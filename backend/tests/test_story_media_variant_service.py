"""Cache de derivation : dedoublonnage, concurrence bornee, degradation.

Ces tests portent sur le COMPORTEMENT SOUS CHARGE du service de variantes,
pas sur la qualite de l'image (voir `test_story_media_variants.py`). Ils
eprouvent le point ou une premiere redaction de ce module etait FAUSSE : le
plafond de deux derivations ne bornait pas le travail reellement actif.
"""

from __future__ import annotations

import asyncio
import io
import time
import uuid
from pathlib import Path
from typing import Any

import pytest
from app.core.config import Settings
from app.core.errors import AppError
from app.services.story_media import variant_service
from app.services.story_media.filesystem_storage import StoryMediaFilesystemStorage
from app.services.story_media.image_variants import DerivedImage, derive_variant
from app.services.story_media.storage_keys import story_media_variant_key
from PIL import Image

USER_ID = uuid.UUID("11111111-1111-4111-8111-111111111111")
MEDIA_ID = uuid.UUID("22222222-2222-4222-8222-222222222222")
FILENAME = f"{MEDIA_ID}.jpg"
SOURCE_KEY = f"stories/{USER_ID}/{FILENAME}"

#: Cible de remplacement, en TEXTE : `derive_variant` est importe dans le
#: service, et mypy strict refuse d'y acceder comme a un attribut exporte.
_DERIVE_TARGET = "app.services.story_media.variant_service.derive_variant"


def _settings(tmp_path: Path, **overrides: Any) -> Settings:
    root = tmp_path / "story-media"
    root.mkdir(parents=True, exist_ok=True)
    base: dict[str, Any] = {
        "app_env": "dev",
        "api_v1_prefix": "/api/v1",
        "story_media_storage_backend": "filesystem",
        "story_media_upload_dir": str(root),
        "media_public_base_url": "http://localhost:8000",
    }
    base.update(overrides)
    return Settings.model_construct(**base)


def _photo(width: int = 1600, height: int = 1200) -> bytes:
    image = Image.new("RGB", (width, height))
    pixels = image.load()
    assert pixels is not None
    seed = 987654321
    for y in range(0, height, 2):
        for x in range(0, width, 2):
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            value = seed & 0xFF
            pixels[x, y] = (value, (value * 5) & 0xFF, (value * 11) & 0xFF)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=95)
    return buffer.getvalue()


@pytest.fixture
def storage(tmp_path: Path) -> StoryMediaFilesystemStorage:
    store = StoryMediaFilesystemStorage(_settings(tmp_path))
    store.put_object(SOURCE_KEY, _photo(), "image/jpeg")
    return store


@pytest.fixture(autouse=True)
def _clean_service_state() -> Any:
    """Le service porte un etat de MODULE : le remettre a neuf entre les tests."""
    variant_service._inflight.clear()
    variant_service._semaphore = None
    yield
    variant_service._inflight.clear()
    variant_service._semaphore = None


@pytest.mark.asyncio
async def test_derives_once_then_serves_the_stored_variant(
    storage: StoryMediaFilesystemStorage, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """La seconde demande ne retransforme pas : elle lit la variante ecrite."""
    settings = _settings(tmp_path)

    first = await variant_service.get_or_derive_variant(
        settings, storage, USER_ID, FILENAME, "card"
    )
    assert first is not None
    assert storage.read_variant(story_media_variant_key(SOURCE_KEY, "card")) is not None

    calls = 0
    real_derive = derive_variant

    def counting(*args: Any, **kwargs: Any) -> DerivedImage | None:
        nonlocal calls
        calls += 1
        return real_derive(*args, **kwargs)

    monkeypatch.setattr(_DERIVE_TARGET, counting)
    try:
        second = await variant_service.get_or_derive_variant(
            settings, storage, USER_ID, FILENAME, "card"
        )
    finally:
        monkeypatch.undo()

    assert second is not None
    assert second.data == first.data
    assert calls == 0, "la variante deja calculee a ete retransformee"


@pytest.mark.asyncio
async def test_concurrent_readers_share_a_single_transformation(
    storage: StoryMediaFilesystemStorage, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Cinq lecteurs sur la MEME photo produisent UNE transformation."""
    settings = _settings(tmp_path)
    calls = 0
    real_derive = derive_variant

    def counting(*args: Any, **kwargs: Any) -> DerivedImage | None:
        nonlocal calls
        calls += 1
        return real_derive(*args, **kwargs)

    monkeypatch.setattr(_DERIVE_TARGET, counting)
    try:
        results = await asyncio.gather(
            *[
                variant_service.get_or_derive_variant(
                    settings, storage, USER_ID, FILENAME, "card"
                )
                for _ in range(5)
            ]
        )
    finally:
        monkeypatch.undo()

    assert all(r is not None for r in results)
    assert calls == 1, f"{calls} transformations pour une seule photo"


@pytest.mark.asyncio
async def test_the_cap_bounds_work_that_is_REALLY_running_even_after_timeouts(
    storage: StoryMediaFilesystemStorage, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """⛔ LA REGRESSION A NE JAMAIS REINTRODUIRE.

    `asyncio.to_thread` ne peut pas annuler un thread deja parti. Une premiere
    redaction prenait le semaphore AUTOUR de l'attente de l'appelant : au delai
    depasse, la place etait rendue pendant que la transformation continuait
    dans son thread. Apres plusieurs delais, dix transformations pouvaient
    tourner de front avec un compteur affichant deux.

    Ce test mesure la concurrence REELLE, vue de l'interieur du travail.

    Le scenario est en DEUX VAGUES, et c'est ce qui le rend probant. En une
    seule vague, tous les appelants renoncent ensemble et personne ne vient
    prendre les places liberees : l'ancien code y aurait paru correct. Il faut
    une seconde vague, qui arrive PENDANT que les threads de la premiere
    tournent encore, pour que le defaut se voie — l'ancien code lui aurait
    donne les places rendues a tort, portant le pic a quatre.
    """
    settings = _settings(tmp_path)
    monkeypatch.setattr(variant_service, "_DERIVATION_TIMEOUT_SECONDS", 0.05)

    active = 0
    peak = 0

    def slow_derive(*_args: Any, **_kwargs: Any) -> DerivedImage | None:
        nonlocal active, peak
        # Compteur manipule DANS le thread : c'est la concurrence REELLE, pas
        # celle que le semaphore croit avoir.
        active += 1
        peak = max(peak, active)
        try:
            time.sleep(0.6)
            return DerivedImage(data=b"\xff\xd8\xff\xd9", content_type="image/jpeg")
        finally:
            active -= 1

    monkeypatch.setattr(_DERIVE_TARGET, slow_derive)

    # Medias DIFFERENTS : le dedoublonnage par cle ne s'applique pas, donc seul
    # le semaphore peut borner.
    async def wave(count: int) -> list[DerivedImage | None]:
        names = [f"{uuid.uuid4()}.jpg" for _ in range(count)]
        for name in names:
            storage.put_object(f"stories/{USER_ID}/{name}", _photo(400, 300), "image/jpeg")
        return list(
            await asyncio.gather(
                *[
                    variant_service.get_or_derive_variant(
                        settings, storage, USER_ID, name, "card"
                    )
                    for name in names
                ]
            )
        )

    first = await wave(2)
    # Les deux ont renonce a 50 ms, mais leurs threads tournent encore (600 ms).
    assert all(r is None for r in first)
    assert active > 0, "les threads de la premiere vague devraient encore tourner"

    second = await wave(2)
    assert all(r is None for r in second)

    # On laisse tout finir avant de conclure sur le pic.
    while variant_service._inflight:
        await asyncio.sleep(0.05)

    assert peak <= 2, f"{peak} transformations actives de front, plafond annonce 2"


@pytest.mark.asyncio
async def test_a_caller_who_gives_up_does_not_waste_the_work(
    storage: StoryMediaFilesystemStorage, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Renoncer n'annule pas la transformation : la suivante la trouve faite.

    `asyncio.shield` est ce qui le garantit. Sans lui, chaque delai depasse
    jetterait le travail deja paye, et la photo suivante repartirait de zero.
    """
    settings = _settings(tmp_path)
    monkeypatch.setattr(variant_service, "_DERIVATION_TIMEOUT_SECONDS", 0.05)
    real_derive = derive_variant

    def slow_derive(*args: Any, **kwargs: Any) -> DerivedImage | None:
        import time

        time.sleep(0.3)
        return real_derive(*args, **kwargs)

    monkeypatch.setattr(_DERIVE_TARGET, slow_derive)

    abandoned = await variant_service.get_or_derive_variant(
        settings, storage, USER_ID, FILENAME, "card"
    )
    assert abandoned is None, "le delai aurait du etre depasse"

    while variant_service._inflight:
        await asyncio.sleep(0.05)

    # Le travail a ete mene a son terme malgre l'abandon.
    assert storage.read_variant(story_media_variant_key(SOURCE_KEY, "card")) is not None


@pytest.mark.asyncio
async def test_an_unreadable_source_falls_back_to_the_original(
    tmp_path: Path, storage: StoryMediaFilesystemStorage
) -> None:
    """Une source illisible ne produit PAS d'erreur servie au client.

    La variante est une optimisation : sur echec, la route sert l'original, et
    la photo reste visible. Le pire scenario est le comportement d'avant.
    """
    settings = _settings(tmp_path)
    broken = f"{uuid.uuid4()}.jpg"
    storage.put_object(f"stories/{USER_ID}/{broken}", b"pas une image", "image/jpeg")

    assert (
        await variant_service.get_or_derive_variant(
            settings, storage, USER_ID, broken, "card"
        )
        is None
    )


@pytest.mark.asyncio
async def test_a_video_never_enters_derivation(
    tmp_path: Path, storage: StoryMediaFilesystemStorage
) -> None:
    """⛔ Aucun changement aux videos."""
    settings = _settings(tmp_path)
    clip = f"{uuid.uuid4()}.mp4"

    assert (
        await variant_service.get_or_derive_variant(settings, storage, USER_ID, clip, "card")
        is None
    )


@pytest.mark.asyncio
async def test_a_missing_source_falls_back_instead_of_raising(
    tmp_path: Path, storage: StoryMediaFilesystemStorage
) -> None:
    """Un original absent rend `None` : la route repart sur son propre 404.

    C'est elle qui porte la convention de reponse, pas ce service.
    """
    settings = _settings(tmp_path)
    absent = f"{uuid.uuid4()}.jpg"

    result = await variant_service.get_or_derive_variant(
        settings, storage, USER_ID, absent, "card"
    )

    assert result is None


def test_variant_storage_cannot_write_into_the_originals_namespace(
    storage: StoryMediaFilesystemStorage,
) -> None:
    """Les methodes derivees refusent une cle d'ORIGINAL.

    C'est la garantie qu'une variante ne peut jamais ecraser la photo source,
    meme sur une erreur de construction de cle.
    """
    with pytest.raises(AppError):
        storage.write_variant(SOURCE_KEY, b"x")
    with pytest.raises(AppError):
        storage.read_variant(SOURCE_KEY)

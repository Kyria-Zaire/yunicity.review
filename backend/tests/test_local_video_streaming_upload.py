"""Réception par blocs des sources vidéo — PR202-VIDEO-STREAMING-UPLOAD-01.

Le défaut corrigé : `await request.body()` allouait le corps ENTIER, puis le
comparait à la limite. Un client pouvait donc faire allouer 2 Go à l'API pour se
voir refuser un fichier de 200 Mo — la limite protégeait le disque, jamais la
mémoire.

Deux propriétés distinctes sont épinglées ici, et il faut les deux :

1. la mémoire reste bornée à un bloc, quoi qu'envoie le client ;
2. aucun fichier partiel ne survit à un échec, quel qu'il soit.

Les tests ne matérialisent jamais 200 Mo réels : un générateur produit des blocs
à la demande, ce qui est justement ce que le code doit savoir consommer. Un test
qui construirait `b"\\x00" * 200_000_000` prouverait le contraire de ce qu'il
cherche à montrer.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator, Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from app.core.config import Settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    LOCAL_VIDEO_MAGIC_SAMPLE_BYTES,
    LOCAL_VIDEO_MAX_BYTES,
    LOCAL_VIDEO_UPLOAD_CHUNK_BYTES,
    LocalVideoUploadStatus,
)
from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage

MIO = 1024 * 1024

#: En-tête ISO BMFF minimal : `ftyp` en octets 4..8. C'est ce que reconnaît la
#: validation par octets magiques, et c'est tout ce qu'il faut lui donner.
ENTETE_MP4 = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 24


def _settings(tmp_path: Path, **surcharges: Any) -> Settings:
    base: dict[str, Any] = {
        "JWT_SECRET_KEY": "test-secret-key-at-least-32-characters-long!!",
        "REGISTRATION_MODE": "",
        "LOCAL_VIDEO_STORAGE_BACKEND": "filesystem",
        "MEDIA_UPLOAD_DIR": str(tmp_path / "media"),
        "MEDIA_PUBLIC_BASE_URL": "http://test",
    }
    base.update(surcharges)
    return Settings(**base)


class _UploadFactice:
    """Juste ce que le service lit d'une session d'upload."""

    def __init__(self, *, taille_attendue: int, content_type: str = "video/mp4") -> None:
        self.id = uuid.uuid4()
        self.storage_key = f"local-videos/reims/{self.id}/source.mp4"
        self.content_type = content_type
        self.expected_size_bytes = taille_attendue
        self.status = LocalVideoUploadStatus.PENDING.value
        self.expires_at = datetime.now(tz=UTC) + timedelta(minutes=10)


class _SessionFactice:
    def __init__(self) -> None:
        self.commits = 0

    async def commit(self) -> None:
        self.commits += 1


def _service(tmp_path: Path, upload: _UploadFactice, **surcharges: Any) -> Any:
    from app.services.local_video_service import LocalVideoService

    settings = _settings(tmp_path, **surcharges)
    # `Any` assume : on assemble deliberement un service par ses attributs
    # prives pour l'isoler de la base. Empiler des `type: ignore` par ligne
    # masquerait ce choix au lieu de le declarer une fois.
    service: Any = LocalVideoService.__new__(LocalVideoService)
    service._session = _SessionFactice()
    service._settings = settings
    service._storage = FilesystemLocalVideoStorage(settings)

    async def _get_upload(_: uuid.UUID) -> _UploadFactice:
        return upload

    service._get_upload = _get_upload
    return service


def _blocs(total: int, *, entete: bytes = ENTETE_MP4) -> AsyncIterator[bytes]:
    """Produit `total` octets à la demande, sans jamais les tenir tous."""

    async def generer() -> AsyncIterator[bytes]:
        restant = total
        premier = entete[:total]
        if premier:
            yield premier
            restant -= len(premier)
        while restant > 0:
            morceau = min(LOCAL_VIDEO_UPLOAD_CHUNK_BYTES, restant)
            yield b"\x00" * morceau
            restant -= morceau

    return generer()


def _temporaires(tmp_path: Path) -> list[Path]:
    import tempfile

    return sorted(Path(tempfile.gettempdir()).glob("local-video-*.part"))


@pytest.fixture(autouse=True)
def _sans_temporaires_residuels() -> Iterator[None]:
    avant = set(_temporaires(Path(".")))
    yield
    apres = set(_temporaires(Path(".")))
    assert apres - avant == set(), "des fichiers temporaires ont survécu au test"


async def _envoyer(service: Any, upload: _UploadFactice, total: int, **kw: Any) -> None:
    await service.store_streamed_upload(
        upload.id,
        _blocs(total, **{k: v for k, v in kw.items() if k == "entete"}),
        declared_length=kw.get("declared_length"),
    )


# --------------------------------------------------------- tailles acceptées


@pytest.mark.parametrize(
    "megaoctets",
    [pytest.param(1, id="1Mo"), pytest.param(49, id="49Mo"), pytest.param(50, id="50Mo")],
)
@pytest.mark.asyncio
async def test_small_uploads_are_accepted(tmp_path: Path, megaoctets: int) -> None:
    """50 Mo passait déjà ; il doit continuer de passer."""
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    await _envoyer(service, upload, megaoctets * MIO)

    assert upload.status == LocalVideoUploadStatus.UPLOADED.value
    stocke = Path(_settings(tmp_path).media_upload_dir) / upload.storage_key
    assert stocke.stat().st_size == megaoctets * MIO


@pytest.mark.asyncio
async def test_exactly_the_limit_is_accepted(tmp_path: Path) -> None:
    """La borne est INCLUSE : 200 Mo pile doit passer."""
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    await _envoyer(service, upload, LOCAL_VIDEO_MAX_BYTES)

    assert upload.status == LocalVideoUploadStatus.UPLOADED.value


@pytest.mark.asyncio
async def test_one_byte_over_the_limit_is_refused(tmp_path: Path) -> None:
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES + 1)
    service = _service(tmp_path, upload)

    with pytest.raises(AppError) as exc:
        await _envoyer(service, upload, LOCAL_VIDEO_MAX_BYTES + 1)

    assert exc.value.code == "LOCAL_VIDEO_TOO_LARGE"
    assert exc.value.status_code == 413
    assert upload.status == LocalVideoUploadStatus.PENDING.value


# ------------------------------------------------- Content-Length et mensonge


@pytest.mark.asyncio
async def test_an_oversized_declaration_is_refused_before_reading(tmp_path: Path) -> None:
    """Annoncer trop gros suffit : on ne lit pas un octet pour le constater."""
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)
    lus = {"blocs": 0}

    async def flux_espion() -> AsyncIterator[bytes]:
        lus["blocs"] += 1
        yield ENTETE_MP4

    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(
            upload.id, flux_espion(), declared_length=LOCAL_VIDEO_MAX_BYTES + 1
        )

    assert exc.value.code == "LOCAL_VIDEO_TOO_LARGE"
    assert lus["blocs"] == 0, "le flux a été lu alors que la déclaration suffisait à refuser"


@pytest.mark.asyncio
async def test_a_missing_content_length_is_still_bounded(tmp_path: Path) -> None:
    """`Transfer-Encoding: chunked` n'annonce aucune taille : le compteur décide."""
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(
            upload.id, _blocs(LOCAL_VIDEO_MAX_BYTES + MIO), declared_length=None
        )

    assert exc.value.code == "LOCAL_VIDEO_TOO_LARGE"


@pytest.mark.asyncio
async def test_a_lying_content_length_does_not_authorise_anything(tmp_path: Path) -> None:
    """Un client qui annonce 1 Mo et en envoie 300 est arrêté par le compteur.

    C'est la raison pour laquelle `Content-Length` ne sert qu'à refuser tôt :
    il n'autorise jamais.
    """
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(
            upload.id, _blocs(LOCAL_VIDEO_MAX_BYTES + 10 * MIO), declared_length=MIO
        )

    assert exc.value.code == "LOCAL_VIDEO_TOO_LARGE"


@pytest.mark.asyncio
async def test_a_two_gigabyte_body_never_allocates_two_gigabytes(tmp_path: Path) -> None:
    """LE test du ticket : la lecture s'arrête, elle n'absorbe pas.

    Le flux compte ce qu'on lui demande. Si le service lisait tout avant de
    juger, il consommerait les 2 Go ; il doit s'arrêter peu après la limite.
    """
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)
    produit = {"octets": 0}
    DEUX_GO = 2 * 1024 * MIO

    async def flux_de_deux_go() -> AsyncIterator[bytes]:
        yield ENTETE_MP4
        produit["octets"] += len(ENTETE_MP4)
        while produit["octets"] < DEUX_GO:
            bloc = b"\x00" * LOCAL_VIDEO_UPLOAD_CHUNK_BYTES
            produit["octets"] += len(bloc)
            yield bloc

    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(upload.id, flux_de_deux_go(), declared_length=None)

    assert exc.value.code == "LOCAL_VIDEO_TOO_LARGE"
    # Tolérance d'un bloc : on coupe au bloc qui franchit la limite.
    assert produit["octets"] <= LOCAL_VIDEO_MAX_BYTES + LOCAL_VIDEO_UPLOAD_CHUNK_BYTES
    assert produit["octets"] < DEUX_GO // 4, "le flux a été consommé bien au-delà de la limite"


# ----------------------------------------------------------------- validation


@pytest.mark.asyncio
async def test_a_falsified_file_is_refused(tmp_path: Path) -> None:
    """Extension et MIME annoncent une vidéo ; les octets disent autre chose."""
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(
            upload.id, _blocs(4 * MIO, entete=b"MZ\x90\x00" + b"\x00" * 60), declared_length=None
        )

    assert exc.value.code == "LOCAL_VIDEO_INVALID_CONTENT"


@pytest.mark.asyncio
async def test_an_empty_body_is_refused(tmp_path: Path) -> None:
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    async def vide() -> AsyncIterator[bytes]:
        return
        yield b""  # pragma: no cover

    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(upload.id, vide(), declared_length=None)

    assert exc.value.code == "LOCAL_VIDEO_EMPTY"


@pytest.mark.asyncio
async def test_the_header_is_validated_from_the_first_chunk_only(tmp_path: Path) -> None:
    """Reconnaître le conteneur ne demande que quelques octets.

    Attendre la fin du fichier pour valider l'en-tête ferait écrire 200 Mo
    avant de constater qu'ils sont inexploitables.
    """
    assert LOCAL_VIDEO_MAGIC_SAMPLE_BYTES <= LOCAL_VIDEO_UPLOAD_CHUNK_BYTES
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)
    blocs_lus = {"n": 0}

    async def flux() -> AsyncIterator[bytes]:
        blocs_lus["n"] += 1
        yield b"pas-une-video" + b"\x00" * 64
        blocs_lus["n"] += 1
        yield b"\x00" * MIO  # pragma: no cover

    with pytest.raises(AppError) as exc:
        await service.store_streamed_upload(upload.id, flux(), declared_length=None)

    assert exc.value.code == "LOCAL_VIDEO_INVALID_CONTENT"


# ------------------------------------------------------------- nettoyage


@pytest.mark.asyncio
async def test_a_refused_upload_leaves_no_partial_file(tmp_path: Path) -> None:
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    with pytest.raises(AppError):
        await _envoyer(service, upload, LOCAL_VIDEO_MAX_BYTES + MIO)

    racine = Path(_settings(tmp_path).media_upload_dir)
    restes = [p for p in racine.rglob("*") if p.is_file()]
    assert restes == [], "un fichier partiel a été laissé dans la racine média"


@pytest.mark.asyncio
async def test_a_client_disconnect_leaves_no_partial_file(tmp_path: Path) -> None:
    """Le flux se rompt en cours de route : rien ne doit rester."""
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    async def flux_rompu() -> AsyncIterator[bytes]:
        yield ENTETE_MP4
        yield b"\x00" * MIO
        raise ConnectionResetError("client parti")

    with pytest.raises(ConnectionResetError):
        await service.store_streamed_upload(upload.id, flux_rompu(), declared_length=None)

    racine = Path(_settings(tmp_path).media_upload_dir)
    assert [p for p in racine.rglob("*") if p.is_file()] == []
    assert upload.status == LocalVideoUploadStatus.PENDING.value


@pytest.mark.asyncio
async def test_a_storage_failure_leaves_no_partial_file(tmp_path: Path) -> None:
    upload = _UploadFactice(taille_attendue=LOCAL_VIDEO_MAX_BYTES)
    service = _service(tmp_path, upload)

    def promotion_qui_echoue(*_: Any, **__: Any) -> None:
        raise OSError("disque plein")

    service._storage.promote_file = promotion_qui_echoue

    with pytest.raises(OSError):
        await _envoyer(service, upload, 2 * MIO)

    assert upload.status == LocalVideoUploadStatus.PENDING.value


# ------------------------------------------------------ promotion atomique


def test_promotion_never_exposes_a_half_written_file(tmp_path: Path) -> None:
    """Une destination existante n'est remplacée qu'en une fois.

    Sans remplacement atomique, un lecteur concurrent pourrait servir une
    vidéo tronquée pendant l'écriture.
    """
    settings = _settings(tmp_path)
    storage = FilesystemLocalVideoStorage(settings)
    cle = "local-videos/reims/abc/source.mp4"

    ancien = Path(settings.media_upload_dir) / cle
    ancien.parent.mkdir(parents=True, exist_ok=True)
    ancien.write_bytes(b"ancienne version")

    source = tmp_path / "nouvelle.part"
    source.write_bytes(b"nouvelle version, plus longue")
    storage.promote_file(source, cle)

    assert ancien.read_bytes() == b"nouvelle version, plus longue"
    assert not source.exists(), "le temporaire survit à la promotion"


def test_streamed_copy_never_reads_the_whole_file(tmp_path: Path) -> None:
    """`read_to_path` et `upload_file` copient par blocs, pas d'un seul tenant.

    L'analyse porte sur l'arbre syntaxique, pas sur le texte : les docstrings
    de ce module CITENT `read_bytes()` pour expliquer ce qui a été retiré, et
    une recherche textuelle les confondrait avec un appel réel.
    """
    import ast
    import inspect

    arbre = ast.parse(inspect.getsource(FilesystemLocalVideoStorage))
    appels = {
        noeud.func.attr
        for noeud in ast.walk(arbre)
        if isinstance(noeud, ast.Call) and isinstance(noeud.func, ast.Attribute)
    }

    assert "read_bytes" not in appels, "une lecture intégrale subsiste dans le stockage"
    assert "copyfileobj" in appels, "la copie par blocs a disparu"
    assert "replace" in appels, "la promotion n'est plus atomique"

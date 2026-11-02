"""Variantes d'affichage des photos de publication (MEDIA-MULTI-PHOTO-01).

Ces tests sont PURS : ils n'ouvrent ni base ni reseau. Ils eprouvent la
derivation elle-meme et l'espace de cles derive — c'est-a-dire les deux
endroits ou une erreur serait silencieuse et couteuse : une photo aplatie, ou
une cle qui ecrase l'original.
"""

from __future__ import annotations

import io
import uuid

import pytest
from app.core.errors import AppError
from app.services.story_media.image_variants import (
    MAX_SOURCE_PIXELS,
    VARIANT_LONGEST_EDGE,
    derive_variant,
    is_derivable,
)
from app.services.story_media.storage_keys import (
    assert_valid_story_media_variant_key,
    story_media_variant_key,
)
from PIL import Image


def _photo(width: int, height: int, *, mode: str = "RGB", fmt: str = "JPEG") -> bytes:
    """Photo de bruit : elle resiste a la compression, donc elle PESE.

    Un aplat uniforme s'effondrerait a quelques octets et ne dirait rien du
    poids reel d'une variante.
    """
    image = Image.new(mode, (width, height))
    pixels = image.load()
    assert pixels is not None
    seed = 1234567
    for y in range(height):
        for x in range(width):
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            value = seed & 0xFF
            if mode == "RGB":
                pixels[x, y] = (value, (value * 7) & 0xFF, (value * 13) & 0xFF)
            else:
                pixels[x, y] = (value, (value * 7) & 0xFF, (value * 13) & 0xFF, 255)
    buffer = io.BytesIO()
    image.save(buffer, format=fmt)
    return buffer.getvalue()


# ── Derivation ──────────────────────────────────────────────────────────────


@pytest.mark.parametrize("variant", ["card", "viewer"])
def test_derive_variant_shrinks_to_the_declared_longest_edge(variant: str) -> None:
    """La variante tient dans son bord long, et pese MOINS que la source."""
    source = _photo(2400, 1800)

    derived = derive_variant(source, variant, ".jpg")

    assert derived is not None
    assert derived.content_type == "image/jpeg"
    with Image.open(io.BytesIO(derived.data)) as out:
        assert max(out.size) == VARIANT_LONGEST_EDGE[variant]
    assert len(derived.data) < len(source)


def test_derive_variant_never_enlarges_the_pixels_of_a_small_photo() -> None:
    """Une photo deja plus petite que le bord cible garde ses dimensions.

    Agrandir couterait des octets sans ajouter un seul detail.
    """
    source = _photo(320, 240)

    derived = derive_variant(source, "card", ".jpg")

    assert derived is not None
    with Image.open(io.BytesIO(derived.data)) as out:
        assert out.size == (320, 240)


def test_derive_variant_declines_when_it_would_not_save_any_bytes() -> None:
    """Rendre une variante PLUS LOURDE que la source serait une perte seche.

    Le cas arrive sur une image deja fortement compressee : la re-encoder a une
    qualite superieure l'alourdit. Le module rend alors `None`, et la route
    sert l'original.

    ⚠️ Cette garantie porte sur les OCTETS, et elle est distincte de celle du
    test precedent, qui porte sur les PIXELS. Une premiere redaction de ce test
    les confondait : une petite photo n'est pas agrandie, mais sa re-encodage
    peut tout de meme peser moins, et la variante est alors servie.
    """
    image = Image.new("RGB", (300, 300))
    pixels = image.load()
    assert pixels is not None
    for y in range(300):
        for x in range(300):
            pixels[x, y] = ((x * 7) & 0xFF, (y * 11) & 0xFF, ((x + y) * 13) & 0xFF)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=15)

    assert derive_variant(buffer.getvalue(), "card", ".jpg") is None


def test_derive_variant_keeps_transparency_by_going_to_webp() -> None:
    """⛔ Une source transparente n'est JAMAIS aplatie en JPEG.

    JPEG n'a pas de canal alpha : convertir un PNG transparent poserait un fond
    noir ou blanc sans que personne ne l'ait demande. Les sources PNG et WebP
    derivent donc en WebP, qui conserve l'alpha.
    """
    image = Image.new("RGBA", (1600, 1200), (255, 0, 0, 0))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    derived = derive_variant(buffer.getvalue(), "card", ".png")

    assert derived is not None
    assert derived.content_type == "image/webp"
    with Image.open(io.BytesIO(derived.data)) as out:
        assert out.mode in ("RGBA", "LA")
        assert out.getchannel("A").getextrema()[1] == 0, "l'alpha a ete perdu"


def test_derive_variant_declines_an_animated_image() -> None:
    """⛔ Une image ANIMEE n'est pas derivee : la convertir n'en garderait que
    la premiere image, et l'animation disparaitrait en silence. La route sert
    l'original — lourd, mais entier."""
    frames = [Image.new("RGB", (900, 900), (i * 20, 0, 0)) for i in range(4)]
    buffer = io.BytesIO()
    frames[0].save(buffer, format="WEBP", save_all=True, append_images=frames[1:])

    assert derive_variant(buffer.getvalue(), "card", ".webp") is None


def test_derive_variant_refuses_a_decompression_bomb() -> None:
    """Le garde-fou de pixels REFUSE, il n'avertit pas.

    L'allocation se fait avant tout redimensionnement : au-dela du plafond, la
    derivation demanderait des gigaoctets. L'erreur est absorbee par le service
    appelant, qui sert alors l'original.
    """
    side = int(MAX_SOURCE_PIXELS**0.5) + 1000
    image = Image.new("RGB", (side, side))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")

    with pytest.raises(AppError) as excinfo:
        derive_variant(buffer.getvalue(), "card", ".jpg")

    assert excinfo.value.status_code == 413


def test_derive_variant_rejects_bytes_that_are_not_an_image() -> None:
    """Aucune exception Pillow ne remonte telle quelle : elle porterait des
    details de la bibliotheque jusqu'au client."""
    with pytest.raises(AppError) as excinfo:
        derive_variant(b"ceci n'est pas une image", "card", ".jpg")

    assert excinfo.value.status_code == 415


def test_derive_variant_rejects_an_unknown_variant_name() -> None:
    with pytest.raises(AppError) as excinfo:
        derive_variant(_photo(1200, 900), "enorme", ".jpg")

    assert excinfo.value.status_code == 400


def test_is_derivable_excludes_video() -> None:
    """⛔ Aucun changement aux videos : elles n'entrent jamais dans la derivation."""
    assert is_derivable("image/jpeg")
    assert is_derivable("image/png; charset=binary")
    assert not is_derivable("video/mp4")
    assert not is_derivable("video/webm")
    assert not is_derivable(None)


# ── Espace de cles derive ───────────────────────────────────────────────────


def test_variant_key_lives_in_its_own_namespace() -> None:
    """La variante ne peut pas ecraser l'original : espaces de noms disjoints."""
    user_id = uuid.uuid4()
    media_id = uuid.uuid4()
    source = f"stories/{user_id}/{media_id}.jpg"

    key = story_media_variant_key(source, "card")

    assert key == f"derived/card/{user_id}/{media_id}.jpg"
    assert not key.startswith("stories/")


def test_variant_key_follows_the_source_extension_for_transparency() -> None:
    """La cle est DETERMINISTE sans decoder : PNG et WebP vont en `.webp`.

    C'est ce qui permet de chercher une variante deja calculee en UN seul acces
    au stockage, sans ouvrir l'original au prealable.
    """
    user_id = uuid.uuid4()
    media_id = uuid.uuid4()

    assert story_media_variant_key(f"stories/{user_id}/{media_id}.png", "card").endswith(
        ".webp"
    )
    assert story_media_variant_key(f"stories/{user_id}/{media_id}.webp", "viewer").endswith(
        ".webp"
    )
    assert story_media_variant_key(f"stories/{user_id}/{media_id}.jpg", "card").endswith(
        ".jpg"
    )


def test_variant_key_refuses_a_video_source() -> None:
    """Une video n'a pas de variante, et ne doit pas en avoir."""
    user_id = uuid.uuid4()
    media_id = uuid.uuid4()

    with pytest.raises(AppError) as excinfo:
        story_media_variant_key(f"stories/{user_id}/{media_id}.mp4", "card")

    assert excinfo.value.status_code == 415


def test_variant_key_refuses_an_unknown_variant_name() -> None:
    user_id = uuid.uuid4()
    media_id = uuid.uuid4()

    with pytest.raises(AppError):
        story_media_variant_key(f"stories/{user_id}/{media_id}.jpg", "../../etc")


@pytest.mark.parametrize(
    "candidate",
    [
        "derived/card/../../stories/x.jpg",
        "derived/unknown/11111111-1111-4111-8111-111111111111/"
        "22222222-2222-4222-8222-222222222222.jpg",
        "stories/11111111-1111-4111-8111-111111111111/"
        "22222222-2222-4222-8222-222222222222.jpg",
        "derived/card/11111111-1111-4111-8111-111111111111/evasion.jpg",
    ],
)
def test_variant_key_guard_rejects_traversal_and_foreign_namespaces(candidate: str) -> None:
    """Le garde-fou protege la cle AVANT tout acces au stockage.

    La cle d'un ORIGINAL est rejetee elle aussi : les methodes derivees ne
    doivent jamais pouvoir ecrire dans `stories/`.
    """
    with pytest.raises(AppError):
        assert_valid_story_media_variant_key(candidate)

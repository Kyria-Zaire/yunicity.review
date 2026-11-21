"""Variantes d'affichage derivees d'une image de publication (MEDIA-MULTI-PHOTO-01).

## Pourquoi

La route de media servait l'ORIGINAL du telephone — jusqu'a 20 Mo, sans
redimensionnement nulle part. Mesure du 2026-11-02 : une photo de 6,4 Mo coute
148 ms de seul decodage en Chromium de bureau, et son transfert sur un lien
mobile se compte en secondes. Le carrousel en affiche une a la fois, dans un
cadre qui ne depasse jamais quelques centaines de pixels de haut.

## Ce que ce module garantit

- **L'original n'est JAMAIS touche.** Les variantes vivent dans leur propre
  espace de cles (`derived/...`), l'original reste `stories/...`, octet pour
  octet. Aucune migration, et un retour arriere consiste a ignorer la variante.
- **La derivation est posterieure a l'autorisation.** Ce module ne sait rien
  des droits : il est appele par la route APRES son controle, jamais avant.
  Decoder une image televersee est une surface d'attaque ; ne la faire courir
  qu'a un appelant deja autorise la reduit d'autant.
- **Les publications DEJA presentes fonctionnent.** La variante est calculee a
  la demande depuis l'original stocke, donc les publications anterieures a ce
  ticket en beneficient sans etre retouchees.
- ⛔ **Les videos ne passent pas par ici.** Elles gardent leur chemin et leurs
  octets, inchanges.
"""

from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Final

from app.core.errors import AppError
from PIL import Image, ImageOps, UnidentifiedImageError

#: Bord le plus long de chaque variante, en pixels.
#:
#: ⛔ CORRECTION d'une affirmation anterieure de ma part : « 1080 px couvre une
#: densite x2 » etait FAUX, et la mesure l'a confirme.
#:
#: Le cadre du carrousel monte a 640 px de HAUT au plus large palier
#: (`globals.css`), donc a densite x2 il faut 1280 px de hauteur reelle. Une
#: photo PORTRAIT y est contrainte par sa HAUTEUR — qui est aussi son bord
#: LONG. A 1080, elle rendait 810x1080 : 1080 < 1280, insuffisant.
#:
#: Mesure du 2026-11-02 sur une photo portrait 3024x4032 de 7,70 Mo :
#:
#:     bord long | poids  | rendu     | hauteur a x2
#:          1080 | 142 Ko | 810x1080  | NON (1080 < 1280)
#:          1280 | 227 Ko | 960x1280  | OUI
#:          1440 | 314 Ko | 1080x1440 | OUI
#:
#: 1280 est donc le plus petit bord long qui suffise au portrait, et il couvre
#: aussi le paysage tant que la colonne ne depasse pas 640 px CSS (1280 px de
#: large a densite x2). Le surcout sur 1080 est de 85 Ko, pour une source de
#: 7,70 Mo : la reduction reste d'un facteur ~34.
#:
#: ⚠️ Mesure sur photos de SYNTHESE aux dimensions d'un telephone, pas encore
#: sur nos photos reelles. La nettete PERCUE reste a juger a l'ecran.
VARIANT_LONGEST_EDGE: Final[dict[str, int]] = {
    "card": 1280,
    "viewer": 2048,
}

#: Qualite de re-encodage, JPEG comme WebP. Parametre de depart lui aussi.
_ENCODE_QUALITY: Final = 82

#: Garde-fou de BOMBE DE DECOMPRESSION. Pillow avertit au-dela de sa propre
#: limite ; ici on REFUSE, car l'allocation se fait avant tout
#: redimensionnement. 80 Mpx laisse passer tout capteur de telephone (un
#: 48 Mpx tient largement) et arrete un PNG de 30 000 x 30 000 qui demanderait
#: plusieurs gigaoctets.
MAX_SOURCE_PIXELS: Final = 80_000_000

#: Types que l'on accepte de DECODER. Deliberement plus etroit que la liste
#: servie : une video n'entre jamais ici.
DERIVABLE_CONTENT_TYPES: Final = frozenset({"image/jpeg", "image/png", "image/webp"})

#: Format de sortie, choisi sur l'EXTENSION de la source — donc connu sans
#: decoder, ce qui rend la cle derivee deterministe.
#:
#: ## Transparence
#: JPEG n'a pas de canal alpha : y convertir un PNG transparent APLATIRAIT le
#: fond, en silence. Les sources PNG et WebP derivent donc en **WebP**, qui
#: conserve l'alpha — et que le client accepte deja
#: (`authorized-media-fetch.ts`, `ALLOWED_CONTENT_TYPES`). Une source JPEG, qui
#: ne peut pas etre transparente, reste en JPEG.
_TARGET_FORMAT_BY_SOURCE_EXT: Final[dict[str, tuple[str, str]]] = {
    ".jpg": ("JPEG", "image/jpeg"),
    ".png": ("WEBP", "image/webp"),
    ".webp": ("WEBP", "image/webp"),
}


@dataclass(frozen=True)
class DerivedImage:
    data: bytes
    content_type: str


def is_derivable(content_type: str | None) -> bool:
    """La variante n'a de sens que pour une image que l'on sait re-encoder."""
    if not content_type:
        return False
    return content_type.split(";", 1)[0].strip().lower() in DERIVABLE_CONTENT_TYPES


def variant_target(source_ext: str) -> tuple[str, str]:
    """Format Pillow et type MIME de la variante, d'apres l'extension source."""
    target = _TARGET_FORMAT_BY_SOURCE_EXT.get(source_ext.lower())
    if target is None:
        raise AppError(
            status_code=415,
            code="STORY_MEDIA_NOT_DERIVABLE",
            detail="Média non redimensionnable.",
        )
    return target


def derive_variant(source: bytes, variant: str, source_ext: str) -> DerivedImage | None:
    """Rend la variante d'affichage d'une image, ou `None` s'il ne faut PAS deriver.

    Rend `None` — et l'appelant sert alors l'ORIGINAL, inchange — quand :

    - l'image est **ANIMEE** (WebP multi-images). La convertir n'en garderait
      que la premiere : l'animation disparaitrait sans que personne ne l'ait
      demande. Mieux vaut un transfert lourd qu'un media mutile ;
    - la variante calculee pese PLUS que la source. Cela arrive sur une image
      deja petite ou deja optimisee ; la servir serait une perte seche.

    Leve `AppError` 415 si la source n'est pas decodable, 413 si elle depasse
    le garde-fou de pixels. Aucune exception Pillow ne remonte telle quelle :
    elle porterait des details de la bibliotheque jusqu'au client.
    """
    longest_edge = VARIANT_LONGEST_EDGE.get(variant)
    if longest_edge is None:
        raise AppError(
            status_code=400,
            code="STORY_MEDIA_INVALID_VARIANT",
            detail="Variante média inconnue.",
        )
    pil_format, content_type = variant_target(source_ext)

    try:
        with Image.open(io.BytesIO(source)) as image:
            width, height = image.size
            if width * height > MAX_SOURCE_PIXELS:
                raise AppError(
                    status_code=413,
                    code="STORY_MEDIA_SOURCE_TOO_LARGE",
                    detail="Image source trop grande pour être redimensionnée.",
                )

            # ⛔ ANIMEE : on ne derive pas. Voir la docstring.
            if getattr(image, "n_frames", 1) > 1:
                return None

            # Orientation EXIF resolue AVANT le cadrage : une photo de telephone
            # porte son orientation dans ses metadonnees, et la redimensionner
            # sans la resoudre produirait une variante couchee.
            upright = _exif_upright(image)

            # JPEG ne porte pas d'alpha : la source JPEG va en RVB. Pour WebP on
            # CONSERVE l'alpha quand il existe, sans jamais aplatir un fond.
            if pil_format == "JPEG":
                resized = upright.convert("RGB")
            elif upright.mode in ("RGBA", "LA") or (
                upright.mode == "P" and "transparency" in upright.info
            ):
                resized = upright.convert("RGBA")
            else:
                resized = upright.convert("RGB")

            # On ne fabrique JAMAIS une variante plus grande que la source :
            # agrandir coute des octets sans ajouter un seul detail.
            if max(resized.size) > longest_edge:
                resized.thumbnail((longest_edge, longest_edge), Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            # `optimize` recalcule les tables de Huffman : quelques pour cent de
            # moins, pour un cout negligeable a cette taille.
            resized.save(buffer, format=pil_format, quality=_ENCODE_QUALITY, optimize=True)
            data = buffer.getvalue()

            if len(data) >= len(source):
                return None
            return DerivedImage(data=data, content_type=content_type)
    except AppError:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise AppError(
            status_code=415,
            code="STORY_MEDIA_NOT_DERIVABLE",
            detail="Média non redimensionnable.",
        ) from exc


def _exif_upright(image: Image.Image) -> Image.Image:
    """Applique l'orientation EXIF, sans echouer sur son absence.

    Une orientation illisible ne doit pas faire echouer la derivation : la
    photo est alors servie telle qu'elle est stockee, exactement comme
    aujourd'hui. L'exception est donc absorbee DELIBEREMENT, et seulement ici.
    """
    try:
        return ImageOps.exif_transpose(image) or image
    except (OSError, ValueError, KeyError):
        return image

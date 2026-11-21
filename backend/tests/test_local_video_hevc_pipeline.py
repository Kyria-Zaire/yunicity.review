"""HEVC iPhone dans le pipeline réel — PR202-VIDEO-STREAMING-FINAL-GATE-01.

Le rapport précédent déclarait HEVC « non vérifié », et c'était la bonne réponse :
`video/quicktime` est accepté, mais ce MIME ne dit rien du codec à l'intérieur.
Un iPhone en mode « Haute efficacité » produit du H.265 dans un conteneur MOV,
exactement le même type MIME qu'un MOV en H.264.

Ce fichier ne suppose rien. Il encode une vraie vidéo HEVC avec ffmpeg, le prouve
avec ffprobe, puis la fait traverser le pipeline entier : initiation, envoi par
blocs, validation, publication, traitement, média final lisible.

La fixture est GÉNÉRÉE, jamais versionnée : un binaire commité deviendrait un
artefact opaque que personne ne saurait régénérer, et son codec ne serait plus
vérifiable.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Any, cast

import pytest
from app.core.local_video_constants import LocalVideoStatus, LocalVideoType
from app.db.session import get_session_factory
from app.models.local_video import LocalVideo
from app.services.local_video.processing_service import run_local_video_processing
from httpx import AsyncClient

from tests.conftest_passport import auth_header, register_user
from tests.test_local_videos_api import BASE, BOULINGRIN_ID

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

#: Sans ffmpeg, rien de ce fichier n'a de sens : on ne remplace pas une vraie
#: vidéo par un en-tête factice, ce serait revenir à la supposition qu'on veut
#: justement lever.
_FFMPEG = pytest.mark.skipif(
    shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None,
    reason="ffmpeg/ffprobe indisponibles : le pipeline HEVC ne peut pas être prouvé ici",
)

DUREE_SECONDES = 3


def _encoder(destination: Path, *, codec: str, tag: str | None, conteneur: str) -> Path:
    """Encode une vidéo de test réelle. Échoue bruyamment si ffmpeg refuse."""
    chemin = destination / f"fixture.{conteneur}"
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        f"testsrc=duration={DUREE_SECONDES}:size=320x240:rate=25",
        "-c:v",
        codec,
        "-pix_fmt",
        "yuv420p",
    ]
    if codec == "libx265":
        # Sans cela libx265 écrit son propre bandeau sur stderr.
        cmd += ["-x265-params", "log-level=none"]
    if tag:
        cmd += ["-tag:v", tag]
    cmd += [str(chemin), "-y"]

    subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    return chemin


def _sonder(chemin: Path) -> dict[str, Any]:
    """Ce que ffprobe dit RÉELLEMENT du fichier — codec, tag, conteneur, durée."""
    sortie = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "stream=codec_name,codec_tag_string",
            "-show_entries",
            "format=format_name,duration",
            "-of",
            "json",
            str(chemin),
        ],
        check=True,
        capture_output=True,
        timeout=60,
    )
    donnees = json.loads(sortie.stdout)
    flux = donnees["streams"][0]
    return {
        "codec": flux["codec_name"],
        "tag": flux.get("codec_tag_string"),
        "conteneur": donnees["format"]["format_name"],
        "duree": float(donnees["format"]["duration"]),
    }


async def _publier(
    client: AsyncClient, chemin: Path, *, content_type: str, nom: str
) -> dict[str, Any]:
    """Parcours complet : initiation, envoi par blocs, publication."""
    utilisateur = await register_user(client, suffix=f"-hevc-{uuid.uuid4().hex[:8]}")
    token = utilisateur["access_token"]
    octets = chemin.read_bytes()

    init = await client.post(
        f"{BASE}/upload-init",
        json={
            "filename": nom,
            "content_type": content_type,
            "file_size_bytes": len(octets),
        },
        headers=auth_header(token),
    )
    assert init.status_code == 201, init.text
    corps = cast(dict[str, Any], init.json())

    envoi = await client.put(
        corps["presigned_url"],
        content=octets,
        headers={"Content-Type": content_type},
    )
    assert envoi.status_code == 204, envoi.text

    publication = await client.post(
        BASE,
        json={
            "upload_id": corps["upload_id"],
            "city": "Reims",
            "neighborhood_id": BOULINGRIN_ID,
            "video_type": LocalVideoType.MOMENT.value,
            "title": "Pipeline HEVC",
        },
        headers=auth_header(token),
    )
    assert publication.status_code == 202, publication.text
    return cast(dict[str, Any], publication.json())


async def _traiter_et_lire(video_id: str) -> LocalVideo:
    """Exécute le VRAI processeur, puis relit l'enregistrement."""
    await run_local_video_processing(uuid.UUID(video_id))

    fabrique = get_session_factory()
    assert fabrique is not None
    async with fabrique() as session:
        video = await session.get(LocalVideo, uuid.UUID(video_id))
        assert video is not None
        return video


# ------------------------------------------------------------------ HEVC


@_FFMPEG
async def test_the_hevc_fixture_really_is_hevc_in_a_mov(tmp_path: Path) -> None:
    """Prouver la fixture AVANT de prouver quoi que ce soit avec elle.

    Un test qui la tiendrait pour acquise pourrait valider du H.264 en croyant
    valider du H.265, et conclure exactement l'inverse de la vérité.
    """
    chemin = _encoder(tmp_path, codec="libx265", tag="hvc1", conteneur="mov")
    sonde = _sonder(chemin)

    assert sonde["codec"] == "hevc", f"codec réel : {sonde['codec']}"
    # `hvc1` est le tag écrit par iPhone ; `hev1` ne se lit pas partout.
    assert sonde["tag"] == "hvc1"
    assert "mov" in sonde["conteneur"]
    assert abs(sonde["duree"] - DUREE_SECONDES) < 0.5
    assert chemin.stat().st_size > 1000, "fichier trop petit pour être une vidéo"


@_FFMPEG
async def test_an_iphone_hevc_video_survives_the_whole_pipeline(
    auth_client: AsyncClient, tmp_path: Path
) -> None:
    """Initiation, envoi par blocs, validation, publication, traitement, média final."""
    chemin = _encoder(tmp_path, codec="libx265", tag="hvc1", conteneur="mov")
    assert _sonder(chemin)["codec"] == "hevc"

    accepte = await _publier(auth_client, chemin, content_type="video/quicktime", nom="iphone.mov")
    assert accepte["status"] == LocalVideoStatus.PROCESSING.value

    video = await _traiter_et_lire(accepte["id"])

    assert video.processing_error is None, f"traitement en échec : {video.processing_error}"
    assert video.status == LocalVideoStatus.PUBLISHED.value
    assert video.media_url, "aucun média final"
    assert video.thumbnail_url, "aucune vignette"
    # La durée est REMESURÉE par ffprobe sur le fichier réel, jamais déclarée.
    assert abs(float(video.duration_seconds) - DUREE_SECONDES) < 1.0


# ------------------------------------------------- non-régression H.264


@_FFMPEG
@pytest.mark.parametrize(
    ("conteneur", "content_type", "nom"),
    [
        pytest.param("mp4", "video/mp4", "clip.mp4", id="mp4-h264"),
        pytest.param("mov", "video/quicktime", "clip.mov", id="mov-h264"),
    ],
)
async def test_h264_still_works_in_both_containers(
    auth_client: AsyncClient, tmp_path: Path, conteneur: str, content_type: str, nom: str
) -> None:
    """Le chemin historique ne doit pas avoir bougé."""
    chemin = _encoder(tmp_path, codec="libx264", tag=None, conteneur=conteneur)
    assert _sonder(chemin)["codec"] == "h264"

    accepte = await _publier(auth_client, chemin, content_type=content_type, nom=nom)
    video = await _traiter_et_lire(accepte["id"])

    assert video.processing_error is None
    assert video.status == LocalVideoStatus.PUBLISHED.value
    assert video.media_url


@_FFMPEG
async def test_a_corrupt_video_fails_with_a_clear_error_and_leaves_nothing(
    auth_client: AsyncClient, tmp_path: Path
) -> None:
    """Un conteneur valide dont le contenu est illisible échoue PROPREMENT.

    L'en-tête suffit à passer la validation d'envoi : c'est ffprobe, plus tard,
    qui constate l'absence de flux exploitable. Ce qui compte alors est que
    l'échec soit nommé et qu'aucun média final ne soit publié.
    """
    chemin = _encoder(tmp_path, codec="libx264", tag=None, conteneur="mp4")
    octets = bytearray(chemin.read_bytes())
    # On conserve l'en-tête `ftyp` et on détruit tout le reste.
    for i in range(32, len(octets)):
        octets[i] = 0
    chemin.write_bytes(bytes(octets))

    accepte = await _publier(auth_client, chemin, content_type="video/mp4", nom="casse.mp4")
    video = await _traiter_et_lire(accepte["id"])

    assert video.status != LocalVideoStatus.PUBLISHED.value, "une vidéo illisible a été publiée"
    assert video.processing_error, "échec sans motif : l'exploitant ne saurait pas quoi corriger"

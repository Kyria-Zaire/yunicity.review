"""Sert les medias de story derriere l'autorisation d'audience.

Un media de story n'est pas un contenu public. La route applique la politique CANONIQUE
du projet -- `can_view_post`, la meme que le feed, les commentaires et la recherche --
apres avoir retrouve la LIGNE METIER qui reference le fichier.

Les deux backends passent par ici : le filesystem sert depuis le volume, R2 est lu
COTE SERVEUR et relaye en flux. Le navigateur n'est jamais redirige vers l'objet R2 :
une redirection rendrait l'autorisation decorative.

Convention de reponse : 404 uniforme pour « inexistant » comme pour « non autorise »,
identique a `CommentService`, afin de ne pas reveler l'existence d'une story restreinte.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import require_authenticated_user
from app.core.errors import AppError
from app.db.session import get_db
from app.models.user import User
from app.repositories.post_repository import PostRepository
from app.repositories.post_visibility import can_view_post
from app.services.story_media.filesystem_storage import StoryMediaFilesystemStorage
from app.services.story_media.storage_keys import story_media_api_url, story_media_key_for

router = APIRouter(tags=["story-media"])

#: Media prive : jamais de cache partage, jamais de sniffing de type.
_PRIVATE_MEDIA_HEADERS = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
}

#: Taille de tranche relayee depuis R2. Borne la memoire quelle que soit la taille objet.
_STREAM_CHUNK_BYTES = 64 * 1024


def _not_found() -> AppError:
    return AppError(
        status_code=404,
        code="STORY_MEDIA_NOT_FOUND",
        detail="Média introuvable.",
    )


def _candidate_urls(settings: Settings, user_id: uuid.UUID, filename: str) -> list[str]:
    """Formes d'URL pouvant designer ce media dans `posts`.

    La forme courante est la route API. La forme historique est l'URL CDN absolue,
    produite par l'ancien backend R2 : elle doit rester RECONNUE par l'autorisation,
    sans jamais etre renvoyee au client.
    """
    key = story_media_key_for(user_id, filename)
    candidates = [story_media_api_url(settings.api_v1_prefix, key)]
    legacy_base = settings.local_video_public_base_url.rstrip("/")
    if legacy_base:
        candidates.append(f"{legacy_base}/{key}")
    return candidates


def _stream(body: object) -> Iterator[bytes]:
    """Relaie l'objet par tranches, puis ferme la connexion amont."""
    try:
        while True:
            chunk = body.read(_STREAM_CHUNK_BYTES)  # type: ignore[attr-defined]
            if not chunk:
                return
            yield chunk
    finally:
        close = getattr(body, "close", None)
        if callable(close):
            close()


# `response_model=None` : la route renvoie un fichier ou un flux selon le backend,
# et FastAPI ne peut pas deriver de modele Pydantic de cette union.
@router.get("/story-media/{user_id}/{filename}", response_model=None)
async def get_story_media_file(
    user_id: uuid.UUID,
    filename: str,
    request: Request,
    viewer: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> FileResponse | StreamingResponse:
    settings = get_settings()

    # Normalisation : aucun separateur, aucun fichier cache. Le confinement est verifie
    # une seconde fois par la cle (`story_media_key_for`) et par le stockage.
    if "/" in filename or "\\" in filename or filename.startswith("."):
        raise _not_found()

    # Le proprietaire lit toujours SON media, meme avant publication : le composer
    # televerse puis previsualise avant de creer la ligne.
    if viewer.id != user_id:
        post = await PostRepository(session).get_active_post_by_media_url(
            _candidate_urls(settings, user_id, filename),
            author_id=user_id,
        )
        if post is None or not can_view_post(post, viewer.id):
            raise _not_found()

    if settings.story_media_storage_backend == "filesystem":
        path, content_type = StoryMediaFilesystemStorage(settings).resolve_public_file(
            user_id, filename
        )
        return FileResponse(
            path=path, media_type=content_type, headers=_PRIVATE_MEDIA_HEADERS
        )

    from app.services.story_media.r2_storage import StoryMediaR2Storage

    obj = StoryMediaR2Storage(settings).open_object(
        story_media_key_for(user_id, filename),
        range_header=request.headers.get("range"),
    )
    headers = dict(_PRIVATE_MEDIA_HEADERS)
    headers["Accept-Ranges"] = "bytes"
    if obj.content_range:
        headers["Content-Range"] = obj.content_range
    if obj.content_length is not None:
        headers["Content-Length"] = str(obj.content_length)
    return StreamingResponse(
        _stream(obj.body),
        status_code=206 if obj.partial else 200,
        media_type=obj.content_type or "application/octet-stream",
        headers=headers,
    )

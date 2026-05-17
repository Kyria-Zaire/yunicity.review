"""FastAPI dependencies: DB session, current user, permission guards."""

from __future__ import annotations

import uuid
from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.rbac_repository import RbacRepository
from app.repositories.user_repository import UserRepository

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AppError(
            status_code=401,
            code="UNAUTHORIZED",
            detail="Authentification requise.",
        )
    payload = decode_access_token(credentials.credentials)
    try:
        user_id = uuid.UUID(str(payload["sub"]))
    except (KeyError, ValueError) as exc:
        raise AppError(
            status_code=401,
            code="UNAUTHORIZED",
            detail="Token d'accès invalide ou expiré.",
        ) from exc

    user = await UserRepository(session).get_by_id(user_id)
    if user is None:
        raise AppError(
            status_code=401,
            code="UNAUTHORIZED",
            detail="Utilisateur introuvable.",
        )
    if not user.is_active:
        raise AppError(
            status_code=403,
            code="ACCOUNT_SUSPENDED",
            detail="Ce compte est suspendu.",
        )
    return user


async def require_authenticated_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user


def require_permission(permission_key: str) -> Callable[..., Awaitable[User]]:
    async def _guard(
        current_user: Annotated[User, Depends(get_current_user)],
        session: Annotated[AsyncSession, Depends(get_db)],
    ) -> User:
        rbac = RbacRepository(session)
        if not await rbac.user_has_permission(current_user.id, permission_key):
            raise AppError(
                status_code=403,
                code="FORBIDDEN",
                detail="Permission insuffisante.",
            )
        return current_user

    return _guard


def is_mobile_client(
    x_client_platform: Annotated[str | None, Header(alias="X-Client-Platform")] = None,
) -> bool:
    return (x_client_platform or "").strip().lower() == "mobile"

"""Presence validation routes (PASSPORT-PRESENCE-01), mounted only when the flag is on.

Kept out of ``api_router`` on purpose: with ``PRESENCE_VALIDATION_ENABLED=false`` the
routes do not exist at all (framework 404, absent from OpenAPI), whatever the request.
"""

from fastapi import APIRouter

from app.api.v1 import admin_presence

presence_api_router = APIRouter()
presence_api_router.include_router(admin_presence.router)

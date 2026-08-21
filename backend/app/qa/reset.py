"""Guarded QA schema reset (C3-F0-T1).

Drops and rebuilds the ``public`` schema of the disposable ``yunicity_qa`` DB.
The guard is invoked *inside* this function (not only in the launcher), so no
import path can reach the destructive statements without passing it first.
"""

from __future__ import annotations

import logging
import shutil

import asyncpg

from app.qa.guard import QaTarget, ensure_qa_destructive_target, resolve_test_database_url

logger = logging.getLogger(__name__)


def _asyncpg_dsn(url: str) -> str:
    """asyncpg wants a plain postgresql:// DSN, not the SQLAlchemy +asyncpg variant."""
    return url.replace("+asyncpg", "")


async def reset_qa_schema() -> QaTarget:
    """DROP + recreate ``public`` schema on the validated QA target. Fail-closed."""
    target = ensure_qa_destructive_target()
    dsn = _asyncpg_dsn(resolve_test_database_url())

    logger.warning("qa_reset_start", extra={"target": target.confirmation()})
    connection = await asyncpg.connect(dsn)
    try:
        await connection.execute("DROP SCHEMA IF EXISTS public CASCADE")
        await connection.execute("CREATE SCHEMA public")
        await connection.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    finally:
        await connection.close()
    logger.warning("qa_reset_done", extra={"target": target.confirmation()})
    _wipe_story_media_volume()
    return target


def _wipe_story_media_volume() -> None:
    """Drop filesystem story/post media living in the isolated QA volume."""
    from app.core.config import get_settings
    from app.core.story_media_policy import (
        allowed_story_media_roots,
        resolve_story_media_upload_dir,
    )

    get_settings.cache_clear()
    settings = get_settings()
    if settings.story_media_storage_backend != "filesystem":
        return
    try:
        root = resolve_story_media_upload_dir(settings.story_media_upload_dir)
    except Exception:
        logger.warning("qa_story_media_wipe_skipped")
        return
    if not any(
        root == allowed.resolve() or root.is_relative_to(allowed.resolve())
        for allowed in allowed_story_media_roots()
    ):
        logger.warning("qa_story_media_wipe_refused", extra={"path": str(root)})
        return
    if not root.exists():
        return
    for child in root.iterdir():
        if child.is_dir() and not child.is_symlink():
            shutil.rmtree(child)
        else:
            child.unlink(missing_ok=True)
    logger.warning("qa_story_media_wiped", extra={"path": str(root)})

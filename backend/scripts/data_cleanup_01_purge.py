"""DATA-CLEANUP-01 — purge smoke data validated by Founder (step 2).

Targets (hardcoded):
  - 2 INFRA-01 published videos
  - 2 orphan local_video_uploads
  - 4 pilot-m00-*@example.com users

Explicitly excluded:
  - qa06b.*@example.com (QA auth test account)

Deletion order:
  1. R2 storage objects
  2. local_video_uploads
  3. local_videos
  4. users (pilot-m00-* only)

Usage (from backend/):
    npx @railway/cli run -- uv run python scripts/data_cleanup_01_purge.py
    npx @railway/cli run -- uv run python scripts/data_cleanup_01_purge.py --execute
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import uuid
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import asyncpg

BACKEND_ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_DIR = BACKEND_ROOT / "data" / "cleanup_snapshots"

# --- Founder-validated targets (hardcoded) ---

LOCAL_VIDEO_IDS: tuple[str, ...] = (
    "7d687d7e-e1b8-473d-a035-954642b1fd3d",
    "00c48937-7ccf-492c-9200-807c5d454d71",
)

UPLOAD_IDS: tuple[str, ...] = (
    "b8b291b9-bc8c-4f14-8eae-9ad5c509a612",
    "0462ff78-b19d-4173-9edd-31c02827eeee",
)

PILOT_M00_USER_IDS: tuple[str, ...] = (
    "c3c31cac-58ba-4c6f-bd0a-f6620736b07a",
    "b5183bb3-864d-4cee-8b51-a3137afb0f29",
    "f33d33da-5b28-40c2-828f-dfa4da0d6bc1",
    "3c2543cd-4252-4f71-b862-d21500297767",
)

EXCLUDED_USER_IDS: frozenset[str] = frozenset(
    {
        "46af7130-c2f4-46bd-a181-871e9c8b7502",  # qa06b.1781574783@example.com
    }
)

EXCLUDED_EMAIL_PREFIX = "qa06b."
PILOT_M00_EMAIL_PREFIX = "pilot-m00-"
EXPECTED_VIDEO_TITLE_PREFIX = "INFRA-01 R2 smoke test"

logger = logging.getLogger("data_cleanup_01_purge")


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ",
    )


def _asyncpg_dsn(database_url: str) -> str:
    url = database_url.strip()
    for prefix in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgres://" + url.removeprefix(prefix)
    return url


def _uuid(value: str) -> uuid.UUID:
    return uuid.UUID(value)


def _record_to_dict(row: asyncpg.Record | None) -> dict[str, Any] | None:
    if row is None:
        return None
    out: dict[str, Any] = {}
    for key in row.keys():
        val = row[key]
        if isinstance(val, uuid.UUID):
            out[key] = str(val)
        elif isinstance(val, datetime):
            out[key] = val.isoformat()
        elif isinstance(val, Decimal):
            out[key] = float(val)
        else:
            out[key] = val
    return out


def _thumbnail_key_from_processed(storage_key: str) -> str:
    if storage_key.endswith("/processed.mp4"):
        return storage_key[: -len("processed.mp4")] + "thumbnail.jpg"
    return storage_key.rsplit("/", 1)[0] + "/thumbnail.jpg"


def _public_path_from_url(url: str | None) -> str | None:
    if not url:
        return None
    marker = "/local-video/"
    idx = url.find(marker)
    if idx == -1:
        return None
    return url[idx + 1 :]


async def _fetch_local_videos(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    rows = await conn.fetch(
        """
        SELECT lv.*, u.email AS author_email
        FROM local_videos lv
        JOIN users u ON u.id = lv.author_user_id
        WHERE lv.id = ANY($1::uuid[])
        ORDER BY lv.created_at
        """,
        [_uuid(vid) for vid in LOCAL_VIDEO_IDS],
    )
    return rows


async def _fetch_uploads(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    rows = await conn.fetch(
        """
        SELECT upl.*, u.email AS author_email
        FROM local_video_uploads upl
        JOIN users u ON u.id = upl.author_user_id
        WHERE upl.id = ANY($1::uuid[])
        ORDER BY upl.created_at
        """,
        [_uuid(uid) for uid in UPLOAD_IDS],
    )
    return rows


async def _fetch_users(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    rows = await conn.fetch(
        """
        SELECT id, email, full_name, city, is_active, created_at
        FROM users
        WHERE id = ANY($1::uuid[])
        ORDER BY created_at
        """,
        [_uuid(uid) for uid in PILOT_M00_USER_IDS],
    )
    return rows


def _validate_targets(
    videos: list[asyncpg.Record],
    uploads: list[asyncpg.Record],
    users: list[asyncpg.Record],
) -> None:
    found_video_ids = {str(row["id"]) for row in videos}
    missing_videos = set(LOCAL_VIDEO_IDS) - found_video_ids
    if missing_videos:
        raise RuntimeError(f"Missing local_videos rows: {sorted(missing_videos)}")

    for row in videos:
        title = row["title"] or ""
        if not title.startswith(EXPECTED_VIDEO_TITLE_PREFIX):
            raise RuntimeError(
                f"Video {row['id']} title mismatch: {title!r} "
                f"(expected prefix {EXPECTED_VIDEO_TITLE_PREFIX!r})"
            )
        email = row["author_email"] or ""
        if email.startswith(EXCLUDED_EMAIL_PREFIX):
            raise RuntimeError(f"Video {row['id']} author is excluded QA account: {email}")
        if str(row["author_user_id"]) in EXCLUDED_USER_IDS:
            raise RuntimeError(f"Video {row['id']} author_user_id is in EXCLUDED_USER_IDS")

    found_upload_ids = {str(row["id"]) for row in uploads}
    missing_uploads = set(UPLOAD_IDS) - found_upload_ids
    if missing_uploads:
        raise RuntimeError(f"Missing local_video_uploads rows: {sorted(missing_uploads)}")

    for row in uploads:
        email = row["author_email"] or ""
        if email.startswith(EXCLUDED_EMAIL_PREFIX):
            raise RuntimeError(f"Upload {row['id']} author is excluded QA account: {email}")
        if str(row["author_user_id"]) in EXCLUDED_USER_IDS:
            raise RuntimeError(f"Upload {row['id']} author_user_id is in EXCLUDED_USER_IDS")

    found_user_ids = {str(row["id"]) for row in users}
    missing_users = set(PILOT_M00_USER_IDS) - found_user_ids
    if missing_users:
        raise RuntimeError(f"Missing users rows: {sorted(missing_users)}")

    for row in users:
        user_id = str(row["id"])
        email = row["email"] or ""
        if user_id in EXCLUDED_USER_IDS or email.startswith(EXCLUDED_EMAIL_PREFIX):
            raise RuntimeError(f"Refusing to purge excluded QA user: {user_id} {email}")
        if not email.startswith(PILOT_M00_EMAIL_PREFIX) or not email.endswith("@example.com"):
            raise RuntimeError(f"User {user_id} email not pilot-m00-*@example.com: {email}")


def _collect_r2_keys(
    videos: list[asyncpg.Record],
    uploads: list[asyncpg.Record],
) -> list[str]:
    keys: list[str] = []
    seen: set[str] = set()

    def add(key: str | None) -> None:
        if not key or key in seen:
            return
        seen.add(key)
        keys.append(key)

    for row in videos:
        add(row["storage_key"])
        add(_thumbnail_key_from_processed(row["storage_key"]))
        add(_public_path_from_url(row["media_url"]))
        add(_public_path_from_url(row["thumbnail_url"]))

    for row in uploads:
        add(row["storage_key"])

    return keys


def _build_snapshot(
    *,
    mode: str,
    videos: list[asyncpg.Record],
    uploads: list[asyncpg.Record],
    users: list[asyncpg.Record],
    r2_keys: list[str],
) -> dict[str, Any]:
    return {
        "script": "data_cleanup_01_purge",
        "mode": mode,
        "created_at": datetime.now(UTC).isoformat(),
        "targets": {
            "local_video_ids": list(LOCAL_VIDEO_IDS),
            "upload_ids": list(UPLOAD_IDS),
            "pilot_m00_user_ids": list(PILOT_M00_USER_IDS),
        },
        "excluded": {
            "user_ids": sorted(EXCLUDED_USER_IDS),
            "email_prefix": EXCLUDED_EMAIL_PREFIX,
        },
        "r2_keys": r2_keys,
        "local_videos": [_record_to_dict(row) for row in videos],
        "local_video_uploads": [_record_to_dict(row) for row in uploads],
        "users": [_record_to_dict(row) for row in users],
        "deletion_order": [
            "r2_objects",
            "local_video_uploads",
            "local_videos",
            "users_pilot_m00",
        ],
    }


def _write_snapshot(snapshot: dict[str, Any]) -> Path:
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    path = SNAPSHOT_DIR / f"data-cleanup-01-{snapshot['mode']}-{stamp}.json"
    path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def _print_plan(snapshot: dict[str, Any]) -> None:
    logger.info("=== DATA-CLEANUP-01 purge plan ===")
    logger.info("R2 objects (%d):", len(snapshot["r2_keys"]))
    for key in snapshot["r2_keys"]:
        logger.info("  - %s", key)

    logger.info("local_video_uploads (%d):", len(snapshot["local_video_uploads"]))
    for row in snapshot["local_video_uploads"]:
        logger.info(
            "  - %s storage_key=%s author=%s", row["id"], row["storage_key"], row["author_email"]
        )

    logger.info("local_videos (%d):", len(snapshot["local_videos"]))
    for row in snapshot["local_videos"]:
        logger.info(
            "  - %s title=%r status=%s author=%s",
            row["id"],
            row["title"],
            row["status"],
            row["author_email"],
        )

    logger.info("users pilot-m00 (%d):", len(snapshot["users"]))
    for row in snapshot["users"]:
        logger.info("  - %s %s", row["id"], row["email"])

    logger.info("EXCLUDED (will NOT delete): qa06b.*@example.com")


def _delete_r2_objects(keys: list[str], *, dry_run: bool) -> dict[str, Any]:
    if not keys:
        return {"attempted": False, "reason": "no_keys", "deleted": [], "failed": []}

    backend = os.environ.get("LOCAL_VIDEO_STORAGE_BACKEND", "filesystem").strip().lower()
    if backend != "r2":
        return {
            "attempted": False,
            "reason": f"storage_backend={backend}",
            "deleted": [],
            "failed": keys,
            "dry_run": dry_run,
        }

    endpoint = os.environ.get("LOCAL_VIDEO_R2_ENDPOINT", "").strip()
    bucket = os.environ.get("LOCAL_VIDEO_R2_BUCKET", "").strip()
    access_key = os.environ.get("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "").strip()
    secret_key = os.environ.get("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "").strip()
    if not all([endpoint, bucket, access_key, secret_key]):
        return {
            "attempted": False,
            "reason": "missing_r2_env",
            "deleted": [],
            "failed": keys,
            "dry_run": dry_run,
        }

    if dry_run:
        logger.info("[dry-run] would delete %d R2 object(s) from bucket=%s", len(keys), bucket)
        for key in keys:
            logger.info("[dry-run]   R2 delete: s3://%s/%s", bucket, key)
        return {
            "attempted": True,
            "backend": "r2",
            "bucket": bucket,
            "deleted": [],
            "failed": [],
            "dry_run": True,
        }

    import boto3  # type: ignore[import-untyped]
    from botocore.client import Config  # type: ignore[import-untyped]
    from botocore.exceptions import ClientError  # type: ignore[import-untyped]

    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )
    deleted: list[str] = []
    failed: list[str] = []
    for key in keys:
        try:
            client.delete_object(Bucket=bucket, Key=key)
            deleted.append(key)
            logger.info("R2 deleted: %s", key)
        except ClientError as exc:
            failed.append(key)
            logger.error("R2 delete failed: %s (%s)", key, exc)

    return {
        "attempted": True,
        "backend": "r2",
        "bucket": bucket,
        "deleted": deleted,
        "failed": failed,
        "dry_run": False,
    }


async def _purge_database(conn: asyncpg.Connection, *, execute: bool) -> dict[str, int]:
    counts = {"local_video_uploads": 0, "local_videos": 0, "users": 0}

    upload_ids = [_uuid(uid) for uid in UPLOAD_IDS]
    video_ids = [_uuid(vid) for vid in LOCAL_VIDEO_IDS]
    user_ids = [_uuid(uid) for uid in PILOT_M00_USER_IDS]

    if execute:
        async with conn.transaction():
            result = await conn.execute(
                "DELETE FROM local_video_uploads WHERE id = ANY($1::uuid[])",
                upload_ids,
            )
            counts["local_video_uploads"] = int(result.split()[-1])
            logger.info("DB deleted local_video_uploads: %d", counts["local_video_uploads"])

            result = await conn.execute(
                "DELETE FROM local_videos WHERE id = ANY($1::uuid[])",
                video_ids,
            )
            counts["local_videos"] = int(result.split()[-1])
            logger.info("DB deleted local_videos: %d", counts["local_videos"])

            result = await conn.execute(
                """
                DELETE FROM users
                WHERE id = ANY($1::uuid[])
                  AND email ILIKE 'pilot-m00-%@example.com'
                  AND email NOT ILIKE 'qa06b.%@example.com'
                """,
                user_ids,
            )
            counts["users"] = int(result.split()[-1])
            logger.info("DB deleted users (pilot-m00): %d", counts["users"])
    else:
        counts["local_video_uploads"] = len(upload_ids)
        counts["local_videos"] = len(video_ids)
        counts["users"] = len(user_ids)
        logger.info(
            "[dry-run] would DELETE local_video_uploads: %d row(s)",
            counts["local_video_uploads"],
        )
        logger.info("[dry-run] would DELETE local_videos: %d row(s)", counts["local_videos"])
        logger.info("[dry-run] would DELETE users (pilot-m00): %d row(s)", counts["users"])

    return counts


async def _run(*, execute: bool) -> int:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        logger.error("DATABASE_URL is not set. Use: npx @railway/cli run -- uv run python ...")
        return 1

    mode = "execute" if execute else "dry-run"
    logger.info("Starting DATA-CLEANUP-01 purge (%s)", mode)

    conn = await asyncpg.connect(_asyncpg_dsn(database_url))
    try:
        videos = await _fetch_local_videos(conn)
        uploads = await _fetch_uploads(conn)
        users = await _fetch_users(conn)
        _validate_targets(videos, uploads, users)

        r2_keys = _collect_r2_keys(videos, uploads)
        snapshot = _build_snapshot(
            mode=mode,
            videos=videos,
            uploads=uploads,
            users=users,
            r2_keys=r2_keys,
        )
        snapshot_path = _write_snapshot(snapshot)
        logger.info("Snapshot written: %s", snapshot_path)

        _print_plan(snapshot)

        r2_result = _delete_r2_objects(r2_keys, dry_run=not execute)
        snapshot["r2_cleanup"] = r2_result

        if execute and r2_result.get("failed"):
            logger.error("R2 cleanup had failures — aborting DB purge")
            snapshot_path.write_text(
                json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            return 1

        db_counts = await _purge_database(conn, execute=execute)
        snapshot["db_cleanup"] = db_counts
        snapshot_path.write_text(
            json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

        if execute:
            logger.info("Purge complete.")
        else:
            logger.info(
                "Dry-run complete — no deletions performed. Re-run with --execute to apply."
            )
    finally:
        await conn.close()

    return 0


def main() -> None:
    _configure_logging()
    parser = argparse.ArgumentParser(
        description="DATA-CLEANUP-01 — purge validated smoke data (dry-run by default).",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Apply deletions. Default is dry-run only.",
    )
    args = parser.parse_args()
    raise SystemExit(asyncio.run(_run(execute=args.execute)))


if __name__ == "__main__":
    main()

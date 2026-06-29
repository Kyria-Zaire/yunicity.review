"""TICKET M-00 — seed local videos for pilot propagation.

Also serves as R2 recette smoke test (MEDIA-INFRA-V1 / INFRA-01):
  YUNICITY_API_BASE_URL=https://api.recette.yunicity.city/api/v1 \\
    python scripts/pilot_m00_seed_videos.py --smoke

After publish (HTTP 202), polls GET /local-videos/{id} until published or timeout.
Polling defaults: interval 2 s, timeout 180 s (override via env below).
Exit 6 = processing timeout (likely video worker not running).
Exit 7 = processing failed (status=failed).

Smoke mode cleans up storage objects by default (R2 or filesystem when creds/paths
are available). DB rows and the ephemeral test user are not removed — no public
delete API exists. Use --leave-artifacts to keep storage objects.

Dry-run (no upload/publish, no storage writes):
  python scripts/pilot_m00_seed_videos.py --dry-run-safe
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any

import httpx

DEFAULT_API = "http://localhost:8000/api/v1"
VIDEO_PATH = Path(__file__).resolve().parents[1] / "data" / "e2e-test-video.mp4"

CENTRE_VILLE_ID = "d6010000-0000-4000-8000-000000000001"
CATHEDRALE_ID = "d6030000-0000-4000-8000-000000000001"
PARTNER_EVENT_1_ID = "d6050000-0000-4000-8000-000000000001"
# Poll after HTTP 202 publish — override for slow recette / large files.
PUBLISH_POLL_INTERVAL_SECONDS = float(
    os.environ.get("LOCAL_VIDEO_SMOKE_POLL_INTERVAL_SECONDS", "2.0")
)
PUBLISH_POLL_TIMEOUT_SECONDS = float(
    os.environ.get("LOCAL_VIDEO_SMOKE_POLL_TIMEOUT_SECONDS", "180.0")
)


class VideoProcessingFailedError(RuntimeError):
    """Worker reported status=failed."""


class VideoProcessingTimeoutError(TimeoutError):
    """Polling exceeded deadline — worker may be down."""

    def __init__(self, video_id: str, *, last_status: str, elapsed_seconds: float) -> None:
        self.video_id = video_id
        self.last_status = last_status
        self.elapsed_seconds = elapsed_seconds
        hint = (
            "Video worker not running? Start: arq workers.video_worker.WorkerSettings"
            if last_status == "processing"
            else f"Last status was {last_status!r}"
        )
        super().__init__(
            f"Video {video_id} not ready after {elapsed_seconds:.0f}s "
            f"(last_status={last_status}). {hint}"
        )


def _api_base() -> str:
    return os.environ.get("YUNICITY_API_BASE_URL", DEFAULT_API).rstrip("/")


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _register(client: httpx.Client, api: str) -> tuple[str, str]:
    email = f"pilot-m00-{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        f"{api}/auth/register",
        json={
            "email": email,
            "password": "StrongPassword1!",
            "full_name": "Pilot M00 Seed",
        },
    )
    response.raise_for_status()
    print(f"registered={email}", file=sys.stderr)
    return response.json()["access_token"], email


def _wait_until_ready(
    client: httpx.Client,
    api: str,
    token: str,
    video_id: str,
) -> dict[str, Any]:
    started = time.monotonic()
    deadline = started + PUBLISH_POLL_TIMEOUT_SECONDS
    last_status = "unknown"
    polls = 0
    while time.monotonic() < deadline:
        response = client.get(
            f"{api}/local-videos/{video_id}",
            headers=_auth_headers(token),
        )
        response.raise_for_status()
        body = response.json()
        last_status = str(body.get("status") or "unknown")
        polls += 1
        if last_status == "published":
            print(
                f"poll_ready video_id={video_id} polls={polls} "
                f"elapsed_s={time.monotonic() - started:.1f}",
                file=sys.stderr,
            )
            return body
        if last_status == "failed":
            detail = body.get("processing_error") or "unknown error"
            raise VideoProcessingFailedError(f"Video processing failed: {detail}")
        time.sleep(PUBLISH_POLL_INTERVAL_SECONDS)
    elapsed = time.monotonic() - started
    print(
        f"poll_timeout video_id={video_id} polls={polls} "
        f"elapsed_s={elapsed:.1f} last_status={last_status} "
        f"interval_s={PUBLISH_POLL_INTERVAL_SECONDS} timeout_s={PUBLISH_POLL_TIMEOUT_SECONDS}",
        file=sys.stderr,
    )
    raise VideoProcessingTimeoutError(
        video_id,
        last_status=last_status,
        elapsed_seconds=elapsed,
    )


def _publish(
    client: httpx.Client,
    api: str,
    token: str,
    *,
    title: str,
    cultural_place_id: str | None = None,
    local_event_id: str | None = None,
) -> dict[str, Any]:
    video_bytes = VIDEO_PATH.read_bytes()
    init = client.post(
        f"{api}/local-videos/upload-init",
        headers=_auth_headers(token),
        json={
            "filename": "pilot-m00.mp4",
            "content_type": "video/mp4",
            "file_size_bytes": len(video_bytes),
            "city": "Reims",
            "neighborhood_id": CENTRE_VILLE_ID,
        },
    )
    init.raise_for_status()
    init_body = init.json()

    upload = client.put(
        init_body["presigned_url"],
        content=video_bytes,
        headers={"Content-Type": "video/mp4"},
    )
    upload.raise_for_status()

    payload: dict[str, Any] = {
        "upload_id": init_body["upload_id"],
        "city": "Reims",
        "neighborhood_id": CENTRE_VILLE_ID,
        "video_type": "moment",
        "title": title,
        "latitude": 49.2583,
        "longitude": 4.0317,
    }
    if cultural_place_id:
        payload["cultural_place_id"] = cultural_place_id
    if local_event_id:
        payload["local_event_id"] = local_event_id

    publish = client.post(
        f"{api}/local-videos",
        headers=_auth_headers(token),
        json=payload,
    )
    if publish.status_code not in {200, 201, 202}:
        publish.raise_for_status()
    accepted = publish.json()
    video_id = str(accepted["id"])
    body = _wait_until_ready(client, api, token, video_id)
    body["_upload_storage_key"] = init_body.get("storage_key")
    body["_upload_id"] = init_body.get("upload_id")
    return body


def _verify_feed(client: httpx.Client, api: str, token: str) -> list[dict[str, Any]]:
    response = client.get(
        f"{api}/local-videos/feed",
        headers=_auth_headers(token),
        params={"city": "Reims", "limit": 20},
    )
    response.raise_for_status()
    return response.json()["items"]


def _cdn_status(client: httpx.Client, url: str) -> int | None:
    if not url:
        return None
    try:
        response = client.head(url, follow_redirects=True)
        return response.status_code
    except httpx.HTTPError:
        return None


def _artifact_storage_keys(video: dict[str, Any]) -> list[str]:
    keys: list[str] = []
    upload_key = video.get("_upload_storage_key")
    if isinstance(upload_key, str) and upload_key.strip():
        keys.append(upload_key.strip())
    processed_key = video.get("storage_key")
    if isinstance(processed_key, str) and processed_key.strip():
        keys.append(processed_key.strip())
        if processed_key.endswith("/processed.mp4"):
            keys.append(processed_key.replace("/processed.mp4", "/thumbnail.jpg"))
    return list(dict.fromkeys(keys))


def _cleanup_storage_objects(keys: list[str]) -> dict[str, Any]:
    if not keys:
        return {"attempted": False, "reason": "no_keys", "deleted": [], "failed": []}

    backend = os.environ.get("LOCAL_VIDEO_STORAGE_BACKEND", "filesystem").strip().lower()
    if backend == "r2":
        return _cleanup_r2_objects(keys)
    return _cleanup_filesystem_objects(keys)


def _cleanup_r2_objects(keys: list[str]) -> dict[str, Any]:
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
            "manual_cleanup_required": keys,
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
        except ClientError:
            failed.append(key)
    return {
        "attempted": True,
        "backend": "r2",
        "bucket": bucket,
        "deleted": deleted,
        "failed": failed,
    }


def _cleanup_filesystem_objects(keys: list[str]) -> dict[str, Any]:
    media_root = Path(os.environ.get("MEDIA_UPLOAD_DIR", "uploads"))
    deleted: list[str] = []
    failed: list[str] = []
    for key in keys:
        path = media_root / key.replace("..", "").lstrip("/")
        try:
            if path.is_file():
                path.unlink()
                deleted.append(key)
            else:
                failed.append(key)
        except OSError:
            failed.append(key)
    return {
        "attempted": True,
        "backend": "filesystem",
        "media_upload_dir": str(media_root),
        "deleted": deleted,
        "failed": failed,
    }


def _manual_db_cleanup(video: dict[str, Any], user_email: str) -> dict[str, Any]:
    return {
        "note": "No public delete API — remove manually if required.",
        "local_video_id": video.get("id"),
        "upload_id": video.get("_upload_id"),
        "user_email": user_email,
        "tables": ["local_videos", "local_video_uploads", "users (optional)"],
    }


def _run_dry_run_safe(client: httpx.Client, api: str) -> int:
    health = client.get(f"{api}/health")
    health.raise_for_status()

    token, email = _register(client, api)
    init = client.post(
        f"{api}/local-videos/upload-init",
        headers=_auth_headers(token),
        json={
            "filename": "pilot-m00.mp4",
            "content_type": "video/mp4",
            "file_size_bytes": 1024,
            "city": "Reims",
            "neighborhood_id": CENTRE_VILLE_ID,
        },
    )
    init.raise_for_status()
    init_body = init.json()
    presigned_url = init_body.get("presigned_url", "")
    uses_r2 = "/binary" not in presigned_url

    report = {
        "mode": "dry-run-safe",
        "api_base": api,
        "health": health.json(),
        "upload_init": {
            "upload_id": init_body.get("upload_id"),
            "storage_key": init_body.get("storage_key"),
            "presigned_url_host": httpx.URL(presigned_url).host if presigned_url else None,
            "expects_r2_presigned": uses_r2,
        },
        "artifacts_created": {
            "user_email": email,
            "local_video_upload_pending": init_body.get("upload_id"),
            "storage_objects": [],
            "local_video_published": None,
        },
        "next_step": (
            "Re-run with --smoke for full pipeline "
            "(use --leave-artifacts to skip storage cleanup)."
        ),
    }
    print(json.dumps(report, indent=2))
    return 0


def _run_smoke(client: httpx.Client, api: str, *, cleanup: bool) -> int:
    token, email = _register(client, api)
    video = _publish(client, api, token, title="INFRA-01 R2 smoke test")

    media_status = _cdn_status(client, video.get("media_url", ""))
    thumb_status = _cdn_status(client, video.get("thumbnail_url", ""))

    artifact_keys = _artifact_storage_keys(video)
    cleanup_result: dict[str, Any] | None = None
    if cleanup:
        cleanup_result = _cleanup_storage_objects(artifact_keys)

    report: dict[str, Any] = {
        "mode": "smoke",
        "api_base": api,
        "video": {
            "id": video["id"],
            "status": video["status"],
            "storage_key": video.get("storage_key"),
            "media_url": video.get("media_url"),
            "thumbnail_url": video.get("thumbnail_url"),
            "upload_storage_key": video.get("_upload_storage_key"),
            "artifact_storage_keys": artifact_keys,
        },
        "cdn_checks": {
            "media_url_http_status": media_status,
            "thumbnail_url_http_status": thumb_status,
        },
        "artifacts_created": {
            "user_email": email,
            "local_video_id": video.get("id"),
            "upload_id": video.get("_upload_id"),
            "storage_keys": artifact_keys,
        },
        "cleanup": cleanup_result,
        "manual_db_cleanup": _manual_db_cleanup(video, email),
    }
    print(json.dumps(report, indent=2))

    if video["status"] != "published":
        return 2
    if media_status != 200 or thumb_status != 200:
        return 3
    if cleanup and cleanup_result and cleanup_result.get("failed"):
        return 5
    return 0


def _run_full(client: httpx.Client, api: str, *, cleanup: bool) -> int:
    token, email = _register(client, api)

    place_video = _publish(
        client,
        api,
        token,
        title="Pilote M-00 — Cathédrale",
        cultural_place_id=CATHEDRALE_ID,
    )
    event_video = _publish(
        client,
        api,
        token,
        title="Pilote M-00 — Afterwork découverte",
        local_event_id=PARTNER_EVENT_1_ID,
    )

    items = _verify_feed(client, api, token)
    place_slug_hits = [
        i for i in items if i.get("cultural_place_slug") == "cathedrale-notre-dame"
    ]
    event_hits = [i for i in items if i.get("local_event_id") == PARTNER_EVENT_1_ID]

    cleanup_reports: list[dict[str, Any]] = []
    if cleanup:
        for video in (place_video, event_video):
            cleanup_reports.append(_cleanup_storage_objects(_artifact_storage_keys(video)))

    report = {
        "mode": "full",
        "api_base": api,
        "user_email": email,
        "place_video": {
            "id": place_video["id"],
            "cultural_place_slug": place_video.get("cultural_place_slug"),
            "status": place_video["status"],
            "media_url": place_video.get("media_url"),
        },
        "event_video": {
            "id": event_video["id"],
            "local_event_id": event_video.get("local_event_id"),
            "status": event_video["status"],
            "media_url": event_video.get("media_url"),
        },
        "feed_place_matches": len(place_slug_hits),
        "feed_event_matches": len(event_hits),
        "feed_total": len(items),
        "cleanup": cleanup_reports if cleanup else None,
    }
    print(json.dumps(report, indent=2))

    if place_video["status"] != "published":
        return 2
    if event_video["status"] != "published":
        return 3
    if not place_slug_hits:
        return 4
    if not event_hits:
        return 5
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Local Video pilot seed / R2 smoke test")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--smoke",
        action="store_true",
        help="Single-video INFRA-01 smoke test with CDN URL checks",
    )
    mode.add_argument(
        "--dry-run-safe",
        action="store_true",
        help="Health + upload-init only (no PUT/publish, no storage objects)",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Delete storage objects after run (default with --smoke)",
    )
    parser.add_argument(
        "--leave-artifacts",
        action="store_true",
        help="Keep storage objects after --smoke (skip cleanup)",
    )
    args = parser.parse_args()

    if not args.dry_run_safe and not VIDEO_PATH.is_file():
        print(f"missing video: {VIDEO_PATH}", file=sys.stderr)
        return 1

    cleanup = args.cleanup
    if args.smoke and not args.leave_artifacts:
        cleanup = True
    elif not args.smoke and not args.cleanup:
        cleanup = False

    api = _api_base()
    try:
        with httpx.Client(timeout=120.0) as client:
            if args.dry_run_safe:
                return _run_dry_run_safe(client, api)
            if args.smoke:
                return _run_smoke(client, api, cleanup=cleanup)
            return _run_full(client, api, cleanup=cleanup)
    except httpx.HTTPStatusError as exc:
        print(
            json.dumps(
                {
                    "error": "http_status_error",
                    "status_code": exc.response.status_code,
                    "body": exc.response.text[:500],
                    "url": str(exc.request.url),
                },
                indent=2,
            ),
            file=sys.stderr,
        )
        return 4
    except httpx.HTTPError as exc:
        print(json.dumps({"error": "http_error", "detail": str(exc)}, indent=2), file=sys.stderr)
        return 4
    except VideoProcessingTimeoutError as exc:
        print(
            json.dumps(
                {
                    "error": "processing_timeout",
                    "video_id": exc.video_id,
                    "last_status": exc.last_status,
                    "elapsed_seconds": exc.elapsed_seconds,
                    "poll_interval_seconds": PUBLISH_POLL_INTERVAL_SECONDS,
                    "poll_timeout_seconds": PUBLISH_POLL_TIMEOUT_SECONDS,
                    "hint": (
                        "Video worker not running? Deploy or start: "
                        "arq workers.video_worker.WorkerSettings"
                        if exc.last_status == "processing"
                        else "Check worker logs for processing failures."
                    ),
                    "detail": str(exc),
                },
                indent=2,
            ),
            file=sys.stderr,
        )
        return 6
    except VideoProcessingFailedError as exc:
        print(
            json.dumps(
                {
                    "error": "processing_failed",
                    "detail": str(exc),
                    "hint": "Inspect LocalVideo.processing_error and worker logs.",
                },
                indent=2,
            ),
            file=sys.stderr,
        )
        return 7


if __name__ == "__main__":
    raise SystemExit(main())

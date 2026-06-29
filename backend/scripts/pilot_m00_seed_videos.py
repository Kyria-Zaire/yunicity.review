"""TICKET M-00 — seed local videos for pilot propagation.

Also serves as R2 recette smoke test (MEDIA-INFRA-V1 / INFRA-01):
  YUNICITY_API_BASE_URL=https://api.recette.yunicity.city/api/v1 \\
    python scripts/pilot_m00_seed_videos.py --smoke
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any

import httpx

DEFAULT_API = "http://localhost:8000/api/v1"
VIDEO_PATH = Path(__file__).resolve().parents[1] / "data" / "e2e-test-video.mp4"

CENTRE_VILLE_ID = "d6010000-0000-4000-8000-000000000001"
CATHEDRALE_ID = "d6030000-0000-4000-8000-000000000001"
PARTNER_EVENT_1_ID = "d6050000-0000-4000-8000-000000000001"


def _api_base() -> str:
    return os.environ.get("YUNICITY_API_BASE_URL", DEFAULT_API).rstrip("/")


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _register(client: httpx.Client, api: str) -> str:
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
    return response.json()["access_token"]


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
    publish.raise_for_status()
    body = publish.json()
    body["_upload_storage_key"] = init_body.get("storage_key")
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


def _run_smoke(client: httpx.Client, api: str) -> int:
    token = _register(client, api)
    video = _publish(client, api, token, title="INFRA-01 R2 smoke test")

    media_status = _cdn_status(client, video.get("media_url", ""))
    thumb_status = _cdn_status(client, video.get("thumbnail_url", ""))

    report = {
        "mode": "smoke",
        "api_base": api,
        "video": {
            "id": video["id"],
            "status": video["status"],
            "storage_key": video.get("storage_key"),
            "media_url": video.get("media_url"),
            "thumbnail_url": video.get("thumbnail_url"),
            "upload_storage_key": video.get("_upload_storage_key"),
        },
        "cdn_checks": {
            "media_url_http_status": media_status,
            "thumbnail_url_http_status": thumb_status,
        },
    }
    print(json.dumps(report, indent=2))

    if video["status"] != "published":
        return 2
    if media_status != 200 or thumb_status != 200:
        return 3
    return 0


def _run_full(client: httpx.Client, api: str) -> int:
    token = _register(client, api)

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

    report = {
        "mode": "full",
        "api_base": api,
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
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="Single-video INFRA-01 smoke test with CDN URL checks",
    )
    args = parser.parse_args()

    if not VIDEO_PATH.is_file():
        print(f"missing video: {VIDEO_PATH}", file=sys.stderr)
        return 1

    api = _api_base()
    try:
        with httpx.Client(timeout=120.0) as client:
            if args.smoke:
                return _run_smoke(client, api)
            return _run_full(client, api)
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


if __name__ == "__main__":
    raise SystemExit(main())

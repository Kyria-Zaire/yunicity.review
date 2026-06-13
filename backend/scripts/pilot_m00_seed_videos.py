"""TICKET M-00 — seed 1 place-linked + 1 event-linked local video for pilot propagation."""

from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path

import httpx

API = "http://localhost:8000/api/v1"
VIDEO_PATH = Path(__file__).resolve().parents[1] / "data" / "e2e-test-video.mp4"

CENTRE_VILLE_ID = "d6010000-0000-4000-8000-000000000001"
CATHEDRALE_ID = "d6030000-0000-4000-8000-000000000001"
# reims_partner_events.py (toujours seedé — contrairement aux events --demo)
PARTNER_EVENT_1_ID = "d6050000-0000-4000-8000-000000000001"


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _register(client: httpx.Client) -> str:
    email = f"pilot-m00-{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        f"{API}/auth/register",
        json={
            "email": email,
            "password": "StrongPassword1!",
            "full_name": "Pilot M00 Seed",
        },
    )
    response.raise_for_status()
    print(f"registered={email}")
    return response.json()["access_token"]


def _publish(
    client: httpx.Client,
    token: str,
    *,
    title: str,
    cultural_place_id: str | None = None,
    local_event_id: str | None = None,
) -> dict:
    video_bytes = VIDEO_PATH.read_bytes()
    init = client.post(
        f"{API}/local-videos/upload-init",
        headers=_auth_headers(token),
        json={
            "filename": "pilot-m00.mp4",
            "content_type": "video/mp4",
            "file_size_bytes": len(video_bytes),
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

    payload: dict = {
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
        f"{API}/local-videos",
        headers=_auth_headers(token),
        json=payload,
    )
    publish.raise_for_status()
    return publish.json()


def _verify_feed(client: httpx.Client, token: str) -> list[dict]:
    response = client.get(
        f"{API}/local-videos/feed",
        headers=_auth_headers(token),
        params={"city": "Reims", "limit": 20},
    )
    response.raise_for_status()
    return response.json()["items"]


def main() -> int:
    if not VIDEO_PATH.is_file():
        print(f"missing video: {VIDEO_PATH}", file=sys.stderr)
        return 1

    with httpx.Client(timeout=120.0) as client:
        token = _register(client)

        place_video = _publish(
            client,
            token,
            title="Pilote M-00 — Cathédrale",
            cultural_place_id=CATHEDRALE_ID,
        )
        event_video = _publish(
            client,
            token,
            title="Pilote M-00 — Afterwork découverte",
            local_event_id=PARTNER_EVENT_1_ID,
        )

        items = _verify_feed(client, token)
        place_slug_hits = [
            i for i in items if i.get("cultural_place_slug") == "cathedrale-notre-dame"
        ]
        event_hits = [
            i for i in items if i.get("local_event_id") == PARTNER_EVENT_1_ID
        ]

        report = {
            "place_video": {
                "id": place_video["id"],
                "cultural_place_slug": place_video.get("cultural_place_slug"),
                "status": place_video["status"],
            },
            "event_video": {
                "id": event_video["id"],
                "local_event_id": event_video.get("local_event_id"),
                "status": event_video["status"],
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


if __name__ == "__main__":
    raise SystemExit(main())

import { describe, expect, it } from "vitest";

import type { LocalVideo } from "@yunicity/types";

import {
  isLocalVideoFeedItemPlayable,
  isLocalVideoFeedItemProcessing,
  resolveLocalVideoPublicationPhase,
} from "./local-video-processing-presenter";

function baseVideo(overrides: Partial<LocalVideo> = {}): LocalVideo {
  return {
    id: "v1",
    author_user_id: "u1",
    city: "Reims",
    neighborhood_id: "n1",
    video_type: "moment",
    title: "Test",
    description: null,
    cultural_place_id: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "",
    thumbnail_url: "",
    duration_seconds: 0,
    file_size_bytes: 0,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "processing",
    processing_status: "processing",
    processing_error: null,
    published_at: null,
    created_at: "2026-06-16T12:00:00.000Z",
    ...overrides,
  };
}

describe("local-video-processing-presenter", () => {
  it("resolveLocalVideoPublicationPhase detects processing and published", () => {
    expect(resolveLocalVideoPublicationPhase(baseVideo())).toBe("processing");
    expect(
      resolveLocalVideoPublicationPhase(
        baseVideo({ status: "published", processing_status: "ready", media_url: "https://cdn/v.mp4" }),
      ),
    ).toBe("published");
    expect(
      resolveLocalVideoPublicationPhase(
        baseVideo({ status: "failed", processing_status: "failed" }),
      ),
    ).toBe("failed");
  });

  it("feed item helpers distinguish playable vs processing slides", () => {
    expect(
      isLocalVideoFeedItemPlayable({
        id: "v1",
        status: "published",
        media_url: "https://cdn/v.mp4",
      } as never),
    ).toBe(true);
    expect(
      isLocalVideoFeedItemProcessing({
        id: "v1",
        status: "processing",
        media_url: "",
      } as never),
    ).toBe(true);
  });
});

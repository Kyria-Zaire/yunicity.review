import { describe, expect, it, vi } from "vitest";

import type { LocalVideo } from "@yunicity/types";

import { getProcessingStatus, pollLocalVideoUntilSettled } from "./local-video-processing";
import type { LocalVideosApi } from "./local-videos-api";
import { mapLocalVideoToFeedPreview } from "./local-videos-api";

function processingVideo(): LocalVideo {
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
  };
}

describe("local-video-processing", () => {
  it("getProcessingStatus returns processing_status field", () => {
    expect(getProcessingStatus(processingVideo())).toBe("processing");
  });

  it("pollLocalVideoUntilSettled resolves when video becomes ready", async () => {
    const ready = {
      ...processingVideo(),
      status: "published" as const,
      processing_status: "ready" as const,
      media_url: "https://cdn.example/v.mp4",
    };
    const getVideo = vi
      .fn<LocalVideosApi["getVideo"]>()
      .mockResolvedValueOnce(processingVideo())
      .mockResolvedValueOnce(ready);

    const api = { getVideo } as unknown as LocalVideosApi;
    const result = await pollLocalVideoUntilSettled(api, "v1", {
      intervalMs: 1,
      timeoutMs: 500,
    });

    expect(result).toEqual(ready);
    expect(getVideo).toHaveBeenCalledTimes(2);
  });
});

describe("mapLocalVideoToFeedPreview", () => {
  it("maps detail video to feed-compatible preview", () => {
    const preview = mapLocalVideoToFeedPreview({
      ...processingVideo(),
      status: "published",
      processing_status: "ready",
      media_url: "https://cdn.example/v.mp4",
      thumbnail_url: "https://cdn.example/t.jpg",
      duration_seconds: 12,
    });
    expect(preview.id).toBe("v1");
    expect(preview.media_url).toBe("https://cdn.example/v.mp4");
    expect(preview.like_count).toBe(0);
  });
});

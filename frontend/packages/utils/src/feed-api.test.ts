import { describe, expect, it, vi } from "vitest";

import type { AuthClient } from "./auth/auth-client";
import { createFeedApi } from "./feed-api";

describe("FeedApi uploadPostMedia — MEDIA-01", () => {
  it("propage AbortSignal jusqu'à la requête multipart", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "/media/photo.jpg", media_type: "image" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const api = createFeedApi({ fetch } as unknown as AuthClient, "https://api.test/api/v1");
    const controller = new AbortController();

    await api.uploadPostMedia(new File(["x"], "photo.jpg", { type: "image/jpeg" }), controller.signal);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      signal: controller.signal,
    });
    expect(fetch.mock.calls[0]?.[1]?.body).toBeInstanceOf(FormData);
  });
});

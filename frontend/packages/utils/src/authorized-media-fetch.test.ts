import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthError } from "./auth/auth-errors";
import {
  AuthorizedMediaFetchError,
  fetchAuthorizedMediaBlob,
} from "./authorized-media-fetch";
import { AuthorizedMediaUrlError } from "./authorized-media-url";

function fakeClient(fetchImpl: (input: string, init?: RequestInit) => Promise<Response>) {
  return { fetch: fetchImpl } as { fetch: typeof fetchImpl };
}

describe("fetchAuthorizedMediaBlob", () => {
  const initial = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (initial === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = initial;
  });

  it("GET authentifié vers l'API, image/jpeg → Blob", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    const fetch = vi.fn(async (input: string, init?: RequestInit) => {
      expect(input).toBe("https://api-preview.yunicity.city/api/v1/story-media/u/a.jpg");
      expect(init?.method).toBe("GET");
      expect(init?.redirect).toBe("error");
      expect(String(input)).not.toMatch(/Bearer|token=/i);
      return new Response(bytes, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    });

    const result = await fetchAuthorizedMediaBlob(fakeClient(fetch) as never, "/api/v1/story-media/u/a.jpg");
    expect(result.contentType).toBe("image/jpeg");
    expect(result.blob.size).toBe(bytes.byteLength);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("refuse une URL externe avant tout fetch", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const fetch = vi.fn();
    await expect(
      fetchAuthorizedMediaBlob(fakeClient(fetch) as never, "https://evil.example/a.jpg"),
    ).rejects.toBeInstanceOf(AuthorizedMediaUrlError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("404 JSON → erreur, jamais un blob image", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const fetch = vi.fn(async () => {
      throw new AuthError("NOT_FOUND", "Média introuvable.", 404);
    });
    await expect(
      fetchAuthorizedMediaBlob(fakeClient(fetch) as never, "/api/v1/story-media/u/a.jpg"),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("Content-Type non image → INVALID_CONTENT_TYPE", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ detail: "Not found" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    await expect(
      fetchAuthorizedMediaBlob(fakeClient(fetch) as never, "/api/v1/story-media/u/a.jpg"),
    ).rejects.toMatchObject({ code: "INVALID_CONTENT_TYPE" } satisfies Partial<AuthorizedMediaFetchError>);
  });

  it("ne place jamais le Bearer dans l'URL passée au client", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const fetch = vi.fn(
      async (input: string) => {
        expect(input).not.toContain("Authorization");
        expect(input).not.toMatch(/[?&]access_token=/i);
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "image/png" },
        });
      },
    );
    await fetchAuthorizedMediaBlob(fakeClient(fetch) as never, "/api/v1/story-media/u/a.png");
  });
});

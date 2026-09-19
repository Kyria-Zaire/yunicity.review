import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthError } from "./auth/auth-errors";
import {
  AuthorizedMediaFetchError,
  fetchAuthorizedMediaBlob,
} from "./authorized-media-fetch";
import { AuthorizedMediaUrlError } from "./authorized-media-url";
import { VALID_STORY_MEDIA_PATH } from "./authorized-media-url.test";

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
      expect(input).toBe(`https://api-preview.yunicity.city${VALID_STORY_MEDIA_PATH}`);
      expect(init?.method).toBe("GET");
      expect(init?.redirect).toBe("error");
      expect(String(input)).not.toMatch(/Bearer|token=/i);
      return new Response(bytes, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    });

    const result = await fetchAuthorizedMediaBlob(
      fakeClient(fetch) as never,
      VALID_STORY_MEDIA_PATH,
    );
    expect(result.contentType).toBe("image/jpeg");
    expect(result.blob.size).toBe(bytes.byteLength);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("refuse une URL externe avant tout fetch (Authorization jamais ajoutée)", async () => {
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
      fetchAuthorizedMediaBlob(fakeClient(fetch) as never, VALID_STORY_MEDIA_PATH),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("Content-Type application/json → INVALID_CONTENT_TYPE", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ detail: "Not found" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    await expect(
      fetchAuthorizedMediaBlob(fakeClient(fetch) as never, VALID_STORY_MEDIA_PATH),
    ).rejects.toMatchObject({
      code: "INVALID_CONTENT_TYPE",
    } satisfies Partial<AuthorizedMediaFetchError>);
  });

  it("refuse image/svg+xml et types vides/malformés", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    for (const type of ["image/svg+xml", "text/html", "", "image/jpeg, image/png"]) {
      const fetch = vi.fn(
        async () =>
          new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: type ? { "Content-Type": type } : undefined,
          }),
      );
      await expect(
        fetchAuthorizedMediaBlob(fakeClient(fetch) as never, VALID_STORY_MEDIA_PATH),
      ).rejects.toMatchObject({ code: "INVALID_CONTENT_TYPE" });
    }
  });

  it("refuse Content-Length manifestement trop grand avant blob", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const fetch = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg",
            "Content-Length": String(30 * 1024 * 1024),
          },
        }),
    );
    await expect(
      fetchAuthorizedMediaBlob(fakeClient(fetch) as never, VALID_STORY_MEDIA_PATH),
    ).rejects.toMatchObject({ code: "OVERSIZE" });
  });

  it("refuse blob vide et réponses 204/206", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    for (const status of [204, 206]) {
      const fetch = vi.fn(
        async () =>
          new Response(null, {
            status,
            headers: { "Content-Type": "image/jpeg" },
          }),
      );
      await expect(
        fetchAuthorizedMediaBlob(fakeClient(fetch) as never, VALID_STORY_MEDIA_PATH),
      ).rejects.toMatchObject({ code: "UNEXPECTED_STATUS", status });
    }

    const empty = vi.fn(
      async () =>
        new Response(new Uint8Array([]), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
    );
    await expect(
      fetchAuthorizedMediaBlob(fakeClient(empty) as never, VALID_STORY_MEDIA_PATH),
    ).rejects.toMatchObject({ code: "EMPTY_BODY" });
  });

  it("conserve redirect:error — une redirection devient erreur réseau", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const fetch = vi.fn(async (_input: string, init?: RequestInit) => {
      expect(init?.redirect).toBe("error");
      throw new TypeError("Failed to fetch");
    });
    await expect(
      fetchAuthorizedMediaBlob(fakeClient(fetch) as never, VALID_STORY_MEDIA_PATH),
    ).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("ne place jamais le Bearer dans l'URL passée au client", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const fetch = vi.fn(async (input: string) => {
      expect(input).not.toContain("Authorization");
      expect(input).not.toMatch(/[?&]access_token=/i);
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    });
    await fetchAuthorizedMediaBlob(fakeClient(fetch) as never, VALID_STORY_MEDIA_PATH.replace(/\.jpg$/i, ".png"));
  });
});

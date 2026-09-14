import { afterEach, describe, expect, it } from "vitest";

import { AuthorizedMediaUrlError, resolveAuthorizedApiMediaUrl } from "./authorized-media-url";

/** Forme réelle persistée par story_media_api_url. */
export const VALID_STORY_MEDIA_PATH =
  "/api/v1/story-media/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg";

describe("resolveAuthorizedApiMediaUrl", () => {
  const initial = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (initial === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = initial;
  });

  it("résout un chemin relatif allowlisté vers l'origine API publique", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(resolveAuthorizedApiMediaUrl(VALID_STORY_MEDIA_PATH)).toBe(
      `https://api-preview.yunicity.city${VALID_STORY_MEDIA_PATH}`,
    );
  });

  it("accepte une URL déjà absolue sur l'origine API", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(
      resolveAuthorizedApiMediaUrl(`https://api-preview.yunicity.city${VALID_STORY_MEDIA_PATH}`),
    ).toBe(`https://api-preview.yunicity.city${VALID_STORY_MEDIA_PATH}`);
  });

  it("refuse une origine externe", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(() => resolveAuthorizedApiMediaUrl("https://evil.example/a.jpg")).toThrow(
      AuthorizedMediaUrlError,
    );
    try {
      resolveAuthorizedApiMediaUrl("https://evil.example/a.jpg");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthorizedMediaUrlError);
      expect((error as AuthorizedMediaUrlError).code).toBe("EXTERNAL_ORIGIN");
    }
  });

  it("refuse un sous-domaine ressemblant à l'API", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(() =>
      resolveAuthorizedApiMediaUrl(
        `https://api-preview.yunicity.city.evil.example${VALID_STORY_MEDIA_PATH}`,
      ),
    ).toThrow(AuthorizedMediaUrlError);
  });

  it("refuse blob/data/javascript/file et protocole relatif", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    for (const src of [
      "blob:https://x/y",
      "data:image/png;base64,AA",
      "javascript:alert(1)",
      "file:///tmp/x.jpg",
      `//evil.example${VALID_STORY_MEDIA_PATH}`,
    ]) {
      expect(() => resolveAuthorizedApiMediaUrl(src)).toThrow(AuthorizedMediaUrlError);
    }
  });

  it("refuse les identifiants dans l'URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(() =>
      resolveAuthorizedApiMediaUrl(
        `https://user:pass@api-preview.yunicity.city${VALID_STORY_MEDIA_PATH}`,
      ),
    ).toThrow(AuthorizedMediaUrlError);
  });

  it("refuse HTTP lorsque l'API attend HTTPS", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(() =>
      resolveAuthorizedApiMediaUrl(`http://api-preview.yunicity.city${VALID_STORY_MEDIA_PATH}`),
    ).toThrow(AuthorizedMediaUrlError);
  });

  it("refuse un chemin API non média et un chemin hors allowlist", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(() => resolveAuthorizedApiMediaUrl("/api/v1/posts")).toThrow(AuthorizedMediaUrlError);
    expect(() => resolveAuthorizedApiMediaUrl("/api/v1/story-media/u/a.jpg")).toThrow(
      AuthorizedMediaUrlError,
    );
    expect(() =>
      resolveAuthorizedApiMediaUrl(
        "/api/v1/story-media/11111111-1111-4111-8111-111111111111/../../etc/passwd",
      ),
    ).toThrow(AuthorizedMediaUrlError);
  });

  it("retire search/hash pour éviter toute injection de jeton", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(
      resolveAuthorizedApiMediaUrl(`${VALID_STORY_MEDIA_PATH}?access_token=leak#x`),
    ).toBe(`https://api-preview.yunicity.city${VALID_STORY_MEDIA_PATH}`);
  });

  it("en mode même origine, n'accepte que l'allowlist story-media", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(resolveAuthorizedApiMediaUrl(VALID_STORY_MEDIA_PATH)).toBe(VALID_STORY_MEDIA_PATH);
    expect(() => resolveAuthorizedApiMediaUrl("/media/a.jpg")).toThrow(AuthorizedMediaUrlError);
    expect(() => resolveAuthorizedApiMediaUrl("https://cdn.example/a.jpg")).toThrow(
      AuthorizedMediaUrlError,
    );
  });

  it("refuse une chaîne vide", () => {
    expect(() => resolveAuthorizedApiMediaUrl("   ")).toThrow(AuthorizedMediaUrlError);
  });
});

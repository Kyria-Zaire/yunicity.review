import { afterEach, describe, expect, it } from "vitest";

import { AuthorizedMediaUrlError, resolveAuthorizedApiMediaUrl } from "./authorized-media-url";

describe("resolveAuthorizedApiMediaUrl", () => {
  const initial = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (initial === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = initial;
  });

  it("résout un chemin relatif vers l'origine API publique", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(resolveAuthorizedApiMediaUrl("/api/v1/story-media/u/a.jpg")).toBe(
      "https://api-preview.yunicity.city/api/v1/story-media/u/a.jpg",
    );
  });

  it("accepte une URL déjà absolue sur l'origine API", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(
      resolveAuthorizedApiMediaUrl("https://api-preview.yunicity.city/api/v1/story-media/u/a.jpg"),
    ).toBe("https://api-preview.yunicity.city/api/v1/story-media/u/a.jpg");
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

  it("refuse blob/data/javascript", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    for (const src of ["blob:https://x/y", "data:image/png;base64,AA", "javascript:alert(1)"]) {
      expect(() => resolveAuthorizedApiMediaUrl(src)).toThrow(AuthorizedMediaUrlError);
    }
  });

  it("en mode même origine, n'accepte que /api/v1/…", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(resolveAuthorizedApiMediaUrl("/api/v1/story-media/u/a.jpg")).toBe(
      "/api/v1/story-media/u/a.jpg",
    );
    expect(() => resolveAuthorizedApiMediaUrl("/media/a.jpg")).toThrow(AuthorizedMediaUrlError);
    expect(() => resolveAuthorizedApiMediaUrl("https://cdn.example/a.jpg")).toThrow(
      AuthorizedMediaUrlError,
    );
  });

  it("refuse une chaîne vide", () => {
    expect(() => resolveAuthorizedApiMediaUrl("   ")).toThrow(AuthorizedMediaUrlError);
  });
});

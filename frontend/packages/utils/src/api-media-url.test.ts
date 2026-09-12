import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveApiMediaUrl } from "./api-media-url";

const AVATAR = "/api/v1/profile-media/74383ba3-0925-4476-b4f6-625aef00a984/avatar.png";

describe("resolveApiMediaUrl", () => {
  const initial = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    if (initial === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = initial;
  });

  it("prefixe une reference relative de l'API par l'origine de l'API", () => {
    // Preview et production : l'API a son propre domaine. C'est le cas qui
    // rendait l'avatar casse — l'origine web repondait 404 sur cette route.
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(resolveApiMediaUrl(AVATAR)).toBe(`https://api-preview.yunicity.city${AVATAR}`);
  });

  it("supprime la barre finale de la base avant de concatener", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city/";
    expect(resolveApiMediaUrl(AVATAR)).toBe(`https://api-preview.yunicity.city${AVATAR}`);
    expect(resolveApiMediaUrl(AVATAR)).not.toContain("//api/v1");
  });

  it("laisse l'URL en meme origine quand aucune base publique n'est configuree", () => {
    // Developpement local : le proxy `/api/v1/*` de Next repond sur l'origine web.
    expect(resolveApiMediaUrl(AVATAR)).toBe(AVATAR);
  });

  it("ne touche pas a une URL deja absolue", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    const cdn = "https://unified-media-preview-production.up.railway.app/media/x.jpg";
    expect(resolveApiMediaUrl(cdn)).toBe(cdn);
    expect(resolveApiMediaUrl("http://exemple.test/a.png")).toBe("http://exemple.test/a.png");
    expect(resolveApiMediaUrl("//exemple.test/a.png")).toBe("//exemple.test/a.png");
  });

  it("ne touche pas a un apercu local avant televersement", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(resolveApiMediaUrl("data:image/png;base64,AAA")).toBe("data:image/png;base64,AAA");
    expect(resolveApiMediaUrl("blob:https://x/y")).toBe("blob:https://x/y");
  });

  it("rend null pour une valeur vide ou absente", () => {
    expect(resolveApiMediaUrl(null)).toBeNull();
    expect(resolveApiMediaUrl(undefined)).toBeNull();
    expect(resolveApiMediaUrl("")).toBeNull();
    expect(resolveApiMediaUrl("   ")).toBeNull();
  });

  it("laisse une relative de document au navigateur, sans inventer de base", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api-preview.yunicity.city";
    expect(resolveApiMediaUrl("images/a.png")).toBe("images/a.png");
  });
});

import { describe, expect, it } from "vitest";

import { getApiBaseUrl, resolveWebApiBaseUrl } from "./api-base-url";

describe("api-base-url — C3.1 dual-origin", () => {
  it("RED: une API LAN absolue n’est pas same-origin avec localhost:3002", () => {
    const page = new URL("http://localhost:3002/login");
    const api = new URL("http://172.20.10.3:8010/api/v1/auth/login");
    expect(page.origin === api.origin).toBe(false);
  });

  it("RED: une IP LAN périmée n’est pas une cible loopback", () => {
    const stale = new URL("http://192.168.1.180:8010/api/v1/health");
    expect(stale.hostname === "127.0.0.1" || stale.hostname === "localhost").toBe(false);
  });

  it("préserve NEXT_PUBLIC_API_URL en production (SSR et navigateur)", () => {
    expect(
      resolveWebApiBaseUrl({
        publicApiUrl: "https://api.example.com",
        proxyTarget: "http://127.0.0.1:8010",
        runtime: "browser",
      }),
    ).toBe("https://api.example.com");
    expect(
      resolveWebApiBaseUrl({
        publicApiUrl: "https://api.example.com/",
        proxyTarget: "http://127.0.0.1:8010",
        runtime: "server",
      }),
    ).toBe("https://api.example.com");
  });

  it("navigateur local/QA sans URL publique → same-origin (chaîne vide)", () => {
    expect(
      resolveWebApiBaseUrl({
        publicApiUrl: undefined,
        proxyTarget: "http://127.0.0.1:8010",
        runtime: "browser",
      }),
    ).toBe("");
  });

  it("SSR local/QA sans URL publique → cible serveur-only", () => {
    expect(
      resolveWebApiBaseUrl({
        publicApiUrl: undefined,
        proxyTarget: "http://127.0.0.1:8010",
        runtime: "server",
      }),
    ).toBe("http://127.0.0.1:8010");
  });

  it("getApiBaseUrl ignore le slash final", () => {
    expect(getApiBaseUrl("http://localhost:8010/")).toBe("http://localhost:8010");
  });
});

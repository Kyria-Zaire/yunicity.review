import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTH_REDIRECT,
  buildCurrentAppPath,
  buildLoginUrlWithNext,
  isSafeInternalReturnPath,
  resolveAuthReturnPath,
} from "./auth-return-path";

describe("auth-return-path", () => {
  it("accepts safe internal paths", () => {
    expect(isSafeInternalReturnPath("/passport")).toBe(true);
    expect(isSafeInternalReturnPath("/feed")).toBe(true);
    expect(isSafeInternalReturnPath("/profile/settings?tab=security")).toBe(true);
  });

  it("rejects external and unsafe values", () => {
    expect(isSafeInternalReturnPath("https://evil.com")).toBe(false);
    expect(isSafeInternalReturnPath("//evil.com")).toBe(false);
    expect(isSafeInternalReturnPath("javascript:alert(1)")).toBe(false);
    expect(isSafeInternalReturnPath("feed")).toBe(false);
    expect(isSafeInternalReturnPath("")).toBe(false);
    expect(isSafeInternalReturnPath(null)).toBe(false);
    expect(isSafeInternalReturnPath("%2F%2Fevil.com")).toBe(false);
  });

  it("resolves next with fallback to feed", () => {
    expect(resolveAuthReturnPath("/passport")).toBe("/passport");
    expect(resolveAuthReturnPath("https://evil.com")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveAuthReturnPath(null)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveAuthReturnPath(undefined)).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("builds login URL with encoded next", () => {
    expect(buildLoginUrlWithNext("/passport")).toBe("/login?next=%2Fpassport");
    expect(buildLoginUrlWithNext("/profile/settings?tab=security")).toBe(
      "/login?next=%2Fprofile%2Fsettings%3Ftab%3Dsecurity",
    );
  });

  it("builds current app path from pathname and search", () => {
    expect(buildCurrentAppPath("/passport", "")).toBe("/passport");
    expect(buildCurrentAppPath("/profile/settings", "tab=security")).toBe(
      "/profile/settings?tab=security",
    );
  });

  // VIDEO-REFONTE-L9 / PRD §7 — REC-01 non-régression chemin vidéo (D2).
  it("L9 D2 — next vidéo interne accepté et next externe rejeté", () => {
    const videoPath = "/videos?video=abc-123";
    expect(isSafeInternalReturnPath(videoPath)).toBe(true);
    expect(resolveAuthReturnPath(videoPath)).toBe(videoPath);
    expect(buildLoginUrlWithNext(videoPath)).toBe(
      "/login?next=%2Fvideos%3Fvideo%3Dabc-123",
    );
    expect(buildCurrentAppPath("/videos", "video=abc-123")).toBe(videoPath);

    expect(resolveAuthReturnPath("https://evil.example/videos?video=x")).toBe(
      DEFAULT_AUTH_REDIRECT,
    );
    expect(resolveAuthReturnPath("//evil/videos?video=x")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveAuthReturnPath("/\\evil")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveAuthReturnPath("%2f%2fevil")).toBe(DEFAULT_AUTH_REDIRECT);
  });
});

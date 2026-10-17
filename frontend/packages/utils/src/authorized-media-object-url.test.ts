import { afterEach, describe, expect, it, vi } from "vitest";

import {
  __authorizedMediaActiveFetchCountForTests,
  __authorizedMediaRegistrySizeForTests,
  __authorizedObjectUrlRetainCountForTests,
  __resetAuthorizedMediaSessionForTests,
  beginAuthorizedMediaFetch,
  clearAuthorizedMediaSession,
  getAuthorizedMediaEpoch,
  onAuthorizedMediaSessionClear,
  releaseAuthorizedObjectUrl,
  retainAuthorizedObjectUrl,
} from "./authorized-media-object-url";

describe("authorized-media-session — isolation", () => {
  afterEach(() => {
    __resetAuthorizedMediaSessionForTests();
    vi.unstubAllGlobals();
  });

  it("refcount : dernière release révoque, jamais négatif", () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revoke });
    const url = "blob:shared";
    expect(retainAuthorizedObjectUrl(url)).toBe(true);
    expect(retainAuthorizedObjectUrl(url)).toBe(true);
    expect(__authorizedObjectUrlRetainCountForTests(url)).toBe(2);
    releaseAuthorizedObjectUrl(url);
    expect(revoke).not.toHaveBeenCalled();
    releaseAuthorizedObjectUrl(url);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(url);
    releaseAuthorizedObjectUrl(url);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(__authorizedObjectUrlRetainCountForTests(url)).toBe(0);
  });

  it("clearAuthorizedMediaSession révoque chaque Blob une fois et vide le registre", () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revoke });
    retainAuthorizedObjectUrl("blob:a");
    retainAuthorizedObjectUrl("blob:b");
    retainAuthorizedObjectUrl("blob:b");
    const before = getAuthorizedMediaEpoch();
    clearAuthorizedMediaSession();
    expect(getAuthorizedMediaEpoch()).toBe(before + 1);
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
    expect(revoke).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledWith("blob:a");
    expect(revoke).toHaveBeenCalledWith("blob:b");
  });

  it("release tardive après purge est sans effet sur le nouveau compteur", () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revoke });
    retainAuthorizedObjectUrl("blob:old");
    clearAuthorizedMediaSession();
    revoke.mockClear();
    releaseAuthorizedObjectUrl("blob:old");
    expect(revoke).not.toHaveBeenCalled();
    expect(retainAuthorizedObjectUrl("blob:new")).toBe(true);
    expect(__authorizedObjectUrlRetainCountForTests("blob:new")).toBe(1);
    releaseAuthorizedObjectUrl("blob:old");
    expect(__authorizedObjectUrlRetainCountForTests("blob:new")).toBe(1);
  });

  it("retain d'une ancienne epoch est refusé", () => {
    const epochA = getAuthorizedMediaEpoch();
    clearAuthorizedMediaSession();
    expect(retainAuthorizedObjectUrl("blob:stale", epochA)).toBe(false);
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
  });

  it("fetch en vol aborté à la purge ; callbacks tardifs ignorés via epoch", () => {
    const handle = beginAuthorizedMediaFetch();
    expect(__authorizedMediaActiveFetchCountForTests()).toBe(1);
    expect(handle.signal.aborted).toBe(false);
    const captured = handle.epoch;
    clearAuthorizedMediaSession();
    expect(handle.signal.aborted).toBe(true);
    expect(__authorizedMediaActiveFetchCountForTests()).toBe(0);
    expect(captured).not.toBe(getAuthorizedMediaEpoch());
    expect(retainAuthorizedObjectUrl("blob:late", captured)).toBe(false);
  });

  it("listener de purge notifié ; exception dans un listener n'empêche pas la suite", () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revoke });
    const good = vi.fn();
    const unsubBad = onAuthorizedMediaSessionClear(() => {
      throw new Error("listener boom");
    });
    const unsubGood = onAuthorizedMediaSessionClear(good);
    retainAuthorizedObjectUrl("blob:x");
    expect(() => clearAuthorizedMediaSession()).not.toThrow();
    expect(good).toHaveBeenCalledOnce();
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
    unsubBad();
    unsubGood();
  });

  it("clear est idempotent", () => {
    retainAuthorizedObjectUrl("blob:x");
    clearAuthorizedMediaSession();
    const epoch = getAuthorizedMediaEpoch();
    clearAuthorizedMediaSession();
    expect(getAuthorizedMediaEpoch()).toBe(epoch + 1);
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
  });

  it("deux sessions ne partagent jamais un Blob", () => {
    retainAuthorizedObjectUrl("blob:a");
    clearAuthorizedMediaSession();
    expect(retainAuthorizedObjectUrl("blob:a")).toBe(true);
    expect(__authorizedObjectUrlRetainCountForTests("blob:a")).toBe(1);
  });
});

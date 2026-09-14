import { afterEach, describe, expect, it, vi } from "vitest";

import {
  __authorizedObjectUrlRetainCountForTests,
  releaseAuthorizedObjectUrl,
  retainAuthorizedObjectUrl,
} from "./authorized-media-object-url";

describe("authorized-media-object-url", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ne révoque qu'après le dernier release", () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", { ...URL, revokeObjectURL: revoke });
    const url = "blob:shared-media";
    retainAuthorizedObjectUrl(url);
    retainAuthorizedObjectUrl(url);
    expect(__authorizedObjectUrlRetainCountForTests(url)).toBe(2);
    releaseAuthorizedObjectUrl(url);
    expect(revoke).not.toHaveBeenCalled();
    expect(__authorizedObjectUrlRetainCountForTests(url)).toBe(1);
    releaseAuthorizedObjectUrl(url);
    expect(revoke).toHaveBeenCalledWith(url);
    expect(__authorizedObjectUrlRetainCountForTests(url)).toBe(0);
  });
});

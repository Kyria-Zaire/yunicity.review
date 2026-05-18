import { describe, expect, it, vi } from "vitest";

import { AuthError } from "./auth-errors";
import { RefreshManager } from "./refresh-manager";

describe("RefreshManager", () => {
  it("deduplicates concurrent refresh calls", async () => {
    const manager = new RefreshManager(2);
    const refreshFn = vi.fn().mockResolvedValue("token-a");

    const [first, second] = await Promise.all([
      manager.refresh(refreshFn),
      manager.refresh(refreshFn),
    ]);

    expect(first).toBe("token-a");
    expect(second).toBe("token-a");
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it("stops after max refresh attempts", async () => {
    const manager = new RefreshManager(1);
    const refreshFn = vi.fn().mockRejectedValue(new AuthError("INVALID_REFRESH_TOKEN", "x", 401));

    await expect(manager.refresh(refreshFn)).rejects.toMatchObject({ code: "INVALID_REFRESH_TOKEN" });
    await expect(manager.refresh(refreshFn)).rejects.toMatchObject({ code: "REFRESH_LIMIT" });
  });

  it("resets attempt counter after success", async () => {
    const manager = new RefreshManager(2);
    const refreshFn = vi
      .fn()
      .mockRejectedValueOnce(new AuthError("INVALID_REFRESH_TOKEN", "x", 401))
      .mockResolvedValueOnce("ok");

    await expect(manager.refresh(refreshFn)).rejects.toBeInstanceOf(AuthError);
    await expect(manager.refresh(refreshFn)).resolves.toBe("ok");
  });
});

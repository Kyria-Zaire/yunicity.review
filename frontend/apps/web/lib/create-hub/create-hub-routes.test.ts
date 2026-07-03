import { describe, expect, it } from "vitest";

import { isCreateHubVisiblePath } from "./create-hub-routes";

describe("create-hub-routes", () => {
  it("hides Create Hub on videos portal and publish flow", () => {
    expect(isCreateHubVisiblePath("/videos")).toBe(false);
    expect(isCreateHubVisiblePath("/videos/new")).toBe(false);
  });

  it("keeps Create Hub visible on feed", () => {
    expect(isCreateHubVisiblePath("/feed")).toBe(true);
  });
});

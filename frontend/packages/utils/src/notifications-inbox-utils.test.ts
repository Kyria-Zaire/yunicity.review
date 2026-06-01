import { describe, expect, it } from "vitest";

import { notificationEmptyMessage, notificationTabLabel } from "./notifications-inbox-utils";

describe("notifications-inbox-utils", () => {
  it("retourne un libellé par onglet", () => {
    expect(notificationTabLabel("social")).toBe("Fil social");
    expect(notificationTabLabel("passport")).toBe("Passport");
  });

  it("message vide honnête pour mentions", () => {
    expect(notificationEmptyMessage("mentions")).toContain("mentions");
  });
});

import { describe, expect, it } from "vitest";

import {
  adminPassportSearchModeLabel,
  adminPassportStatusLabel,
  buildPassportOpsDetailPath,
  buildPassportOpsListPath,
} from "./admin-passport";

describe("admin-passport helpers", () => {
  it("labels passport status", () => {
    expect(adminPassportStatusLabel("active")).toBe("Actif");
    expect(adminPassportStatusLabel("suspended")).toBe("Suspendu");
  });

  it("labels search modes", () => {
    expect(adminPassportSearchModeLabel("auto")).toBe("Automatique");
    expect(adminPassportSearchModeLabel("email")).toBe("Email");
    expect(adminPassportSearchModeLabel("qr_fragment")).toBe("Fragment QR");
  });

  it("builds detail path", () => {
    expect(buildPassportOpsDetailPath("abc-123")).toBe("/passport-ops/abc-123");
  });

  it("builds list path with query", () => {
    expect(buildPassportOpsListPath()).toBe("/passport-ops");
    expect(buildPassportOpsListPath({ q: "test@mail.com", status: "active" })).toBe(
      "/passport-ops?q=test%40mail.com&status=active",
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  adminPassportSearchModeLabel,
  adminPassportStatusLabel,
  buildPartnerDetailPath,
  buildPassportOpsDetailPath,
  buildPassportOpsListPath,
  buildPassportOpsPath,
  maskStaffQrToken,
  offerRedemptionStatusLabel,
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
    expect(buildPassportOpsPath({ q: "test@mail.com", status: "active" })).toBe(
      "/passport-ops?q=test%40mail.com&status=active",
    );
  });

  it("builds partner detail path", () => {
    expect(buildPartnerDetailPath("org-1")).toBe("/partners/organizations/org-1");
  });

  it("masks staff qr token when hidden", () => {
    const token = "qr-secret-token-abcdefghijklmnop";
    expect(maskStaffQrToken(token, false)).toBe("qr-secre…mnop");
    expect(maskStaffQrToken(token, true)).toBe(token);
  });

  it("labels offer redemption status", () => {
    expect(offerRedemptionStatusLabel("completed")).toBe("Validée");
    expect(offerRedemptionStatusLabel("pending")).toBe("En attente");
  });
});

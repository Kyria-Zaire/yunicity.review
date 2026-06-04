import { describe, expect, it } from "vitest";

import {
  adminPassportSearchModeLabel,
  adminPassportStatusLabel,
  buildPartnerDetailPath,
  buildPassportOpsDetailPath,
  buildPassportOpsListPath,
  buildPassportOpsPath,
  canReactivatePassport,
  canSuspendPassport,
  isPassportReasonValid,
  maskStaffQrToken,
  offerRedemptionStatusLabel,
  passportStatusActionCopy,
  passportStatusActionKind,
  passportStatusActionSuccessMessage,
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

  it("gates suspend and reactivate by status", () => {
    expect(canSuspendPassport("active")).toBe(true);
    expect(canSuspendPassport("suspended")).toBe(false);
    expect(canReactivatePassport("suspended")).toBe(true);
    expect(canReactivatePassport("active")).toBe(false);
  });

  it("resolves action kind only for modifiable statuses", () => {
    expect(passportStatusActionKind("active")).toBe("suspend");
    expect(passportStatusActionKind("suspended")).toBe("reactivate");
  });

  it("exposes action copy for suspend and reactivate", () => {
    expect(passportStatusActionCopy("suspend").title).toBe("Suspendre ce Passport");
    expect(passportStatusActionCopy("reactivate").title).toBe("Réactiver ce Passport");
    expect(passportStatusActionCopy("suspend").confirmTone).toBe("danger");
    expect(passportStatusActionCopy("reactivate").confirmTone).toBe("primary");
  });

  it("validates passport action reason length", () => {
    expect(isPassportReasonValid("ab")).toBe(false);
    expect(isPassportReasonValid("abc")).toBe(true);
    expect(isPassportReasonValid("   motif valide   ")).toBe(true);
  });

  it("builds success messages per action", () => {
    expect(passportStatusActionSuccessMessage("suspend")).toContain("suspendu");
    expect(passportStatusActionSuccessMessage("reactivate")).toContain("réactivé");
  });
});

import { describe, expect, it } from "vitest";

import {
  adminPartnerDetailPath,
  capabilityLabel,
  formatPartnerDate,
  organizationTypeLabel,
  partnershipTypeLabel,
  verificationStatusLabel,
  visibilityLabel,
} from "./admin-partner";

describe("admin-partner helpers", () => {
  it("builds admin detail path", () => {
    expect(adminPartnerDetailPath("abc-123")).toBe("/partners/organizations/abc-123");
  });

  it("labels organization and partner fields", () => {
    expect(organizationTypeLabel("commerce")).toBe("Commerce");
    expect(visibilityLabel("private")).toBe("Privée");
    expect(verificationStatusLabel("verified")).toBe("Vérifiée");
    expect(partnershipTypeLabel("local_business")).toBe("Commerce local");
  });

  it("formats partner dates", () => {
    expect(formatPartnerDate(null)).toBe("—");
    expect(formatPartnerDate("2026-01-15T10:00:00Z")).toMatch(/2026/);
  });

  it("labels capabilities", () => {
    expect(capabilityLabel("can_activate")).toContain("Activer");
    expect(capabilityLabel("can_create_profile")).toContain("profil");
  });
});

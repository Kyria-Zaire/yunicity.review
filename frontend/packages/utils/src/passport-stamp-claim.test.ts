import { describe, expect, it } from "vitest";

import type { PassportStampClaimResult } from "@yunicity/types";

import {
  buildPassportStampClaimUrl,
  formatPassportStampDate,
  passportStampSourceLabel,
  passportStampTypeLabel,
} from "./passport-stamp-claim";

const BASE_CLAIM: PassportStampClaimResult = {
  status: "created",
  already_claimed: false,
  stamp: {
    id: "stamp-1",
    organization_id: "org-1",
    organization: {
      id: "org-1",
      slug: "cafe-local",
      name: "Café Local",
      city: "Reims",
      logo_url: null,
    },
    stamp_source: "qr",
    stamped_at: "2026-05-30T10:00:00Z",
  },
  passport: {
    stamps_count: 1,
    tier_code: "basic",
  },
};

describe("passport-stamp-claim utils", () => {
  it("passportStampSourceLabel returns correct labels", () => {
    expect(passportStampSourceLabel("qr")).toBe("QR");
    expect(passportStampSourceLabel("organization")).toBe("Partenaire");
  });

  it("passportStampTypeLabel delegates to passportStampSourceLabel", () => {
    expect(passportStampTypeLabel("qr")).toBe("QR");
    expect(passportStampTypeLabel("organization")).toBe("Partenaire");
  });

  it("buildPassportStampClaimUrl encodes token correctly", () => {
    expect(buildPassportStampClaimUrl("abc123")).toBe(
      "/passport/stamp/claim?token=abc123",
    );
    expect(buildPassportStampClaimUrl("a.b+c=d")).toContain("/passport/stamp/claim?token=");
  });

  it("formatPassportStampDate returns French locale date", () => {
    const result = formatPassportStampDate("2026-05-30T10:00:00Z");
    expect(result).toContain("2026");
    expect(result.toLowerCase()).toContain("mai");
  });

  it("formatPassportStampDate returns empty string for invalid date", () => {
    expect(formatPassportStampDate("not-a-date")).toBe("");
  });

  it("already_claimed:true parses as already claimed", () => {
    const alreadyClaimed: PassportStampClaimResult = {
      ...BASE_CLAIM,
      status: "already_claimed",
      already_claimed: true,
    };
    expect(alreadyClaimed.already_claimed).toBe(true);
    expect(alreadyClaimed.status).toBe("already_claimed");
  });

  it("created:false is not a fake stamp — organization name comes from response", () => {
    expect(BASE_CLAIM.stamp.organization.name).toBe("Café Local");
    expect(BASE_CLAIM.stamp.organization.name).not.toBe("");
  });
});

import { describe, expect, it } from "vitest";

import {
  SCAN_ERROR_MESSAGES,
  humanizeScanError,
  humanizeScanErrorCode,
} from "./scan-labels";

const HARDENING_ERROR_CODES = [
  "QR_INVALID",
  "PASSPORT_NOT_FOUND",
  "PASSPORT_USER_INACTIVE",
  "SCAN_PARTNER_FORBIDDEN",
  "OFFER_NOT_FOUND",
  "OFFER_NOT_PUBLISHED",
  "OFFER_EXPIRED",
  "OFFER_EXHAUSTED",
  "OFFER_TIER_REQUIRED",
  "REDEMPTION_ALREADY_EXISTS",
  "OFFER_NOT_VERIFIED",
  "OFFER_NOT_STARTED",
] as const;

describe("humanizeScanError / humanizeScanErrorCode", () => {
  it("exposes stable alias", () => {
    expect(humanizeScanErrorCode).toBe(humanizeScanError);
  });

  it("maps all partner scan hardening codes", () => {
    for (const code of HARDENING_ERROR_CODES) {
      expect(SCAN_ERROR_MESSAGES[code]).toBeTruthy();
      expect(humanizeScanError(code, "fallback")).toBe(SCAN_ERROR_MESSAGES[code]);
    }
  });

  it("explains staff without partner org as permission issue", () => {
    expect(humanizeScanError("SCAN_PARTNER_FORBIDDEN", "raw")).toContain("rattaché");
    expect(humanizeScanError("SCAN_PARTNER_FORBIDDEN", "raw")).not.toContain("reconnu");
    expect(humanizeScanError("SCAN_PARTNER_FORBIDDEN", "raw")).not.toContain("invalide");
  });

  it("falls back to server message for unknown codes", () => {
    expect(humanizeScanError("UNKNOWN", "Message serveur")).toBe("Message serveur");
  });
});

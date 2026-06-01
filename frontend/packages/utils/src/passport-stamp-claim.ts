/** Passport stamp QR claim utilities (WEB-PARTNERS-04A). */

import type { PassportStampClaimResult, PassportStampSource } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

const STAMP_SOURCE_LABELS: Record<PassportStampSource, string> = {
  organization: "Partenaire",
  qr: "QR",
};

export function passportStampSourceLabel(source: PassportStampSource): string {
  return STAMP_SOURCE_LABELS[source] ?? "Tampon";
}

export function passportStampTypeLabel(source: PassportStampSource): string {
  return passportStampSourceLabel(source);
}

export function formatPassportStampDate(stamped_at: string): string {
  const date = new Date(stamped_at);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildPassportStampClaimUrl(token: string): string {
  return `/passport/stamp/claim?token=${encodeURIComponent(token)}`;
}

export class PassportStampClaimApi extends ApiClientBase {
  claimStamp(token: string): Promise<PassportStampClaimResult> {
    return this.postJson<PassportStampClaimResult>("/passport/stamps/claim", { token });
  }
}

export function createPassportStampClaimApi(
  client: AuthClient,
  apiBaseUrl: string,
): PassportStampClaimApi {
  return new PassportStampClaimApi(client, apiBaseUrl);
}

import type {
  PartnerOfferPublicListResponse,
  PassportActivateRequest,
  PassportMe,
  PassportQr,
  PassportStampClaimResult,
  PassportStampListResponse,
  PassportTierListResponse,
  Redemption,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { parseApiError } from "./auth/auth-errors";
import { ApiClientBase } from "./api-client";

export class PassportApi extends ApiClientBase {
  getPassportMe(): Promise<PassportMe> {
    return this.getJson<PassportMe>("/passport/me");
  }

  getPassportQr(): Promise<PassportQr> {
    return this.getJson<PassportQr>("/passport/me/qr");
  }

  activatePassport(payload: PassportActivateRequest = {}): Promise<PassportMe> {
    return this.postJson<PassportMe>("/passport/activate", payload);
  }

  listStamps(): Promise<PassportStampListResponse> {
    return this.getJson<PassportStampListResponse>("/passport/stamps");
  }

  listOffers(): Promise<PartnerOfferPublicListResponse> {
    return this.getJson<PartnerOfferPublicListResponse>("/passport/offers");
  }

  claimStamp(token: string): Promise<PassportStampClaimResult> {
    return this.postJson<PassportStampClaimResult>("/passport/stamps/claim", { token });
  }

  redeemOffer(offerId: string): Promise<Redemption> {
    return this.postJson<Redemption>(`/passport/offers/${encodeURIComponent(offerId)}/redeem`, {});
  }
}

export function createPassportApi(client: AuthClient, apiBaseUrl: string): PassportApi {
  return new PassportApi(client, apiBaseUrl);
}

/** Tiers publics — pas d'authentification requise. */
export async function fetchPassportTiersPublic(
  apiBaseUrl: string,
): Promise<PassportTierListResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/passport/tiers`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as PassportTierListResponse;
}

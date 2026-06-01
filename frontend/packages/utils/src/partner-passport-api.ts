/** Partner passport stamp QR generation (WEB-PARTNERS-08B). */

import type { StampQrGenerateRequest, StampQrGenerateResponse } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class PartnerPassportApi extends ApiClientBase {
  generateStampQr(
    partnerSlug: string,
    city: string,
    payload: StampQrGenerateRequest = {},
  ): Promise<StampQrGenerateResponse> {
    const search = new URLSearchParams({ city });
    return this.postJson<StampQrGenerateResponse>(
      `/partners/${encodeURIComponent(partnerSlug)}/passport-qr?${search.toString()}`,
      payload,
    );
  }
}

export function createPartnerPassportApi(
  client: AuthClient,
  apiBaseUrl: string,
): PartnerPassportApi {
  return new PartnerPassportApi(client, apiBaseUrl);
}

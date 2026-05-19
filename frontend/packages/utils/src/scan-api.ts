import type {
  ScanRedeemRequest,
  ScanRedeemResponse,
  ScanResolveRequest,
  ScanResolveResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class ScanApi extends ApiClientBase {
  resolvePassport(payload: ScanResolveRequest): Promise<ScanResolveResponse> {
    return this.postJson<ScanResolveResponse>("/scan/resolve", payload);
  }

  redeemOffer(payload: ScanRedeemRequest): Promise<ScanRedeemResponse> {
    return this.postJson<ScanRedeemResponse>("/scan/redeem", payload);
  }
}

export function createScanApi(client: AuthClient, apiBaseUrl: string): ScanApi {
  return new ScanApi(client, apiBaseUrl);
}

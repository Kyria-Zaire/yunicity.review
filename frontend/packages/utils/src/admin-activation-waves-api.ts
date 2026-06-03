import type {
  AdminActivationWaveDetail,
  AdminActivationWaveItem,
  AdminActivationWaveListItem,
  AdminActivationWaveUpdatePayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";
import { normalizeActivationWaveItemPatchPayload } from "./admin-activation-wave";

export class AdminActivationWavesApi extends ApiClientBase {
  listWaves(): Promise<AdminActivationWaveListItem[]> {
    return this.getJson<AdminActivationWaveListItem[]>("/admin/activation-waves");
  }

  getWaveDetail(waveId: string): Promise<AdminActivationWaveDetail> {
    return this.getJson<AdminActivationWaveDetail>(
      `/admin/activation-waves/${encodeURIComponent(waveId)}`,
    );
  }

  updateItem(
    itemId: string,
    payload: AdminActivationWaveUpdatePayload,
  ): Promise<AdminActivationWaveItem> {
    const body = normalizeActivationWaveItemPatchPayload(payload);
    return this.patchJson<AdminActivationWaveItem>(
      `/admin/activation-wave-items/${encodeURIComponent(itemId)}`,
      body,
    );
  }
}

export function createAdminActivationWavesApi(
  client: AuthClient,
  apiBaseUrl: string,
): AdminActivationWavesApi {
  return new AdminActivationWavesApi(client, apiBaseUrl);
}

import type { AdminPlatformConfigSnapshot } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class AdminPlatformConfigApi extends ApiClientBase {
  getSnapshot(): Promise<AdminPlatformConfigSnapshot> {
    return this.getJson<AdminPlatformConfigSnapshot>("/admin/platform-config");
  }
}

export function createAdminPlatformConfigApi(
  client: AuthClient,
  apiBaseUrl: string,
): AdminPlatformConfigApi {
  return new AdminPlatformConfigApi(client, apiBaseUrl);
}

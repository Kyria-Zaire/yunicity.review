import * as SecureStore from "expo-secure-store";

import type { TokenStorage } from "@yunicity/utils";

const ACCESS_KEY = "yunicity_access_token";
const REFRESH_KEY = "yunicity_refresh_token";

export class SecureTokenStorage implements TokenStorage {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  }

  async setAccessToken(token: string | null): Promise<void> {
    if (token) {
      await SecureStore.setItemAsync(ACCESS_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_KEY);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  }

  async setRefreshToken(token: string | null): Promise<void> {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    }
  }

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  }
}

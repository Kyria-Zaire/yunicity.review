import type { AuthUser } from "@yunicity/types";

export interface AuthSessionState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

export const emptyAuthSession: AuthSessionState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

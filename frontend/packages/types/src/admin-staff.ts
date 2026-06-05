/** Admin platform staff types (ADMIN-08C). */

import type { RoleKey } from "./auth";

export type AdminStaffPlatformRole = Extract<
  RoleKey,
  "SUPER_ADMIN" | "CITY_ADMIN" | "MODERATOR"
>;

export type AdminStaffActionType =
  | "assign_role"
  | "revoke_role"
  | "suspend"
  | "reactivate";

export interface AdminStaffListItem {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string[];
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminStaffListResponse {
  items: AdminStaffListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminStaffListParams {
  role?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface AdminStaffDetailResponse {
  id: string;
  email: string;
  full_name: string;
  city: string | null;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminStaffActionActor {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AdminStaffActionItem {
  action: AdminStaffActionType | string;
  previous_roles: string[] | null;
  new_roles: string[] | null;
  reason: string | null;
  actor_user: AdminStaffActionActor | null;
  created_at: string;
}

export interface AdminStaffActionListResponse {
  items: AdminStaffActionItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminStaffActionListParams {
  page?: number;
  page_size?: number;
}

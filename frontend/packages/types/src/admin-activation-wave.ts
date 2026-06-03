/** Admin activation waves API (ADMIN-02C-B / ADMIN-02C-D). */

export type ActivationWaveStatus = "draft" | "active" | "completed" | "archived";

export type ActivationWaveItemStatus =
  | "candidate"
  | "ready"
  | "activated"
  | "later"
  | "abandoned";

export interface AdminActivationWaveChecklist {
  contact_confirmed: boolean;
  assets_received: boolean;
  passport_offer_ready: boolean;
  qr_ready: boolean;
  go_public_ready: boolean;
}

export interface AdminActivationWaveListItem {
  id: string;
  city: string;
  code: string;
  name: string;
  status: ActivationWaveStatus;
  items_total: number;
  items_ready: number;
  items_activated: number;
}

export interface AdminActivationWaveSummary {
  id: string;
  city: string;
  code: string;
  name: string;
  description: string | null;
  status: ActivationWaveStatus;
  sort_order: number;
}

export interface AdminActivationWaveItem {
  id: string;
  organization_id: string | null;
  partner_profile_id: string | null;
  partner_name_snapshot: string;
  partner_slug_snapshot: string | null;
  status: ActivationWaveItemStatus;
  checklist: AdminActivationWaveChecklist;
  notes: string | null;
}

export interface AdminActivationWaveDetail {
  wave: AdminActivationWaveSummary;
  items: AdminActivationWaveItem[];
}

export interface AdminActivationWaveUpdatePayload {
  status?: ActivationWaveItemStatus;
  checklist?: AdminActivationWaveChecklist;
  notes?: string | null;
}

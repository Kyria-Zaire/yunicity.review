/** Partners workspace tab ids (ADMIN-02A). */

export const PARTNERS_WORKSPACE_TABS = [
  "leads",
  "partners",
  "verification",
  "activation",
] as const;

export type PartnersWorkspaceTabId = (typeof PARTNERS_WORKSPACE_TABS)[number];

export const DEFAULT_PARTNERS_WORKSPACE_TAB: PartnersWorkspaceTabId = "leads";

export const PARTNERS_WORKSPACE_TAB_LABELS: Record<PartnersWorkspaceTabId, string> = {
  leads: "Leads",
  partners: "Partenaires",
  verification: "Vérifications",
  activation: "Activation",
};

export function parsePartnersWorkspaceTab(value: string | null): PartnersWorkspaceTabId {
  if (value && PARTNERS_WORKSPACE_TABS.includes(value as PartnersWorkspaceTabId)) {
    return value as PartnersWorkspaceTabId;
  }
  return DEFAULT_PARTNERS_WORKSPACE_TAB;
}

export function partnerPublicPlaceUrl(slug: string, city: string): string {
  const base = (process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const params = new URLSearchParams({ city });
  return `${base}/places/${encodeURIComponent(slug)}?${params.toString()}`;
}

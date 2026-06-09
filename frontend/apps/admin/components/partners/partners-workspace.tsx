"use client";

import { PartnersTerrainCommandPage } from "@/components/partners/terrain/partners-terrain-command-page";
import { PartnersDirectoryTab } from "@/components/partners/partners-directory-tab";
import { PartnersLeadsTab } from "@/components/partners/partners-leads-tab";
import { PartnersActivationTab } from "@/components/partners/partners-activation-tab";
import { PartnersVerificationTab } from "@/components/partners/partners-verification-tab";
import { PartnersWorkspaceTabs } from "@/components/partners/partners-workspace-tabs";
import {
  PARTNERS_WORKSPACE_TAB_LABELS,
  parsePartnersWorkspaceTab,
  type PartnersWorkspaceTabId,
} from "@/lib/partners-workspace";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const DEFAULT_CITY = "Reims";
const WORKFLOW_TABS = new Set<PartnersWorkspaceTabId>([
  "leads",
  "verification",
  "activation",
]);

export function PartnersWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam ? parsePartnersWorkspaceTab(tabParam) : null;
  const showWorkflow = activeTab !== null && WORKFLOW_TABS.has(activeTab);

  const setTab = useCallback(
    (tab: PartnersWorkspaceTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/partners?${params.toString()}`);
    },
    [router, searchParams],
  );

  if (!showWorkflow) {
    return <PartnersTerrainCommandPage />;
  }

  const tabLabel =
    activeTab !== null ? PARTNERS_WORKSPACE_TAB_LABELS[activeTab] : "Partenaires";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-stone-950">{tabLabel}</h1>
      </header>

      <PartnersWorkspaceTabs activeTab={activeTab ?? "leads"} onTabChange={setTab} />

      <div className="rounded-b-2xl border border-t-0 border-stone-200 bg-white p-4 shadow-sm md:p-6">
        {activeTab === "leads" ? <PartnersLeadsTab city={DEFAULT_CITY} /> : null}
        {activeTab === "partners" ? <PartnersDirectoryTab city={DEFAULT_CITY} /> : null}
        {activeTab === "verification" ? <PartnersVerificationTab /> : null}
        {activeTab === "activation" ? <PartnersActivationTab city={DEFAULT_CITY} /> : null}
      </div>
    </div>
  );
}

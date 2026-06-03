"use client";

import { PartnersDirectoryTab } from "@/components/partners/partners-directory-tab";
import { PartnersLeadsTab } from "@/components/partners/partners-leads-tab";
import { PartnersPlaceholderTab } from "@/components/partners/partners-placeholder-tab";
import { PartnersVerificationTab } from "@/components/partners/partners-verification-tab";
import { PartnersWorkspaceTabs } from "@/components/partners/partners-workspace-tabs";
import {
  parsePartnersWorkspaceTab,
  type PartnersWorkspaceTabId,
} from "@/lib/partners-workspace";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function PartnersWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parsePartnersWorkspaceTab(searchParams.get("tab"));

  const setTab = useCallback(
    (tab: PartnersWorkspaceTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/partners?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Partenaires
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Workspace terrain, catalogue et files à venir — Reims
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Accès direct CRM classique :{" "}
          <Link href="/partner-leads" className="font-medium text-stone-800 hover:underline">
            /partner-leads
          </Link>
        </p>
      </header>

      <PartnersWorkspaceTabs activeTab={activeTab} onTabChange={setTab} />

      <div className="rounded-b-2xl border border-t-0 border-stone-200 bg-white p-4 shadow-sm md:p-6">
        {activeTab === "leads" ? <PartnersLeadsTab /> : null}
        {activeTab === "partners" ? <PartnersDirectoryTab /> : null}
        {activeTab === "verification" ? <PartnersVerificationTab /> : null}
        {activeTab === "activation" ? (
          <PartnersPlaceholderTab
            title="Activation Waves"
            description="Les vagues d'activation (signed → active, batch staff) seront traitées après le cycle partenaire complet."
            bullets={[
              "Wave 1 — partenaires actifs sur le territoire (catalogue public)",
              "Wave 2 — partenaires signés à valider (ADMIN-02C / 02D)",
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}

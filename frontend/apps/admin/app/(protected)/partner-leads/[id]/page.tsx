"use client";

import { PartnerLead360View } from "@/components/partners/leads/detail/partner-lead-360-view";
import { useAuth } from "@/lib/auth/auth-provider";
import type { PartnerLead } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function PartnerLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = params.id;
  const { partnerLeadsApi } = useAuth();

  const [lead, setLead] = useState<PartnerLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await partnerLeadsApi.getPartnerLead(leadId);
      setLead(data);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Prospect introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [partnerLeadsApi, leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-4 pb-10" aria-busy="true">
        <div className="h-32 rounded-2xl bg-stone-100" />
        <div className="h-24 rounded-2xl bg-stone-100" />
        <div className="h-48 rounded-2xl bg-stone-100" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
          {error ?? "Prospect introuvable."}
        </div>
        <Link href="/partner-leads" className="text-sm font-medium text-yunicity-primary underline">
          Retour au pipeline
        </Link>
      </div>
    );
  }

  return <PartnerLead360View lead={lead} onLeadUpdated={setLead} />;
}

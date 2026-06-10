"use client";

import { PartnerLead360ActionPanel } from "@/components/partners/leads/detail/partner-lead-360-action";
import { PartnerLead360EditModal } from "@/components/partners/leads/detail/partner-lead-360-edit-modal";
import { PartnerLead360Hero } from "@/components/partners/leads/detail/partner-lead-360-hero";
import { PartnerLeadConversionPanel } from "@/components/partners/leads/detail/partner-lead-conversion-panel";
import { PartnerLeadConversionReadinessPanel } from "@/components/partners/leads/detail/partner-lead-conversion-readiness";
import { PartnerLeadConversionSuccess } from "@/components/partners/leads/detail/partner-lead-conversion-success";
import { PartnerLeadGuidedConversionModal } from "@/components/partners/leads/detail/partner-lead-guided-conversion-modal";
import { PartnerLeadInfoPanel } from "@/components/partners/leads/detail/partner-lead-info-panel";
import { PartnerLeadReadinessBar } from "@/components/partners/leads/detail/partner-lead-readiness";
import { PartnerLeadRelationSignal } from "@/components/partners/leads/detail/partner-lead-relation-signal";
import { PartnerLeadTimeline } from "@/components/partners/leads/detail/partner-lead-timeline";
import { useAuth } from "@/lib/auth/auth-provider";
import type { ConvertLeadPayload, PartnerLead, PartnerLeadUpdatePayload } from "@yunicity/types";
import {
  buildPartnerLead360Action,
  buildPartnerLeadConversionReadiness,
  buildPartnerLeadRelationSignal,
  buildPartnerLeadTimeline,
  isAuthError,
  partnerLeadCanConvert,
  partnerLeadConvertDisabledReason,
  partnerLeadIsConverted,
  partnerLeadReadiness,
  partnerLeadTimelineIsEmpty,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

type PartnerLead360ViewProps = {
  lead: PartnerLead;
  onLeadUpdated: (lead: PartnerLead) => void;
};

export function PartnerLead360View({ lead, onLeadUpdated }: PartnerLead360ViewProps) {
  const { user, partnerLeadsApi } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [conversionSuccessOrgId, setConversionSuccessOrgId] = useState<string | null | undefined>(
    undefined,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const signal = useMemo(() => buildPartnerLeadRelationSignal(lead), [lead]);
  const action = useMemo(() => buildPartnerLead360Action(lead), [lead]);
  const timeline = useMemo(() => buildPartnerLeadTimeline(lead), [lead]);
  const readiness = useMemo(() => partnerLeadReadiness(lead), [lead]);
  const conversionReadiness = useMemo(() => buildPartnerLeadConversionReadiness(lead), [lead]);
  const timelineMinimal = useMemo(() => partnerLeadTimelineIsEmpty(lead), [lead]);
  const canConvert = partnerLeadCanConvert(lead);
  const convertReason = partnerLeadConvertDisabledReason(lead);

  async function handleSave(payload: PartnerLeadUpdatePayload) {
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await partnerLeadsApi.updatePartnerLead(lead.id, payload);
      onLeadUpdated(updated);
      setShowEdit(false);
    } catch (err) {
      setSaveError(isAuthError(err) ? err.message : "Enregistrement impossible.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConvert(payload: ConvertLeadPayload) {
    const updated = await partnerLeadsApi.convertPartnerLead(lead.id, payload);
    onLeadUpdated(updated);
    setShowConvert(false);
    setConversionSuccessOrgId(updated.converted_organization_id);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <PartnerLead360Hero
        lead={lead}
        canConvert={canConvert}
        convertDisabledReason={convertReason}
        onEdit={() => setShowEdit(true)}
        onConvert={() => setShowConvert(true)}
      />

      <PartnerLeadRelationSignal signal={signal} />

      <PartnerLeadConversionReadinessPanel readiness={conversionReadiness} />

      <PartnerLead360ActionPanel
        action={action}
        onEdit={() => setShowEdit(true)}
        onConvert={() => setShowConvert(true)}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <PartnerLeadTimeline events={timeline} isMinimal={timelineMinimal} />
          <PartnerLeadInfoPanel lead={lead} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <PartnerLeadReadinessBar readiness={readiness} />
          {lead.converted_organization_id ? (
            <PartnerLeadConversionPanel
              organizationId={lead.converted_organization_id}
              convertedAt={lead.converted_at}
            />
          ) : null}
        </div>
      </div>

      <PartnerLead360EditModal
        lead={lead}
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          setSaveError(null);
        }}
        onSave={handleSave}
        isSaving={isSaving}
        saveError={saveError}
      />

      {showConvert && user && !partnerLeadIsConverted(lead) ? (
        <PartnerLeadGuidedConversionModal
          lead={lead}
          currentUser={user}
          onClose={() => setShowConvert(false)}
          onSubmit={handleConvert}
        />
      ) : null}

      {conversionSuccessOrgId !== undefined ? (
        <PartnerLeadConversionSuccess
          lead={lead}
          onDismiss={() => setConversionSuccessOrgId(undefined)}
        />
      ) : null}
    </div>
  );
}

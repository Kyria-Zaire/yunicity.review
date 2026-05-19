"use client";

import { ConvertLeadModal } from "@/components/convert-lead-modal";
import { InterestTags } from "@/components/interest-tags";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { VerificationBadge } from "@/components/verification-badge";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/format";
import type {
  ConvertLeadPayload,
  PartnerLead,
  PartnerLeadStatus,
  PartnerLeadUpdatePayload,
} from "@yunicity/types";
import {
  PARTNER_LEAD_SOURCE_LABELS,
  PARTNER_LEAD_STATUS_LABELS,
  isAuthError,
} from "@yunicity/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STATUS_OPTIONS = Object.entries(PARTNER_LEAD_STATUS_LABELS) as [
  PartnerLeadStatus,
  string,
][];

export default function PartnerLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = params.id;
  const { user, partnerLeadsApi } = useAuth();

  const [lead, setLead] = useState<PartnerLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  const [status, setStatus] = useState<PartnerLeadStatus>("new");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [nextFollowup, setNextFollowup] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await partnerLeadsApi.getPartnerLead(leadId);
      setLead(data);
      setStatus(data.status);
      setNotes(data.notes ?? "");
      setTagsInput(data.tags.join(", "));
      setNextFollowup(toDatetimeLocalValue(data.next_followup_at));
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Lead introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [partnerLeadsApi, leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!lead) {
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const payload: PartnerLeadUpdatePayload = {
      status,
      notes: notes.trim() || null,
      tags,
      next_followup_at: fromDatetimeLocalValue(nextFollowup),
    };
    try {
      const updated = await partnerLeadsApi.updatePartnerLead(lead.id, payload);
      setLead(updated);
      setStatus(updated.status);
      setNotes(updated.notes ?? "");
      setTagsInput(updated.tags.join(", "));
      setNextFollowup(toDatetimeLocalValue(updated.next_followup_at));
    } catch (err) {
      setSaveError(isAuthError(err) ? err.message : "Enregistrement impossible.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConvert(payload: ConvertLeadPayload) {
    if (!lead) {
      return;
    }
    const updated = await partnerLeadsApi.convertPartnerLead(lead.id, payload);
    setLead(updated);
    setStatus(updated.status);
    setShowConvert(false);
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du lead…</p>;
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link href="/partner-leads" className="text-sm text-muted-foreground hover:underline">
          ← Retour à la liste
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? "Lead introuvable."}
        </div>
      </div>
    );
  }

  const isConverted =
    lead.status === "converted" || lead.converted_organization_id !== null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/partner-leads" className="text-sm text-muted-foreground hover:underline">
        ← Partenaires terrain
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{lead.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.city ?? "Ville non renseignée"} ·{" "}
            {PARTNER_LEAD_SOURCE_LABELS[lead.source]}
          </p>
        </div>
        <LeadStatusBadge status={lead.status} />
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Visibilité & conversion
        </h3>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <LeadStatusBadge status={lead.status} />
          {lead.status === "rejected" ? (
            <VerificationBadge status="rejected" />
          ) : isConverted ? (
            <>
              <VerificationBadge status="pending" />
              <span className="text-xs text-muted-foreground">
                Organization en attente de validation publique
              </span>
            </>
          ) : lead.status === "signed" ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
              Prêt à convertir
            </span>
          ) : (
            <VerificationBadge status="pending" />
          )}
        </div>
        {lead.converted_at ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Converti le {formatDateTime(lead.converted_at)}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">Contact</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Contact</dt>
              <dd>{lead.contact_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{lead.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd>{lead.phone ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Présence</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Adresse</dt>
              <dd>{lead.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Site</dt>
              <dd>
                {lead.website ? (
                  <a href={lead.website} className="text-blue-700 hover:underline" target="_blank" rel="noreferrer">
                    {lead.website}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Instagram</dt>
              <dd>{lead.instagram ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Intérêts produit</h3>
        <div className="mt-3">
          <InterestTags lead={lead} />
        </div>
      </section>

      {lead.converted_organization_id ? (
        <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
          <h3 className="text-sm font-semibold">Organization liée</h3>
          <p className="mt-2 font-mono text-xs text-neutral-700">
            {lead.converted_organization_id}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Statut attendu après conversion : <VerificationBadge status="pending" /> — reste
            privée jusqu&apos;à validation modération (<VerificationBadge status="verified" />).
          </p>
        </section>
      ) : null}

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold">Suivi CRM</h3>

        <label className="block text-sm">
          <span className="font-medium">Statut</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PartnerLeadStatus)}
            disabled={isConverted}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Compte-rendu terrain, prochaine action…"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Tags (séparés par des virgules)</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="restaurant, centre-ville"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Prochain suivi</span>
          <input
            type="datetime-local"
            value={nextFollowup}
            onChange={(e) => setNextFollowup(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-yunicity-primary px-4 py-2 text-sm font-medium text-white hover:bg-yunicity-primary-hover disabled:opacity-50"
          >
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {!isConverted ? (
            <button
              type="button"
              onClick={() => setShowConvert(true)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Convertir en organization
            </button>
          ) : null}
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        Créé {formatDateTime(lead.created_at)} · MAJ {formatDateTime(lead.updated_at)}
      </p>

      {showConvert && user ? (
        <ConvertLeadModal
          lead={lead}
          defaultOwnerUserId={user.id}
          onClose={() => setShowConvert(false)}
          onSubmit={handleConvert}
        />
      ) : null}
    </div>
  );
}

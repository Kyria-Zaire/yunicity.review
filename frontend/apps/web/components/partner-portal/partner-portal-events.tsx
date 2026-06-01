"use client";

import { usePartnerPortalContext } from "@/hooks/use-partner-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { LocalEventManagement } from "@yunicity/types";
import {
  buildPartnerPortalEventPublicHref,
  fromDatetimeLocalValue,
  isAuthError,
  partnerPortalModerationStatusLabel,
} from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useState } from "react";

function formatEventWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function canResubmitEvent(event: LocalEventManagement): boolean {
  return event.moderation_status === "rejected" && !event.is_cancelled;
}

function canSubmitEvent(event: LocalEventManagement): boolean {
  return event.moderation_status === "pending_review" && !event.is_cancelled;
}

function isPublicEvent(event: LocalEventManagement): boolean {
  return event.moderation_status === "approved" && !event.is_cancelled;
}

export function PartnerPortalEvents() {
  const ctx = usePartnerPortalContext();
  const api = useYunicityApi();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [locationName, setLocationName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    if (!ctx.organization || !title.trim() || !startsAt || !locationName.trim()) {
      setFormError("Titre, date et lieu sont obligatoires.");
      return;
    }
    const startsIso = fromDatetimeLocalValue(startsAt);
    if (!startsIso) {
      setFormError("Date invalide.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const created = await api.organizationEvents.createEvent({
        organization_id: ctx.organization.id,
        title: title.trim(),
        description: description.trim() || null,
        event_type: "partner_event",
        city: ctx.organization.city,
        starts_at: startsIso,
        location_name: locationName.trim(),
      });
      await api.organizationEvents.submitEvent(created.id);
      setTitle("");
      setDescription("");
      setStartsAt("");
      setLocationName("");
      setShowForm(false);
      await ctx.reload();
    } catch (err) {
      setFormError(isAuthError(err) ? err.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }, [api.organizationEvents, ctx, description, locationName, startsAt, title]);

  const handleSubmit = useCallback(
    async (eventId: string) => {
      setBusy(true);
      setFormError(null);
      try {
        await api.organizationEvents.submitEvent(eventId);
        await ctx.reload();
      } catch (err) {
        setFormError(isAuthError(err) ? err.message : "Soumission impossible.");
      } finally {
        setBusy(false);
      }
    },
    [api.organizationEvents, ctx],
  );

  if (!ctx.organization) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          {ctx.events.length} événement{ctx.events.length !== 1 ? "s" : ""}
        </p>
        {ctx.canManage ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {showForm ? "Fermer le formulaire" : "Nouvel événement"}
          </button>
        ) : null}
      </div>

      {showForm && ctx.canManage ? (
        <div className="space-y-4 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">Créer un événement</h2>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Titre</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Date et heure de début</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Lieu</span>
            <input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <p className="text-xs text-neutral-500">
            L’événement est créé puis soumis en validation — il n’apparaît pas comme publié tant
            qu’il n’est pas approuvé.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreate()}
            className="rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Envoi…" : "Créer et soumettre"}
          </button>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        </div>
      ) : null}

      {ctx.events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
          Aucun événement. Créez un moment et soumettez-le pour modération.
        </p>
      ) : (
        <ul className="space-y-4">
          {ctx.events.map((event) => (
            <li
              key={event.id}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-neutral-900">{event.title}</h3>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                  {partnerPortalModerationStatusLabel(event.moderation_status)}
                  {event.is_cancelled ? " · Annulé" : ""}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {formatEventWhen(event.starts_at)} · {event.location_name}
                {event.district ? ` · ${event.district}` : ""}
              </p>
              {event.description ? (
                <p className="mt-2 text-sm text-neutral-600 line-clamp-3">{event.description}</p>
              ) : null}
              {"rejection_reason" in event && event.rejection_reason ? (
                <p className="mt-2 text-xs text-red-600">Motif : {event.rejection_reason}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                {isPublicEvent(event) ? (
                  <Link
                    href={buildPartnerPortalEventPublicHref(event.id)}
                    className="text-xs font-semibold text-yunicity-primary hover:underline"
                  >
                    Voir l’événement public
                  </Link>
                ) : null}
                {ctx.canManage && (canSubmitEvent(event) || canResubmitEvent(event)) ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSubmit(event.id)}
                    className="text-xs font-semibold text-neutral-700 hover:underline"
                  >
                    {canResubmitEvent(event) ? "Resoumettre pour validation" : "Soumettre pour validation"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

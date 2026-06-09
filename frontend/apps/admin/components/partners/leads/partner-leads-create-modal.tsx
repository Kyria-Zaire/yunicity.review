"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { OrganizationType, PartnerLeadSource } from "@yunicity/types";
import {
  PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_SOURCE,
  PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_TYPE,
  PARTNER_LEAD_QUICK_CAPTURE_ERROR_MESSAGE,
  PARTNER_LEAD_QUICK_CAPTURE_TYPE_OPTIONS,
  isAuthError,
  partnerLeadQuickCapturePartialResetFields,
  partnerLeadQuickCaptureSourceOptions,
} from "@yunicity/utils";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type PartnerLeadsCreateModalProps = {
  city: string;
  open: boolean;
  onClose: () => void;
  onCreated: (leadId: string) => void;
  anotherCaptureToken?: number;
};

export function PartnerLeadsCreateModal({
  city,
  open,
  onClose,
  onCreated,
  anotherCaptureToken = 0,
}: PartnerLeadsCreateModalProps) {
  const { partnerLeadsApi } = useAuth();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  const [name, setName] = useState("");
  const [organizationType, setOrganizationType] = useState<OrganizationType>(
    PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_TYPE,
  );
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<PartnerLeadSource>(
    PARTNER_LEAD_QUICK_CAPTURE_DEFAULT_SOURCE,
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameInvalid, setNameInvalid] = useState(false);

  const sourceOptions = partnerLeadQuickCaptureSourceOptions();

  useEffect(() => {
    if (!open) {
      return;
    }
    if (anotherCaptureToken > 0) {
      const reset = partnerLeadQuickCapturePartialResetFields();
      setName(reset.name);
      setPhone(reset.phone);
      setEmail(reset.email);
      setNotes(reset.notes);
    }
    setError(null);
    setNameInvalid(false);
    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open, anotherCaptureToken]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameInvalid(true);
      setError("Le nom doit contenir au moins 2 caractères.");
      nameInputRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setNameInvalid(false);
    try {
      const created = await partnerLeadsApi.createPartnerLead({
        name: trimmed,
        organization_type: organizationType,
        phone: phone.trim() || null,
        email: email.trim() || null,
        source,
        notes: notes.trim() || null,
        city,
      });
      onCreated(created.id);
      onClose();
    } catch (err) {
      setError(
        isAuthError(err)
          ? err.message
          : PARTNER_LEAD_QUICK_CAPTURE_ERROR_MESSAGE,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-base text-stone-900 placeholder:text-stone-400 focus:border-yunicity-primary focus:outline-none focus:ring-2 focus:ring-yunicity-primary/20 sm:py-2.5 sm:text-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stone-950/50 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-capture-title"
    >
      <div className="flex min-h-0 flex-1 flex-col bg-white sm:max-h-[90vh] sm:w-full sm:max-w-sm sm:flex-none sm:rounded-2xl sm:border sm:border-stone-200 sm:shadow-xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
              Quick capture
            </p>
            <h2 id="quick-capture-title" className="mt-1 text-lg font-bold text-stone-950">
              Nouveau prospect
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">Enregistrement terrain · {city}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-4">
            <div>
              <label htmlFor="qc-name" className="text-sm font-medium text-stone-800">
                Nom du prospect <span className="text-rose-600">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="qc-name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameInvalid) {
                    setNameInvalid(false);
                    setError(null);
                  }
                }}
                required
                minLength={2}
                autoComplete="organization"
                enterKeyHint="next"
                aria-invalid={nameInvalid}
                aria-describedby={error ? errorId : undefined}
                className={`${fieldClass} ${nameInvalid ? "border-rose-300 ring-rose-100" : ""}`}
                placeholder="Boulangerie Dupont"
              />
            </div>

            <div>
              <label htmlFor="qc-type" className="text-sm font-medium text-stone-800">
                Type <span className="text-rose-600">*</span>
              </label>
              <select
                id="qc-type"
                name="organization_type"
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                required
                className={fieldClass}
              >
                {PARTNER_LEAD_QUICK_CAPTURE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="qc-phone" className="text-sm font-medium text-stone-800">
                Téléphone
              </label>
              <input
                id="qc-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label htmlFor="qc-email" className="text-sm font-medium text-stone-800">
                Email
              </label>
              <input
                id="qc-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                enterKeyHint="next"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="contact@exemple.fr"
              />
            </div>

            <div>
              <label htmlFor="qc-source" className="text-sm font-medium text-stone-800">
                Source
              </label>
              <select
                id="qc-source"
                name="source"
                value={source}
                onChange={(e) => setSource(e.target.value as PartnerLeadSource)}
                className={fieldClass}
              >
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="qc-notes" className="text-sm font-medium text-stone-800">
                Notes
              </label>
              <textarea
                id="qc-notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${fieldClass} resize-none`}
                placeholder="Intéressé par Passport."
              />
            </div>

            {error ? (
              <p
                id={errorId}
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-stone-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:rounded-b-2xl">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-yunicity-primary px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60 sm:py-3 sm:text-sm"
            >
              {isSubmitting ? "Création…" : "Créer le prospect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

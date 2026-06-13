"use client";

import type { NeighborhoodContributionIdentityType } from "@yunicity/types";
import {
  NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH,
  NEIGHBORHOOD_CONTRIBUTION_IDENTITY_ANONYMOUS_REMOIS_LABEL,
  NEIGHBORHOOD_CONTRIBUTION_IDENTITY_PSEUDO_LABEL,
  NEIGHBORHOOD_CONTRIBUTION_IDENTITY_VERIFIED_LABEL,
  NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH,
  NEIGHBORHOOD_V2_CONTRIBUTION_BODY_LABEL,
  NEIGHBORHOOD_V2_CONTRIBUTION_EDITORIAL_REMINDER,
  NEIGHBORHOOD_V2_CONTRIBUTION_IDENTITY_HINT,
  NEIGHBORHOOD_V2_CONTRIBUTION_MODAL_TITLE,
  NEIGHBORHOOD_V2_CONTRIBUTION_SUBMIT_LABEL,
  NEIGHBORHOOD_V2_CONTRIBUTION_SUBMITTING_LABEL,
  NEIGHBORHOOD_V2_CONTRIBUTION_TITLE_LABEL,
  NEIGHBORHOOD_V2_CONTRIBUTION_TRANSMISSION_HINT,
  createInitialContributionFormState,
  formatContributionCharacterCount,
  isContributionFormValid,
  type NeighborhoodContributionFormState,
} from "@yunicity/utils";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import type { ContributionSubmitStatus } from "@/hooks/use-neighborhood-contribution-submit";

type NeighborhoodContributionModalProps = {
  open: boolean;
  onClose: () => void;
  displayName: string;
  hasActivePassport: boolean;
  status: ContributionSubmitStatus;
  errorMessage: string | null;
  onSubmit: (form: NeighborhoodContributionFormState) => Promise<void>;
  onReset: () => void;
};

const IDENTITY_OPTIONS: {
  type: NeighborhoodContributionIdentityType;
  label: string;
  requiresPassport?: boolean;
}[] = [
  { type: "PSEUDO", label: NEIGHBORHOOD_CONTRIBUTION_IDENTITY_PSEUDO_LABEL },
  { type: "ANONYMOUS", label: NEIGHBORHOOD_CONTRIBUTION_IDENTITY_ANONYMOUS_REMOIS_LABEL },
  {
    type: "VERIFIED",
    label: NEIGHBORHOOD_CONTRIBUTION_IDENTITY_VERIFIED_LABEL,
    requiresPassport: true,
  },
];

export function NeighborhoodContributionModal({
  open,
  onClose,
  displayName,
  hasActivePassport,
  status,
  errorMessage,
  onSubmit,
  onReset,
}: NeighborhoodContributionModalProps) {
  const [form, setForm] = useState(createInitialContributionFormState);

  useEffect(() => {
    if (!open) return;
    setForm(createInitialContributionFormState());
    onReset();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && status !== "submitting") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onReset, open, status]);

  if (!open) return null;

  const isSubmitting = status === "submitting";
  const canSubmit = isContributionFormValid(form) && !isSubmitting;

  function updateIdentity(type: NeighborhoodContributionIdentityType) {
    setForm((current) => ({ ...current, identityType: type }));
  }

  function identityOptionLabel(type: NeighborhoodContributionIdentityType, label: string): string {
    if (type === "PSEUDO") {
      return displayName.trim() || label;
    }
    return label;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fermer la transmission"
        onClick={onClose}
        disabled={isSubmitting}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="neighborhood-contribution-modal-title"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-3xl sm:px-6 sm:py-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="neighborhood-contribution-modal-title"
            className="pr-2 text-base font-bold leading-snug text-neutral-900 sm:text-lg"
          >
            {NEIGHBORHOOD_V2_CONTRIBUTION_MODAL_TITLE}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold text-neutral-900">Identité</legend>
            <p className="mt-1 text-sm text-neutral-600">{NEIGHBORHOOD_V2_CONTRIBUTION_IDENTITY_HINT}</p>
            <div className="mt-3 space-y-2">
              {IDENTITY_OPTIONS.map((option) => {
                const disabled =
                  isSubmitting || (option.requiresPassport === true && !hasActivePassport);
                return (
                  <label
                    key={option.type}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${
                      form.identityType === option.type
                        ? "border-yunicity-primary/40 bg-yunicity-primary/5"
                        : "border-neutral-200"
                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="contribution-identity"
                      value={option.type}
                      checked={form.identityType === option.type}
                      disabled={disabled}
                      onChange={() => updateIdentity(option.type)}
                      className="h-4 w-4 accent-yunicity-primary"
                    />
                    <span className="text-sm text-neutral-800">
                      {identityOptionLabel(option.type, option.label)}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="contribution-title" className="text-sm font-semibold text-neutral-900">
              {NEIGHBORHOOD_V2_CONTRIBUTION_TITLE_LABEL}
            </label>
            <input
              id="contribution-title"
              type="text"
              maxLength={NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH}
              value={form.title}
              disabled={isSubmitting}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="contribution-body" className="text-sm font-semibold text-neutral-900">
                {NEIGHBORHOOD_V2_CONTRIBUTION_BODY_LABEL}
              </label>
              <span className="text-xs text-neutral-500">
                {formatContributionCharacterCount(
                  form.body.trim().length,
                  NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH,
                )}
              </span>
            </div>
            <textarea
              id="contribution-body"
              rows={6}
              maxLength={NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH}
              value={form.body}
              disabled={isSubmitting}
              onChange={(event) =>
                setForm((current) => ({ ...current, body: event.target.value }))
              }
              className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2.5 text-sm leading-relaxed text-neutral-900 outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
            />
          </div>

          <p className="rounded-xl bg-neutral-50 px-3 py-3 text-sm leading-relaxed text-neutral-600">
            {NEIGHBORHOOD_V2_CONTRIBUTION_EDITORIAL_REMINDER}
          </p>

          <p className="text-sm italic text-neutral-500">
            {NEIGHBORHOOD_V2_CONTRIBUTION_TRANSMISSION_HINT}
          </p>

          {errorMessage ? (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void onSubmit(form)}
            className="w-full rounded-full bg-yunicity-primary px-5 py-3 text-sm font-semibold text-white hover:bg-yunicity-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? NEIGHBORHOOD_V2_CONTRIBUTION_SUBMITTING_LABEL
              : NEIGHBORHOOD_V2_CONTRIBUTION_SUBMIT_LABEL}
          </button>
        </div>
      </section>
    </div>
  );
}

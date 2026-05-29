"use client";

import type { TribeCreateDraft, TribeCreateStepId } from "@yunicity/utils";
import {
  TRIBE_CREATE_BACK,
  TRIBE_CREATE_CANCEL,
  TRIBE_CREATE_CATEGORY_PLACEHOLDER,
  TRIBE_CREATE_CHARTER_LABEL,
  TRIBE_CREATE_CONFIRM_BODY,
  TRIBE_CREATE_CONFIRM_TITLE,
  TRIBE_CREATE_DESC_MAX,
  TRIBE_CREATE_DESC_PLACEHOLDER,
  TRIBE_CREATE_FIELD_CATEGORY,
  TRIBE_CREATE_FIELD_CITY,
  TRIBE_CREATE_FIELD_COVER,
  TRIBE_CREATE_FIELD_DESCRIPTION,
  TRIBE_CREATE_FIELD_NAME,
  TRIBE_CREATE_FIELD_VISIBILITY,
  TRIBE_CREATE_INFO_TITLE,
  TRIBE_CREATE_INVITE_PRIVATE,
  TRIBE_CREATE_INVITE_PUBLIC,
  TRIBE_CREATE_INVITE_TITLE,
  TRIBE_CREATE_NAME_MAX,
  TRIBE_CREATE_NAME_PLACEHOLDER,
  TRIBE_CREATE_NEXT,
  TRIBE_CREATE_PERSONALIZE_TITLE,
  TRIBE_CREATE_PREVIEW_COVER_SOON,
  TRIBE_CREATE_RULES_BODY,
  TRIBE_CREATE_RULES_TITLE,
  TRIBE_CREATE_SUBMIT,
  TRIBE_CREATE_SUBMITTING,
  TRIBE_CREATE_VISIBILITY_PRIVATE,
  TRIBE_CREATE_VISIBILITY_PRIVATE_DESC,
  TRIBE_CREATE_VISIBILITY_PUBLIC,
  TRIBE_CREATE_VISIBILITY_PUBLIC_DESC,
  TRIBE_CREATE_CATEGORY_OPTIONS,
  tribeCreateVisibilityLabel,
  tribeCategoryLabel,
} from "@yunicity/utils";
import Link from "next/link";

type TribeCreateWizardProps = {
  step: TribeCreateStepId;
  draft: TribeCreateDraft;
  validationMessage: string | null;
  isSubmitting: boolean;
  onChange: (patch: Partial<TribeCreateDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <span className="font-medium text-neutral-800">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
  );
}

function ReviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-3 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-bold uppercase tracking-wide text-neutral-400">
        {label}
      </dt>
      <dd className="text-sm text-neutral-800">{value}</dd>
    </div>
  );
}

export function TribeCreateWizard({
  step,
  draft,
  validationMessage,
  isSubmitting,
  onChange,
  onBack,
  onNext,
  onSubmit,
}: TribeCreateWizardProps) {
  const descCount = draft.description.length;

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8">
      {validationMessage ? (
        <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {validationMessage}
        </p>
      ) : null}

      {step === "info" ? (
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_INFO_TITLE}</h2>
          <div className="mt-6 space-y-5">
            <label className="block space-y-1.5 text-sm">
              <FieldLabel required>{TRIBE_CREATE_FIELD_NAME}</FieldLabel>
              <input
                value={draft.name}
                onChange={(event) => onChange({ name: event.target.value })}
                maxLength={TRIBE_CREATE_NAME_MAX}
                placeholder={TRIBE_CREATE_NAME_PLACEHOLDER}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
              />
            </label>

            <label className="block space-y-1.5 text-sm">
              <FieldLabel required>{TRIBE_CREATE_FIELD_CATEGORY}</FieldLabel>
              <select
                value={draft.category}
                onChange={(event) => onChange({ category: event.target.value })}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
              >
                <option value="">{TRIBE_CREATE_CATEGORY_PLACEHOLDER}</option>
                {TRIBE_CREATE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm">
              <FieldLabel required>{TRIBE_CREATE_FIELD_DESCRIPTION}</FieldLabel>
              <textarea
                value={draft.description}
                onChange={(event) => onChange({ description: event.target.value })}
                maxLength={TRIBE_CREATE_DESC_MAX}
                rows={4}
                placeholder={TRIBE_CREATE_DESC_PLACEHOLDER}
                className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
              />
              <span className="text-xs text-neutral-400">
                {descCount}/{TRIBE_CREATE_DESC_MAX}
              </span>
            </label>

            <label className="block space-y-1.5 text-sm">
              <FieldLabel>{TRIBE_CREATE_FIELD_CITY}</FieldLabel>
              <input
                value={draft.city}
                onChange={(event) => onChange({ city: event.target.value })}
                maxLength={80}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
              />
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-neutral-800">{TRIBE_CREATE_FIELD_VISIBILITY}</legend>
              <label className="flex cursor-pointer gap-3 rounded-xl border border-neutral-200 p-4 has-[:checked]:border-yunicity-primary has-[:checked]:bg-[#EEF0FF]/50">
                <input
                  type="radio"
                  name="visibility"
                  checked={draft.visibility === "public"}
                  onChange={() => onChange({ visibility: "public" })}
                  className="mt-1 accent-yunicity-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    {TRIBE_CREATE_VISIBILITY_PUBLIC}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-neutral-600">
                    {TRIBE_CREATE_VISIBILITY_PUBLIC_DESC}
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-xl border border-neutral-200 p-4 has-[:checked]:border-yunicity-primary has-[:checked]:bg-[#EEF0FF]/50">
                <input
                  type="radio"
                  name="visibility"
                  checked={draft.visibility === "private_invite"}
                  onChange={() => onChange({ visibility: "private_invite" })}
                  className="mt-1 accent-yunicity-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    {TRIBE_CREATE_VISIBILITY_PRIVATE}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-neutral-600">
                    {TRIBE_CREATE_VISIBILITY_PRIVATE_DESC}
                  </span>
                </span>
              </label>
            </fieldset>
          </div>
        </div>
      ) : null}

      {step === "personalize" ? (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_PERSONALIZE_TITLE}</h2>
          <p className="text-sm text-neutral-600">{TRIBE_CREATE_PREVIEW_COVER_SOON}</p>
          <label className="block space-y-1.5 text-sm">
            <FieldLabel>{TRIBE_CREATE_FIELD_COVER}</FieldLabel>
            <input
              type="url"
              value={draft.coverImageUrl}
              onChange={(event) => onChange({ coverImageUrl: event.target.value })}
              placeholder="https://…"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
        </div>
      ) : null}

      {step === "rules" ? (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_RULES_TITLE}</h2>
          <p className="text-sm leading-relaxed text-neutral-600">{TRIBE_CREATE_RULES_BODY}</p>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 has-[:checked]:border-yunicity-primary has-[:checked]:bg-[#EEF0FF]/50">
            <input
              type="checkbox"
              checked={draft.charterAccepted}
              onChange={(event) => onChange({ charterAccepted: event.target.checked })}
              className="mt-1 accent-yunicity-primary"
            />
            <span className="text-sm leading-relaxed text-neutral-800">{TRIBE_CREATE_CHARTER_LABEL}</span>
          </label>
        </div>
      ) : null}

      {step === "invite" ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_INVITE_TITLE}</h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {draft.visibility === "private_invite"
              ? TRIBE_CREATE_INVITE_PRIVATE
              : TRIBE_CREATE_INVITE_PUBLIC}
          </p>
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_CONFIRM_TITLE}</h2>
          <p className="text-sm text-neutral-600">{TRIBE_CREATE_CONFIRM_BODY}</p>
          <dl className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4">
            <ReviewRow label="Nom" value={draft.name} />
            <ReviewRow label="Catégorie" value={tribeCategoryLabel(draft.category)} />
            <ReviewRow label="Description" value={draft.description} />
            <ReviewRow label="Ville" value={draft.city} />
            <ReviewRow label="Visibilité" value={tribeCreateVisibilityLabel(draft.visibility)} />
            <ReviewRow label="Couverture" value={draft.coverImageUrl.trim() || "Image éditoriale par défaut"} />
          </dl>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-6">
        {step === "info" ? (
          <Link
            href="/tribes"
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            {TRIBE_CREATE_CANCEL}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            {TRIBE_CREATE_BACK}
          </button>
        )}

        {step === "confirm" ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? TRIBE_CREATE_SUBMITTING : TRIBE_CREATE_SUBMIT}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            {TRIBE_CREATE_NEXT}
            <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  );
}

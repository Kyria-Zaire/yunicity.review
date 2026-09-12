"use client";

import type { TribeCreateDraft, TribeCreateStepId } from "@yunicity/utils";
import {
  TRIBE_CREATE_DESKTOP_ACCESS_INFO,
  TRIBE_CREATE_DESC_MAX,
  TRIBE_CREATE_DESKTOP_ACCESS_BODY,
  TRIBE_CREATE_DESKTOP_ACCESS_PRIVATE_INFO,
  TRIBE_CREATE_DESKTOP_ACCESS_PUBLIC_INFO,
  TRIBE_CREATE_DESKTOP_ACCESS_TITLE,
  TRIBE_CREATE_DESKTOP_BACK_STEP,
  TRIBE_CREATE_DESKTOP_CANCEL,
  TRIBE_CREATE_DESKTOP_CHARTER_LABEL,
  TRIBE_CREATE_DESKTOP_COVER_HINT,
  TRIBE_CREATE_DESKTOP_DESC_PLACEHOLDER,
  TRIBE_CREATE_DESKTOP_FIELD_CITY,
  TRIBE_CREATE_DESKTOP_FIELD_CITY_HINT,
  TRIBE_CREATE_DESKTOP_FIELD_COMMUNITY,
  TRIBE_CREATE_DESKTOP_FIELD_COVER,
  TRIBE_CREATE_DESKTOP_FIELD_DESCRIPTION,
  TRIBE_CREATE_DESKTOP_FIELD_NAME,
  TRIBE_CREATE_DESKTOP_FIELD_THEME,
  TRIBE_CREATE_DESKTOP_IDENTITY_BODY,
  TRIBE_CREATE_DESKTOP_IDENTITY_TITLE,
  TRIBE_CREATE_DESKTOP_NAME_PLACEHOLDER,
  TRIBE_CREATE_DESKTOP_PROFILE_CHANGE,
  TRIBE_CREATE_DESKTOP_PROFILE_LABEL,
  TRIBE_CREATE_DESKTOP_REVIEW_BODY,
  TRIBE_CREATE_DESKTOP_REVIEW_TITLE,
  TRIBE_CREATE_DESKTOP_RULES_BODY,
  TRIBE_CREATE_DESKTOP_RULES_TITLE,
  TRIBE_CREATE_DESKTOP_SAVE_DRAFT,
  TRIBE_CREATE_DESKTOP_VISIBILITY_PRIVATE,
  TRIBE_CREATE_DESKTOP_VISIBILITY_PRIVATE_DESC,
  TRIBE_CREATE_DESKTOP_VISIBILITY_PUBLIC,
  TRIBE_CREATE_DESKTOP_VISIBILITY_PUBLIC_DESC,
  TRIBE_CREATE_DESKTOP_VISUALS_BODY,
  TRIBE_CREATE_DESKTOP_VISUALS_TITLE,
  TRIBE_CREATE_NAME_MAX,
  TRIBE_CREATE_SUBMIT,
  TRIBE_CREATE_SUBMITTING,
  TRIBE_CREATE_DESKTOP_CATEGORY_GRID,
  tribeCreateDesktopNextLabel,
  tribeCategoryLabel,
  tribeCreateVisibilityLabel,
} from "@yunicity/utils";
import {
  BookOpen,
  Camera,
  ChevronDown,
  Globe2,
  Heart,
  Landmark,
  Lock,
  MapPin,
  MoreHorizontal,
  Music2,
  Trophy,
  Users,
  GraduationCap,
  Info,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_ICON = {
  culture: Landmark,
  sport: Trophy,
  heart: Heart,
  students: GraduationCap,
  music: Music2,
  photo: Camera,
  users: Users,
  other: MoreHorizontal,
} as const;

type TribeCreateDesktopWizardProps = {
  variant?: "desktop" | "medium" | "mobile";
  step: TribeCreateStepId;
  draft: TribeCreateDraft;
  creatorName: string;
  validationMessage: string | null;
  isSubmitting: boolean;
  onChange: (patch: Partial<TribeCreateDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
};

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-neutral-800">
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

function creatorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "YC";
}

export function TribeCreateDesktopWizard({
  variant = "desktop",
  step,
  draft,
  creatorName,
  validationMessage,
  isSubmitting,
  onChange,
  onBack,
  onNext,
  onSaveDraft,
  onSubmit,
}: TribeCreateDesktopWizardProps) {
  const isMobile = variant === "mobile";
  const isMedium = variant === "medium";
  const visibilityFieldName = isMobile
    ? "visibility-mobile"
    : isMedium
      ? "visibility-medium"
      : "visibility-desktop";
  const nameCount = draft.name.length;
  const descCount = draft.description.length;

  return (
    <div
      className={`rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${
        isMobile ? "p-4" : "p-6 sm:p-8"
      }`}
    >
      {validationMessage ? (
        <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {validationMessage}
        </p>
      ) : null}

      {step === "identity" ? (
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_IDENTITY_TITLE}</h2>
          <p className="mt-1 text-sm text-neutral-600">{TRIBE_CREATE_DESKTOP_IDENTITY_BODY}</p>

          <div className={`${isMobile ? "space-y-5" : "mt-6 space-y-5"}`}>
            {isMobile ? (
              <div className="space-y-2">
                <FieldLabel>{TRIBE_CREATE_DESKTOP_PROFILE_LABEL}</FieldLabel>
                <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-sm font-bold text-white">
                    {creatorInitials(creatorName)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900">
                    {creatorName}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </div>
                <button
                  type="button"
                  disabled
                  className="text-sm font-semibold text-yunicity-primary/70"
                  title={TRIBE_CREATE_DESKTOP_PROFILE_CHANGE}
                >
                  {TRIBE_CREATE_DESKTOP_PROFILE_CHANGE}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {TRIBE_CREATE_DESKTOP_PROFILE_LABEL}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">{creatorName}</p>
                </div>
                <button
                  type="button"
                  disabled
                  className="text-sm font-semibold text-yunicity-primary/60"
                  title={TRIBE_CREATE_DESKTOP_PROFILE_CHANGE}
                >
                  {TRIBE_CREATE_DESKTOP_PROFILE_CHANGE}
                </button>
              </div>
            )}

            <div className={isMedium ? "grid gap-5 sm:grid-cols-2" : "space-y-5"}>
              <label className="block space-y-1.5">
                <FieldLabel required>{TRIBE_CREATE_DESKTOP_FIELD_NAME}</FieldLabel>
                {isMobile ? (
                  <div className="relative">
                    <input
                      value={draft.name}
                      onChange={(event) => onChange({ name: event.target.value })}
                      maxLength={TRIBE_CREATE_NAME_MAX}
                      placeholder={TRIBE_CREATE_DESKTOP_NAME_PLACEHOLDER}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 pr-16 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-neutral-400">
                      {nameCount} / {TRIBE_CREATE_NAME_MAX}
                    </span>
                  </div>
                ) : (
                  <>
                    <input
                      value={draft.name}
                      onChange={(event) => onChange({ name: event.target.value })}
                      maxLength={TRIBE_CREATE_NAME_MAX}
                      placeholder={TRIBE_CREATE_DESKTOP_NAME_PLACEHOLDER}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                    />
                    <span className="text-xs text-neutral-400">
                      {nameCount} / {TRIBE_CREATE_NAME_MAX}
                    </span>
                  </>
                )}
              </label>

              <label className="block space-y-1.5">
                <FieldLabel required>{TRIBE_CREATE_DESKTOP_FIELD_CITY}</FieldLabel>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={draft.city}
                    onChange={(event) => onChange({ city: event.target.value })}
                    maxLength={80}
                    className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-10 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                  />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
                <span className="text-xs text-neutral-500">{TRIBE_CREATE_DESKTOP_FIELD_CITY_HINT}</span>
              </label>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-neutral-800">
                {TRIBE_CREATE_DESKTOP_FIELD_THEME}
                <span className="text-red-500"> *</span>
              </legend>
              <ul
                className={`grid grid-cols-2 gap-2 ${isMobile ? "" : "sm:grid-cols-4"}`}
              >
                {TRIBE_CREATE_DESKTOP_CATEGORY_GRID.map((option) => {
                  const Icon = CATEGORY_ICON[option.icon] ?? BookOpen;
                  const selected = draft.category === option.value;
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => onChange({ category: option.value })}
                        className={`flex w-full flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
                          selected
                            ? "border-yunicity-primary bg-[#EEF0FF]/60 text-yunicity-primary"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                        <span className="text-xs font-semibold leading-tight">{option.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <label className="block space-y-1.5">
              <FieldLabel required>{TRIBE_CREATE_DESKTOP_FIELD_DESCRIPTION}</FieldLabel>
              {isMobile ? (
                <div className="relative">
                  <textarea
                    value={draft.description}
                    onChange={(event) => onChange({ description: event.target.value })}
                    maxLength={TRIBE_CREATE_DESC_MAX}
                    rows={4}
                    placeholder={TRIBE_CREATE_DESKTOP_DESC_PLACEHOLDER}
                    className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 pb-7 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                  />
                  <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs tabular-nums text-neutral-400">
                    {descCount} / {TRIBE_CREATE_DESC_MAX}
                  </span>
                </div>
              ) : (
                <>
                  <textarea
                    value={draft.description}
                    onChange={(event) => onChange({ description: event.target.value })}
                    maxLength={TRIBE_CREATE_DESC_MAX}
                    rows={4}
                    placeholder={TRIBE_CREATE_DESKTOP_DESC_PLACEHOLDER}
                    className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                  />
                  <span className="text-xs text-neutral-400">
                    {descCount} / {TRIBE_CREATE_DESC_MAX}
                  </span>
                </>
              )}
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-neutral-800">
                {TRIBE_CREATE_DESKTOP_FIELD_COMMUNITY}
              </legend>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "sm:grid-cols-2"}`}>
                <label
                  className={`flex cursor-pointer gap-3 rounded-xl border border-neutral-200 p-4 has-[:checked]:border-yunicity-primary has-[:checked]:bg-[#EEF0FF]/50 ${
                    isMobile ? "items-start" : ""
                  }`}
                >
                  {isMobile ? (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FF] text-yunicity-primary">
                      <Globe2 className="h-5 w-5" aria-hidden />
                    </span>
                  ) : null}
                  <input
                    type="radio"
                    name={visibilityFieldName}
                    checked={draft.visibility === "public"}
                    onChange={() => onChange({ visibility: "public" })}
                    className={`accent-yunicity-primary ${isMobile ? "order-last mt-1 shrink-0" : "mt-1"}`}
                  />
                  <span className={isMobile ? "min-w-0 flex-1" : undefined}>
                    {!isMobile ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                        <Globe2 className="h-4 w-4" aria-hidden />
                        {TRIBE_CREATE_DESKTOP_VISIBILITY_PUBLIC}
                      </span>
                    ) : (
                      <span className="block text-sm font-semibold text-neutral-900">
                        {TRIBE_CREATE_DESKTOP_VISIBILITY_PUBLIC}
                      </span>
                    )}
                    <span className="mt-1 block text-xs leading-relaxed text-neutral-600">
                      {TRIBE_CREATE_DESKTOP_VISIBILITY_PUBLIC_DESC}
                    </span>
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer gap-3 rounded-xl border border-neutral-200 p-4 has-[:checked]:border-yunicity-primary has-[:checked]:bg-[#EEF0FF]/50 ${
                    isMobile ? "items-start" : ""
                  }`}
                >
                  {isMobile ? (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500">
                      <Lock className="h-5 w-5" aria-hidden />
                    </span>
                  ) : null}
                  <input
                    type="radio"
                    name={visibilityFieldName}
                    checked={draft.visibility === "private_invite"}
                    onChange={() => onChange({ visibility: "private_invite" })}
                    className={`accent-yunicity-primary ${isMobile ? "order-last mt-1 shrink-0" : "mt-1"}`}
                  />
                  <span className={isMobile ? "min-w-0 flex-1" : undefined}>
                    {!isMobile ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                        <Lock className="h-4 w-4" aria-hidden />
                        {TRIBE_CREATE_DESKTOP_VISIBILITY_PRIVATE}
                      </span>
                    ) : (
                      <span className="block text-sm font-semibold text-neutral-900">
                        {TRIBE_CREATE_DESKTOP_VISIBILITY_PRIVATE}
                      </span>
                    )}
                    <span className="mt-1 block text-xs leading-relaxed text-neutral-600">
                      {TRIBE_CREATE_DESKTOP_VISIBILITY_PRIVATE_DESC}
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {isMedium || isMobile ? (
              <p className="flex gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-neutral-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                {TRIBE_CREATE_DESKTOP_ACCESS_INFO}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "access" ? (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_ACCESS_TITLE}</h2>
          <p className="text-sm text-neutral-600">{TRIBE_CREATE_DESKTOP_ACCESS_BODY}</p>
          <p className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-neutral-700">
            {draft.visibility === "private_invite"
              ? TRIBE_CREATE_DESKTOP_ACCESS_PRIVATE_INFO
              : TRIBE_CREATE_DESKTOP_ACCESS_PUBLIC_INFO}
          </p>

          <div className="space-y-4 rounded-xl border border-neutral-200 p-4">
            <h3 className="text-sm font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_RULES_TITLE}</h3>
            <p className="text-sm leading-relaxed text-neutral-600">{TRIBE_CREATE_DESKTOP_RULES_BODY}</p>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 has-[:checked]:border-yunicity-primary has-[:checked]:bg-[#EEF0FF]/50">
              <input
                type="checkbox"
                checked={draft.charterAccepted}
                onChange={(event) => onChange({ charterAccepted: event.target.checked })}
                className="mt-1 accent-yunicity-primary"
              />
              <span className="text-sm leading-relaxed text-neutral-800">
                {TRIBE_CREATE_DESKTOP_CHARTER_LABEL}
              </span>
            </label>
          </div>
        </div>
      ) : null}

      {step === "visuals" ? (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_VISUALS_TITLE}</h2>
          <p className="text-sm text-neutral-600">{TRIBE_CREATE_DESKTOP_VISUALS_BODY}</p>
          <p className="text-sm text-neutral-500">{TRIBE_CREATE_DESKTOP_COVER_HINT}</p>
          <label className="block space-y-1.5 text-sm">
            <FieldLabel>{TRIBE_CREATE_DESKTOP_FIELD_COVER}</FieldLabel>
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

      {step === "review" ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_REVIEW_TITLE}</h2>
          <p className="text-sm text-neutral-600">{TRIBE_CREATE_DESKTOP_REVIEW_BODY}</p>
          <dl className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4">
            <ReviewRow label="Nom" value={draft.name} />
            <ReviewRow label="Catégorie" value={tribeCategoryLabel(draft.category)} />
            <ReviewRow label="Description" value={draft.description} />
            <ReviewRow label="Ville" value={draft.city} />
            <ReviewRow label="Visibilité" value={tribeCreateVisibilityLabel(draft.visibility)} />
            <ReviewRow
              label="Couverture"
              value={draft.coverImageUrl.trim() || "Image éditoriale par défaut"}
            />
          </dl>
        </div>
      ) : null}

      {!isMobile ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-6">
        {step === "identity" ? (
          <Link
            href="/tribes"
            className="text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
          >
            {TRIBE_CREATE_DESKTOP_CANCEL}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
          >
            {TRIBE_CREATE_DESKTOP_BACK_STEP}
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            {TRIBE_CREATE_DESKTOP_SAVE_DRAFT}
          </button>

          {step === "review" ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
            >
              {isSubmitting ? TRIBE_CREATE_SUBMITTING : TRIBE_CREATE_SUBMIT}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
            >
              {tribeCreateDesktopNextLabel(step)}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </div>
      ) : null}
    </div>
  );
}

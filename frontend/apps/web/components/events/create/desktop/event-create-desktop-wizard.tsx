"use client";

import type { OrganizationMeItem } from "@yunicity/types";
import type { EventCreateCategoryId, EventCreateDraft, EventCreateStepId } from "@yunicity/utils";
import {
  EVENT_CREATE_CANCEL,
  EVENT_CREATE_CATEGORIES,
  EVENT_CREATE_CHANGE_ORGANIZATION,
  EVENT_CREATE_DESC_HINT,
  EVENT_CREATE_DESC_MAX,
  EVENT_CREATE_ESSENTIALS_BODY,
  EVENT_CREATE_ESSENTIALS_TITLE,
  EVENT_CREATE_FIELD_CATEGORY,
  EVENT_CREATE_FIELD_COVER,
  EVENT_CREATE_FIELD_DESCRIPTION,
  EVENT_CREATE_FIELD_LOCATION,
  EVENT_CREATE_FIELD_ORGANIZER,
  EVENT_CREATE_FIELD_RECURRING,
  EVENT_CREATE_FIELD_STARTS,
  EVENT_CREATE_FIELD_TITLE,
  EVENT_CREATE_FIELD_VISIBILITY,
  EVENT_CREATE_NO_ORG,
  EVENT_CREATE_NO_ORG_CTA,
  EVENT_CREATE_PRACTICAL_BODY,
  EVENT_CREATE_PRACTICAL_TITLE,
  EVENT_CREATE_MOBILE_DESC_HINT,
  EVENT_CREATE_MOBILE_RECURRING_HINT,
  EVENT_CREATE_MOBILE_VISIBILITY_PRIVATE,
  EVENT_CREATE_RECURRING_HINT,
  EVENT_CREATE_REVIEW_BODY,
  EVENT_CREATE_REVIEW_TITLE,
  EVENT_CREATE_SAVE_DRAFT,
  EVENT_CREATE_SCHEDULE_BODY,
  EVENT_CREATE_SCHEDULE_TITLE,
  EVENT_CREATE_STEPS,
  EVENT_CREATE_SUBMIT,
  EVENT_CREATE_SUBMITTING,
  EVENT_CREATE_TITLE_HINT,
  EVENT_CREATE_TITLE_MAX,
  EVENT_CREATE_VISIBILITY_PRIVATE,
  EVENT_CREATE_VISIBILITY_PRIVATE_DESC,
  EVENT_CREATE_VISIBILITY_PUBLIC,
  EVENT_CREATE_VISIBILITY_PUBLIC_DESC,
  EVENT_CREATE_VISUALS_BODY,
  EVENT_CREATE_VISUALS_TITLE,
  resolveEventCreateCategory,
} from "@yunicity/utils";
import {
  BadgeCheck,
  ChevronDown,
  Globe2,
  Landmark,
  Lock,
  MoreHorizontal,
  Music2,
  Trophy,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_ICON = {
  culture: Landmark,
  music: Music2,
  food: UtensilsCrossed,
  sport: Trophy,
  family: Users,
  local_life: Globe2,
  other: MoreHorizontal,
} as const;

type EventCreateDesktopWizardProps = {
  variant?: "desktop" | "medium" | "mobile";
  step: EventCreateStepId;
  draft: EventCreateDraft;
  organizations: OrganizationMeItem[];
  selectedOrganization: OrganizationMeItem | null;
  showOrgPicker: boolean;
  validationMessage: string | null;
  isSubmitting: boolean;
  onChange: (patch: Partial<EventCreateDraft>) => void;
  onToggleOrgPicker: (open: boolean) => void;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
};

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-neutral-900">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
  );
}

function CharCounter({
  value,
  max,
  variant = "desktop",
}: {
  value: number;
  max: number;
  variant?: "desktop" | "medium" | "mobile";
}) {
  return (
    <span
      className={`pointer-events-none absolute right-3 text-xs tabular-nums text-neutral-400 ${
        variant === "desktop" ? "bottom-3" : "top-3"
      }`}
    >
      {value} / {max}
    </span>
  );
}

export function EventCreateDesktopWizard({
  variant = "desktop",
  step,
  draft,
  organizations,
  selectedOrganization,
  showOrgPicker,
  validationMessage,
  isSubmitting,
  onChange,
  onToggleOrgPicker,
  onBack,
  onNext,
  onSaveDraft,
  onSubmit,
}: EventCreateDesktopWizardProps) {
  const activeStep = EVENT_CREATE_STEPS.find((item) => item.id === step);
  const titleCount = draft.title.length;
  const descCount = draft.description.length;
  const isMobile = variant === "mobile";
  const isTileCategory = variant === "medium" || isMobile;

  return (
    <div
      className={
        isMobile
          ? "rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
          : "rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8"
      }
      data-event-create-wizard=""
      data-event-create-wizard-variant={variant}
    >
      {validationMessage ? (
        <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {validationMessage}
        </p>
      ) : null}

      {step === "essentials" ? (
        <div>
          {!isMobile ? (
            <>
              <h2 className="text-xl font-bold text-neutral-900">{EVENT_CREATE_ESSENTIALS_TITLE}</h2>
              <p className="mt-1 text-sm text-neutral-600">{EVENT_CREATE_ESSENTIALS_BODY}</p>
            </>
          ) : null}

          <div className={isMobile ? "space-y-5" : "mt-6 space-y-6"}>
            <div className="space-y-2">
              {!isMobile ? (
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel required>{EVENT_CREATE_FIELD_ORGANIZER}</FieldLabel>
                  {organizations.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => onToggleOrgPicker(!showOrgPicker)}
                      className="text-sm font-semibold text-yunicity-primary hover:underline"
                    >
                      {EVENT_CREATE_CHANGE_ORGANIZATION}
                    </button>
                  ) : null}
                </div>
              ) : (
                <FieldLabel required>{EVENT_CREATE_FIELD_ORGANIZER}</FieldLabel>
              )}

              {organizations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
                  <p>{EVENT_CREATE_NO_ORG}</p>
                  <Link
                    href="/organizations/request"
                    className="mt-2 inline-flex font-semibold text-yunicity-primary hover:underline"
                  >
                    {EVENT_CREATE_NO_ORG_CTA}
                  </Link>
                </div>
              ) : showOrgPicker ? (
                <div className="space-y-2 rounded-xl border border-neutral-200 p-2">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        onChange({ organizationId: org.id, city: org.city || draft.city });
                        onToggleOrgPicker(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-neutral-50 ${
                        org.id === draft.organizationId ? "bg-[#EEF0FF]" : ""
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary/10 text-xs font-bold text-yunicity-primary">
                        {org.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-sm font-semibold text-neutral-900">
                          {org.name}
                          {org.verification_status === "verified" ? (
                            <BadgeCheck className="h-4 w-4 text-yunicity-primary" aria-hidden />
                          ) : null}
                        </span>
                        <span className="text-xs text-neutral-500">{org.city}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => organizations.length > 1 && onToggleOrgPicker(true)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary/10 text-xs font-bold text-yunicity-primary">
                      {(selectedOrganization?.name ?? "OR").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-sm font-semibold text-neutral-900">
                        {selectedOrganization?.name}
                        {selectedOrganization?.verification_status === "verified" ? (
                          <BadgeCheck className="h-4 w-4 text-yunicity-primary" aria-hidden />
                        ) : null}
                      </span>
                    </span>
                  </span>
                  {organizations.length > 1 ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  ) : null}
                </button>
              )}
              {isMobile && organizations.length > 1 && !showOrgPicker ? (
                <button
                  type="button"
                  onClick={() => onToggleOrgPicker(true)}
                  className="text-sm font-semibold text-yunicity-primary hover:underline"
                >
                  {EVENT_CREATE_CHANGE_ORGANIZATION}
                </button>
              ) : null}
            </div>

            <label className="block space-y-2">
              <FieldLabel required>{EVENT_CREATE_FIELD_TITLE}</FieldLabel>
              <div className="relative">
                <input
                  value={draft.title}
                  onChange={(event) => onChange({ title: event.target.value })}
                  maxLength={EVENT_CREATE_TITLE_MAX}
                  placeholder="Visite nocturne de la cathédrale"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 pr-16 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                />
                <CharCounter value={titleCount} max={EVENT_CREATE_TITLE_MAX} variant={variant} />
              </div>
              <p className="text-xs text-neutral-500">{EVENT_CREATE_TITLE_HINT}</p>
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-neutral-900">
                {EVENT_CREATE_FIELD_CATEGORY}
              </legend>
              <div
                className={
                  isTileCategory
                    ? isMobile
                      ? "grid grid-cols-2 gap-2"
                      : "grid grid-cols-2 gap-2 sm:grid-cols-4"
                    : "flex flex-wrap gap-2"
                }
              >
                {EVENT_CREATE_CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICON[category.id];
                  const selected = draft.categoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => onChange({ categoryId: category.id as EventCreateCategoryId })}
                      className={
                        isTileCategory
                          ? `flex flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-semibold transition ${
                              selected
                                ? "border-yunicity-primary bg-yunicity-primary text-white"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                            }`
                          : `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                              selected
                                ? "border-yunicity-primary bg-yunicity-primary text-white"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                            }`
                      }
                    >
                      <Icon className={isTileCategory ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block space-y-2">
              <FieldLabel required>{EVENT_CREATE_FIELD_DESCRIPTION}</FieldLabel>
              <div className="relative">
                <textarea
                  value={draft.description}
                  onChange={(event) => onChange({ description: event.target.value })}
                  maxLength={EVENT_CREATE_DESC_MAX}
                  rows={4}
                  placeholder="Une découverte lumineuse du patrimoine rémois."
                  className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 pr-16 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                />
                <CharCounter value={descCount} max={EVENT_CREATE_DESC_MAX} variant={variant} />
              </div>
              <p className="text-xs text-neutral-500">
                {isMobile ? EVENT_CREATE_MOBILE_DESC_HINT : EVENT_CREATE_DESC_HINT}
              </p>
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-neutral-900">
                {EVENT_CREATE_FIELD_VISIBILITY}
              </legend>
              <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "sm:grid-cols-2"}`}>
                <label
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                    draft.visibility === "public"
                      ? "border-yunicity-primary bg-[#EEF0FF]/60"
                      : "border-neutral-200"
                  } ${isMobile ? "flex-col items-center p-3 text-center" : ""}`}
                >
                  <input
                    type="radio"
                    name="event-visibility"
                    checked={draft.visibility === "public"}
                    onChange={() => onChange({ visibility: "public" })}
                    className="sr-only"
                  />
                  <Globe2
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      draft.visibility === "public" ? "text-yunicity-primary" : "text-neutral-400"
                    }`}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">
                      {EVENT_CREATE_VISIBILITY_PUBLIC}
                    </span>
                    {!isMobile ? (
                      <span className="mt-1 block text-xs leading-relaxed text-neutral-600">
                        {EVENT_CREATE_VISIBILITY_PUBLIC_DESC}
                      </span>
                    ) : null}
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                    draft.visibility === "private_invite"
                      ? "border-yunicity-primary bg-[#EEF0FF]/60"
                      : "border-neutral-200"
                  } ${isMobile ? "flex-col items-center p-3 text-center" : ""}`}
                >
                  <input
                    type="radio"
                    name="event-visibility"
                    checked={draft.visibility === "private_invite"}
                    onChange={() => onChange({ visibility: "private_invite" })}
                    className="sr-only"
                  />
                  <Lock
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      draft.visibility === "private_invite"
                        ? "text-yunicity-primary"
                        : "text-neutral-400"
                    }`}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">
                      {isMobile
                        ? EVENT_CREATE_MOBILE_VISIBILITY_PRIVATE
                        : EVENT_CREATE_VISIBILITY_PRIVATE}
                    </span>
                    {!isMobile ? (
                      <span className="mt-1 block text-xs leading-relaxed text-neutral-600">
                        {EVENT_CREATE_VISIBILITY_PRIVATE_DESC}
                      </span>
                    ) : null}
                  </span>
                </label>
              </div>
              {isMobile && draft.visibility === "public" ? (
                <p className="text-xs text-neutral-500">{EVENT_CREATE_VISIBILITY_PUBLIC_DESC}</p>
              ) : null}
            </fieldset>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{EVENT_CREATE_FIELD_RECURRING}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {isMobile ? EVENT_CREATE_MOBILE_RECURRING_HINT : EVENT_CREATE_RECURRING_HINT}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.isRecurring}
                onClick={() => onChange({ isRecurring: !draft.isRecurring })}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  draft.isRecurring ? "bg-yunicity-primary" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    draft.isRecurring ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === "schedule" ? (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{EVENT_CREATE_SCHEDULE_TITLE}</h2>
            <p className="mt-1 text-sm text-neutral-600">{EVENT_CREATE_SCHEDULE_BODY}</p>
          </div>
          <label className="block space-y-2 text-sm">
            <FieldLabel required>{EVENT_CREATE_FIELD_STARTS}</FieldLabel>
            <input
              type="datetime-local"
              value={draft.startsAt}
              onChange={(event) => onChange({ startsAt: event.target.value })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <FieldLabel required>{EVENT_CREATE_FIELD_LOCATION}</FieldLabel>
            <input
              value={draft.locationName}
              onChange={(event) => onChange({ locationName: event.target.value })}
              placeholder="Parvis Notre-Dame"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
        </div>
      ) : null}

      {step === "visuals" ? (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{EVENT_CREATE_VISUALS_TITLE}</h2>
            <p className="mt-1 text-sm text-neutral-600">{EVENT_CREATE_VISUALS_BODY}</p>
          </div>
          <label className="block space-y-2 text-sm">
            <FieldLabel>{EVENT_CREATE_FIELD_COVER}</FieldLabel>
            <input
              type="url"
              value={draft.coverImageUrl}
              onChange={(event) => onChange({ coverImageUrl: event.target.value })}
              placeholder="https://…"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
        </div>
      ) : null}

      {step === "practical" ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900">{EVENT_CREATE_PRACTICAL_TITLE}</h2>
          <p className="text-sm text-neutral-600">{EVENT_CREATE_PRACTICAL_BODY}</p>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900">{EVENT_CREATE_REVIEW_TITLE}</h2>
          <p className="text-sm text-neutral-600">{EVENT_CREATE_REVIEW_BODY}</p>
          <dl className="mt-2 space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/70 px-4 py-3 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-neutral-400">Titre</dt>
              <dd className="mt-1 font-medium text-neutral-900">{draft.title.trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-neutral-400">Catégorie</dt>
              <dd className="mt-1 font-medium text-neutral-900">
                {resolveEventCreateCategory(draft.categoryId)?.label ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-neutral-400">Lieu</dt>
              <dd className="mt-1 font-medium text-neutral-900">{draft.locationName.trim() || "—"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {!isMobile ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-6">
        {step === "essentials" ? (
          <Link
            href="/sortir"
            className="text-sm font-semibold text-yunicity-primary transition hover:underline"
          >
            {EVENT_CREATE_CANCEL}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
          >
            Retour
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            {EVENT_CREATE_SAVE_DRAFT}
          </button>
          {step === "review" ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {isSubmitting ? EVENT_CREATE_SUBMITTING : EVENT_CREATE_SUBMIT}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {activeStep?.nextCta ?? "Continuer"}
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
        </div>
      ) : null}
    </div>
  );
}

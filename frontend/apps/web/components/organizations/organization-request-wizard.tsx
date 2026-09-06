"use client";

import { OrganizationRequestMapPreview } from "@/components/organizations/organization-request-map-preview";
import type { Neighborhood } from "@yunicity/types";
import type {
  OrganizationRequestCategoryOption,
  OrganizationRequestDraft,
  OrganizationRequestStepId,
} from "@yunicity/utils";
import {
  ORG_REQUEST_BACK,
  ORG_REQUEST_CANCEL,
  ORG_REQUEST_DETAILS_TITLE,
  ORG_REQUEST_FIELD_ADDRESS,
  ORG_REQUEST_FIELD_CATEGORY,
  ORG_REQUEST_FIELD_CITY,
  ORG_REQUEST_FIELD_INSTAGRAM,
  ORG_REQUEST_FIELD_LONG_DESC,
  ORG_REQUEST_FIELD_NAME,
  ORG_REQUEST_FIELD_NEIGHBORHOOD,
  ORG_REQUEST_FIELD_PHONE,
  ORG_REQUEST_FIELD_POSTAL,
  ORG_REQUEST_FIELD_SHORT_DESC,
  ORG_REQUEST_FIELD_WEBSITE,
  ORG_REQUEST_IDENTITY_TITLE,
  ORG_REQUEST_NAME_PLACEHOLDER,
  ORG_REQUEST_NEIGHBORHOOD_PLACEHOLDER,
  ORG_REQUEST_NEXT,
  ORG_REQUEST_PHOTOS_BODY,
  ORG_REQUEST_PHOTOS_RULE,
  ORG_REQUEST_PHOTOS_TITLE,
  ORG_REQUEST_REVIEW_BODY,
  ORG_REQUEST_REVIEW_TITLE,
  ORG_REQUEST_SHORT_DESC_PLACEHOLDER,
  ORG_REQUEST_SUBMIT,
  ORG_REQUEST_SUBMITTING,
  ORG_REQUEST_TRUST_BODY,
  ORG_REQUEST_TRUST_TITLE,
  ORGANIZATION_REQUEST_CATEGORY_OPTIONS,
  ORG_REQUEST_SHORT_DESC_MAX,
} from "@yunicity/utils";
import { Crosshair, ShieldCheck } from "lucide-react";
import Link from "next/link";

type OrganizationRequestWizardProps = {
  variant?: "desktop" | "mobile";
  step: OrganizationRequestStepId;
  draft: OrganizationRequestDraft;
  neighborhoods: Neighborhood[];
  selectedCategory: OrganizationRequestCategoryOption | null;
  selectedNeighborhood: Neighborhood | null;
  validationMessage: string | null;
  isSubmitting: boolean;
  onChange: (patch: Partial<OrganizationRequestDraft>) => void;
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

export function OrganizationRequestWizard({
  variant = "desktop",
  step,
  draft,
  neighborhoods,
  selectedCategory,
  selectedNeighborhood,
  validationMessage,
  isSubmitting,
  onChange,
  onBack,
  onNext,
  onSubmit,
}: OrganizationRequestWizardProps) {
  const shortDescCount = draft.shortDescription.length;
  const isMobile = variant === "mobile";

  return (
    <div
      className={
        isMobile
          ? "rounded-xl border border-neutral-200/90 bg-white p-4 shadow-sm"
          : "rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8"
      }
    >
      {validationMessage ? (
        <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {validationMessage}
        </p>
      ) : null}

      {step === "identity" ? (
        <div>
          <h2
            className={
              isMobile ? "text-base font-bold text-neutral-900" : "text-xl font-bold text-neutral-900"
            }
          >
            {ORG_REQUEST_IDENTITY_TITLE}
          </h2>
          <div className={`mt-4 ${isMobile ? "space-y-5" : "mt-6 space-y-5"}`}>
            <label className="block space-y-1.5 text-sm">
              <FieldLabel required>{ORG_REQUEST_FIELD_NAME}</FieldLabel>
              <input
                value={draft.name}
                onChange={(event) => onChange({ name: event.target.value })}
                maxLength={160}
                placeholder={ORG_REQUEST_NAME_PLACEHOLDER}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
              />
            </label>

            <label className="block space-y-1.5 text-sm">
              <FieldLabel required>{ORG_REQUEST_FIELD_CATEGORY}</FieldLabel>
              <select
                value={draft.categoryId}
                onChange={(event) => onChange({ categoryId: event.target.value })}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
              >
                <option value="">Sélectionnez une catégorie</option>
                {ORGANIZATION_REQUEST_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm">
              <FieldLabel required>{ORG_REQUEST_FIELD_SHORT_DESC}</FieldLabel>
              <div className="relative">
                <textarea
                  value={draft.shortDescription}
                  onChange={(event) => onChange({ shortDescription: event.target.value })}
                  maxLength={ORG_REQUEST_SHORT_DESC_MAX}
                  rows={3}
                  placeholder={ORG_REQUEST_SHORT_DESC_PLACEHOLDER}
                  className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                />
                <span className="absolute bottom-2 right-3 text-xs text-neutral-400">
                  {shortDescCount}/{ORG_REQUEST_SHORT_DESC_MAX}
                </span>
              </div>
            </label>

            <label className="block space-y-1.5 text-sm">
              <FieldLabel required>{ORG_REQUEST_FIELD_CITY}</FieldLabel>
              <input
                value={draft.city}
                onChange={(event) => onChange({ city: event.target.value })}
                maxLength={128}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
              />
            </label>
          </div>
        </div>
      ) : null}

      {step === "address" ? (
        <div>
          <h2
            className={
              isMobile ? "text-base font-bold text-neutral-900" : "text-xl font-bold text-neutral-900"
            }
          >
            Adresse et carte
          </h2>
          <div className={`mt-4 ${isMobile ? "space-y-5" : "mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]"}`}>
            <div className="space-y-5">
              <label className="block space-y-1.5 text-sm">
                <FieldLabel required>{ORG_REQUEST_FIELD_ADDRESS}</FieldLabel>
                <div className="relative">
                  <input
                    value={draft.address}
                    onChange={(event) => onChange({ address: event.target.value })}
                    maxLength={255}
                    placeholder="Rechercher une adresse"
                    className="w-full rounded-xl border border-neutral-200 py-2.5 pl-3 pr-10 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                  />
                  <Crosshair
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                </div>
              </label>

              <label className="block space-y-1.5 text-sm">
                <FieldLabel>{ORG_REQUEST_FIELD_NEIGHBORHOOD}</FieldLabel>
                <select
                  value={draft.neighborhoodSlug}
                  onChange={(event) => onChange({ neighborhoodSlug: event.target.value })}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                >
                  <option value="">{ORG_REQUEST_NEIGHBORHOOD_PLACEHOLDER}</option>
                  {neighborhoods.map((neighborhood) => (
                    <option key={neighborhood.slug} value={neighborhood.slug}>
                      {neighborhood.display_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <OrganizationRequestMapPreview
              city={draft.city}
              latitude={selectedNeighborhood?.latitude}
              longitude={selectedNeighborhood?.longitude}
            />
          </div>
        </div>
      ) : null}

      {step === "practical" ? (
        <div className="space-y-5">
          <h2
            className={
              isMobile ? "text-base font-bold text-neutral-900" : "text-xl font-bold text-neutral-900"
            }
          >
            {ORG_REQUEST_DETAILS_TITLE}
          </h2>
          <label className="block space-y-1.5 text-sm">
            <FieldLabel>{ORG_REQUEST_FIELD_WEBSITE}</FieldLabel>
            <input
              value={draft.website}
              onChange={(event) => onChange({ website: event.target.value })}
              maxLength={2048}
              placeholder="https://…"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <FieldLabel>{ORG_REQUEST_FIELD_PHONE}</FieldLabel>
            <input
              value={draft.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
              maxLength={32}
              placeholder="03 26 …"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <FieldLabel>{ORG_REQUEST_FIELD_POSTAL}</FieldLabel>
            <input
              value={draft.postalCode}
              onChange={(event) => onChange({ postalCode: event.target.value })}
              maxLength={16}
              placeholder="51100"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <FieldLabel>{ORG_REQUEST_FIELD_INSTAGRAM}</FieldLabel>
            <input
              value={draft.instagram}
              onChange={(event) => onChange({ instagram: event.target.value })}
              maxLength={128}
              placeholder="@compte ou lien"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <FieldLabel>{ORG_REQUEST_FIELD_LONG_DESC}</FieldLabel>
            <textarea
              value={draft.longDescription}
              onChange={(event) => onChange({ longDescription: event.target.value })}
              maxLength={1000}
              rows={4}
              className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
        </div>
      ) : null}

      {step === "visuals" ? (
        <div className="space-y-4">
          <h2
            className={
              isMobile ? "text-base font-bold text-neutral-900" : "text-xl font-bold text-neutral-900"
            }
          >
            {ORG_REQUEST_PHOTOS_TITLE}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">{ORG_REQUEST_PHOTOS_BODY}</p>
          <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            {ORG_REQUEST_PHOTOS_RULE}
          </p>
        </div>
      ) : null}

      {step === "verification" ? (
        <div className="space-y-4">
          <h2
            className={
              isMobile ? "text-base font-bold text-neutral-900" : "text-xl font-bold text-neutral-900"
            }
          >
            {ORG_REQUEST_REVIEW_TITLE}
          </h2>
          <p className="text-sm text-neutral-600">{ORG_REQUEST_REVIEW_BODY}</p>
          <dl className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4">
            <ReviewRow label="Nom" value={draft.name} />
            <ReviewRow label="Catégorie" value={selectedCategory?.label} />
            <ReviewRow label="Adresse" value={draft.address} />
            <ReviewRow label="Ville" value={draft.city} />
            <ReviewRow label="Quartier" value={selectedNeighborhood?.display_name} />
            <ReviewRow label="Description" value={draft.shortDescription} />
            <ReviewRow label="Site web" value={draft.website} />
            <ReviewRow label="Téléphone" value={draft.phone} />
            <ReviewRow label="Code postal" value={draft.postalCode} />
          </dl>
          <div className="rounded-2xl bg-[#EEF0FF] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 shrink-0 text-yunicity-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{ORG_REQUEST_TRUST_TITLE}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{ORG_REQUEST_TRUST_BODY}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={
          isMobile
            ? "mt-6 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4"
            : "mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-6"
        }
      >
        {step === "identity" ? (
          <Link
            href="/places"
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            {ORG_REQUEST_CANCEL}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            {ORG_REQUEST_BACK}
          </button>
        )}

        {step === "verification" ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? ORG_REQUEST_SUBMITTING : ORG_REQUEST_SUBMIT}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            {ORG_REQUEST_NEXT}
            <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  );
}

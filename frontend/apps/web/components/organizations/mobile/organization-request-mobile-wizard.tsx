"use client";

import { OrganizationRequestMapPreview } from "@/components/organizations/organization-request-map-preview";
import { useAuth } from "@/lib/auth/auth-provider";
import type { Neighborhood } from "@yunicity/types";
import type {
  OrganizationRequestCategoryOption,
  OrganizationRequestDraft,
  OrganizationRequestStepId,
} from "@yunicity/utils";
import {
  ORG_REQUEST_ADDRESS_BODY,
  ORG_REQUEST_ADDRESS_PLACEHOLDER,
  ORG_REQUEST_ADDRESS_TITLE,
  ORG_REQUEST_CHANGE_PROFILE,
  ORG_REQUEST_DETAILS_BODY,
  ORG_REQUEST_DETAILS_TITLE,
  ORG_REQUEST_FIELD_ADDRESS,
  ORG_REQUEST_FIELD_CATEGORY,
  ORG_REQUEST_FIELD_CITY,
  ORG_REQUEST_FIELD_CITY_HINT,
  ORG_REQUEST_FIELD_INSTAGRAM,
  ORG_REQUEST_FIELD_LONG_DESC,
  ORG_REQUEST_FIELD_NAME,
  ORG_REQUEST_FIELD_NEIGHBORHOOD,
  ORG_REQUEST_FIELD_PHONE,
  ORG_REQUEST_FIELD_PLACE_TYPE,
  ORG_REQUEST_FIELD_POSTAL,
  ORG_REQUEST_FIELD_PROPOSER,
  ORG_REQUEST_FIELD_SHORT_DESC,
  ORG_REQUEST_FIELD_WEBSITE,
  ORG_REQUEST_IDENTITY_BODY,
  ORG_REQUEST_IDENTITY_NEXT_HINT,
  ORG_REQUEST_IDENTITY_TITLE,
  ORG_REQUEST_NAME_MAX,
  ORG_REQUEST_NAME_PLACEHOLDER,
  ORG_REQUEST_NEIGHBORHOOD_PLACEHOLDER,
  ORG_REQUEST_OFFICIAL_REP,
  ORG_REQUEST_OFFICIAL_REP_HINT,
  ORG_REQUEST_PHOTOS_BODY,
  ORG_REQUEST_PHOTOS_RULE,
  ORG_REQUEST_PHOTOS_TITLE,
  ORG_REQUEST_REVIEW_BODY,
  ORG_REQUEST_REVIEW_TITLE,
  ORG_REQUEST_SHORT_DESC_MAX,
  ORG_REQUEST_SHORT_DESC_PLACEHOLDER,
  ORG_REQUEST_TRUST_BODY,
  ORG_REQUEST_TRUST_TITLE,
  ORGANIZATION_REQUEST_CATEGORY_OPTIONS,
  ORGANIZATION_REQUEST_PLACE_TYPES,
  defaultOrganizationRequestPlaceTypeId,
} from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  ChevronDown,
  Crosshair,
  Info,
  Landmark,
  Leaf,
  MapPin,
  MoreHorizontal,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";

const CATEGORY_ICON = {
  cultural: Landmark,
  nature: Leaf,
  cafe_restaurant: UtensilsCrossed,
  commerce: ShoppingBag,
  leisure: Trophy,
  services: Briefcase,
  other: MoreHorizontal,
} as const;

type OrganizationRequestMobileWizardProps = {
  step: OrganizationRequestStepId;
  draft: OrganizationRequestDraft;
  neighborhoods: Neighborhood[];
  selectedCategory: OrganizationRequestCategoryOption | null;
  selectedNeighborhood: Neighborhood | null;
  validationMessage: string | null;
  onChange: (patch: Partial<OrganizationRequestDraft>) => void;
};

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-neutral-900">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
  );
}

function ReviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-3 last:border-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="text-sm text-neutral-800">{value}</dd>
    </div>
  );
}

/** Formulaire mobile par étape — sans footer (action bar sticky). */
export function OrganizationRequestMobileWizard({
  step,
  draft,
  neighborhoods,
  selectedCategory,
  selectedNeighborhood,
  validationMessage,
  onChange,
}: OrganizationRequestMobileWizardProps) {
  const { user } = useAuth();
  const nameCount = draft.name.length;
  const shortDescCount = draft.shortDescription.length;
  const placeTypes = ORGANIZATION_REQUEST_PLACE_TYPES[draft.categoryId] ?? [];
  const proposerLabel = user?.full_name?.trim() || user?.email?.split("@")[0] || "Citoyen";
  const proposerInitial = proposerLabel.slice(0, 1).toUpperCase();

  return (
    <div
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-org-request-mobile-wizard=""
    >
      {validationMessage ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {validationMessage}
        </p>
      ) : null}

      {step === "identity" ? (
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{ORG_REQUEST_IDENTITY_TITLE}</h2>
          <p className="mt-1 text-sm text-neutral-600">{ORG_REQUEST_IDENTITY_BODY}</p>

          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <FieldLabel required>{ORG_REQUEST_FIELD_PROPOSER}</FieldLabel>
                <button
                  type="button"
                  disabled
                  className="text-sm font-semibold text-yunicity-primary"
                  title="Bientôt disponible"
                >
                  {ORG_REQUEST_CHANGE_PROFILE}
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-sm font-bold text-white">
                  {proposerInitial}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-800">
                  {proposerLabel}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </div>
            </div>

            <label className="block space-y-2">
              <FieldLabel required>{ORG_REQUEST_FIELD_NAME}</FieldLabel>
              <div className="relative">
                <input
                  value={draft.name}
                  onChange={(event) => onChange({ name: event.target.value })}
                  maxLength={ORG_REQUEST_NAME_MAX}
                  placeholder={ORG_REQUEST_NAME_PLACEHOLDER}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 pl-3 pr-16 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-neutral-400">
                  {nameCount} / {ORG_REQUEST_NAME_MAX}
                </span>
              </div>
            </label>

            <label className="block space-y-2">
              <FieldLabel required>{ORG_REQUEST_FIELD_CITY}</FieldLabel>
              <div className="relative">
                <MapPin
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <select
                  value={draft.city}
                  onChange={(event) => onChange({ city: event.target.value })}
                  className="w-full appearance-none rounded-xl border border-neutral-200 py-2.5 pl-9 pr-10 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                >
                  <option value="Reims">Reims</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
              </div>
              <p className="text-xs leading-snug text-neutral-500">{ORG_REQUEST_FIELD_CITY_HINT}</p>
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-neutral-900">
                {ORG_REQUEST_FIELD_CATEGORY}
                <span className="text-red-500"> *</span>
              </legend>
              <div className="grid grid-cols-2 gap-2.5">
                {ORGANIZATION_REQUEST_CATEGORY_OPTIONS.map((option) => {
                  const Icon = CATEGORY_ICON[option.id as keyof typeof CATEGORY_ICON] ?? Building2;
                  const selected = draft.categoryId === option.id;
                  const isOther = option.id === "other";
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          categoryId: option.id,
                          placeTypeId: defaultOrganizationRequestPlaceTypeId(option.id),
                        })
                      }
                      className={`flex min-h-[4.25rem] items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition ${
                        isOther ? "col-span-2" : ""
                      } ${
                        selected
                          ? "border-yunicity-primary bg-[#EEF0FF] shadow-[inset_0_0_0_1px_rgba(59,75,230,0.2)]"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${
                          selected ? "text-yunicity-primary" : "text-neutral-400"
                        }`}
                        aria-hidden
                      />
                      <span
                        className={`text-xs font-semibold leading-snug ${
                          selected ? "text-yunicity-primary" : "text-neutral-800"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block space-y-2">
              <FieldLabel>{ORG_REQUEST_FIELD_PLACE_TYPE}</FieldLabel>
              <div className="relative">
                <select
                  value={draft.placeTypeId}
                  onChange={(event) => onChange({ placeTypeId: event.target.value })}
                  disabled={!draft.categoryId}
                  className="w-full appearance-none rounded-xl border border-neutral-200 px-3 py-2.5 pr-10 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary disabled:bg-neutral-50"
                >
                  <option value="">Sélectionnez un type</option>
                  {placeTypes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
              </div>
            </label>

            <label className="block space-y-2">
              <FieldLabel required>{ORG_REQUEST_FIELD_SHORT_DESC}</FieldLabel>
              <div className="relative">
                <textarea
                  value={draft.shortDescription}
                  onChange={(event) => onChange({ shortDescription: event.target.value })}
                  maxLength={ORG_REQUEST_SHORT_DESC_MAX}
                  rows={4}
                  placeholder={ORG_REQUEST_SHORT_DESC_PLACEHOLDER}
                  className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 pb-8 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                />
                <span className="pointer-events-none absolute bottom-3 right-3 text-xs tabular-nums text-neutral-400">
                  {shortDescCount} / {ORG_REQUEST_SHORT_DESC_MAX}
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-neutral-200 px-4 py-3">
              <input
                type="checkbox"
                checked={draft.isOfficialRepresentative}
                onChange={(event) => onChange({ isOfficialRepresentative: event.target.checked })}
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-neutral-900">
                  {ORG_REQUEST_OFFICIAL_REP}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  {ORG_REQUEST_OFFICIAL_REP_HINT}
                </span>
              </span>
            </label>

            <div className="rounded-xl bg-[#EEF0FF] px-4 py-3">
              <p className="inline-flex items-start gap-2 text-sm text-neutral-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                {ORG_REQUEST_IDENTITY_NEXT_HINT}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {step === "address" ? (
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{ORG_REQUEST_ADDRESS_TITLE}</h2>
          <p className="mt-1 text-sm text-neutral-600">{ORG_REQUEST_ADDRESS_BODY}</p>
          <div className="mt-5 space-y-5">
            <label className="block space-y-2">
              <FieldLabel required>{ORG_REQUEST_FIELD_ADDRESS}</FieldLabel>
              <div className="relative">
                <input
                  value={draft.address}
                  onChange={(event) => onChange({ address: event.target.value })}
                  maxLength={255}
                  placeholder={ORG_REQUEST_ADDRESS_PLACEHOLDER}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 pl-3 pr-10 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
                />
                <Crosshair
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
              </div>
            </label>
            <label className="block space-y-2">
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
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{ORG_REQUEST_DETAILS_TITLE}</h2>
            <p className="mt-1 text-sm text-neutral-600">{ORG_REQUEST_DETAILS_BODY}</p>
          </div>
          <label className="block space-y-2">
            <FieldLabel>{ORG_REQUEST_FIELD_WEBSITE}</FieldLabel>
            <input
              value={draft.website}
              onChange={(event) => onChange({ website: event.target.value })}
              maxLength={2048}
              placeholder="https://…"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-2">
            <FieldLabel>{ORG_REQUEST_FIELD_PHONE}</FieldLabel>
            <input
              value={draft.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
              maxLength={32}
              placeholder="03 26 …"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-2">
            <FieldLabel>{ORG_REQUEST_FIELD_POSTAL}</FieldLabel>
            <input
              value={draft.postalCode}
              onChange={(event) => onChange({ postalCode: event.target.value })}
              maxLength={16}
              placeholder="51100"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-2">
            <FieldLabel>{ORG_REQUEST_FIELD_INSTAGRAM}</FieldLabel>
            <input
              value={draft.instagram}
              onChange={(event) => onChange({ instagram: event.target.value })}
              maxLength={128}
              placeholder="@compte ou lien"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>
          <label className="block space-y-2">
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
          <h2 className="text-lg font-bold text-neutral-900">{ORG_REQUEST_PHOTOS_TITLE}</h2>
          <p className="text-sm leading-relaxed text-neutral-600">{ORG_REQUEST_PHOTOS_BODY}</p>
          <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            {ORG_REQUEST_PHOTOS_RULE}
          </p>
        </div>
      ) : null}

      {step === "verification" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-900">{ORG_REQUEST_REVIEW_TITLE}</h2>
          <p className="text-sm text-neutral-600">{ORG_REQUEST_REVIEW_BODY}</p>
          <dl className="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4">
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
          <div className="rounded-2xl bg-[#EEF0FF] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{ORG_REQUEST_TRUST_TITLE}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{ORG_REQUEST_TRUST_BODY}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

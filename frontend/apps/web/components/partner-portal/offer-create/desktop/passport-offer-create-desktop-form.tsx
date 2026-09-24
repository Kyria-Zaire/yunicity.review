"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { OrganizationMeItem, PartnerOfferType, PartnerPublic } from "@yunicity/types";
import type { PassportOfferCreateDraft, PassportOfferCreateTierScope } from "@yunicity/utils";
import {
  PASSPORT_OFFER_CREATE_COVER_CHANGE,
  PASSPORT_OFFER_CREATE_COVER_HINT,
  PASSPORT_OFFER_CREATE_DESC_COUNTER,
  PASSPORT_OFFER_CREATE_DESC_RECOMMENDED_MAX,
  PASSPORT_OFFER_CREATE_FIELD_CATEGORY,
  PASSPORT_OFFER_CREATE_FIELD_CONDITIONS,
  PASSPORT_OFFER_CREATE_FIELD_DESCRIPTION,
  PASSPORT_OFFER_CREATE_FIELD_END,
  PASSPORT_OFFER_CREATE_FIELD_PARTNER,
  PASSPORT_OFFER_CREATE_FIELD_RULE,
  PASSPORT_OFFER_CREATE_FIELD_START,
  PASSPORT_OFFER_CREATE_FIELD_TIMEZONE,
  PASSPORT_OFFER_CREATE_FIELD_TITLE,
  PASSPORT_OFFER_CREATE_FIELD_TIERS,
  PASSPORT_OFFER_CREATE_FIELD_VALIDATION,
  PASSPORT_OFFER_CREATE_FIELD_VALUE,
  PASSPORT_OFFER_CREATE_FLASH_INFO,
  PASSPORT_OFFER_CREATE_FLASH_INFO_LONG,
  PASSPORT_OFFER_CREATE_NON_CUMULATIVE,
  PASSPORT_OFFER_CREATE_PARTNER_LOCKED,
  PASSPORT_OFFER_CREATE_PASSPORT_RULE,
  PASSPORT_OFFER_CREATE_QR_HIDDEN_HINT,
  PASSPORT_OFFER_CREATE_SECTION_BENEFIT,
  PASSPORT_OFFER_CREATE_SECTION_ELIGIBILITY,
  PASSPORT_OFFER_CREATE_SECTION_GENERAL,
  PASSPORT_OFFER_CREATE_SECTION_VALIDITY,
  PASSPORT_OFFER_CREATE_SINGLE_USE,
  PASSPORT_OFFER_CREATE_SAVE_DRAFT,
  PASSPORT_OFFER_CREATE_SUBMIT,
  PASSPORT_OFFER_CREATE_SUBMITTING,
  PASSPORT_OFFER_CREATE_SAVING,
  PASSPORT_OFFER_CREATE_TIER_ALL,
  PASSPORT_OFFER_CREATE_TIER_AMBASSADOR,
  PASSPORT_OFFER_CREATE_TIER_EXPLORER,
  PASSPORT_OFFER_CREATE_VALIDATION_QR,
  partnerOfferTypeLabel,
} from "@yunicity/utils";
import { Camera, CheckCircle2, Clock3, Lock, Shield, UtensilsCrossed } from "lucide-react";
import { useRef } from "react";

const OFFER_TYPES: PartnerOfferType[] = [
  "gift",
  "drink",
  "discount",
  "event_access",
  "vip",
  "custom",
];

type PassportOfferCreateDesktopFormProps = {
  variant?: "desktop" | "medium" | "mobile";
  draft: PassportOfferCreateDraft;
  organization: OrganizationMeItem;
  partner: PartnerPublic | null;
  onChange: (patch: Partial<PassportOfferCreateDraft>) => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  isSaving?: boolean;
  isSubmitting?: boolean;
};

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-neutral-900">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </span>
  );
}

function FormSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function PassportOfferCreateDesktopForm({
  variant = "desktop",
  draft,
  organization,
  partner,
  onChange,
  onSaveDraft,
  onSubmit,
  isSaving = false,
  isSubmitting = false,
}: PassportOfferCreateDesktopFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const partnerLocation = partner?.address?.split(",")[0]?.trim() || organization.city;
  const isMedium = variant === "medium";
  const isMobile = variant === "mobile";
  const coverHeight = isMobile ? "h-36" : isMedium ? "h-40" : "h-52";

  return (
    <div className="space-y-6" data-passport-offer-create-form="" data-variant={variant}>
      <FormSection id="passport-offer-create-general" title={PASSPORT_OFFER_CREATE_SECTION_GENERAL}>
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
            <CulturalImage
              src={draft.coverImageUrl || partner?.cover_image_url || null}
              alt=""
              placeName={organization.name}
              className={`w-full object-cover ${coverHeight}`}
              sizes="800px"
              overlay={false}
              showFallbackCaption={false}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-white"
            >
              <Camera className="h-4 w-4" aria-hidden />
              {PASSPORT_OFFER_CREATE_COVER_CHANGE}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                onChange({ coverImageUrl: URL.createObjectURL(file) });
              }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">{PASSPORT_OFFER_CREATE_COVER_HINT}</p>
        </div>

        {isMedium ? (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_TITLE}</FieldLabel>
                <input
                  value={draft.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                  placeholder="Avantage déjeuner chez Pittaya"
                />
              </label>
              <label className="block">
                <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_VALUE}</FieldLabel>
                <input
                  value={draft.valueLabel}
                  onChange={(e) => onChange({ valueLabel: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                  placeholder="Un dessert offert pour l'achat d'un plat"
                />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
              <label className="block">
                <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_DESCRIPTION}</FieldLabel>
                <textarea
                  value={draft.description}
                  onChange={(e) => onChange({ description: e.target.value })}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                  placeholder="Présentez votre Passport au moment de la commande…"
                />
              </label>
              <label className="block">
                <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_CATEGORY}</FieldLabel>
                <div className="relative mt-2">
                  <UtensilsCrossed
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500"
                    aria-hidden
                  />
                  <select
                    value={draft.offerType}
                    onChange={(e) => onChange({ offerType: e.target.value as PartnerOfferType })}
                    className="w-full appearance-none rounded-xl border border-neutral-200 py-2.5 pl-10 pr-3 text-sm"
                  >
                    {OFFER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {partnerOfferTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
          </>
        ) : (
          <>
            <label className="block">
              <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_TITLE}</FieldLabel>
              <input
                value={draft.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                placeholder="Avantage déjeuner chez Pittaya"
              />
            </label>
            <label className="block">
              <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_VALUE}</FieldLabel>
              <input
                value={draft.valueLabel}
                onChange={(e) => onChange({ valueLabel: e.target.value })}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                placeholder="Un dessert offert pour l'achat d'un plat"
              />
            </label>
            <label className="block">
              <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_DESCRIPTION}</FieldLabel>
              <textarea
                value={draft.description}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={isMobile ? 5 : 4}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                placeholder="Présentez votre Passport au moment de la commande…"
              />
              {isMobile ? (
                <p className="mt-1.5 text-right text-xs tabular-nums text-neutral-400">
                  {PASSPORT_OFFER_CREATE_DESC_COUNTER(
                    draft.description.trim().length,
                    PASSPORT_OFFER_CREATE_DESC_RECOMMENDED_MAX,
                  )}
                </p>
              ) : null}
            </label>
            <label className="block">
              <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_CATEGORY}</FieldLabel>
              <div className="relative mt-2">
                <UtensilsCrossed
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500"
                  aria-hidden
                />
                <select
                  value={draft.offerType}
                  onChange={(e) => onChange({ offerType: e.target.value as PartnerOfferType })}
                  className="w-full appearance-none rounded-xl border border-neutral-200 py-2.5 pl-10 pr-3 text-sm"
                >
                  {OFFER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {partnerOfferTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </>
        )}

        <div>
          <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_PARTNER}</FieldLabel>
          <div className="relative mt-2">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              readOnly
              value={`${organization.name} · ${partnerLocation}`}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm text-neutral-700"
            />
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">{PASSPORT_OFFER_CREATE_PARTNER_LOCKED}</p>
        </div>
      </FormSection>

      <FormSection id="passport-offer-create-benefit" title={PASSPORT_OFFER_CREATE_SECTION_BENEFIT}>
        <div className={isMedium ? "grid gap-5 md:grid-cols-2" : "space-y-5"}>
          <div className="space-y-3">
            <label className="flex items-start gap-3 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={draft.singleUsePerHolder}
                onChange={(e) => onChange({ singleUsePerHolder: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-neutral-300"
              />
              {PASSPORT_OFFER_CREATE_SINGLE_USE}
            </label>
            <label className="flex items-start gap-3 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={draft.nonCumulative}
                onChange={(e) => onChange({ nonCumulative: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-neutral-300"
              />
              {PASSPORT_OFFER_CREATE_NON_CUMULATIVE}
            </label>
          </div>
          <label className="block">
            <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_CONDITIONS}</FieldLabel>
            <textarea
              value={draft.conditions}
              onChange={(e) => onChange({ conditions: e.target.value })}
              rows={isMedium ? 4 : 3}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              placeholder="Valable sur place, selon les horaires et conditions du partenaire."
            />
          </label>
        </div>
      </FormSection>

      <FormSection id="passport-offer-create-validity" title={PASSPORT_OFFER_CREATE_SECTION_VALIDITY}>
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-3"}`}>
          <label className="block">
            <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_START}</FieldLabel>
            <input
              type="datetime-local"
              value={draft.validFrom}
              onChange={(e) => onChange({ validFrom: e.target.value })}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_END}</FieldLabel>
            <input
              type="datetime-local"
              value={draft.validUntil}
              onChange={(e) => onChange({ validUntil: e.target.value })}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_TIMEZONE}</FieldLabel>
            <select
              value={draft.timezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
            >
              <option value="Europe/Paris">Europe/Paris</option>
            </select>
          </label>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-[#EEF0FF] px-4 py-3 text-sm text-neutral-700">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          <p>{isMobile ? PASSPORT_OFFER_CREATE_FLASH_INFO_LONG : PASSPORT_OFFER_CREATE_FLASH_INFO}</p>
        </div>
      </FormSection>

      <FormSection
        id="passport-offer-create-eligibility"
        title={PASSPORT_OFFER_CREATE_SECTION_ELIGIBILITY}
      >
        {isMobile ? (
          <>
            <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_RULE}</FieldLabel>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                <p className="text-sm font-semibold text-neutral-900">
                  {PASSPORT_OFFER_CREATE_PASSPORT_RULE}
                </p>
              </div>
              <span
                className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-yunicity-primary"
                aria-hidden
              >
                <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {PASSPORT_OFFER_CREATE_PASSPORT_RULE}
              </p>
            </div>
            <span
              className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-yunicity-primary"
              aria-hidden
            >
              <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
            </span>
          </div>
        )}

        <div>
          <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_TIERS}</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["all", PASSPORT_OFFER_CREATE_TIER_ALL],
                ["basic", PASSPORT_OFFER_CREATE_TIER_EXPLORER],
                ["silver", PASSPORT_OFFER_CREATE_TIER_AMBASSADOR],
              ] as const
            ).map(([value, label]) => {
              const active = draft.tierScope === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ tierScope: value as PassportOfferCreateTierScope })}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                      : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel required>{PASSPORT_OFFER_CREATE_FIELD_VALIDATION}</FieldLabel>
          <div className="relative mt-2">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              readOnly
              value={PASSPORT_OFFER_CREATE_VALIDATION_QR}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm text-neutral-700"
            />
          </div>
          {isMobile ? (
            <p className="mt-2 inline-flex items-center gap-2 text-xs text-neutral-500">
              <Shield className="h-3.5 w-3.5 shrink-0 text-yunicity-primary" aria-hidden />
              {PASSPORT_OFFER_CREATE_QR_HIDDEN_HINT}
            </p>
          ) : null}
        </div>
      </FormSection>

      {!isMobile ? <div id="passport-offer-create-review" className="scroll-mt-24 pb-4" /> : null}

      {isMedium && onSaveDraft && onSubmit ? (
        <div className="flex flex-wrap items-center justify-center gap-3 pb-2">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving || isSubmitting}
            className="min-w-[12rem] rounded-xl border border-yunicity-primary bg-white px-5 py-3 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] disabled:opacity-50"
          >
            {isSaving ? PASSPORT_OFFER_CREATE_SAVING : PASSPORT_OFFER_CREATE_SAVE_DRAFT}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || isSubmitting}
            className="min-w-[12rem] rounded-xl bg-yunicity-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? PASSPORT_OFFER_CREATE_SUBMITTING : PASSPORT_OFFER_CREATE_SUBMIT}
          </button>
        </div>
      ) : null}
    </div>
  );
}

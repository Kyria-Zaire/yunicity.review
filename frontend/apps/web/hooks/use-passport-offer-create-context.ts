"use client";

import { usePartnerPortalContext } from "@/hooks/use-partner-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { PassportOfferCreateDraft, PassportOfferCreateStepId } from "@yunicity/utils";
import {
  PASSPORT_OFFER_CREATE_DRAFT_SAVED,
  PASSPORT_OFFER_CREATE_DRAFT_STORAGE_KEY,
  PASSPORT_OFFER_CREATE_ERROR,
  buildPartnerPortalOffersHref,
  buildPassportOfferCreatePayload,
  createEmptyPassportOfferCreateDraft,
  resolvePartnerImage,
  validatePassportOfferCreateDraft,
} from "@yunicity/utils";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function readStoredDraft(organizationId: string, coverImageUrl: string): PassportOfferCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PASSPORT_OFFER_CREATE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PassportOfferCreateDraft>;
    if (parsed.organizationId && parsed.organizationId !== organizationId) {
      return null;
    }
    return { ...createEmptyPassportOfferCreateDraft(organizationId, coverImageUrl), ...parsed };
  } catch {
    return null;
  }
}

export function usePassportOfferCreateContext() {
  const api = useYunicityApi();
  const router = useRouter();
  const ctx = usePartnerPortalContext();

  const defaultCover = useMemo(() => {
    if (!ctx.partner) return "";
    return (
      resolvePartnerImage(
        {
          cover_image_url: ctx.partner.cover_image_url,
          logo_url: ctx.partner.logo_url,
          category: ctx.partner.category,
        },
        "hero",
      ) ?? ""
    );
  }, [ctx.partner]);

  const [draft, setDraft] = useState<PassportOfferCreateDraft>(() =>
    createEmptyPassportOfferCreateDraft(ctx.organization?.id ?? "", defaultCover),
  );
  const [step, setStep] = useState<PassportOfferCreateStepId>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!ctx.organization || ctx.isLoading) return;
    const stored = readStoredDraft(ctx.organization.id, defaultCover);
    setDraft(
      stored ?? createEmptyPassportOfferCreateDraft(ctx.organization.id, defaultCover),
    );
    setHydrated(true);
  }, [ctx.organization, ctx.isLoading, defaultCover]);

  const updateDraft = useCallback((patch: Partial<PassportOfferCreateDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setValidationMessage(null);
    setError(null);
    setDraftSavedMessage(null);
  }, []);

  const persistDraftLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(PASSPORT_OFFER_CREATE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setDraftSavedMessage(PASSPORT_OFFER_CREATE_DRAFT_SAVED);
  }, [draft]);

  const persistDraftRemote = useCallback(async () => {
    if (!ctx.organization || !ctx.canManage) {
      return null;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = buildPassportOfferCreatePayload({
        ...draft,
        organizationId: ctx.organization.id,
      });
      const saved = draft.offerId
        ? await api.partnerOffers.updateOffer(draft.offerId, {
            title: payload.title,
            description: payload.description,
            offer_type: payload.offer_type,
            valid_from: payload.valid_from,
            valid_until: payload.valid_until,
            redemption_limit: payload.redemption_limit,
            tier_code_required: payload.tier_code_required,
            is_flash: payload.is_flash,
            flash_ends_at: payload.flash_ends_at,
          })
        : await api.partnerOffers.createOffer(payload);
      setDraft((prev) => ({ ...prev, offerId: saved.id, organizationId: ctx.organization!.id }));
      persistDraftLocal();
      return saved;
    } catch (err) {
      setError(isAuthError(err) ? err.message : PASSPORT_OFFER_CREATE_ERROR);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [api.partnerOffers, ctx.canManage, ctx.organization, draft, persistDraftLocal]);

  const saveDraft = useCallback(async () => {
    await persistDraftRemote();
  }, [persistDraftRemote]);

  const cancel = useCallback(() => {
    router.push(buildPartnerPortalOffersHref());
  }, [router]);

  const scrollToStep = useCallback((nextStep: PassportOfferCreateStepId) => {
    setStep(nextStep);
    const sectionId = {
      general: "passport-offer-create-general",
      benefit: "passport-offer-create-benefit",
      validity: "passport-offer-create-validity",
      eligibility: "passport-offer-create-eligibility",
      review: "passport-offer-create-review",
    }[nextStep];
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const submit = useCallback(async () => {
    const validation = validatePassportOfferCreateDraft(draft);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      if (validation.step) scrollToStep(validation.step);
      return null;
    }
    if (!ctx.canManage) return null;

    setIsSubmitting(true);
    setError(null);
    try {
      const saved = await persistDraftRemote();
      if (!saved) return null;
      const offerId = saved.id ?? draft.offerId;
      if (!offerId) return null;
      await api.partnerOffers.submitOffer(offerId);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(PASSPORT_OFFER_CREATE_DRAFT_STORAGE_KEY);
      }
      router.push(buildPartnerPortalOffersHref());
      return saved;
    } catch (err) {
      setError(isAuthError(err) ? err.message : PASSPORT_OFFER_CREATE_ERROR);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [api.partnerOffers, ctx.canManage, draft, persistDraftRemote, router, scrollToStep]);

  return {
    ctx,
    draft,
    step,
    loading: ctx.isLoading || !hydrated,
    isSubmitting,
    isSaving,
    error,
    validationMessage,
    draftSavedMessage,
    updateDraft,
    saveDraft,
    submit,
    cancel,
    setStep: scrollToStep,
  };
}

export type PassportOfferCreateContextValue = ReturnType<typeof usePassportOfferCreateContext>;

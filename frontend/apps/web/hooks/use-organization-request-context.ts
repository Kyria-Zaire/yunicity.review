"use client";

import type { Neighborhood, OrganizationType } from "@yunicity/types";
import type {
  OrganizationRequestDraft,
  OrganizationRequestStepId,
} from "@yunicity/utils";
import {
  clearOrganizationRequestDraft,
  createEmptyOrganizationRequestDraft,
  loadOrganizationRequestDraft,
  nextOrganizationRequestStep,
  ORGANIZATION_REQUEST_CATEGORY_OPTIONS,
  persistOrganizationRequestDraft,
  previousOrganizationRequestStep,
  resolveOrganizationRequestCategory,
  validateOrganizationRequestDraft,
  validateOrganizationRequestStep,
} from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

const ORGANIZATION_TYPES = new Set<string>([
  "commerce",
  "association",
  "school",
  "freelance",
  "public_agency",
  "creator",
  "other",
]);

function resolveIntentCategoryId(typeParam: string | null): string | null {
  if (!typeParam || !ORGANIZATION_TYPES.has(typeParam)) return null;
  const exact = ORGANIZATION_REQUEST_CATEGORY_OPTIONS.find(
    (option) => option.id === typeParam,
  );
  if (exact) return exact.id;
  const match = ORGANIZATION_REQUEST_CATEGORY_OPTIONS.find(
    (option) => option.type === (typeParam as OrganizationType),
  );
  return match?.id ?? null;
}

function draftHasContent(draft: OrganizationRequestDraft): boolean {
  return Boolean(
    draft.name.trim() ||
      draft.categoryId.trim() ||
      draft.address.trim() ||
      draft.shortDescription.trim() ||
      draft.website.trim() ||
      draft.phone.trim(),
  );
}

export function useOrganizationRequestContext() {
  const api = useYunicityApi();
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const intentType = searchParams.get("type");
  const [draft, setDraft] = useState<OrganizationRequestDraft>(() =>
    createEmptyOrganizationRequestDraft(user?.city?.trim() || DEFAULT_CITY),
  );
  const [step, setStep] = useState<OrganizationRequestStepId>("identity");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);

  useEffect(() => {
    const stored = loadOrganizationRequestDraft();
    if (stored) {
      setDraft(stored.draft);
      setStep(stored.step);
      setDraftSavedVisible(true);
    }
  }, []);

  useEffect(() => {
    const categoryId = resolveIntentCategoryId(intentType);
    if (!categoryId) return;
    setDraft((prev) => (prev.categoryId ? prev : { ...prev, categoryId }));
  }, [intentType]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const city = user?.city?.trim() || DEFAULT_CITY;
        const data = await api.neighborhoods.listNeighborhoods({ city, page_size: 48 });
        if (!cancelled) {
          setNeighborhoods(data.items.filter((item) => item.is_active));
          setDraft((prev) => ({ ...prev, city }));
        }
      } catch {
        if (!cancelled) setNeighborhoods([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [api, user?.city]);

  const selectedNeighborhood = useMemo(
    () => neighborhoods.find((item) => item.slug === draft.neighborhoodSlug) ?? null,
    [draft.neighborhoodSlug, neighborhoods],
  );

  const selectedCategory = useMemo(
    () => resolveOrganizationRequestCategory(draft.categoryId),
    [draft.categoryId],
  );

  const hasDraftContent = useMemo(() => draftHasContent(draft), [draft]);

  const persistDraft = useCallback(() => {
    persistOrganizationRequestDraft(draft, step);
    setDraftSavedVisible(true);
  }, [draft, step]);

  const updateDraft = useCallback((patch: Partial<OrganizationRequestDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setValidationMessage(null);
    setError(null);
  }, []);

  const goNext = useCallback(() => {
    const validation = validateOrganizationRequestStep(step, draft);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return false;
    }
    const next = nextOrganizationRequestStep(step);
    if (next) {
      setStep(next);
      persistOrganizationRequestDraft(draft, next);
      setDraftSavedVisible(true);
    }
    setValidationMessage(null);
    return true;
  }, [draft, step]);

  const goBack = useCallback(() => {
    const prev = previousOrganizationRequestStep(step);
    if (prev) setStep(prev);
    setValidationMessage(null);
  }, [step]);

  const saveDraft = useCallback(() => {
    persistDraft();
  }, [persistDraft]);

  const saveAndExit = useCallback(() => {
    persistDraft();
    router.push("/places");
  }, [persistDraft, router]);

  const submit = useCallback(async () => {
    const validation = validateOrganizationRequestDraft(draft);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      setStep(validation.message?.includes("adresse") ? "address" : "identity");
      return null;
    }
    const category = resolveOrganizationRequestCategory(draft.categoryId);
    if (!category) {
      setValidationMessage("Sélectionnez une catégorie.");
      setStep("identity");
      return null;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.createOrganizationRequest({
        name: draft.name.trim(),
        type: category.type,
        city: draft.city.trim(),
        category: category.category,
        address: draft.address.trim(),
        postal_code: draft.postalCode.trim() || undefined,
        phone: draft.phone.trim() || undefined,
        website: draft.website.trim() || undefined,
        instagram: draft.instagram.trim() || undefined,
        short_description: draft.shortDescription.trim(),
        description: draft.longDescription.trim() || undefined,
        neighborhood_label: selectedNeighborhood?.display_name ?? undefined,
      });
      clearOrganizationRequestDraft();
      setSubmittedSlug(response.slug);
      return response;
    } catch {
      setError("submit_failed");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [api, draft, selectedNeighborhood]);

  return {
    draft,
    step,
    setStep,
    neighborhoods,
    selectedNeighborhood,
    selectedCategory,
    loading,
    isSubmitting,
    error,
    validationMessage,
    submittedSlug,
    hasDraftContent: draftSavedVisible || hasDraftContent,
    updateDraft,
    goNext,
    goBack,
    saveDraft,
    saveAndExit,
    submit,
  };
}

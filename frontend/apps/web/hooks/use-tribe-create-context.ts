"use client";

import type { Tribe } from "@yunicity/types";
import type { TribeCreateDraft, TribeCreateStepId } from "@yunicity/utils";
import {
  TRIBE_CREATE_DRAFT_SAVED,
  TRIBE_CREATE_DRAFT_STORAGE_KEY,
  buildTribeCreatePayload,
  createTribeCreateDraftFromParams,
  nextTribeCreateStep,
  previousTribeCreateStep,
  validateTribeCreateStep,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

type TribeCreateSeed = { category?: string | null; city?: string | null };

function readStoredDraft(city: string): TribeCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TRIBE_CREATE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TribeCreateDraft>;
    return { ...createTribeCreateDraftFromParams({ city }, city), ...parsed };
  } catch {
    return null;
  }
}

export function useTribeCreateContext(seed?: TribeCreateSeed) {
  const api = useYunicityApi();
  const router = useRouter();
  const { user } = useAuth();
  const seedCity = seed?.city?.trim() || null;
  const [draft, setDraft] = useState<TribeCreateDraft>(() =>
    createTribeCreateDraftFromParams(
      { category: seed?.category, city: seedCity },
      user?.city?.trim() || DEFAULT_CITY,
    ),
  );
  const [step, setStep] = useState<TribeCreateStepId>("identity");
  const [exampleTribes, setExampleTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);
  const [createdTribe, setCreatedTribe] = useState<Tribe | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const city = seedCity || user?.city?.trim() || DEFAULT_CITY;
        const stored = readStoredDraft(city);
        const data = await api.tribes.listTribes({ city, page_size: 6 });
        if (!cancelled) {
          setExampleTribes(data.items.filter((item) => !item.is_archived).slice(0, 5));
          setDraft((prev) => {
            const base = stored ?? prev;
            return { ...base, city: base.city.trim() || city };
          });
        }
      } catch {
        if (!cancelled) setExampleTribes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [api, user?.city, seedCity]);

  const updateDraft = useCallback((patch: Partial<TribeCreateDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setValidationMessage(null);
    setError(null);
    setDraftSavedMessage(null);
  }, []);

  const persistDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(TRIBE_CREATE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setDraftSavedMessage(TRIBE_CREATE_DRAFT_SAVED);
  }, [draft]);

  const goNext = useCallback(() => {
    const validation = validateTribeCreateStep(step, draft);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return false;
    }
    const next = nextTribeCreateStep(step);
    if (next) setStep(next);
    setValidationMessage(null);
    return true;
  }, [draft, step]);

  const goBack = useCallback(() => {
    const prev = previousTribeCreateStep(step);
    if (prev) setStep(prev);
    setValidationMessage(null);
  }, [step]);

  const saveAndExit = useCallback(() => {
    persistDraft();
    router.push(`/tribes?city=${encodeURIComponent(draft.city.trim() || DEFAULT_CITY)}`);
  }, [draft.city, persistDraft, router]);

  const saveDraft = useCallback(() => {
    persistDraft();
  }, [persistDraft]);

  const submit = useCallback(async () => {
    for (const stepId of ["identity", "access"] as const) {
      const validation = validateTribeCreateStep(stepId, draft);
      if (!validation.valid) {
        setValidationMessage(validation.message);
        setStep(stepId);
        return null;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.tribes.createTribe(buildTribeCreatePayload(draft));
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(TRIBE_CREATE_DRAFT_STORAGE_KEY);
      }
      setCreatedTribe(response);
      return response;
    } catch {
      setError("submit_failed");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [api, draft]);

  return {
    draft,
    step,
    exampleTribes,
    loading,
    isSubmitting,
    error,
    validationMessage,
    draftSavedMessage,
    createdTribe,
    creatorName: user?.full_name?.trim() || user?.email || "Citoyen",
    updateDraft,
    goNext,
    goBack,
    saveDraft,
    saveAndExit,
    submit,
  };
}

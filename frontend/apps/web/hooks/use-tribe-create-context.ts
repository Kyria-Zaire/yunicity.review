"use client";

import type { Tribe } from "@yunicity/types";
import type { TribeCreateDraft, TribeCreateStepId } from "@yunicity/utils";
import {
  buildTribeCreatePayload,
  createTribeCreateDraftFromParams,
  nextTribeCreateStep,
  previousTribeCreateStep,
  validateTribeCreateStep,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

type TribeCreateSeed = { category?: string | null; city?: string | null };

export function useTribeCreateContext(seed?: TribeCreateSeed) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const seedCity = seed?.city?.trim() || null;
  const [draft, setDraft] = useState<TribeCreateDraft>(() =>
    createTribeCreateDraftFromParams(
      { category: seed?.category, city: seedCity },
      user?.city?.trim() || DEFAULT_CITY,
    ),
  );
  const [step, setStep] = useState<TribeCreateStepId>("info");
  const [exampleTribes, setExampleTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [createdTribe, setCreatedTribe] = useState<Tribe | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // La ville amorcee (query param du CTA quartier) l'emporte sur la ville du profil.
        const city = seedCity || user?.city?.trim() || DEFAULT_CITY;
        const data = await api.tribes.listTribes({ city, page_size: 6 });
        if (!cancelled) {
          setExampleTribes(data.items.filter((item) => !item.is_archived).slice(0, 5));
          setDraft((prev) => ({ ...prev, city }));
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
  }, []);

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

  const submit = useCallback(async () => {
    for (const stepId of ["info", "rules"] as const) {
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
    createdTribe,
    updateDraft,
    goNext,
    goBack,
    submit,
  };
}

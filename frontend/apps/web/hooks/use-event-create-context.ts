"use client";

import type { OrganizationMeItem } from "@yunicity/types";
import type { EventCreateDraft, EventCreateStepId } from "@yunicity/utils";
import {
  EVENT_CREATE_DRAFT_SAVED,
  EVENT_CREATE_DRAFT_STORAGE_KEY,
  buildEventCreatePayload,
  createEmptyEventCreateDraft,
  fromDatetimeLocalValue,
  nextEventCreateStep,
  previousEventCreateStep,
  validateEventCreateStep,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

function readStoredDraft(city: string): EventCreateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(EVENT_CREATE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EventCreateDraft>;
    return { ...createEmptyEventCreateDraft(city), ...parsed };
  } catch {
    return null;
  }
}

export function useEventCreateContext() {
  const api = useYunicityApi();
  const router = useRouter();
  const { user } = useAuth();
  const city = user?.city?.trim() || DEFAULT_CITY;

  const [draft, setDraft] = useState<EventCreateDraft>(() => createEmptyEventCreateDraft(city));
  const [organizations, setOrganizations] = useState<OrganizationMeItem[]>([]);
  const [step, setStep] = useState<EventCreateStepId>("essentials");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [draftSavedMessage, setDraftSavedMessage] = useState<string | null>(null);
  const [showOrgPicker, setShowOrgPicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await api.listMyOrganizations();
        const items = response.items.filter((item) => item.member_status === "active");
        if (cancelled) return;
        setOrganizations(items);
        const stored = readStoredDraft(city);
        setDraft((prev) => {
          const base = stored ?? { ...prev, city };
          if (!base.organizationId && items[0]) {
            return { ...base, organizationId: items[0].id, city: items[0].city || city };
          }
          return { ...base, city: base.city || city };
        });
      } catch {
        if (!cancelled) setOrganizations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [api, city]);

  const updateDraft = useCallback((patch: Partial<EventCreateDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setValidationMessage(null);
    setError(null);
    setDraftSavedMessage(null);
  }, []);

  const persistDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(EVENT_CREATE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setDraftSavedMessage(EVENT_CREATE_DRAFT_SAVED);
  }, [draft]);

  const goNext = useCallback(() => {
    const validation = validateEventCreateStep(step, draft);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return false;
    }
    const next = nextEventCreateStep(step);
    if (next) setStep(next);
    setValidationMessage(null);
    return true;
  }, [draft, step]);

  const goBack = useCallback(() => {
    const prev = previousEventCreateStep(step);
    if (prev) setStep(prev);
    setValidationMessage(null);
  }, [step]);

  const saveAndExit = useCallback(() => {
    persistDraft();
    router.push("/sortir");
  }, [persistDraft, router]);

  const saveDraft = useCallback(() => {
    persistDraft();
  }, [persistDraft]);

  const submit = useCallback(async () => {
    for (const stepId of ["essentials", "schedule"] as const) {
      const validation = validateEventCreateStep(stepId, draft);
      if (!validation.valid) {
        setValidationMessage(validation.message);
        setStep(stepId);
        return null;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const startsIso = fromDatetimeLocalValue(draft.startsAt);
      if (!startsIso) {
        setValidationMessage("Indiquez une date et heure de début.");
        setStep("schedule");
        return null;
      }
      const created = await api.organizationEvents.createEvent({
        ...buildEventCreatePayload(draft),
        starts_at: startsIso,
      });
      await api.organizationEvents.submitEvent(created.id);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(EVENT_CREATE_DRAFT_STORAGE_KEY);
      }
      router.push(`/events/${created.id}`);
      return created;
    } catch {
      setError("submit_failed");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [api.organizationEvents, draft, router]);

  const selectedOrganization =
    organizations.find((item) => item.id === draft.organizationId) ?? organizations[0] ?? null;

  return {
    draft,
    step,
    organizations,
    selectedOrganization,
    loading,
    isSubmitting,
    error,
    validationMessage,
    draftSavedMessage,
    showOrgPicker,
    setShowOrgPicker,
    updateDraft,
    goNext,
    goBack,
    saveDraft,
    saveAndExit,
    submit,
  };
}

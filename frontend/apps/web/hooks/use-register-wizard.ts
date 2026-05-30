"use client";

import {
  createEmptyRegisterDraft,
  nextRegisterStep,
  previousRegisterStep,
  validateRegisterStep,
  type RegisterDraft,
  type RegisterStepId,
} from "@yunicity/utils";
import { useCallback, useState } from "react";

export function useRegisterWizard() {
  const [step, setStep] = useState<RegisterStepId>("type");
  const [draft, setDraft] = useState<RegisterDraft>(() => createEmptyRegisterDraft());
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const updateDraft = useCallback((patch: Partial<RegisterDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setValidationMessage(null);
  }, []);

  const goNext = useCallback(() => {
    const validation = validateRegisterStep(step, draft);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return false;
    }
    const next = nextRegisterStep(step);
    if (next) setStep(next);
    setValidationMessage(null);
    return true;
  }, [draft, step]);

  const goBack = useCallback(() => {
    const prev = previousRegisterStep(step);
    if (prev) setStep(prev);
    setValidationMessage(null);
  }, [step]);

  return {
    step,
    setStep,
    draft,
    updateDraft,
    validationMessage,
    goNext,
    goBack,
  };
}

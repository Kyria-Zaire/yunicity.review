"use client";

import type { NeighborhoodContributionSubmitRequest } from "@yunicity/types";
import {
  mapContributionSubmitError,
  type NeighborhoodContributionFormState,
} from "@yunicity/utils";
import { useCallback, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type ContributionSubmitStatus = "idle" | "submitting" | "success" | "error";

export function useNeighborhoodContributionSubmit({
  slug,
  city,
}: {
  slug: string;
  city: string;
}) {
  const api = useYunicityApi();
  const [status, setStatus] = useState<ContributionSubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const submit = useCallback(
    async (form: NeighborhoodContributionFormState) => {
      setStatus("submitting");
      setErrorMessage(null);

      const payload: NeighborhoodContributionSubmitRequest = {
        identity_type: form.identityType,
        title: form.title.trim() || null,
        body: form.body.trim(),
        anonymous_gender: form.identityType === "ANONYMOUS" ? "remois" : null,
      };

      try {
        await api.neighborhoods.submitContribution(slug, city, payload);
        setStatus("success");
      } catch (error) {
        setStatus("error");
        setErrorMessage(mapContributionSubmitError(error));
      }
    },
    [api.neighborhoods, city, slug],
  );

  return {
    status,
    errorMessage,
    submit,
    reset,
  };
}

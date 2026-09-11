"use client";

import {
  MemoryTokenStorage,
  createAuthClient,
  getWebApiBaseUrl,
  parseRegistrationStatus,
} from "@yunicity/utils";
import type { RegistrationStatus } from "@yunicity/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export const REGISTRATION_STATUS_TIMEOUT_MS = 8_000;

export async function withTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("registration-status-timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Lit l'état d'ouverture auprès du backend — AUTH-04A.
 *
 * Le backend est seul autoritaire. Aucun statut ouvert n'existe avant une
 * réponse complète et valide. Réseau, timeout, 404, 5xx et JSON invalide
 * convergent tous vers un état indisponible qui ne monte jamais le formulaire.
 */
export function useRegistrationStatus(): {
  status: RegistrationStatus | null;
  isLoading: boolean;
  isUnavailable: boolean;
  retry: () => void;
} {
  const client = useMemo(
    () =>
      createAuthClient({
        apiBaseUrl: getWebApiBaseUrl(),
        platform: "web",
        storage: new MemoryTokenStorage(),
      }),
    [],
  );

  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let annule = false;
    setStatus(null);
    setIsLoading(true);
    setIsUnavailable(false);
    void (async () => {
      try {
        const recu = parseRegistrationStatus(
          await withTimeout(() => client.registrationStatus(), REGISTRATION_STATUS_TIMEOUT_MS),
        );
        if (!recu) throw new Error("registration-status-invalid");
        if (!annule) setStatus(recu);
      } catch {
        if (!annule) setIsUnavailable(true);
      } finally {
        if (!annule) setIsLoading(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [attempt, client]);

  return { status, isLoading, isUnavailable, retry };
}

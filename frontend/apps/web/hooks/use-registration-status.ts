"use client";

import {
  MemoryTokenStorage,
  createAuthClient,
  fallbackRegistrationStatus,
  getWebApiBaseUrl,
  parseRegistrationStatus,
} from "@yunicity/utils";
import type { RegistrationStatus } from "@yunicity/types";
import { useEffect, useMemo, useState } from "react";

/**
 * Lit l'état d'ouverture auprès du backend — AUTH-04A.
 *
 * Le backend est seul autoritaire. Ce hook ne décide de rien : il rapporte, et
 * l'écran s'y conforme. Tant que la réponse n'est pas arrivée, on part du repli
 * bâti sur l'ancienne variable de compilation, de sorte qu'un backend qui ne
 * connaît pas encore la route ne ferme pas l'écran d'inscription.
 */
export function useRegistrationStatus(): {
  status: RegistrationStatus;
  isLoading: boolean;
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

  const [status, setStatus] = useState<RegistrationStatus>(() =>
    fallbackRegistrationStatus(
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_REGISTRATION_ENABLED : undefined,
    ),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let annule = false;
    void (async () => {
      try {
        const recu = parseRegistrationStatus(await client.registrationStatus());
        if (!annule && recu) setStatus(recu);
      } catch {
        // Backend injoignable ou route inconnue : on garde le repli. Fermer ici
        // couperait l'inscription sur la seule foi d'une erreur reseau.
      } finally {
        if (!annule) setIsLoading(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [client]);

  return { status, isLoading };
}

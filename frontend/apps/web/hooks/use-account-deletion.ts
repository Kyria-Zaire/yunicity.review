"use client";

import type { AccountDeletionStatus } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

/**
 * Découvre si la suppression de compte est disponible — AUTH-02A.
 *
 * Le backend répond `404` quand le drapeau est absent : la fonctionnalité n'a
 * alors aucune existence, et l'interface n'en montre rien. C'est le signal
 * runtime, pas une variable de compilation — elle serait figée au build et ne
 * pourrait pas suivre un changement côté serveur.
 */
export function useAccountDeletion(): {
  enabled: boolean;
  status: AccountDeletionStatus | null;
  isLoading: boolean;
} {
  const { yunicityApi } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<AccountDeletionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      const recu = await yunicityApi.auth.accountDeletionStatus();
      setStatus(recu);
      setEnabled(true);
    } catch (erreur) {
      // 404 = desactive. Toute autre erreur laisse la section masquee aussi :
      // mieux vaut ne rien proposer que proposer une action qui echouera.
      if (isAuthError(erreur) && erreur.status === 404) setEnabled(false);
      else setEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [yunicityApi]);

  useEffect(() => {
    void charger();
  }, [charger]);

  return { enabled, status, isLoading };
}

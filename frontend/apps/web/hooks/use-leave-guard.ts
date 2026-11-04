"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { internalLeaveTarget, registerLeaveInterceptor } from "@/lib/navigation/leave-guard";

/**
 * Retient toute sortie de l'écran tant que `active` est vrai, et la confie à
 * `onIntercept` — qui décide, typiquement après une confirmation, d'appeler
 * `proceed`.
 *
 * Couvre : liens du chrome (capture document), navigations programmatiques
 * passées par `guardNavigation` (Create Hub), bouton « Précédent » du
 * navigateur (entrée sentinelle, voir `armerRetour`), rechargement et
 * fermeture d'onglet (`beforeunload`, dialogue natif du navigateur).
 */
export function useLeaveGuard({
  active,
  onIntercept,
}: {
  active: boolean;
  onIntercept: (proceed: () => void) => void;
}): void {
  const router = useRouter();
  // La ref évite de réarmer les écoutes à chaque rendu de l'écran.
  const onInterceptRef = useRef(onIntercept);
  onInterceptRef.current = onIntercept;

  useEffect(() => {
    if (!active) return;

    const retirer = registerLeaveInterceptor((proceed) => {
      onInterceptRef.current(proceed);
      return true;
    });

    function surClic(event: MouseEvent) {
      const destination = internalLeaveTarget(event, window.location.href);
      if (destination === null) return;
      // Capture au niveau du document : `next/link` ne voit jamais ce clic.
      event.preventDefault();
      event.stopPropagation();
      onInterceptRef.current(() => router.push(destination));
    }

    function avantDechargement(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Requis par Chrome et Safari pour afficher le dialogue natif.
      event.returnValue = "";
    }

    const desarmerRetour = armerRetour((proceed) => onInterceptRef.current(proceed));

    document.addEventListener("click", surClic, true);
    window.addEventListener("beforeunload", avantDechargement);
    return () => {
      retirer();
      desarmerRetour();
      document.removeEventListener("click", surClic, true);
      window.removeEventListener("beforeunload", avantDechargement);
    };
  }, [active, router]);
}

/** Marqueur de l'entrée sentinelle, ajouté à l'état d'historique de Next. */
const SENTINELLE = "__yunicityLeaveGuard";

function estSentinelle(etat: unknown): boolean {
  return typeof etat === "object" && etat !== null && SENTINELLE in etat;
}

function pousserSentinelle(): void {
  // ⚠️ On CONSERVE l'état de Next (arbre du routeur, `__NA`) : sans lui, le
  // routeur app recharge la page au retour sur cette entrée.
  const etat: unknown = window.history.state;
  const base = typeof etat === "object" && etat !== null ? etat : {};
  window.history.pushState({ ...base, [SENTINELLE]: true }, "", window.location.href);
}

/**
 * « Précédent » du navigateur — une sortie courante, pas un cas marginal.
 *
 * Une entrée SENTINELLE (même URL, même état Next) est empilée au-dessus de la
 * page. « Précédent » ne fait alors que revenir sur la page elle-même : on
 * réarme aussitôt la sentinelle et on demande confirmation. Confirmer recule
 * de DEUX entrées — la sentinelle et la page — vers la page d'avant.
 *
 * ⚠️ Limite : quand la garde se lève (brouillon vidé), la sentinelle reste
 * dans l'historique — un « Précédent » de plus revient sur la même page. La
 * retirer exigerait un `history.back()` au démontage, qui reculerait aussi
 * après une navigation confirmée.
 */
function armerRetour(retenir: (proceed: () => void) => void): () => void {
  if (!estSentinelle(window.history.state)) pousserSentinelle();
  let sortieConfirmee = false;

  function surRetour() {
    if (sortieConfirmee) return;
    pousserSentinelle();
    retenir(() => {
      sortieConfirmee = true;
      window.history.go(-2);
    });
  }

  window.addEventListener("popstate", surRetour);
  return () => window.removeEventListener("popstate", surRetour);
}

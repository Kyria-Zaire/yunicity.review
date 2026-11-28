"use client";

import { TURNSTILE_SCRIPT_URL } from "@yunicity/utils";
import { useEffect, useId, useRef, useState } from "react";

type TurnstileWidgetProps = {
  siteKey: string;
  /** Remonte le jeton, ou `null` quand il expire ou qu'il est réinitialisé. */
  onToken: (token: string | null) => void;
  /** Le widget n'a pas pu se charger : l'appelant décide quoi en faire. */
  onUnavailable: () => void;
  action?: string;
};

type Etat = "chargement" | "pret" | "indisponible";

/**
 * Cloudflare Turnstile en mode géré — AUTH-04A-CORRECTION-01.
 *
 * Le widget ne décide rien : il produit un jeton que seul le backend transforme
 * en autorisation. Son rôle ici est de rester discret quand tout va bien et de
 * ne jamais piéger l'utilisateur quand il échoue.
 *
 * Trois précautions gouvernent ce composant :
 *
 * - **Le script n'est chargé qu'une fois** pour toute la page, même si le
 *   composant est monté, démonté et remonté par l'assistant d'inscription.
 * - **Le widget est retiré au démontage**, sinon Cloudflare laisse un conteneur
 *   orphelin qui réapparaît au remontage.
 * - **L'expiration remonte `null`**, pour que le formulaire sache qu'il doit
 *   redemander un jeton — sans jamais effacer ce que l'utilisateur a saisi.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  onUnavailable,
  action = "register",
}: TurnstileWidgetProps) {
  const conteneur = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [etat, setEtat] = useState<Etat>("chargement");
  const titreId = useId();

  useEffect(() => {
    let annule = false;

    async function monter() {
      try {
        await chargerScriptTurnstile();
      } catch {
        if (!annule) {
          setEtat("indisponible");
          onUnavailable();
        }
        return;
      }
      if (annule || !conteneur.current || !window.turnstile) return;

      widgetId.current = window.turnstile.render(conteneur.current, {
        sitekey: siteKey,
        action,
        callback: (token: string) => onToken(token),
        // Un jeton expiré n'est plus valide côté serveur : le signaler tout de
        // suite évite un refus incompréhensible à la soumission.
        "expired-callback": () => onToken(null),
        "timeout-callback": () => onToken(null),
        "error-callback": () => {
          onToken(null);
          setEtat("indisponible");
          onUnavailable();
        },
      });
      setEtat("pret");
    }

    void monter();

    return () => {
      annule = true;
      if (widgetId.current && window.turnstile) {
        // Sans ce retrait, un remontage empile les widgets.
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, action, onToken, onUnavailable]);

  return (
    <div className="mt-4">
      <div
        ref={conteneur}
        aria-labelledby={titreId}
        // Le widget gère son propre focus clavier ; on ne lui en impose pas.
        className="min-h-[65px]"
      />
      <p id={titreId} className="sr-only">
        Vérification de sécurité anti-robot
      </p>
      {etat === "chargement" ? (
        <p className="mt-1 text-xs text-neutral-500" role="status" aria-live="polite">
          Vérification de sécurité en cours…
        </p>
      ) : null}
      {etat === "indisponible" ? (
        <p className="mt-1 text-xs leading-relaxed text-red-700" role="alert">
          La vérification de sécurité n&apos;a pas pu se charger. Vérifiez votre connexion,
          puis réessayez : vos informations sont conservées.
        </p>
      ) : null}
    </div>
  );
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

let chargement: Promise<void> | null = null;

/**
 * Charge le script officiel, une seule fois par page.
 *
 * La promesse est mémorisée : deux montages simultanés attendent le même
 * chargement au lieu d'insérer deux balises. Un script déjà présent dans le
 * document — rendu serveur, retour arrière — est réutilisé tel quel.
 */
function chargerScriptTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve();
  if (chargement) return chargement;

  chargement = new Promise<void>((resoudre, rejeter) => {
    const existant = document.querySelector<HTMLScriptElement>(
      `script[src^="${TURNSTILE_SCRIPT_URL}"]`,
    );
    if (existant) {
      existant.addEventListener("load", () => resoudre());
      existant.addEventListener("error", () => rejeter(new Error("turnstile script failed")));
      if (window.turnstile) resoudre();
      return;
    }

    const balise = document.createElement("script");
    balise.src = TURNSTILE_SCRIPT_URL;
    balise.async = true;
    balise.defer = true;
    balise.addEventListener("load", () => resoudre());
    balise.addEventListener("error", () => {
      chargement = null; // permet une nouvelle tentative
      rejeter(new Error("turnstile script failed"));
    });
    document.head.appendChild(balise);
  });

  return chargement;
}

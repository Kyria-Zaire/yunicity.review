"use client";

import { POST_NEW_CLOSE, POST_NEW_PUBLISH, POST_NEW_TITLE } from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";

/**
 * En-tête du composeur — **une seule** action primaire, sur les trois paliers.
 *
 * `submitting` désactive aussi « Publier » : le verrou synchrone du hook
 * d'envoi empêche la seconde tentative, mais un bouton resté actif invite à
 * cliquer et laisse croire que rien ne se passe.
 */
export function NewPostHeader({
  canPublish,
  submitting,
  progressLabel,
  onBack,
  onPublish,
}: {
  canPublish: boolean;
  submitting: boolean;
  progressLabel: string | null;
  onBack: () => void;
  onPublish: () => void;
}) {
  return (
    // Mobile : collé sous l'en-tête Yunicity — « Publier » reste accessible au
    // défilement et clavier ouvert (spec, § clavier). Hauteur de l'en-tête
    // mesurée à l'exécution (`useMobileChromeInsets`), jamais codée en dur.
    <header
      data-new-post-header=""
      className="flex items-center gap-3 px-4 py-3 max-[639px]:sticky max-[639px]:top-[var(--new-post-chrome-top,0px)] max-[639px]:z-10 max-[639px]:rounded-t-3xl max-[639px]:border-b max-[639px]:border-neutral-100 max-[639px]:bg-white"
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={POST_NEW_CLOSE}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </button>

      <h1 className="flex-1 text-base font-bold text-neutral-900 sm:text-lg">{POST_NEW_TITLE}</h1>

      {progressLabel ? (
        <p className="text-xs font-medium text-neutral-500" role="status" aria-live="polite">
          {progressLabel}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onPublish}
        disabled={!canPublish || submitting}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary disabled:bg-neutral-100 disabled:text-neutral-500"
      >
        {POST_NEW_PUBLISH}
      </button>
    </header>
  );
}

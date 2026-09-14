"use client";

import {
  COMPOSER_MEDIA_CHOOSE_ANOTHER,
  COMPOSER_MEDIA_CONTINUE_WITHOUT,
  COMPOSER_MEDIA_RESOLUTION_HINT,
} from "@yunicity/utils";

/**
 * Arbitrage d'un média refusé — MEDIA-01.
 *
 * Quand une image est rejetée (format, taille, envoi échoué), publier sans rien
 * dire reviendrait à retirer la photo dans le dos de l'utilisateur : il clique
 * « Publier » en croyant l'envoyer. Tant qu'il n'a pas tranché, la publication
 * reste bloquée, et ces deux actions sont les seules issues.
 *
 * Aucune des deux n'envoie ni ne publie quoi que ce soit : elles ne font
 * qu'exprimer une intention.
 *
 * Partagé par les quatre composers pour que les libellés, les noms accessibles
 * et les cibles tactiles ne divergent pas d'un écran à l'autre.
 */
export function ComposerMediaResolution({
  onChooseAnother,
  onContinueWithout,
  className = "",
}: {
  onChooseAnother: () => void;
  onContinueWithout: () => void;
  className?: string;
}) {
  return (
    <div data-composer-media-resolution="" className={`mt-2 ${className}`}>
      <p className="text-xs leading-relaxed text-neutral-600">{COMPOSER_MEDIA_RESOLUTION_HINT}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onChooseAnother}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {COMPOSER_MEDIA_CHOOSE_ANOTHER}
        </button>
        <button
          type="button"
          onClick={onContinueWithout}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {COMPOSER_MEDIA_CONTINUE_WITHOUT}
        </button>
      </div>
    </div>
  );
}

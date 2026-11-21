"use client";

import {
  POST_NEW_UNDETERMINED_CHECK_FEED,
  POST_NEW_UNDETERMINED_HINT,
  POST_NEW_UNDETERMINED_RETRY,
  POST_NEW_UNDETERMINED_TITLE,
} from "@yunicity/utils";

/**
 * §3.4 bis — l'issue **INDÉTERMINÉE** : la création est partie, aucune réponse
 * n'est revenue. Personne ne sait si la publication existe.
 *
 * ⛔ Ce n'est PAS un échec, et ce n'est pas un succès : d'où `role="status"`
 * plutôt que `alert`, et une microcopie qui **nomme l'incertitude**.
 *
 * L'action **primaire** est « Réessayer » : le rejeu part sous la MÊME clé,
 * donc sans doublon possible — c'est la branche sûre, et il faut y pousser.
 *
 * ⛔ Aucun bouton « Abandonner » ici : le mot promettrait une annulation qui
 * n'existe pas. Quitter l'écran ne retire rien du serveur, et c'est le dialogue
 * de sortie qui doit le dire.
 */
export function NewPostUndetermined({
  onRetry,
  onOpenFeed,
}: {
  onRetry: () => void;
  onOpenFeed: () => void;
}) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <h2 className="text-sm font-bold text-amber-700">{POST_NEW_UNDETERMINED_TITLE}</h2>
      <p className="mt-1 text-sm leading-5 text-neutral-900">{POST_NEW_UNDETERMINED_HINT}</p>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {POST_NEW_UNDETERMINED_RETRY}
        </button>
        <button
          type="button"
          onClick={onOpenFeed}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {POST_NEW_UNDETERMINED_CHECK_FEED}
        </button>
      </div>
    </section>
  );
}

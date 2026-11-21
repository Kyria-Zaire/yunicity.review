"use client";

import {
  POST_NEW_ALREADY_SENT_ACTION,
  POST_NEW_ALREADY_SENT_HINT,
  POST_NEW_ALREADY_SENT_TITLE,
  POST_NEW_START_NEW_PUBLICATION,
} from "@yunicity/utils";

/**
 * 409 `POST_REQUEST_CONFLICT` : la publication **EXISTE**, avec un contenu
 * différent de ce qui est à l'écran.
 *
 * ⛔ Pas de bouton « Réessayer » : rejouer ne produirait qu'un second refus.
 * ⛔ Aucune republication automatique, aucun minuteur.
 *
 * « Créer une nouvelle publication » est le **geste explicite** qui libère la
 * clé d'idempotence (§3.4 bis b). Le code ne la libère jamais à sa place.
 */
export function NewPostAlreadySent({
  onOpenFeed,
  onStartNew,
}: {
  onOpenFeed: () => void;
  onStartNew: () => void;
}) {
  return (
    <section role="alert" className="mx-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <h2 className="text-sm font-bold text-amber-700">{POST_NEW_ALREADY_SENT_TITLE}</h2>
      <p className="mt-1 text-sm leading-5 text-neutral-900">{POST_NEW_ALREADY_SENT_HINT}</p>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onOpenFeed}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {POST_NEW_ALREADY_SENT_ACTION}
        </button>
        <button
          type="button"
          onClick={onStartNew}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {POST_NEW_START_NEW_PUBLICATION}
        </button>
      </div>
    </section>
  );
}

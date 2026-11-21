"use client";

import type { RejectedFile } from "@/hooks/use-new-post-draft";
import {
  POST_NEW_REJECTED_CHOOSE_OTHERS,
  POST_NEW_REJECTED_CONTINUE,
  POST_NEW_REJECTED_KEEP_HINT,
  POST_NEW_REJECTED_TITLE,
} from "@yunicity/utils";

/**
 * Refus **À LA SÉLECTION** : rien n'est parti, l'utilisateur tranche.
 *
 * Chaque fichier est nommé avec son motif. L'ancien écran écrasait les motifs
 * les uns sur les autres dans une seule chaîne : sur un lot de dix, l'utilisateur
 * ne savait ni combien ni lesquels avaient été écartés.
 *
 * `role="status"` et non `alert` : ce n'est pas une erreur, c'est une décision
 * à prendre, et le brouillon reste intact.
 */
export function NewPostRejectedFiles({
  files,
  onChooseOthers,
  onDismiss,
}: {
  files: RejectedFile[];
  onChooseOthers: () => void;
  onDismiss: () => void;
}) {
  if (files.length === 0) return null;

  return (
    <section
      role="status"
      className="mx-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <h2 className="text-sm font-bold text-amber-700">{POST_NEW_REJECTED_TITLE(files.length)}</h2>

      <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-neutral-900">
        {files.map((file) => (
          <li key={`${file.name}-${file.reason}`}>
            <span className="font-semibold">{file.name}</span> — {file.reason}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onChooseOthers}
          className="inline-flex min-h-11 items-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {POST_NEW_REJECTED_CHOOSE_OTHERS}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-11 items-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {POST_NEW_REJECTED_CONTINUE}
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-neutral-600">{POST_NEW_REJECTED_KEEP_HINT}</p>
    </section>
  );
}

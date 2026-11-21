"use client";

import {
  POST_COMPOSER_BODY_MAX,
  POST_NEW_CONTENT_LOCKED,
  POST_NEW_PLACEHOLDER,
} from "@yunicity/utils";

/**
 * Zone de texte du composeur.
 *
 * L'étiquette est en `sr-only` plutôt qu'absente : un `placeholder` seul ne
 * nomme pas le champ pour un lecteur d'écran, et disparaît dès la première
 * frappe.
 */
export function NewPostBodyField({
  value,
  onChange,
  city,
  charCount,
  locked,
}: {
  value: string;
  onChange: (value: string) => void;
  city: string;
  charCount: number;
  /** Contenu figé (envoi en cours ou issue inconnue) : lisible, non modifiable. */
  locked: boolean;
}) {
  return (
    <div
      className={`mx-4 rounded-2xl border px-4 py-3 ${
        locked ? "border-neutral-200 bg-neutral-50" : "border-neutral-200 bg-white"
      }`}
    >
      <label htmlFor="new-post-body" className="sr-only">
        {POST_NEW_PLACEHOLDER(city)}
      </label>
      <textarea
        id="new-post-body"
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        placeholder={POST_NEW_PLACEHOLDER(city)}
        maxLength={POST_COMPOSER_BODY_MAX}
        readOnly={locked}
        aria-describedby={locked ? "new-post-body-locked" : undefined}
        className="w-full resize-none border-0 bg-transparent text-base text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        {locked ? (
          <p id="new-post-body-locked" className="text-xs text-neutral-600">
            {POST_NEW_CONTENT_LOCKED}
          </p>
        ) : (
          <span />
        )}
        <p className="shrink-0 whitespace-nowrap text-right text-xs text-neutral-500">
          {charCount} / {POST_COMPOSER_BODY_MAX}
        </p>
      </div>
    </div>
  );
}

"use client";

import {
  POST_NEW_CREATE_FAILED_TITLE,
  POST_NEW_UPLOAD_FAILED_FILE,
  POST_NEW_UPLOAD_FAILED_TITLE,
  POST_NEW_UPLOAD_KEPT,
  POST_NEW_UPLOAD_RETRY,
  POST_NEW_UPLOAD_SESSION_SCOPE,
} from "@yunicity/utils";
import { AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Ce qui a échoué — deux familles, jamais confondues (I4 de la revue finale) :
 *   - `media` : l'ENVOI d'un fichier, désigné par le rang de sa vignette ;
 *   - `creation` : la publication elle-même, aucun fichier en cause.
 * Auparavant un échec de création était titré du nom de l'AUTEUR, faute de
 * fichier : « L'envoi de Kyria a échoué. »
 */
export type NewPostFailureCause =
  | { kind: "media"; mediaKind: "photo" | "vidéo"; rank: number; fileName: string }
  | { kind: "creation" };

/**
 * **ÉCHEC D'ENVOI** — à ne pas confondre avec un fichier refusé : le fichier
 * est valide, la requête a échoué, et la tentative est rejouable.
 *
 * On dit explicitement la **portée** de la reprise : les médias déjà transférés
 * ne repartent pas, mais seulement tant que cet écran reste ouvert. Promettre
 * davantage serait faux — rien n'est persisté.
 *
 * `message` vient de `composerMediaErrorMessage` : une constante traduite,
 * jamais la réponse brute du serveur.
 */
export function NewPostUploadFailure({
  cause,
  message,
  mediaCount,
  hasUploadedMedia,
  onRetry,
}: {
  cause: NewPostFailureCause;
  message: string;
  mediaCount: number;
  /** Au moins un média est déjà transféré : la promesse de non-renvoi a un objet. */
  hasUploadedMedia: boolean;
  onRetry: () => void;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const alerteRef = useRef<HTMLElement>(null);

  /**
   * UNE fois, à l'apparition : l'encart est amené à l'écran et reçoit le focus.
   * Sur mobile, la grille le place sous la ligne de flottaison ; sans cela,
   * l'utilisateur ne voit qu'un « Publier » inerte, sans explication.
   * Les marges de défilement (`.new-post-failure-zone`) le gardent ENTIER entre les
   * barres fixes. Un nouvel échec remonte le composant, donc se révèle aussi.
   */
  useEffect(() => {
    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    zoneRef.current?.scrollIntoView?.({ block: "nearest", behavior: reduit ? "auto" : "smooth" });
    alerteRef.current?.focus({ preventScroll: true });
  }, []);

  const titre =
    cause.kind === "media"
      ? POST_NEW_UPLOAD_FAILED_TITLE(cause.mediaKind, cause.rank)
      : POST_NEW_CREATE_FAILED_TITLE;

  return (
    <div
      ref={zoneRef}
      className="new-post-failure-zone mx-4 flex flex-col gap-2"
    >
      <section
        ref={alerteRef}
        role="alert"
        tabIndex={-1}
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <div className="flex gap-2.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-red-700">{titre}</h2>
            <p className="mt-1 text-sm leading-5 text-neutral-900">{message}</p>
            <p className="mt-1 text-sm leading-5 text-neutral-900">
              {POST_NEW_UPLOAD_KEPT(mediaCount)}
            </p>
            {cause.kind === "media" ? (
              <p className="mt-1 truncate text-xs text-neutral-600">
                {POST_NEW_UPLOAD_FAILED_FILE(cause.fileName)}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-yunicity-primary bg-white px-4 text-sm font-semibold text-yunicity-primary transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {POST_NEW_UPLOAD_RETRY}
        </button>
      </section>

      {hasUploadedMedia ? (
        <p className="text-center text-xs leading-5 text-neutral-600">
          {POST_NEW_UPLOAD_SESSION_SCOPE}
        </p>
      ) : null}
    </div>
  );
}

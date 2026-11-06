"use client";

import { NewPostMediaItemMenu } from "@/components/feed/post-composer/new-post-media-item-menu";
import type { MediaDraft } from "@/hooks/use-new-post-draft";
import {
  POST_NEW_MEDIA_POSITION,
  POST_NEW_MEDIA_REMOVE_ONE,
  POST_NEW_MEDIA_STATUS_FAILED,
  POST_NEW_MEDIA_STATUS_PENDING,
  POST_NEW_MEDIA_STATUS_UPLOADED,
  POST_NEW_MEDIA_STATUS_UPLOADING,
} from "@yunicity/utils";
import { CheckCircle2, Clock3, Loader2, MoreHorizontal, X, XCircle } from "lucide-react";

const STATUT = {
  uploaded: { label: POST_NEW_MEDIA_STATUS_UPLOADED, Icone: CheckCircle2, couleur: "text-green-700" },
  uploading: { label: POST_NEW_MEDIA_STATUS_UPLOADING, Icone: Loader2, couleur: "text-neutral-600" },
  failed: { label: POST_NEW_MEDIA_STATUS_FAILED, Icone: XCircle, couleur: "text-red-600" },
  selected: { label: POST_NEW_MEDIA_STATUS_PENDING, Icone: Clock3, couleur: "text-neutral-600" },
} as const;

/**
 * Vignette d'un média du brouillon.
 *
 * ⚠️ I7 de la revue finale : l'`overflow-hidden` vit sur le CADRE de l'image,
 * pas sur la vignette. Posé sur la vignette, il rognait le menu `•••` — dont
 * « Retirer », sa dernière ligne — puisque le menu est plus haut que la tuile.
 *
 * La pastille `✕` est un RACCOURCI de retrait (planches) ; le menu reste la
 * voie accessible complète (réordonner au clavier).
 */
export function NewPostMediaTile({
  media,
  index,
  total,
  menuOpen,
  editDisabled,
  showStatus,
  onToggleMenu,
  onForward,
  onBackward,
  onMakeFirst,
  onRemove,
}: {
  media: MediaDraft;
  index: number;
  total: number;
  menuOpen: boolean;
  /** Contenu figé : les commandes restent visibles mais inertes. */
  editDisabled: boolean;
  /** Une tentative d'envoi a eu lieu : chaque vignette dit où elle en est. */
  showStatus: boolean;
  onToggleMenu: () => void;
  onForward: () => void;
  onBackward: () => void;
  onMakeFirst: () => void;
  onRemove: () => void;
}) {
  const rang = index + 1;
  const statut = STATUT[media.status.kind];
  const enEchec = media.status.kind === "failed";

  return (
    <div className={menuOpen ? "relative z-20" : "relative"}>
      {/* Format 5:4, légèrement paysage, comme la maquette validée (recette du
          04/11) : seul le CADRE de l'aperçu change, `object-cover` recadre à
          l'affichage — le fichier envoyé reste intact. */}
      <div className="relative aspect-[5/4]">
        <div
          className={`absolute inset-0 overflow-hidden rounded-xl bg-neutral-100 ${
            enEchec ? "ring-2 ring-red-500 ring-offset-1" : ""
          }`}
        >
          {media.mediaType === "video" ? (
            <video src={media.previewUrl} muted playsInline className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.previewUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <span
          aria-hidden
          className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-neutral-900 shadow-sm"
        >
          {rang}
        </span>
        <span className="sr-only">{POST_NEW_MEDIA_POSITION(rang, total)}</span>

        {/* Zones d'interaction 44 px, pastilles visuelles 28 px. */}
        <button
          type="button"
          aria-label={`Options du média ${rang}`}
          aria-expanded={menuOpen}
          onClick={onToggleMenu}
          disabled={editDisabled}
          className="absolute right-0 top-0 disabled:opacity-50 inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-yunicity-primary"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow">
            <MoreHorizontal className="h-4 w-4 text-neutral-900" aria-hidden />
          </span>
        </button>

        <button
          type="button"
          aria-label={POST_NEW_MEDIA_REMOVE_ONE(rang)}
          onClick={onRemove}
          disabled={editDisabled}
          className="absolute bottom-0 right-0 disabled:opacity-50 inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-yunicity-primary"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow">
            <X className="h-4 w-4 text-neutral-900" aria-hidden />
          </span>
        </button>

        {menuOpen ? (
          <NewPostMediaItemMenu
            isFirst={index === 0}
            isLast={index === total - 1}
            onForward={onForward}
            onBackward={onBackward}
            onMakeFirst={onMakeFirst}
            onRemove={onRemove}
          />
        ) : null}
      </div>

      {showStatus || enEchec ? (
        <p className={`mt-1.5 flex items-center justify-center gap-1 text-xs font-medium ${statut.couleur}`}>
          <statut.Icone
            className={`h-3.5 w-3.5 ${media.status.kind === "uploading" ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden
          />
          {statut.label}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import type { FeedReportReason } from "@yunicity/types";
import { FEED_REPORT_LABEL, FEED_REPORT_REASON_LABELS } from "@yunicity/utils";
import { MoreVertical } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

const REASONS: FeedReportReason[] = ["spam", "inappropriate", "other"];

/**
 * Menu options publication — icône kebab maquette mobile.
 *
 * C3.1-R1L : ce menu proposait Spam / Contenu inapproprié / Autre sur TOUTE
 * publication, y compris celle de l'utilisateur connecté. Signaler sa propre
 * publication n'a aucun sens produit, et le backend ne l'interdisait pas non
 * plus (garde ajoutée dans `report_service`). L'appartenance est tranchée sur
 * l'identité serveur : pour un auteur citoyen, `FeedAuthor.id` EST le
 * `user_id`. Le rendu client n'est pas la frontière de sécurité — c'est l'API
 * qui refuse — mais il ne doit plus proposer une action impossible.
 *
 * Aucune action n'étant aujourd'hui câblée pour le propriétaire, le menu n'est
 * pas rendu du tout sur sa propre publication : un kebab vide serait un second
 * contrôle mort. `PATCH` et `DELETE /posts/{id}` existent et restent
 * disponibles pour une extension Modifier/Supprimer.
 */
export function FeedPostOptionsMenu({
  onReport,
  authorUserId,
}: {
  onReport: (reason: FeedReportReason) => Promise<void>;
  /** `user_id` de l'auteur quand c'est un citoyen, `null` pour une organisation. */
  authorUserId?: string | null;
}) {
  const { user } = useAuth();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function submit(reason: FeedReportReason) {
    setIsSubmitting(true);
    try {
      await onReport(reason);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const viewerIsAuthor = Boolean(authorUserId && user?.id && authorUserId === user.id);
  if (viewerIsAuthor) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={FEED_REPORT_LABEL}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-xl border border-neutral-200/90 bg-white py-1 shadow-lg"
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            {FEED_REPORT_LABEL}
          </p>
          {REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              role="menuitem"
              disabled={isSubmitting}
              onClick={() => void submit(reason)}
              className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {FEED_REPORT_REASON_LABELS[reason]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

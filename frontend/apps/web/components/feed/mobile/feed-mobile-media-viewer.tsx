"use client";

import { useCallback, useEffect, useRef } from "react";

import { Dialog } from "@yunicity/ui/primitives";
import { useAuthorizedMediaSource } from "@/hooks/use-authorized-media-source";
import { AuthorizedPublicationImageView } from "@/components/feed/authorized-publication-image";
import { PublicationMediaFrame } from "@/components/feed/publication-media-frame";
import { releaseAuthorizedObjectUrl, retainAuthorizedObjectUrl } from "@yunicity/utils";

/**
 * Visionneuse média du fil (C3.1-R1L + MEDIA-01B + MEDIA-02).
 *
 * Préfère l'object URL partagée par la carte. Si elle disparaît (démontage carte
 * / révocation) alors que le dialogue est ouvert, second fetch authentifié.
 * Viewer = contain, original complet, distinct du cadre feed cover.
 *
 * ── Parcours d'une publication à plusieurs photos (MEDIA-MULTI-PHOTO-01) ─────
 * La grille plafonne à quatre tuiles : au-delà, les photos n'étaient
 * atteignables par AUCUN geste. Le parcours vit donc ici, et non dans la
 * grille — c'est ce qui permet de garder le plafond visible intact.
 *
 * Le média COURANT est le seul résolu : l'ouverture réutilise le blob de la
 * tuile touchée, et chaque déplacement résout le suivant À LA DEMANDE. Dix
 * photos ne coûtent donc jamais dix appels authentifiés d'un coup.
 *
 * ⛔ La VIDÉO reste hors de ce parcours : elle n'entre pas dans la liste
 * (`feed-publication-media.tsx`), et son rendu — URL brute, hors résolution
 * autorisée — garde sa limite documentée, NON validée.
 */

/** Course horizontale minimale d'un balayage, en pixels CSS. */
const SWIPE_THRESHOLD_PX = 48;

export function FeedMobileMediaViewer({
  open,
  onOpenChange,
  objectUrl,
  mediaUrl,
  label,
  position = 1,
  total = 1,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectUrl: string | null;
  /** URL distante pour repli si la source partagée n'est plus disponible. */
  mediaUrl: string;
  label: string;
  /** Rang du média courant, à partir de 1. */
  position?: number;
  /** Nombre total de médias parcourables. */
  total?: number;
  /** Déplacement relatif demandé (-1 / +1). Absent : visionneuse figée. */
  onNavigate?: (delta: number) => void;
}) {
  const needsFallback = open && !objectUrl;
  const fallback = useAuthorizedMediaSource(needsFallback ? mediaUrl : null);
  const activeUrl = objectUrl ?? fallback.objectUrl;

  const canBrowse = total > 1 && Boolean(onNavigate);
  const canGoBack = canBrowse && position > 1;
  const canGoForward = canBrowse && position < total;

  /**
   * Garde UNIQUE du déplacement : aux bornes, l'appel ne part pas.
   *
   * C'est elle qui rend l'action impossible, et non l'attribut `disabled` des
   * boutons — qui a été écarté parce qu'il retire le bouton de l'ordre de
   * tabulation et fait retomber le focus sur `<body>` dès qu'on atteint une
   * borne. Les boutons restent donc focalisables et portent `aria-disabled`.
   */
  const navigate = useCallback(
    (delta: number) => {
      if (!onNavigate) return;
      if (delta < 0 && position <= 1) return;
      if (delta > 0 && position >= total) return;
      onNavigate(delta);
    },
    [onNavigate, position, total],
  );

  useEffect(() => {
    if (!open || !activeUrl) return;
    retainAuthorizedObjectUrl(activeUrl);
    return () => releaseAuthorizedObjectUrl(activeUrl);
  }, [open, activeUrl]);

  // Clavier : les flèches parcourent. Échap, le piège de focus et le retour du
  // focus appartiennent au dialogue — ne pas les redoubler ici.
  useEffect(() => {
    if (!open || !canBrowse) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, canBrowse, navigate]);

  // Tactile : un balayage horizontal franc, et lui seul. Le seuil écarte les
  // défilements verticaux et les tremblements de doigt.
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    swipeStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start || !canBrowse) return;
      const end = event.changedTouches[0];
      if (!end) return;
      const dx = end.clientX - start.x;
      const dy = end.clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return;
      navigate(dx < 0 ? 1 : -1);
    },
    [navigate, canBrowse],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={label}
      closeLabel="Fermer l’image"
      chrome="bare"
      className="bg-black"
    >
      <div
        data-feed-media-viewer=""
        className="relative flex h-full w-full items-center justify-center px-[max(0.5rem,env(safe-area-inset-left))] py-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <PublicationMediaFrame
          variant="viewer"
          kind="image"
          orientation={null}
          feedPublicationMarker={false}
          className="flex max-h-[100dvh] max-w-full items-center justify-center"
        >
          {objectUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL déjà décodée par la carte
            <img
              data-authorized-media-state="ready"
              src={objectUrl}
              alt={label}
              className="publication-media-frame__media max-h-[100dvh] max-w-full object-contain"
              decoding="async"
            />
          ) : (
            <AuthorizedPublicationImageView
              status={fallback.status === "idle" && needsFallback ? "loading" : fallback.status}
              objectUrl={fallback.objectUrl}
              alt={label}
              imgClassName="publication-media-frame__media max-h-[100dvh] max-w-full object-contain"
              onRetry={fallback.retry}
              onDisplayed={fallback.markDisplayed}
              onDecodeFailed={fallback.markDecodeFailed}
            />
          )}
        </PublicationMediaFrame>

        {canBrowse ? (
          <>
            {/* Aux bornes : `aria-disabled`, et NON `disabled`. Le bouton garde
                sa place dans l'ordre de tabulation — sans quoi atteindre la
                première ou la dernière photo au clavier ferait retomber le
                focus sur `<body>`, et l'anneau de focus disparaîtrait. Le
                déplacement, lui, est bel et bien empêché : `navigate` le
                refuse à la borne, quelle que soit l'origine du geste. */}
            <button
              type="button"
              data-feed-media-viewer-previous=""
              aria-label="Photo précédente"
              aria-disabled={!canGoBack}
              onClick={() => navigate(-1)}
              className={`absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-2xl leading-none text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${canGoBack ? "" : "opacity-30"}`}
            >
              <span aria-hidden>‹</span>
            </button>
            <button
              type="button"
              data-feed-media-viewer-next=""
              aria-label="Photo suivante"
              aria-disabled={!canGoForward}
              onClick={() => navigate(1)}
              className={`absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-2xl leading-none text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${canGoForward ? "" : "opacity-30"}`}
            >
              <span aria-hidden>›</span>
            </button>
            {/* Annoncé sans déplacer le focus : le rang change sous le doigt
                comme sous la flèche, et doit s'entendre dans les deux cas. */}
            <p
              data-feed-media-viewer-counter=""
              role="status"
              aria-live="polite"
              className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-sm font-medium text-white"
            >
              {position} / {total}
            </p>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}

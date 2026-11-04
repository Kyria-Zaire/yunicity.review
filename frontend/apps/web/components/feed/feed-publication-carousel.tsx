"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AuthorizedPublicationImageView,
  type MediaIntrinsicSize,
} from "@/components/feed/authorized-publication-image";
import { useAuthorizedMediaSource } from "@/hooks/use-authorized-media-source";
import {
  openFeedMediaViewer,
  type FeedMediaViewerItem,
} from "@/lib/feed/feed-media-viewer-session";
import {
  carouselIndexFromScroll,
  clampCarouselIndex,
} from "@/lib/feed/publication-carousel-rank";
import { classifyMediaOrientation, type MediaOrientation } from "@yunicity/utils";

/**
 * Carrousel de photos DANS la publication (MEDIA-MULTI-PHOTO-01).
 *
 * ## Pourquoi il remplace la mosaïque
 *
 * La mosaïque montrait quatre vignettes et un badge « +N » décoratif : au-delà
 * de quatre photos, les suivantes n'étaient atteignables par aucun geste depuis
 * la publication. Elle portait aussi deux défauts observés en recette — un
 * voile gris sur toute la grille et un « +N » affiché deux fois —, qui avaient
 * la MÊME cause : un badge en `position: absolute; inset: 0` rendu comme enfant
 * direct du conteneur de grille, lui-même `position: relative`. Les deux
 * disparaissent avec la grille, parce que l'élément qui les causait disparaît.
 *
 * ## Le défilement est NATIF
 *
 * `overflow-x` + `scroll-snap-type: x mandatory`, pas de piste translatée en
 * JavaScript. L'inertie tactile, le rebond iOS et le défilement clavier
 * viennent du navigateur — c'est ce qui rend le balayage fiable sur Safari
 * iPhone, là où un `touchend` simulé en jsdom ne prouvait rien. `mandatory` est
 * adapté ici parce que chaque diapositive fait exactement une page de large.
 *
 * ## Aucun saut vertical
 *
 * Le cadre a une HAUTEUR FIXE pour toute la publication, décidée une fois
 * (orientation de la première photo) et jamais rediscutée ensuite. Les photos
 * y sont en `contain` : elles ne sont ni rognées, ni capables de pousser la
 * page quand on passe d'un portrait à un paysage.
 *
 * ## Préchargement borné, et déclaratif
 *
 * Une diapositive hors fenêtre ne reçoit PAS d'URL : son hook ne déclenche donc
 * aucune requête. La fenêtre vaut `[courante]` tant que la photo courante n'est
 * pas prête, puis `[courante-1 .. courante+1]`. La priorité au média courant
 * n'est pas une intention, c'est la forme même du rendu.
 *
 * ⛔ Les vidéos ne passent pas par ici : elles gardent leur rendu actuel.
 */

/** Rayon de préchargement une fois la photo courante prête. */
const PRELOAD_RADIUS = 1;

function PublicationCarouselSlide({
  mediaUrl,
  label,
  index,
  total,
  isCurrent,
  shouldLoad,
  viewerItems,
  onReadyChange,
  onIntrinsicSize,
}: {
  mediaUrl: string;
  label: string;
  index: number;
  total: number;
  isCurrent: boolean;
  /** Hors fenêtre : aucune URL n'est passée au hook, donc aucune requête. */
  shouldLoad: boolean;
  viewerItems: FeedMediaViewerItem[];
  onReadyChange: (index: number, isReady: boolean) => void;
  onIntrinsicSize: (index: number, size: MediaIntrinsicSize) => void;
}) {
  const { status, objectUrl, retry, markDisplayed, markDecodeFailed } =
    useAuthorizedMediaSource(shouldLoad ? mediaUrl : null, { variant: "card" });

  /**
   * L'état « prête » est REMONTÉ EN CONTINU, et retombe à faux dès que la
   * diapositive quitte la fenêtre de préchargement — son hook reçoit alors
   * `null`, relâche son blob et revient à `idle`.
   *
   * Le signaler une seule fois, à l'affichage, laisserait le parent croire
   * qu'une photo déchargée est toujours prête : il accorderait le rayon de
   * préchargement à un rang qui n'a plus rien à l'écran, et les voisines
   * passeraient devant la photo courante.
   */
  const isReady = status === "ready";
  useEffect(() => {
    onReadyChange(index, isReady);
  }, [index, isReady, onReadyChange]);

  const onDisplayed = useCallback(
    (size?: MediaIntrinsicSize) => {
      if (size) onIntrinsicSize(index, size);
      markDisplayed();
    },
    [index, markDisplayed, onIntrinsicSize],
  );

  const canOpen = status === "ready" && Boolean(objectUrl);

  const media = (
    <AuthorizedPublicationImageView
      status={status}
      objectUrl={objectUrl}
      alt={label}
      framed
      imgClassName="publication-carousel__img"
      onRetry={retry}
      onDisplayed={onDisplayed}
      onDecodeFailed={markDecodeFailed}
    />
  );

  return (
    <div
      className="publication-carousel__slide"
      data-publication-carousel-slide={index}
      role="group"
      aria-roledescription="diapositive"
      aria-label={`${index + 1} sur ${total}`}
    >
      {canOpen ? (
        <button
          type="button"
          /**
           * Seule la diapositive COURANTE est dans l'ordre de tabulation. Sans
           * cela, `Tab` traverserait les dix boutons « Agrandir » d'une
           * publication, dont neuf invisibles.
           *
           * ⛔ PAS d'`aria-hidden` ici. Le bouton reste focalisable par
           * programme, et masquer un élément focalisable place le focus dans un
           * sous-arbre caché dès qu'il s'y trouvait — une violation ARIA qui
           * fait perdre son contexte au lecteur d'écran. La diapositive porte
           * déjà `role="group"` et « n sur total » : le contexte est là, sans
           * mentir à l'arbre d'accessibilité.
           */
          tabIndex={isCurrent ? 0 : -1}
          onClick={(event) => {
            event.currentTarget.focus();
            openFeedMediaViewer({
              mediaUrl,
              objectUrl,
              label: viewerItems[index]?.label ?? label,
              items: viewerItems,
              // L'agrandissement CONSERVE le rang : la visionneuse s'ouvre sur
              // la photo regardée, et le parcours continue de là.
              index,
            });
          }}
          aria-label={`Agrandir l’image ${index + 1}`}
          className="publication-carousel__open"
        >
          {media}
        </button>
      ) : (
        media
      )}
    </div>
  );
}

export function FeedPublicationCarousel({
  urls,
  label,
}: {
  /** Photos SEULES, dans l'ordre de publication. Deux au minimum. */
  urls: string[];
  label: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [readyIndexes, setReadyIndexes] = useState<ReadonlySet<number>>(new Set());
  const [frameOrientation, setFrameOrientation] = useState<MediaOrientation | null>(null);

  const total = urls.length;

  const viewerItems = useMemo<FeedMediaViewerItem[]>(
    () => urls.map((url, rank) => ({ mediaUrl: url, label: `${label} (${rank + 1})` })),
    [urls, label],
  );

  const onReadyChange = useCallback((index: number, isReady: boolean) => {
    setReadyIndexes((previous) => {
      if (previous.has(index) === isReady) return previous;
      const next = new Set(previous);
      if (isReady) next.add(index);
      else next.delete(index);
      return next;
    });
  }, []);

  /**
   * L'orientation du CADRE est décidée par la PREMIÈRE photo, une seule fois.
   *
   * La rediscuter à chaque diapositive ferait sauter la page sous le doigt —
   * c'est précisément ce qu'il ne faut pas. Les photos suivantes s'inscrivent
   * dans ce cadre en `contain`, donc sans rognage.
   */
  const onIntrinsicSize = useCallback((index: number, size: MediaIntrinsicSize) => {
    if (index !== 0) return;
    setFrameOrientation((previous) => {
      if (previous) return previous;
      return classifyMediaOrientation(size.width, size.height);
    });
  }, []);

  // Priorité au média courant : les voisines n'entrent dans la fenêtre
  // qu'une fois la courante affichée.
  const radius = readyIndexes.has(current) ? PRELOAD_RADIUS : 0;

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = clampCarouselIndex(index, track.children.length);
    const slide = track.children[clamped];
    if (!(slide instanceof HTMLElement)) return;
    // `scrollTo` plutôt que `scrollIntoView` : ce dernier fait aussi défiler les
    // ancêtres, et ferait bouger la page entière autour de la publication.
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, []);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const index = carouselIndexFromScroll(track.scrollLeft, track.clientWidth, total);
    setCurrent((previous) => (previous === index ? previous : index));
  }, [total]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(current + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(current - 1);
      }
    },
    [current, goTo],
  );

  // Le rang courant doit rester dans les bornes si la liste raccourcit.
  useEffect(() => {
    if (current > total - 1) setCurrent(Math.max(total - 1, 0));
  }, [current, total]);

  /**
   * Le focus SUIT la diapositive courante.
   *
   * ⚠️ `tabIndex={-1}` retire un bouton de l'ordre de tabulation mais NE
   * DÉPLACE PAS un focus déjà posé dessus. Sans ce déplacement, un lecteur au
   * clavier resterait accroché au bouton d'une photo sortie de l'écran, et
   * « Agrandir » ouvrirait une photo qu'il ne voit plus.
   *
   * On n'agit QUE si le focus était déjà dans une diapositive de CE carrousel :
   * voler le focus à quelqu'un qui lit ailleurs dans la page serait pire que le
   * défaut corrigé.
   */
  useEffect(() => {
    const root = rootRef.current;
    const active = document.activeElement;
    if (!root || !(active instanceof HTMLElement)) return;

    const slide = active.closest("[data-publication-carousel-slide]");
    if (!slide || !root.contains(slide)) return;
    if (slide.getAttribute("data-publication-carousel-slide") === String(current)) return;

    const target =
      root.querySelector<HTMLElement>(
        `[data-publication-carousel-slide="${current}"] button`,
      ) ?? trackRef.current;
    target?.focus();
  }, [current]);

  const canGoBack = current > 0;
  const canGoForward = current < total - 1;

  return (
    <div
      ref={rootRef}
      /**
       * Les flèches clavier sont écoutées par le COMPOSANT ENTIER, et non par
       * la seule piste : les commandes — flèches, points — vivent hors de la
       * piste, et une flèche pressée depuis l'une d'elles ne faisait rien.
       *
       * ⛔ L'écouteur reste BORNÉ à ce composant : un écouteur sur `document`
       * capturerait les flèches de toute la page, et deux publications
       * ouvertes se disputeraient le même geste.
       */
      onKeyDown={onKeyDown}
      data-feed-publication-media=""
      data-feed-publication-media-kind="carousel"
      className="feed-publication-media publication-carousel mt-3"
      data-publication-carousel-orientation={frameOrientation ?? "unknown"}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="publication-carousel__viewport">
        <div
          ref={trackRef}
          className="publication-carousel__track"
          data-publication-carousel-track=""
          tabIndex={0}
          onScroll={onScroll}
        >
          {urls.map((url, index) => (
            <PublicationCarouselSlide
              key={`${url}:${index}`}
              mediaUrl={url}
              label={label}
              index={index}
              total={total}
              isCurrent={index === current}
              shouldLoad={Math.abs(index - current) <= radius}
              viewerItems={viewerItems}
              onReadyChange={onReadyChange}
              onIntrinsicSize={onIntrinsicSize}
            />
          ))}
        </div>

        {/* Compteur EN HAUT À DROITE. Annoncé sans voler le focus : le rang
            change sous le doigt comme sous la flèche. */}
        <p
          data-publication-carousel-counter=""
          role="status"
          aria-live="polite"
          className="publication-carousel__counter"
        >
          {current + 1} / {total}
        </p>

        {/* Aux bornes : `aria-disabled`, jamais `disabled` — sinon le bouton
            quitte l'ordre de tabulation et le focus retombe sur `<body>`.
            L'action est empêchée par `goTo`, qui borne son index. */}
        <button
          type="button"
          data-publication-carousel-previous=""
          aria-label="Photo précédente"
          aria-disabled={!canGoBack}
          onClick={() => canGoBack && goTo(current - 1)}
          className="publication-carousel__arrow publication-carousel__arrow--previous"
        >
          <span aria-hidden>‹</span>
        </button>
        <button
          type="button"
          data-publication-carousel-next=""
          aria-label="Photo suivante"
          aria-disabled={!canGoForward}
          onClick={() => canGoForward && goTo(current + 1)}
          className="publication-carousel__arrow publication-carousel__arrow--next"
        >
          <span aria-hidden>›</span>
        </button>
      </div>

      {/* Indicateurs DESSOUS. Ce sont de vrais boutons : un point qui montre le
          rang sans permettre d'y aller serait une décoration. */}
      <div className="publication-carousel__dots" data-publication-carousel-dots="">
        {urls.map((url, index) => (
          <button
            key={`dot:${url}:${index}`}
            type="button"
            aria-label={`Aller à la photo ${index + 1}`}
            aria-current={index === current ? "true" : undefined}
            onClick={() => goTo(index)}
            className="publication-carousel__dot"
            data-publication-carousel-dot={index === current ? "current" : ""}
          >
            <span aria-hidden className="publication-carousel__dot-mark" />
          </button>
        ))}
      </div>
    </div>
  );
}

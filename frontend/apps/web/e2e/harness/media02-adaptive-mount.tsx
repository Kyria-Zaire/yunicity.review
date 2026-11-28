/**
 * MEDIA-02 — harnais : carte publication avec cadre adaptatif (portrait 9:16).
 */

import { createRoot } from "react-dom/client";

import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import { FeedMediaViewerHost } from "@/components/feed/feed-media-viewer-host";
import { PublicationMediaFrame } from "@/components/feed/publication-media-frame";
import { AuthorizedPublicationImageView } from "@/components/feed/authorized-publication-image";

function makeDataUrl(width: number, height: number, color: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d indisponible");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL("image/png");
}

function mount(): void {
  const root = document.getElementById("media02-root");
  if (!root) throw new Error("media02-root manquant");

  const portraitData = makeDataUrl(1080, 1920, "#4b5563");
  const landscapeData = makeDataUrl(1920, 1080, "#6b7280");

  Promise.all([
    fetch(portraitData).then((r) => r.blob()),
    fetch(landscapeData).then((r) => r.blob()),
  ]).then(([portraitBlob, landscapeBlob]) => {
    const portraitUrl = URL.createObjectURL(portraitBlob);
    const landscapeUrl = URL.createObjectURL(landscapeBlob);

    createRoot(root).render(
      <div className="citizen-feed-shell feed-mobile-shell mx-auto max-w-lg bg-[#F4F5F7]">
        <header
          data-media02-main-header=""
          className="flex min-h-[4.25rem] items-center border-b border-neutral-200 bg-white px-4"
        >
          <span className="text-sm font-bold">Yunicity</span>
        </header>
        <div className="feed-main-column mx-auto max-w-[28rem] bg-white pb-24">
          <article
            data-media02-card="portrait"
            className="feed-publication-padding border-b border-neutral-200 px-4 py-3"
          >
            <header className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold">
                KM
              </span>
              <div>
                <p className="text-sm font-bold text-neutral-900">Kyria</p>
                <p className="text-xs text-neutral-500">il y a 2 min</p>
              </div>
            </header>
            <p className="feed-publication-text mt-3 text-[15px] text-neutral-800">
              Hello média school #reims
            </p>
            <div data-media02-frame-host="portrait" className="mt-3">
              <PublicationMediaFrame
                variant="feed"
                kind="image"
                orientation="portrait"
                status="ready"
                feedPublicationKind="image"
                className="feed-publication-media overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
              >
                <AuthorizedPublicationImageView
                  status="ready"
                  objectUrl={portraitUrl}
                  alt="Portrait 9:16"
                  framed
                  onRetry={() => undefined}
                />
              </PublicationMediaFrame>
            </div>
            <footer
              data-media02-actions=""
              className="feed-publication-footer-padding mt-3 flex items-center gap-4"
            >
              <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center">
                J’aime
              </button>
              <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center">
                Commenter
              </button>
              <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center">
                Partager
              </button>
            </footer>
          </article>

          <article data-media02-card="landscape" className="px-4 py-3">
            <p className="text-sm text-neutral-800">Paysage 16:9</p>
            <div data-media02-frame-host="landscape" className="mt-3">
              <PublicationMediaFrame
                variant="feed"
                kind="image"
                orientation="landscape"
                status="ready"
                feedPublicationKind="image"
                className="feed-publication-media overflow-hidden rounded-xl border border-neutral-200"
              >
                <AuthorizedPublicationImageView
                  status="ready"
                  objectUrl={landscapeUrl}
                  alt="Paysage"
                  framed
                  onRetry={() => undefined}
                />
              </PublicationMediaFrame>
            </div>
          </article>

          <section data-media02-video="portrait" className="px-4 py-3">
            <p className="text-sm text-neutral-800">Vidéo portrait</p>
            <FeedPublicationMedia mediaUrl="/api/v1/local-videos/media02-portrait.mp4" />
          </section>

          <section data-media02-video="landscape" className="px-4 py-3">
            <p className="text-sm text-neutral-800">Vidéo paysage</p>
            <FeedPublicationMedia mediaUrl="/api/v1/local-videos/media02-landscape.mp4" />
          </section>

          <article data-media02-legacy="portrait" className="px-4 py-3 opacity-40">
            <p className="text-xs">legacy contain (référence)</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portraitUrl}
              alt=""
              className="mx-auto block w-full object-contain"
              data-media02-legacy-img=""
            />
          </article>
        </div>
        <nav
          data-media02-bottom-nav=""
          className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex h-[3.25rem] items-center justify-around text-xs">
            <span>Fil</span>
            <span>Carte</span>
            <span>Créer</span>
            <span>Notifs</span>
            <span>Profil</span>
          </div>
        </nav>
        <FeedMediaViewerHost />
      </div>,
    );
  });
}

mount();

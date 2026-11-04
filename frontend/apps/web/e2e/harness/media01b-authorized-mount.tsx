/**
 * MEDIA-01B — harnais rendu : états image authentifiée (loading / ready / error / viewer).
 */

import { createRoot } from "react-dom/client";

import { AuthorizedPublicationImageView } from "@/components/feed/authorized-publication-image";
import { FeedMediaViewerHost } from "@/components/feed/feed-media-viewer-host";
import { openFeedMediaViewer } from "@/lib/feed/feed-media-viewer-session";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6aAAAAAElFTkSuQmCC";

function mount(): void {
  const root = document.getElementById("media01b-root");
  if (!root) throw new Error("media01b-root manquant");

  // Object URL réelle pour l'état ready / viewer.
  let objectUrl = "";
  fetch(TINY_PNG)
    .then((r) => r.blob())
    .then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      createRoot(root).render(
        <div className="mx-auto max-w-3xl space-y-8 p-4">
          <section data-media01b-state="loading" className="rounded-xl border border-neutral-200 p-2">
            <h2 className="mb-2 text-sm font-medium">loading</h2>
            <AuthorizedPublicationImageView
              status="loading"
              objectUrl={null}
              alt=""
              onRetry={() => undefined}
            />
          </section>
          <section data-media01b-state="ready" className="rounded-xl border border-neutral-200 p-2">
            <h2 className="mb-2 text-sm font-medium">ready</h2>
            <AuthorizedPublicationImageView
              status="ready"
              objectUrl={objectUrl}
              alt="Image de démonstration"
              imgClassName="mx-auto block max-h-80 w-full rounded-xl object-contain"
              onRetry={() => undefined}
            />
          </section>
          <section data-media01b-state="error" className="rounded-xl border border-neutral-200 p-2">
            <h2 className="mb-2 text-sm font-medium">error</h2>
            <AuthorizedPublicationImageView
              status="error"
              objectUrl={null}
              alt=""
              onRetry={() => undefined}
            />
          </section>
          <section data-media01b-state="decode-error" className="rounded-xl border border-neutral-200 p-2">
            <h2 className="mb-2 text-sm font-medium">decode-error (même UI)</h2>
            <AuthorizedPublicationImageView
              status="error"
              objectUrl={null}
              alt=""
              onRetry={() => undefined}
            />
          </section>
          <button
            type="button"
            data-media01b-open-viewer=""
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-neutral-300 px-4"
            onClick={() =>
              openFeedMediaViewer({
                mediaUrl:
                  "/api/v1/story-media/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg",
                objectUrl,
                label: "Image de démonstration",
              })
            }
          >
            Ouvrir plein écran
          </button>
          <FeedMediaViewerHost />
        </div>,
      );
    });
}

mount();

/**
 * MEDIA-01 — GATE 9 : harnais de rendu des quatre composers.
 *
 * Monte les composants RÉELS avec le CSS RÉEL de l'application, dans un
 * navigateur réel. Seuls les accès réseau et la session sont remplacés par des
 * bouchons (voir `media01-stubs`), aliasés à la compilation : le balisage, les
 * classes et la mise en page mesurés sont ceux de production.
 */

import { createRoot } from "react-dom/client";

import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedDesktopComposer } from "@/components/feed/desktop/feed-desktop-composer";
import { FeedMobileComposer } from "@/components/feed/mobile/feed-mobile-composer";
import { NewPostScreen } from "@/components/feed/post-composer/new-post-screen";
import { TerritoryMobilePostComposer } from "@/components/shared/mobile/territory-mobile-post-composer";

async function noop(): Promise<void> {}

function Harnais() {
  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-8 bg-white p-4">
      <section data-media01-composer="feed">
        <FeedComposer onSubmit={noop} city="Reims" />
      </section>
      <section data-media01-composer="mobile">
        <FeedMobileComposer city="Reims" onSubmit={noop} />
      </section>
      <section data-media01-composer="desktop">
        <FeedDesktopComposer city="Reims" avatarInitial="C" avatarUrl={null} onSubmit={noop} />
      </section>
      <section data-media01-composer="territorial">
        <TerritoryMobilePostComposer onSubmit={noop} />
      </section>
      {/* Cinquième parcours actif : la page `/feed/new`, avec ses deux vues. */}
      <section data-media01-composer="new-post">
        <NewPostScreen />
      </section>
    </div>
  );
}

createRoot(document.getElementById("media01-root")!).render(<Harnais />);

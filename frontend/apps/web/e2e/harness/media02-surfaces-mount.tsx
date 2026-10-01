/**
 * MEDIA-02 — harnais des six surfaces raccordées.
 *
 * Monte les CARTES RÉELLES (profil desktop et mobile, tribu, offre, partenaire)
 * avec un média portrait 9:16 — le cas qui a motivé MEDIA-02. On mesure ensuite
 * la boîte que chaque variante impose réellement, plutôt que de lire des
 * classes CSS.
 */

import type { FeedPost, PartnerCreatorContentPublic } from "@yunicity/types";
import { createRoot } from "react-dom/client";

import { OfferFeedCard } from "@/components/feed/offer-feed-card";
import { PartnerCreatorContentCard } from "@/components/partners/partner-creator-content-card";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";
import { ProfileMobilePostCard } from "@/components/profile/mobile/profile-mobile-post-card";
import { TribeDetailMobilePostCard } from "@/components/tribes/mobile/tribe-detail-mobile-post-card";

/** Média portrait 9:16 : le cas qui monopolisait la hauteur avant MEDIA-02. */
const MEDIA = "/api/v1/story-media/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg";

function post(id: string, media: string | null): FeedPost {
  return {
    id,
    type: "post",
    author: {
      type: "citizen",
      id: "00000000-0000-4000-8000-000000000001",
      display_name: "Kyria",
      username: "kyria",
      logo_url: null,
    },
    city: "reims",
    title: null,
    body: "Hello média school #reims",
    media_url: media,
    location: null,
    like_count: 2,
    comment_count: 1,
    liked_by_me: false,
    offer: null,
    event: null,
    creator_content: null,
    neighborhood_summary: { slug: "centre-ville", display_name: "Centre-ville" },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as FeedPost;
}

const contenuPartenaire: PartnerCreatorContentPublic = {
  id: "aaaaaaaa-1111-4111-8111-111111111111",
  title: "Coulisses du studio",
  body: "Une semaine de tournage à Reims.",
  media_url: MEDIA,
  published_at: new Date().toISOString(),
};

declare global {
  interface Window {
    media02SurfacesPret: boolean;
  }
}

function Section({ cle, titre, children }: { cle: string; titre: string; children: React.ReactNode }) {
  return (
    <section data-media02-surface={cle} className="border-b border-neutral-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-neutral-500">{titre}</p>
      {children}
    </section>
  );
}

function mount(): void {
  const root = document.getElementById("media02-root");
  if (!root) throw new Error("media02-root manquant");

  // Deux publications : la première est « featured » en profil desktop
  // (variante compact), la seconde secondaire (variante thumbnail).
  const publications = [post("p1", MEDIA), post("p2", MEDIA)];

  createRoot(root).render(
    <div className="citizen-feed-shell mx-auto max-w-lg bg-[#F4F5F7]">
      <Section cle="profil-desktop" titre="Profil desktop — compact + thumbnail">
        <ProfileDesktopPublications posts={publications} displayName="Kyria" />
      </Section>

      <Section cle="tribu-mobile" titre="Tribu mobile — compact">
        <TribeDetailMobilePostCard post={post("t1", MEDIA)} />
      </Section>

      <Section cle="partenaire" titre="Partenaire / créateur — compact">
        <PartnerCreatorContentCard item={contenuPartenaire} partnerName="Studio Reims" />
      </Section>

      <Section cle="offre" titre="Offre — thumbnail">
        <OfferFeedCard post={post("o1", MEDIA)} currentUserId={null} />
      </Section>

      <Section cle="profil-mobile" titre="Profil mobile — thumbnail">
        <ProfileMobilePostCard post={post("pm1", MEDIA)} displayName="Kyria" />
      </Section>
    </div>,
  );

  window.media02SurfacesPret = true;
}

mount();

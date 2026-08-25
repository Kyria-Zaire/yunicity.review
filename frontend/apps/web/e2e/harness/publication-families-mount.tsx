import type { FeedComment, FeedPost } from "@yunicity/types";
import { createRoot } from "react-dom/client";

import {
  FeedCardWithDependencies,
  type FeedCardDependencies,
} from "@/components/feed/feed-card";
import { PUBLICATION_IMAGE_FIXTURE_DATA_URL } from "@/e2e/harness/publication-image-fixture";

/**
 * Harnais des familles de publication (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A-BIS).
 *
 * ── Pourquoi un harnais ──────────────────────────────────────────────────────
 * La baseline QA ne contient ni post événement, ni post offre, ni post portant
 * une vidéo. Ces familles ne seraient donc jamais rendues par une preuve sur
 * `/feed` — or ce sont précisément les chemins que l'unification a modifiés.
 *
 * ── Ce que le harnais N'EST PAS ──────────────────────────────────────────────
 * Il ne recopie aucune structure : il monte le VRAI `FeedCard`, avec le vrai
 * CSS de l'application. Aucune API n'est appelée, aucune publication n'est
 * créée. Les handlers sont des espions locaux qui enregistrent l'appel sans
 * réseau — le contrat de branchement est ainsi observable sans mutation.
 */

/**
 * Deux identités distinctes — le prédicat du menu en dépend.
 *
 * `FeedPostOptionsMenu` retourne `null` quand le lecteur EST l'auteur : on ne
 * signale pas sa propre publication. Un harnais où lecteur et auteur sont la
 * même personne n'aurait donc jamais de menu, et le test le prendrait pour un
 * défaut. Les cinq familles sont signées par un AUTRE citoyen ; une sixième
 * carte, signée par le lecteur, verrouille le comportement inverse.
 */
const AUTEUR = {
  type: "citizen" as const,
  id: "author-harness",
  display_name: "Camille Dubois",
  username: "camille",
  logo_url: null,
};

/** Le lecteur du harnais — distinct de l'auteur des cinq familles. */
const LECTEUR_ID = "reader-harness";

function base(id: string): FeedPost {
  return {
    id,
    type: "post",
    author: AUTEUR,
    city: "Reims",
    title: null,
    body: null,
    media_url: null,
    location: null,
    like_count: 3,
    comment_count: 2,
    liked_by_me: false,
    offer: null,
    event: null,
    creator_content: null,
    neighborhood_summary: null,
    created_at: "2026-08-24T09:00:00Z",
    updated_at: "2026-08-24T09:00:00Z",
  };
}

/** MP4 minimal : le contrat testé est « un <video> existe », pas la lecture. */
const VIDEO_URL = "/media/qa/qa-sample-video.mp4";

const FAMILLES: { cle: string; post: FeedPost }[] = [
  { cle: "text", post: { ...base("p-text"), body: "Le marché du Boulingrin ouvre plus tôt ce samedi." } },
  {
    cle: "image",
    post: {
      ...base("p-image"),
      body: "Lever de soleil sur la cathédrale.",
      media_url: PUBLICATION_IMAGE_FIXTURE_DATA_URL,
    },
  },
  {
    cle: "video",
    post: { ...base("p-video"), body: "Le tram sous la neige.", media_url: VIDEO_URL },
  },
  {
    cle: "event",
    post: {
      ...base("p-event"),
      type: "event",
      title: "Concert au Cryptoportique",
      body: "Entrée libre, places limitées.",
      event: {
        local_event_id: "evt-harness",
        starts_at: "2026-08-30T18:30:00Z",
        ends_at: null,
        location_name: "Cryptoportique",
        district: "Centre-ville",
        event_type: "concert",
        interested_by_me: false,
      },
      neighborhood_summary: { slug: "centre-ville", display_name: "Centre-ville" },
    },
  },
  {
    cle: "offer",
    post: {
      ...base("p-offer"),
      type: "offer",
      title: "-20 % chez Maison Fossier",
      body: "Sur présentation du Passport.",
      offer: {
        partner_offer_id: "off-harness",
        valid_from: null,
        valid_until: "2026-12-31T22:59:59Z",
        offer_type: "discount",
        is_flash: false,
      },
    },
  },
  {
    cle: "own",
    post: {
      ...base("p-own"),
      author: { ...AUTEUR, id: LECTEUR_ID, display_name: "Vous", username: "vous" },
      body: "Ma propre publication.",
    },
  },
];

/**
 * Journal exposé à la page — déclaré, jamais casté. `as unknown as` serait un
 * contournement du typage, et le contrat du harnais l'interdit.
 */
declare global {
  interface Window {
    __ynHarnessLog: string[];
  }
}

/** Espions locaux : ils prouvent le branchement sans aucun appel réseau. */
const journal: string[] = [];
window.__ynHarnessLog = journal;

/**
 * API factice STRICTEMENT typée : chaque méthode satisfait la signature réelle
 * du contrat et résout localement. Aucune route interceptée, aucun `fetch`
 * remplacé, aucun provider patché — la vue n'a simplement pas de providers.
 */
const dependencies: FeedCardDependencies = {
  listComments: async (postId) => {
    journal.push(`listComments:${postId}`);
    const commentaire: FeedComment = {
      id: `c-${postId}`,
      post_id: postId,
      user_id: AUTEUR.id,
      author_display_name: AUTEUR.display_name,
      author_username: AUTEUR.username,
      body: "Merci pour l'info !",
      created_at: "2026-08-24T09:30:00Z",
      updated_at: "2026-08-24T09:30:00Z",
    };
    return { items: [commentaire], next_cursor: null };
  },
  createComment: async (postId, payload) => {
    journal.push(`createComment:${postId}`);
    return {
      id: `c-new-${postId}`,
      post_id: postId,
      user_id: AUTEUR.id,
      author_display_name: AUTEUR.display_name,
      author_username: AUTEUR.username,
      body: payload.body,
      created_at: "2026-08-24T09:31:00Z",
      updated_at: "2026-08-24T09:31:00Z",
    };
  },
  deleteComment: async (commentId) => {
    journal.push(`deleteComment:${commentId}`);
  },
  toggleEventInterest: async (eventId) => {
    journal.push(`toggleEventInterest:${eventId}`);
    return { event_id: eventId, interested: true, interest_count: 1 };
  },
  currentUserId: LECTEUR_ID,
};

createRoot(document.getElementById("yn-publication-root")!).render(
  <div>
    {FAMILLES.map(({ cle, post }) => (
      <div key={cle} data-yn-family={cle} className="mb-4">
        <FeedCardWithDependencies
          post={post}
          dependencies={dependencies}
          onToggleLike={async (p) => {
            journal.push(`like:${p.id}`);
          }}
          onReport={async (postId, reason) => {
            journal.push(`report:${postId}:${reason}`);
          }}
        />
      </div>
    ))}
  </div>,
);

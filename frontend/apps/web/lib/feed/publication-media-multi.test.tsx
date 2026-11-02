// @vitest-environment jsdom

/**
 * MEDIA-MULTI-PHOTO-01 — plusieurs photos, du contrat du fil jusqu'à l'écran.
 *
 * ── Ce que ces tests protègent ───────────────────────────────────────────────
 * Les photos étaient STOCKÉES mais jamais RENDUES : le contrat du fil n'exposait
 * que `media_url`, et aucune carte de production ne passait de liste. La grille,
 * elle, existait déjà — seul un harnais E2E l'atteignait.
 *
 * Trois propriétés sont verrouillées ici, et aucune n'est visible au typage :
 *   1. l'ORDRE — celui que l'auteur a choisi en sélectionnant ses fichiers ;
 *   2. le PLAFOND VISIBLE de la grille — quatre tuiles, puis un compteur ;
 *   3. l'absence de résolution autorisée pour ce qui n'est PAS affiché.
 *
 * La résolution autorisée est observée par les APPELS au réseau plutôt que par
 * le DOM : un média protégé n'atteint l'écran qu'après son blob, et c'est
 * l'appel — pas l'image — qui prouve l'ordre et le compte.
 */

import type { FeedPost } from "@yunicity/types";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CitizenPostCard } from "@/components/feed/citizen-post-card";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BASE = "/api/v1/story-media/11111111-1111-4111-8111-111111111111";
const photo = (n: number) => `${BASE}/photo-${n}.jpg`;
const video = (n: number) => `${BASE}/video-${n}.mp4`;

const { fetchAuthorizedMediaBlob, apiStub } = vi.hoisted(() => {
  const fetchAuthorizedMediaBlob = vi.fn();
  return { fetchAuthorizedMediaBlob, apiStub: { fetchAuthorizedMediaBlob } };
});

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => apiStub,
}));

/** URLs demandées au réseau, dans l'ordre où les tuiles les ont réclamées. */
const requestedUrls = (): string[] =>
  fetchAuthorizedMediaBlob.mock.calls.map((call) => String(call[0]));

beforeEach(() => {
  // Promesse jamais tenue : le test observe la DEMANDE, pas le décodage.
  fetchAuthorizedMediaBlob.mockImplementation(() => new Promise(() => {}));
});

afterEach(() => {
  cleanup();
  fetchAuthorizedMediaBlob.mockReset();
});

function publication(overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    id: "post-1",
    type: "post",
    author: {
      type: "citizen",
      id: "22222222-2222-4222-8222-222222222222",
      display_name: "Kyria Mambu",
      username: "kyria",
      logo_url: null,
    },
    city: "Reims",
    title: null,
    body: "Trois photos de Reims",
    media_url: null,
    location: null,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
    offer: null,
    event: null,
    creator_content: null,
    neighborhood_summary: null,
    created_at: "2026-11-02T09:00:00Z",
    updated_at: "2026-11-02T09:00:00Z",
    ...overrides,
  };
}

const grid = (container: HTMLElement) =>
  container.querySelector('[data-feed-publication-media-kind="grid"]');

describe("grille — ordre, plafond et résolutions", () => {
  it("1 — trois photos rendent une grille, et les demandes suivent l'ORDRE publié", () => {
    const urls = [photo(1), photo(2), photo(3)];
    const { container } = render(<FeedPublicationMedia mediaUrls={urls} label="Reims" />);

    expect(grid(container)).not.toBeNull();
    expect(requestedUrls()).toEqual(urls);
  });

  it("2 — UNE photo garde la présentation mono d'origine, sans grille", () => {
    const { container } = render(<FeedPublicationMedia mediaUrls={[photo(1)]} label="Reims" />);

    expect(grid(container)).toBeNull();
    expect(requestedUrls()).toEqual([photo(1)]);
  });

  it("3 — sans liste, `mediaUrl` seul reste rendu comme avant", () => {
    // Non-régression des publications antérieures : leur colonne `media_urls`
    // n'a jamais été écrite, et le fil rend alors une liste VIDE.
    const { container } = render(
      <FeedPublicationMedia mediaUrl={photo(9)} mediaUrls={[]} label="Reims" />,
    );

    expect(grid(container)).toBeNull();
    expect(requestedUrls()).toEqual([photo(9)]);
  });

  it("4 — au-delà de QUATRE, le plafond visible tient et rien d'invisible n'est résolu", () => {
    const urls = [photo(1), photo(2), photo(3), photo(4), photo(5), photo(6)];
    const { container } = render(<FeedPublicationMedia mediaUrls={urls} label="Reims" />);

    // Le plafond de la grille est CONSERVÉ : quatre tuiles, puis « +2 ».
    const overflowBadge = container.querySelector("[data-publication-media-overflow]");
    expect(overflowBadge?.getAttribute("data-publication-media-overflow")).toBe("2");

    // Et surtout : les deux médias NON affichés ne déclenchent AUCUN appel.
    // Les résoudre paierait un aller-retour authentifié pour rien.
    expect(requestedUrls()).toEqual([photo(1), photo(2), photo(3), photo(4)]);
  });

  it("5 — une VIDÉO de la liste garde son comportement actuel : aucune résolution autorisée", () => {
    /**
     * ⚠️ LIMITE CONNUE, conservée telle quelle (décision de Kyria : « préserver
     * le comportement existant, documenter sa limite »).
     *
     * Une vidéo est rendue par `<video src={url}>` — l'URL BRUTE —, alors que
     * la route `/api/v1/story-media/...` exige un porteur. Une vidéo du fil ne
     * peut donc pas se charger par ce chemin. Ce n'est PAS introduit ici : le
     * rendu mono-vidéo faisait déjà de même. Ce test fige l'état pour que le
     * jour où on le corrige, ce soit une DÉCISION et non un effet de bord.
     */
    const { container } = render(
      <FeedPublicationMedia mediaUrls={[photo(1), video(2)]} label="Reims" />,
    );

    expect(grid(container)).not.toBeNull();
    expect(container.querySelector("video")).not.toBeNull();
    expect(requestedUrls()).toEqual([photo(1)]);
  });

  it("6 — un nouveau rendu ne redemande PAS les mêmes médias", () => {
    const urls = [photo(1), photo(2)];
    const { rerender } = render(<FeedPublicationMedia mediaUrls={urls} label="Reims" />);
    expect(requestedUrls()).toEqual(urls);

    // Une nouvelle liste, de contenu IDENTIQUE : les URL ne changent pas, donc
    // aucune résolution ne doit repartir.
    rerender(<FeedPublicationMedia mediaUrls={[photo(1), photo(2)]} label="Reims" />);
    expect(requestedUrls()).toEqual(urls);
  });
});

describe("câblage des surfaces citoyennes", () => {
  it("7 — la carte du FIL passe la liste à la grille", () => {
    const { container } = render(
      <CitizenPostCard
        currentUserId={null}
        post={publication({
          media_url: photo(1),
          media_urls: [
            { url: photo(1), media_type: "image" },
            { url: photo(2), media_type: "image" },
          ],
        })}
      />,
    );

    expect(grid(container)).not.toBeNull();
    expect(requestedUrls()).toEqual([photo(1), photo(2)]);
  });

  it("8 — la carte du FIL sans média ne rend aucun cadre", () => {
    const { container } = render(<CitizenPostCard currentUserId={null} post={publication()} />);

    expect(container.querySelector("[data-feed-publication-media]")).toBeNull();
    expect(requestedUrls()).toEqual([]);
  });

  it("9 — le PROFIL rend la grille sur un lot de PHOTOS SEULES", () => {
    const { container } = render(
      <ProfileDesktopPublications
        posts={[
          publication({
            media_url: photo(1),
            media_urls: [
              { url: photo(1), media_type: "image" },
              { url: photo(2), media_type: "image" },
              { url: photo(3), media_type: "image" },
            ],
          }),
        ]}
        displayName="Kyria Mambu"
      />,
    );

    expect(grid(container)).not.toBeNull();
    expect(requestedUrls()).toEqual([photo(1), photo(2), photo(3)]);
  });

  it("10 — le PROFIL garde sa présentation d'origine à UNE seule photo", () => {
    // Contrainte explicite : « aucun changement global de présentation
    // mono-photo ». La vignette carrée du profil n'est pas remplacée par la
    // grille du fil.
    const { container } = render(
      <ProfileDesktopPublications
        posts={[
          publication({
            media_url: photo(1),
            media_urls: [{ url: photo(1), media_type: "image" }],
          }),
        ]}
        displayName="Kyria Mambu"
      />,
    );

    expect(grid(container)).toBeNull();
    expect(requestedUrls()).toEqual([photo(1)]);
  });

  it("11 — le PROFIL garde sa présentation d'origine sur un lot MIXTE", () => {
    /**
     * La présentation d'origine du profil ne rendait JAMAIS de vidéo : elle
     * passait par `AuthorizedPostImage`. Monter la grille du fil sur un lot
     * mixte y introduirait une tuile `<video src={URL brute}>`, hors
     * résolution autorisée — la limite vidéo gagnerait une surface.
     *
     * Le lot mixte retombe donc sur le comportement ANTÉRIEUR : une seule
     * vignette, construite depuis `media_url`.
     */
    const { container } = render(
      <ProfileDesktopPublications
        posts={[
          publication({
            media_url: photo(1),
            media_urls: [
              { url: photo(1), media_type: "image" },
              { url: `${BASE}/clip.mp4`, media_type: "video" },
            ],
          }),
        ]}
        displayName="Kyria Mambu"
      />,
    );

    expect(grid(container)).toBeNull();
    expect(container.querySelector("video")).toBeNull();
    expect(requestedUrls()).toEqual([photo(1)]);
  });

  it("12 — un `media_type` qui contredit son fichier n'ouvre pas la grille du PROFIL", () => {
    // Le `media_type` du contrat est le signal premier, mais on ne lui fait
    // pas une confiance aveugle : une entrée annoncée `image` dont l'URL est
    // une vidéo écarte aussi la grille.
    const { container } = render(
      <ProfileDesktopPublications
        posts={[
          publication({
            media_url: photo(1),
            media_urls: [
              { url: photo(1), media_type: "image" },
              { url: `${BASE}/clip.mp4`, media_type: "image" },
            ],
          }),
        ]}
        displayName="Kyria Mambu"
      />,
    );

    expect(grid(container)).toBeNull();
    expect(requestedUrls()).toEqual([photo(1)]);
  });
});

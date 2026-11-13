import { describe, expect, it } from "vitest";

import {
  buildLocalVideoTeaserViewFromFeedItem,
  buildLocalVideoTeaserViewFromNeighborhoodVideo,
  resolveLocalVideoTeaserDestination,
} from "./local-video-teaser-view";

/**
 * VIDEO-03 — teasers territoriaux.
 *
 * Deux contrats serveur distincts alimentent le MEME teaser : le feed
 * (`LocalVideoFeedItem`, carte) et le detail quartier
 * (`NeighborhoodDetailVideoItem`, fiche). Ces tests verrouillent la mise en
 * forme commune, et surtout la seule regle sensible : le CTA « Y aller » ne
 * doit exister que si une destination REELLE et navigable est liee. Fabriquer
 * une destination serait mentir a la personne sur ce qu'elle va trouver.
 */
const AUTEUR = {
  id: "u1",
  username: "camille",
  full_name: "Camille Martin",
  avatar_url: null,
};

function feedItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "v1",
    title: "Marché du Boulingrin",
    thumbnail_url: "https://cdn.test/thumb.jpg",
    duration_seconds: 42,
    video_type: "lieu",
    neighborhood_name: "Centre-ville",
    neighborhood_slug: "centre-ville",
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    author: AUTEUR,
    ...overrides,
  } as Parameters<typeof buildLocalVideoTeaserViewFromFeedItem>[0];
}

function hoodVideo(overrides: Record<string, unknown> = {}) {
  return {
    id: "v9",
    title: "Fête de quartier",
    thumbnail_url: "https://cdn.test/hood.jpg",
    duration_seconds: 90,
    video_type: "evenement",
    neighborhood_slug: "saint-remi",
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    author: AUTEUR,
    ...overrides,
  } as Parameters<typeof buildLocalVideoTeaserViewFromNeighborhoodVideo>[0];
}

describe("resolveLocalVideoTeaserDestination", () => {
  it("renvoie la fiche du lieu quand un lieu est lié", () => {
    expect(
      resolveLocalVideoTeaserDestination({
        cultural_place_slug: "cathedrale-de-reims",
        cultural_place_name: "Cathédrale de Reims",
        local_event_id: null,
      }),
    ).toEqual({ href: "/places/cathedrale-de-reims", label: "Y aller" });
  });

  it("renvoie la fiche de l'événement quand seul un événement est lié", () => {
    expect(
      resolveLocalVideoTeaserDestination({
        cultural_place_slug: null,
        cultural_place_name: null,
        local_event_id: "e42",
      }),
    ).toEqual({ href: "/events/e42", label: "Y aller" });
  });

  it("préfère le lieu quand les deux sont liés", () => {
    const cible = resolveLocalVideoTeaserDestination({
      cultural_place_slug: "halles-du-boulingrin",
      cultural_place_name: "Halles du Boulingrin",
      local_event_id: "e42",
    });
    expect(cible?.href).toBe("/places/halles-du-boulingrin");
  });

  it("ne renvoie rien quand aucune cible n'est liée", () => {
    expect(
      resolveLocalVideoTeaserDestination({
        cultural_place_slug: null,
        cultural_place_name: null,
        local_event_id: null,
      }),
    ).toBeNull();
  });

  it("ne fabrique pas de destination depuis un slug vide", () => {
    expect(
      resolveLocalVideoTeaserDestination({
        cultural_place_slug: "   ",
        cultural_place_name: "Un lieu",
        local_event_id: null,
      }),
    ).toBeNull();
  });

  it("ne fabrique pas de destination depuis un nom de lieu sans slug", () => {
    // Le nom seul ne donne aucune route : masquer plutot que deviner un slug.
    expect(
      resolveLocalVideoTeaserDestination({
        cultural_place_slug: null,
        cultural_place_name: "Cathédrale de Reims",
        local_event_id: null,
      }),
    ).toBeNull();
  });

  it("encode les identifiants pour ne pas casser la route", () => {
    const cible = resolveLocalVideoTeaserDestination({
      cultural_place_slug: null,
      cultural_place_name: null,
      local_event_id: "e 42/x",
    });
    expect(cible?.href).toBe("/events/e%2042%2Fx");
  });
});

describe("buildLocalVideoTeaserViewFromFeedItem", () => {
  it("compose la vue depuis un élément de feed", () => {
    const vue = buildLocalVideoTeaserViewFromFeedItem(feedItem());
    expect(vue).toMatchObject({
      id: "v1",
      title: "Marché du Boulingrin",
      thumbnailUrl: "https://cdn.test/thumb.jpg",
      neighborhoodName: "Centre-ville",
      authorName: "Camille Martin",
      href: "/videos?video=v1",
      duration: "42s",
      destination: null,
    });
  });

  it("expose la destination quand le feed porte un lieu", () => {
    const vue = buildLocalVideoTeaserViewFromFeedItem(
      feedItem({ cultural_place_slug: "operabis", cultural_place_name: "Opéra" }),
    );
    expect(vue.destination).toEqual({ href: "/places/operabis", label: "Y aller" });
  });
});

describe("buildLocalVideoTeaserViewFromNeighborhoodVideo", () => {
  it("compose la vue depuis le détail quartier, avec le nom du quartier fourni", () => {
    const vue = buildLocalVideoTeaserViewFromNeighborhoodVideo(hoodVideo(), "Saint-Remi");
    expect(vue).toMatchObject({
      id: "v9",
      title: "Fête de quartier",
      thumbnailUrl: "https://cdn.test/hood.jpg",
      neighborhoodName: "Saint-Remi",
      authorName: "Camille Martin",
      href: "/videos?video=v9",
      duration: "1:30",
      destination: null,
    });
  });

  it("expose la destination événement du détail quartier", () => {
    const vue = buildLocalVideoTeaserViewFromNeighborhoodVideo(
      hoodVideo({ local_event_id: "e7" }),
      "Saint-Remi",
    );
    expect(vue.destination).toEqual({ href: "/events/e7", label: "Y aller" });
  });

  it("retombe sur un titre lisible quand le titre est absent", () => {
    const vue = buildLocalVideoTeaserViewFromNeighborhoodVideo(
      hoodVideo({ title: null, cultural_place_name: "Basilique Saint-Remi" }),
      "Saint-Remi",
    );
    expect(vue.title).toBe("Basilique Saint-Remi");
  });

  it("reste lisible sans titre ni lieu", () => {
    const vue = buildLocalVideoTeaserViewFromNeighborhoodVideo(
      hoodVideo({ title: null }),
      "Saint-Remi",
    );
    expect(vue.title).toBe("Vidéo locale");
  });
});

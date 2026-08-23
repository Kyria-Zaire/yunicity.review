import type { FeedPost, LocalVideoFeedItem } from "@yunicity/types";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  FEED_STREAM_VIDEO_INDEX,
  buildFeedStream,
  countStreamVideos,
} from "@/lib/feed/feed-stream";

/**
 * C3-FEED-M7-R2.1 — contrat d'assemblage du flux Feed, partage par tous les ecrans.
 *
 * `local_videos` n'a ni `post_id` ni cle etrangere vers `posts` : la video n'est
 * jamais convertie en `FeedPost`, seule sa PLACE est decidee ici. Ces tests
 * verrouillent l'insertion unique, la position stable, les vues ou aucune
 * insertion n'est legitime, et la purete de la fonction.
 */
const post = (id: string): FeedPost => ({ id }) as unknown as FeedPost;
const video = (id = "v1"): LocalVideoFeedItem => ({ id }) as unknown as LocalVideoFeedItem;

describe("buildFeedStream", () => {
  it("insere UNE seule video, apres la premiere publication", () => {
    const flux = buildFeedStream([post("a"), post("b"), post("c")], video(), "for_you");
    expect(flux.map((e) => e.kind)).toEqual(["post", "local-video", "post", "post"]);
    expect(countStreamVideos(flux)).toBe(1);
  });

  it("garde la meme position quand la liste s'allonge (pagination)", () => {
    const courte = buildFeedStream([post("a"), post("b")], video(), "for_you");
    const longue = buildFeedStream(
      [post("a"), post("b"), post("c"), post("d"), post("e")],
      video(),
      "for_you",
    );
    expect(courte.findIndex((e) => e.kind === "local-video")).toBe(FEED_STREAM_VIDEO_INDEX);
    expect(longue.findIndex((e) => e.kind === "local-video")).toBe(FEED_STREAM_VIDEO_INDEX);
    // Une insertion PAR PAGE produirait deux entrees video sur la liste longue.
    expect(countStreamVideos(longue)).toBe(1);
  });

  it("laisse le fil intact quand aucune video n'est disponible", () => {
    const flux = buildFeedStream([post("a"), post("b")], null, "for_you");
    expect(flux.map((e) => e.kind)).toEqual(["post", "post"]);
    expect(countStreamVideos(flux)).toBe(0);
  });

  it("place la video en tete quand aucune publication n'existe", () => {
    const flux = buildFeedStream([], video(), "for_you");
    expect(flux.map((e) => e.kind)).toEqual(["local-video"]);
  });

  it("n'injecte rien dans Recent : la video n'a pas de rang de recence", () => {
    const flux = buildFeedStream([post("a"), post("b")], video(), "recent");
    expect(countStreamVideos(flux)).toBe(0);
  });

  it("n'injecte rien dans Populaire : la video n'a pas de score de popularite", () => {
    const flux = buildFeedStream([post("a"), post("b")], video(), "popular");
    expect(countStreamVideos(flux)).toBe(0);
  });

  it("est pure : n'altere jamais le tableau de publications recu", () => {
    const posts = [post("a"), post("b")];
    const copie = [...posts];
    buildFeedStream(posts, video(), "for_you");
    expect(posts).toEqual(copie);
    expect(posts).toHaveLength(2);
  });

  it("reevaluee, ne cumule jamais deux videos", () => {
    const posts = [post("a"), post("b"), post("c")];
    for (let i = 0; i < 5; i += 1) {
      expect(countStreamVideos(buildFeedStream(posts, video(), "for_you"))).toBe(1);
    }
  });

  it("donne des cles distinctes et stables a chaque entree", () => {
    const flux = buildFeedStream([post("a"), post("b")], video("v9"), "for_you");
    const cles = flux.map((e) => e.key);
    expect(new Set(cles).size).toBe(cles.length);
    expect(cles).toContain("local-video-v9");
  });
});

describe("feed-stream — contrat de module partagé", () => {
  const source = readFileSync(
    fileURLToPath(new URL("./feed-stream.ts", import.meta.url)),
    "utf-8",
  );

  it("ne contient aucun breakpoint", () => {
    // Un breakpoint dans le contrat le rendrait inadoptable par mobile/desktop.
    expect(source).not.toMatch(/\b(640|768|834|1024|1279|1280)\b/);
    expect(source).not.toMatch(/min-width|max-width|@media/);
  });

  it("ne dépend ni de `window` ni du DOM", () => {
    expect(source).not.toMatch(/\bwindow\b/);
    expect(source).not.toMatch(/\bdocument\b/);
    expect(source).not.toMatch(/matchMedia/);
  });

  it("ne dépend d'aucun composant, d'aucun CSS et d'aucune identité medium", () => {
    const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]!);
    expect(imports.every((i) => i.startsWith("@yunicity/"))).toBe(true);
    expect(source).not.toMatch(/\.css|className|components\//);
    // Les IDENTITES medium doivent avoir disparu. Le mot lui-meme reste
    // legitime en prose pour nommer le premier consommateur du contrat.
    expect(source).not.toMatch(/MediumFeedStreamItem|buildMediumFeedStream|medium-feed-stream/);
    expect(source).not.toMatch(/export\s+(type\s+)?\w*Medium\w*/);
  });
});

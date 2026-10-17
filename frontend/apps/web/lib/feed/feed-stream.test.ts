import type { FeedPost, LocalVideoFeedItem } from "@yunicity/types";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  FEED_CONTEXT_MODULE_FAMILIES,
  FEED_CONTEXT_SLOT_POSITIONS,
  type FeedContextModuleFamily,
} from "@/lib/feed/feed-context-stream";
import {
  FEED_STREAM_VIDEO_INDEX,
  buildFeedStream,
  countStreamModules,
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
/*
 * Fabriques REELLEMENT typees : aucune assertion, aucun `as unknown as`. Le
 * compilateur verifie donc la forme complete, et l'ajout d'un champ requis dans
 * `FeedPost` ou `LocalVideoFeedItem` casse ici plutot que de passer en silence.
 * Seul `id` varie — c'est la seule donnee que `buildFeedStream` lit.
 */
const post = (id: string): FeedPost => ({
  id,
  type: "post",
  author: {
    type: "citizen",
    id: `author-${id}`,
    display_name: "Citoyenne QA",
    username: "citoyenne-qa",
    logo_url: null,
  },
  city: "Reims",
  title: null,
  body: "Publication de test",
  media_url: null,
  location: null,
  like_count: 0,
  comment_count: 0,
  liked_by_me: false,
  offer: null,
  event: null,
  creator_content: null,
  neighborhood_summary: null,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
});

const video = (id = "v1"): LocalVideoFeedItem => ({
  id,
  author_user_id: `author-${id}`,
  author: {
    id: `author-${id}`,
    username: "videaste-qa",
    full_name: "Videaste QA",
    avatar_url: null,
  },
  city: "Reims",
  neighborhood_id: "neighborhood-qa",
  neighborhood_name: "Centre-ville",
  neighborhood_slug: "centre-ville",
  video_type: "moment",
  title: "Moment local",
  description: null,
  cultural_place_id: null,
  cultural_place_slug: null,
  cultural_place_name: null,
  local_event_id: null,
  tribe_id: null,
  organization_id: null,
  media_url: "/media/qa/qa-sample-video.mp4",
  thumbnail_url: "/media/qa/qa-sample-video.png",
  duration_seconds: 42,
  media_width: 1920,
  media_height: 1080,
  mime_type: "video/mp4",
  latitude: null,
  longitude: null,
  status: "published",
  published_at: "2026-01-01T10:00:00Z",
  created_at: "2026-01-01T10:00:00Z",
  distance_meters: null,
  walk_minutes: null,
  like_count: 0,
  comment_count: 0,
  view_count: 0,
  liked_by_me: false,
});

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
    /*
     * C3-FEED-UNIFIED-CONTEXT-STREAM-R1 : la regle etait « tout import commence
     * par `@yunicity/` ». Elle exprimait l'intention — aucun composant, aucun
     * CSS — mais interdisait aussi un contrat FRERE et pur du meme calque
     * (`lib/feed/feed-context-stream`), ce qui n'a jamais ete le but. La regle
     * dit maintenant ce qu'elle voulait dire : paquets partages, ou contrats
     * purs de `lib/`. Rien d'autre.
     */
    expect(
      imports.every((i) => i.startsWith("@yunicity/") || i.startsWith("@/lib/")),
      `imports hors calque : ${imports.filter((i) => !i.startsWith("@yunicity/") && !i.startsWith("@/lib/")).join(", ")}`,
    ).toBe(true);
    expect(source).not.toMatch(/\.css|className|components\/|hooks\/|from "react"/);
    // Les IDENTITES medium doivent avoir disparu. Le mot lui-meme reste
    // legitime en prose pour nommer le premier consommateur du contrat.
    expect(source).not.toMatch(/MediumFeedStreamItem|buildMediumFeedStream|medium-feed-stream/);
    expect(source).not.toMatch(/export\s+(type\s+)?\w*Medium\w*/);
  });
});

/**
 * C3-FEED-UNIFIED-CONTEXT-STREAM-R1 — modules contextuels dans le meme flux.
 *
 * Un module n'est JAMAIS un `FeedPost` : il ne porte qu'une identite de famille,
 * et le rendu decidera quoi en faire. Il ne compte jamais comme contenu reel,
 * sinon la cadence se decalerait a chaque insertion.
 */
const TOUTES = [...FEED_CONTEXT_MODULE_FAMILIES];

/** `n` publications, identifiants stables et ordonnes. */
const posts = (n: number): FeedPost[] =>
  Array.from({ length: n }, (_, i) => post(`p${String(i).padStart(2, "0")}`));

/** Rangs (1-indexes) des modules parmi les contenus reels qui les precedent. */
function rangsContextuels(flux: ReturnType<typeof buildFeedStream>): number[] {
  const rangs: number[] = [];
  let reels = 0;
  for (const item of flux) {
    if (item.kind === "context-module") rangs.push(reels);
    else reels += 1;
  }
  return rangs;
}

const avec = (familles: readonly FeedContextModuleFamily[]) => ({
  availableContextFamilies: familles,
});

describe("buildFeedStream — modules contextuels", () => {
  it("zero contenu : aucun module", () => {
    expect(buildFeedStream([], null, "for_you", avec(TOUTES))).toEqual([]);
  });

  it("moins de quatre contenus : aucun module", () => {
    for (const n of [1, 2, 3]) {
      const flux = buildFeedStream(posts(n), null, "for_you", avec(TOUTES));
      expect(countStreamModules(flux), `${n} contenus`).toBe(0);
    }
  });

  it("premier module EXACTEMENT apres le quatrieme contenu reel", () => {
    const flux = buildFeedStream(posts(4), null, "for_you", avec(TOUTES));
    expect(countStreamModules(flux)).toBe(1);
    expect(flux[4]).toEqual({
      kind: "context-module",
      key: "context-must-see",
      family: "must-see",
    });
  });

  it("positions cumulees 4, 10, 17 et 24", () => {
    const flux = buildFeedStream(posts(30), null, "for_you", avec(TOUTES));
    expect(rangsContextuels(flux)).toEqual([...FEED_CONTEXT_SLOT_POSITIONS]);
  });

  it("la video locale COMPTE comme contenu reel", () => {
    // 3 posts + 1 video = 4 contenus reels -> le premier module apparait.
    const flux = buildFeedStream(posts(3), video(), "for_you", avec(TOUTES));
    expect(countStreamModules(flux)).toBe(1);
    expect(rangsContextuels(flux)).toEqual([4]);
    // Sans la video, 3 contenus ne suffisent pas.
    expect(countStreamModules(buildFeedStream(posts(3), null, "for_you", avec(TOUTES)))).toBe(0);
  });

  it("respecte la priorite par defaut", () => {
    const flux = buildFeedStream(posts(30), null, "for_you", avec(TOUTES));
    const familles = flux.flatMap((i) => (i.kind === "context-module" ? [i.family] : []));
    expect(familles).toEqual(["must-see", "local-privilege", "tribes", "local-now"]);
  });

  it("must-see indisponible : local-privilege prend le premier slot", () => {
    const flux = buildFeedStream(
      posts(30),
      null,
      "for_you",
      avec(["local-privilege", "tribes", "local-now"]),
    );
    const familles = flux.flatMap((i) => (i.kind === "context-module" ? [i.family] : []));
    expect(familles).toEqual(["local-privilege", "tribes", "local-now"]);
    expect(rangsContextuels(flux)).toEqual([4, 10, 17]);
  });

  it("plusieurs familles indisponibles : pas de trou artificiel", () => {
    const flux = buildFeedStream(posts(30), null, "for_you", avec(["local-now"]));
    expect(rangsContextuels(flux)).toEqual([4]);
  });

  it("toutes indisponibles : flux strictement identique a l'existant", () => {
    const sans = buildFeedStream(posts(30), video(), "for_you");
    const vide = buildFeedStream(posts(30), video(), "for_you", avec([]));
    expect(vide).toEqual(sans);
    expect(countStreamModules(vide)).toBe(0);
  });

  it("jamais deux modules consecutifs", () => {
    const flux = buildFeedStream(posts(30), video(), "for_you", avec(TOUTES));
    for (let i = 1; i < flux.length; i += 1) {
      const paire = `${flux[i - 1]!.kind}+${flux[i]!.kind}`;
      expect(paire, `position ${i}`).not.toBe("context-module+context-module");
    }
  });

  it("une seule occurrence par famille", () => {
    const flux = buildFeedStream(posts(60), video(), "for_you", avec(TOUTES));
    const familles = flux.flatMap((i) => (i.kind === "context-module" ? [i.family] : []));
    expect(new Set(familles).size).toBe(familles.length);
  });

  it("aucune repetition au-dela de 24 contenus", () => {
    const flux = buildFeedStream(posts(120), null, "for_you", avec(TOUTES));
    expect(countStreamModules(flux)).toBe(4);
  });

  it("stable de 10 a 20 puis 30 contenus : les rangs deja poses ne bougent pas", () => {
    const r10 = rangsContextuels(buildFeedStream(posts(10), null, "for_you", avec(TOUTES)));
    const r20 = rangsContextuels(buildFeedStream(posts(20), null, "for_you", avec(TOUTES)));
    const r30 = rangsContextuels(buildFeedStream(posts(30), null, "for_you", avec(TOUTES)));
    expect(r10).toEqual([4, 10]);
    expect(r20).toEqual([4, 10, 17]);
    expect(r30).toEqual([4, 10, 17, 24]);
    // Chaque releve est un PREFIXE du suivant : rien n'a ete deplace.
    expect(r20.slice(0, r10.length)).toEqual(r10);
    expect(r30.slice(0, r20.length)).toEqual(r20);
  });

  it("append 20 vers 40 : les modules deja poses gardent leur position", () => {
    const pageOne = buildFeedStream(posts(20), video(), "for_you", avec(TOUTES));
    const pageTwo = buildFeedStream(posts(40), video(), "for_you", avec(TOUTES));
    const firstFamilies = pageOne
      .filter((item) => item.kind === "context-module")
      .map((item) => item.key);
    const secondFamilies = pageTwo
      .filter((item) => item.kind === "context-module")
      .map((item) => item.key);

    expect(rangsContextuels(pageOne)).toEqual([4, 10, 17]);
    expect(rangsContextuels(pageTwo)).toEqual([4, 10, 17, 24]);
    expect(secondFamilies.slice(0, firstFamilies.length)).toEqual(firstFamilies);
  });

  it("reevaluation idempotente", () => {
    const a = buildFeedStream(posts(30), video(), "for_you", avec(TOUTES));
    const b = buildFeedStream(posts(30), video(), "for_you", avec(TOUTES));
    expect(b).toEqual(a);
  });

  it("cles uniques entre posts, videos et modules", () => {
    const flux = buildFeedStream(posts(30), video(), "for_you", avec(TOUTES));
    const cles = flux.map((i) => i.key);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("recent : ni video ni module", () => {
    const flux = buildFeedStream(posts(30), video(), "recent", avec(TOUTES));
    expect(countStreamVideos(flux)).toBe(0);
    expect(countStreamModules(flux)).toBe(0);
    expect(flux).toHaveLength(30);
  });

  it("popular : ni video ni module", () => {
    const flux = buildFeedStream(posts(30), video(), "popular", avec(TOUTES));
    expect(countStreamVideos(flux)).toBe(0);
    expect(countStreamModules(flux)).toBe(0);
    expect(flux).toHaveLength(30);
  });

  it("PUR : n'altere ni la liste de posts ni la liste de familles", () => {
    const entree = posts(30);
    const copiePosts = [...entree];
    const familles: FeedContextModuleFamily[] = [...TOUTES];
    const copieFamilles = [...familles];
    buildFeedStream(entree, video(), "for_you", avec(familles));
    expect(entree).toEqual(copiePosts);
    expect(familles).toEqual(copieFamilles);
  });

  it("l'ordre des publications reste celui de l'entree", () => {
    const entree = posts(30);
    const flux = buildFeedStream(entree, video(), "for_you", avec(TOUTES));
    const rendus = flux.flatMap((i) => (i.kind === "post" ? [i.post.id] : []));
    expect(rendus).toEqual(entree.map((p) => p.id));
  });

  it("la position editoriale de la video est preservee", () => {
    const flux = buildFeedStream(posts(30), video(), "for_you", avec(TOUTES));
    expect(flux[FEED_STREAM_VIDEO_INDEX]!.kind).toBe("local-video");
    expect(countStreamVideos(flux)).toBe(1);
  });

  it("un module n'est jamais un FeedPost", () => {
    const flux = buildFeedStream(posts(30), null, "for_you", avec(TOUTES));
    for (const item of flux) {
      if (item.kind !== "context-module") continue;
      expect(Object.keys(item).sort()).toEqual(["family", "key", "kind"]);
      expect("post" in item).toBe(false);
      expect("video" in item).toBe(false);
    }
  });
});

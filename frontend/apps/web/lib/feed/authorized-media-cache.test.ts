// @vitest-environment jsdom

/**
 * Conservation temporaire des médias dans une SESSION AUTORISÉE.
 *
 * ⛔ Ce n'est pas un cache HTTP : la route média reste `private, no-store`, et
 * rien ici ne change cet en-tête. Ce qui est conservé est le Blob déjà obtenu
 * par l'application, en mémoire d'onglet.
 *
 * Trois propriétés sont verrouillées ici, et aucune n'est visible au typage :
 *   1. l'ISOLATION entre comptes — une URL identique ne traverse pas un
 *      changement de session ;
 *   2. la BORNE EN OCTETS — borner le seul nombre d'entrées laisserait dix
 *      photos de 8 Mo occuper 80 Mo ;
 *   3. l'ÉVICTION LRU, et la libération du Blob qu'elle entraîne.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __authorizedMediaCacheStateForTests,
  __authorizedObjectUrlRetainCountForTests,
  __resetAuthorizedMediaSessionForTests,
  clearAuthorizedMediaSession,
  dropCachedAuthorizedMedia,
  putCachedAuthorizedMedia,
  takeCachedAuthorizedMedia,
} from "@yunicity/utils";

const MEDIA = (n: number) => `/api/v1/story-media/user/photo-${n}.jpg`;

let created = 0;
const revoked: string[] = [];

beforeEach(() => {
  created = 0;
  revoked.length = 0;
  // Le registre n'accepte QUE des `blob:` — un stub d'une autre forme serait
  // refusé en silence.
  Object.defineProperty(URL, "createObjectURL", {
    value: vi.fn(() => `blob:media-${++created}`),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    value: vi.fn((url: string) => {
      revoked.push(url);
    }),
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  __resetAuthorizedMediaSessionForTests();
});

const blobUrl = () => URL.createObjectURL(new Blob(["x"]));

describe("isolation par session autorisée", () => {
  it("1 — une URL identique n'est PAS réutilisée après un changement de compte", () => {
    const url = blobUrl();
    putCachedAuthorizedMedia(MEDIA(1), "card", url, 1024);
    expect(takeCachedAuthorizedMedia(MEDIA(1), "card")).toBe(url);

    // Déconnexion / changement de compte / 401 : la purge centrale.
    clearAuthorizedMediaSession();

    /**
     * ⛔ LE POINT CRITIQUE. Le compte suivant demande EXACTEMENT la même URL.
     * S'il récupérait l'entrée, il verrait la photo du compte précédent.
     */
    expect(takeCachedAuthorizedMedia(MEDIA(1), "card")).toBeNull();
    expect(__authorizedMediaCacheStateForTests().size).toBe(0);
  });

  it("2 — une entrée d'epoch périmée est refusée ET retirée", () => {
    // Même garantie, par l'autre chemin : l'epoch est comparée à CHAQUE
    // lecture. Elle tient donc même si un chemin de changement de compte
    // oubliait d'appeler la purge.
    const url = blobUrl();
    putCachedAuthorizedMedia(MEDIA(2), "card", url, 512);
    clearAuthorizedMediaSession();
    putCachedAuthorizedMedia(MEDIA(3), "card", blobUrl(), 512);

    expect(takeCachedAuthorizedMedia(MEDIA(2), "card")).toBeNull();
    expect(takeCachedAuthorizedMedia(MEDIA(3), "card")).not.toBeNull();
  });

  it("3 — la purge RÉVOQUE les Blobs conservés", () => {
    const url = blobUrl();
    putCachedAuthorizedMedia(MEDIA(4), "card", url, 2048);

    clearAuthorizedMediaSession();

    expect(revoked).toContain(url);
    expect(__authorizedMediaCacheStateForTests().bytes).toBe(0);
  });
});

describe("variante et clé", () => {
  it("4 — `card` et `viewer` sont deux entrées DISTINCTES", () => {
    // Même photo, deux poids très différents : les confondre servirait une
    // vignette dans la visionneuse, ou l'inverse.
    const card = blobUrl();
    const viewer = blobUrl();
    putCachedAuthorizedMedia(MEDIA(5), "card", card, 200_000);
    putCachedAuthorizedMedia(MEDIA(5), "viewer", viewer, 800_000);

    expect(takeCachedAuthorizedMedia(MEDIA(5), "card")).toBe(card);
    expect(takeCachedAuthorizedMedia(MEDIA(5), "viewer")).toBe(viewer);
    expect(__authorizedMediaCacheStateForTests().size).toBe(2);
  });
});

describe("bornes", () => {
  it("5 — la borne est en OCTETS, pas seulement en nombre d'entrées", () => {
    /**
     * Quatre photos de 16 Mo dépassent le plafond de 48 Mo alors que le
     * nombre d'entrées (4) reste très loin de sa limite. Si seul le nombre
     * bornait, l'onglet porterait 64 Mo de Blobs — et serait tué par le
     * système sur mobile avant d'avoir atteint la limite.
     */
    const SIXTEEN_MB = 16 * 1024 * 1024;
    for (let i = 1; i <= 4; i += 1) {
      putCachedAuthorizedMedia(MEDIA(10 + i), "card", blobUrl(), SIXTEEN_MB);
    }

    const state = __authorizedMediaCacheStateForTests();
    expect(state.bytes).toBeLessThanOrEqual(48 * 1024 * 1024);
    expect(state.size).toBeLessThan(4);
  });

  it("6 — l'éviction est LRU : la plus anciennement UTILISÉE part la première", () => {
    const EIGHTEEN_MB = 18 * 1024 * 1024;
    const first = blobUrl();
    const second = blobUrl();
    putCachedAuthorizedMedia(MEDIA(21), "card", first, EIGHTEEN_MB);
    putCachedAuthorizedMedia(MEDIA(22), "card", second, EIGHTEEN_MB);

    // On RELIT la première : elle devient la plus récemment utilisée.
    expect(takeCachedAuthorizedMedia(MEDIA(21), "card")).toBe(first);

    // Une troisième fait déborder : c'est la DEUXIÈME qui doit partir.
    putCachedAuthorizedMedia(MEDIA(23), "card", blobUrl(), EIGHTEEN_MB);

    expect(takeCachedAuthorizedMedia(MEDIA(22), "card")).toBeNull();
    expect(takeCachedAuthorizedMedia(MEDIA(21), "card")).not.toBeNull();
  });

  it("7 — une photo plus lourde que le plafond n'est pas conservée du tout", () => {
    // La conserver viderait le cache pour une seule entrée, qu'il faudrait
    // évincer aussitôt.
    putCachedAuthorizedMedia(MEDIA(30), "card", blobUrl(), 64 * 1024 * 1024);

    expect(takeCachedAuthorizedMedia(MEDIA(30), "card")).toBeNull();
    expect(__authorizedMediaCacheStateForTests().size).toBe(0);
  });
});

describe("retrait ciblé", () => {
  it("8 — `drop` retire l'entrée et relâche sa part du Blob", () => {
    /**
     * C'est ce qui rend le réessai possible : sans ce retrait, un Blob déclaré
     * image mais indécodable resterait conservé, et « réessayer » reservirait
     * le même échec indéfiniment.
     */
    const url = blobUrl();
    putCachedAuthorizedMedia(MEDIA(40), "card", url, 1024);
    expect(__authorizedObjectUrlRetainCountForTests(url)).toBeGreaterThan(0);

    dropCachedAuthorizedMedia(MEDIA(40), "card");

    expect(takeCachedAuthorizedMedia(MEDIA(40), "card")).toBeNull();
    expect(__authorizedObjectUrlRetainCountForTests(url)).toBe(0);
    expect(revoked).toContain(url);
  });
});

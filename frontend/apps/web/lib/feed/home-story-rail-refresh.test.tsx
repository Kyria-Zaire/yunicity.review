// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetStoryRingsFreshnessForTests, markStoryRingsStale } from "@yunicity/utils";

/**
 * Rail « Moments près de vous » après publication — PR202-MOBILE-P0.
 *
 * Défaut observé sur iPhone : une Story publiée apparaissait dans `/stories`
 * sous « Votre story », mais le rail de l'accueil continuait d'afficher
 * l'entrée précédente. Les deux surfaces appellent pourtant `listStoryRings()`.
 *
 * La cause n'est donc pas la source mais le moment : l'accueil ne lisait qu'au
 * montage de son contexte, et revenir en arrière depuis Safari iOS restaure la
 * page depuis le bfcache sans rejouer les effets.
 *
 * Deux exigences opposées sont épinglées ici. Ne jamais manquer une
 * publication — c'est le bug. Et ne jamais recharger sans raison : un refetch à
 * chaque changement d'onglet serait une régression réseau, pas un correctif.
 */

const ANNEAU_AVANT = {
  author_id: "u-autre",
  latest_story_id: "s-ancienne",
  latest_media_url: null,
  title: "Centre-ville",
  subtitle: "7 sept.",
};
const ANNEAU_APRES = {
  author_id: "u-moi",
  latest_story_id: "s-nouvelle",
  latest_media_url: null,
  title: "Ma story",
  subtitle: "maintenant",
};

const listStoryRings = vi.fn();

/**
 * Bouchon STABLE : le hook dépend de `api`. Un objet neuf à chaque rendu
 * relancerait l'effet en boucle et le test mesurerait un artefact.
 */
const apiStub = {
  getProfileMe: vi.fn(),
  listStoryRings,
  listCulturalPlaces: vi.fn(),
  fetchPublicPartnerOffers: vi.fn(),
  events: { listEvents: vi.fn(), listSavedEvents: vi.fn() },
  neighborhoods: { listNeighborhoods: vi.fn() },
  tribes: { listTribes: vi.fn() },
};

vi.mock("@/hooks/use-yunicity-api", () => ({ useYunicityApi: () => apiStub }));
vi.mock("@/lib/auth/auth-provider", () => ({ useAuth: () => ({ user: { city: "reims" } }) }));

import { useFeedPortalContext } from "@/hooks/use-feed-portal-context";

function vide() {
  return Promise.resolve({ items: [] });
}

beforeEach(() => {
  __resetStoryRingsFreshnessForTests();
  listStoryRings.mockReset();
  listStoryRings.mockResolvedValue({ items: [ANNEAU_AVANT] });
  apiStub.getProfileMe.mockResolvedValue({ city: "reims", avatar_url: null });
  apiStub.listCulturalPlaces.mockImplementation(vide);
  apiStub.fetchPublicPartnerOffers.mockImplementation(vide);
  apiStub.events.listEvents.mockImplementation(vide);
  apiStub.events.listSavedEvents.mockImplementation(vide);
  apiStub.neighborhoods.listNeighborhoods.mockImplementation(vide);
  apiStub.tribes.listTribes.mockImplementation(vide);
});

afterEach(cleanup);

async function monter() {
  const vue = renderHook(() => useFeedPortalContext());
  await waitFor(() => expect(listStoryRings).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(vue.result.current.loading).toBe(false));
  return vue;
}

/** Ce que fait Safari en restaurant la page depuis le bfcache. */
async function retourSurLAccueil() {
  await act(async () => {
    window.dispatchEvent(new Event("pageshow"));
    await Promise.resolve();
  });
}

describe("PR202-MOBILE-P0 — le rail d'accueil suit les publications", () => {
  it("charge les anneaux au premier affichage", async () => {
    const vue = await monter();
    expect(vue.result.current.storyRings).toEqual([ANNEAU_AVANT]);
  });

  it("revenir sans avoir publié ne déclenche AUCUN appel", async () => {
    await monter();

    await retourSurLAccueil();
    await retourSurLAccueil();

    expect(listStoryRings).toHaveBeenCalledTimes(1);
  });

  it("après publication, le retour sur l'accueil recharge et montre la story", async () => {
    const vue = await monter();
    expect(vue.result.current.storyRings).toEqual([ANNEAU_AVANT]);

    listStoryRings.mockResolvedValue({ items: [ANNEAU_APRES, ANNEAU_AVANT] });
    act(() => markStoryRingsStale());
    await retourSurLAccueil();

    await waitFor(() => expect(listStoryRings).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(vue.result.current.storyRings).toEqual([ANNEAU_APRES, ANNEAU_AVANT]),
    );
  });

  it("l'ancienne entrée ne subsiste pas en double", async () => {
    const vue = await monter();

    listStoryRings.mockResolvedValue({ items: [ANNEAU_APRES, ANNEAU_AVANT] });
    act(() => markStoryRingsStale());
    await retourSurLAccueil();

    await waitFor(() => expect(vue.result.current.storyRings).toHaveLength(2));
    const ids = vue.result.current.storyRings.map((r) => r.latest_story_id);
    expect(new Set(ids).size, "un anneau apparaît deux fois").toBe(ids.length);
  });

  it("un seul rechargement pour une seule publication", async () => {
    await monter();

    act(() => markStoryRingsStale());
    await retourSurLAccueil();
    await waitFor(() => expect(listStoryRings).toHaveBeenCalledTimes(2));

    // Retours suivants : plus rien à rattraper.
    await retourSurLAccueil();
    await retourSurLAccueil();
    expect(listStoryRings).toHaveBeenCalledTimes(2);
  });

  it("deux publications successives sont toutes deux rattrapées", async () => {
    await monter();

    act(() => markStoryRingsStale());
    await retourSurLAccueil();
    await waitFor(() => expect(listStoryRings).toHaveBeenCalledTimes(2));

    act(() => markStoryRingsStale());
    await retourSurLAccueil();
    await waitFor(() => expect(listStoryRings).toHaveBeenCalledTimes(3));
  });

  it("l'onglet redevenu visible rattrape aussi la publication", async () => {
    await monter();
    act(() => markStoryRingsStale());

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    await waitFor(() => expect(listStoryRings).toHaveBeenCalledTimes(2));
  });

  it("un échec réseau laisse le rail vide plutôt qu'obsolète", async () => {
    const vue = await monter();

    listStoryRings.mockRejectedValue(new Error("reseau"));
    act(() => markStoryRingsStale());
    await retourSurLAccueil();

    await waitFor(() => expect(vue.result.current.storyRings).toEqual([]));
  });
});

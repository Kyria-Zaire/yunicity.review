// @vitest-environment jsdom

/**
 * TRIBE-JOIN-PENDING-RELOAD-01 (TRI-02) — la fiche d'une tribu dépend de l'identité du
 * lecteur (membre, demande en attente). Au rechargement, la session web n'est restaurée
 * qu'à la fin de l'amorçage d'`AuthProvider` : une fiche chargée avant part SANS jeton et
 * revient anonyme.
 *
 * Le faux serveur ci-dessous répond selon le jeton présent AU MOMENT de l'appel
 * (`server.bearer`), comme `get_current_user_optional` côté API.
 */

import type { Tribe } from "@yunicity/types";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTribeDetail } from "@/hooks/use-tribe-detail";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type AuthState = {
  user: { id: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const mocks = vi.hoisted(() => {
  const auth: { state: AuthState } = {
    state: { user: null, isLoading: true, isAuthenticated: false },
  };
  /** Identifiant dont le jeton est en mémoire ; `null` = requête anonyme. */
  const server: { bearer: string | null } = { bearer: null };
  const emptyPage = { items: [], total: 0 };
  const api = {
    tribes: {
      getTribe: vi.fn<(slug: string, city: string) => Promise<Tribe>>(),
      listTribeMembers: vi.fn(() => Promise.resolve(emptyPage)),
      listTribes: vi.fn(() => Promise.resolve(emptyPage)),
      listTribePosts: vi.fn(() => Promise.resolve({ items: [], next_cursor: null })),
    },
    events: { listEvents: vi.fn(() => Promise.resolve(emptyPage)) },
    neighborhoods: { listNeighborhoods: vi.fn(() => Promise.resolve(emptyPage)) },
    listCulturalPlaces: vi.fn(() => Promise.resolve(emptyPage)),
    fetchPublicPartnerOffers: vi.fn(() => Promise.resolve(emptyPage)),
  };
  return { auth, server, api };
});

vi.mock("@/lib/auth/auth-provider", () => ({ useAuth: () => mocks.auth.state }));
vi.mock("@/hooks/use-yunicity-api", () => ({ useYunicityApi: () => mocks.api }));

const SLUG = "qa-tribu-privee";
const CITY = "Reims";
const REQUESTER = "user-demandeur";
const MEMBER = "user-membre";

function tribeSeenBy(viewer: string | null): Tribe {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    slug: SLUG,
    name: "QA Tribu privée",
    description: "Tribu de recette.",
    city: CITY,
    category: "other",
    visibility: "private_invite",
    persistence_kind: "permanent",
    cover_image_url: null,
    is_featured: false,
    member_limit: 50,
    active_member_count: 3,
    is_archived: false,
    viewer_is_member: viewer === MEMBER,
    viewer_role: viewer === MEMBER ? "member" : null,
    viewer_notifications_muted: false,
    viewer_has_pending_join_request: viewer === REQUESTER,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function setAuth(next: AuthState) {
  mocks.auth.state = next;
}

function signedIn(id: string): AuthState {
  return { user: { id }, isLoading: false, isAuthenticated: true };
}

const BOOTSTRAPPING: AuthState = { user: null, isLoading: true, isAuthenticated: false };
const ANONYMOUS: AuthState = { user: null, isLoading: false, isAuthenticated: false };

/** Fin de l'amorçage : le jeton est restauré, puis le fournisseur publie l'utilisateur. */
async function finishBootstrap(rerender: () => void, viewer: string | null) {
  await act(async () => {
    mocks.server.bearer = viewer;
    setAuth(viewer ? signedIn(viewer) : ANONYMOUS);
    rerender();
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

function getTribeCalls(): number {
  return mocks.api.tribes.getTribe.mock.calls.length;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.server.bearer = null;
  setAuth(BOOTSTRAPPING);
  mocks.api.tribes.getTribe.mockReset();
  mocks.api.tribes.getTribe.mockImplementation(() =>
    Promise.resolve(tribeSeenBy(mocks.server.bearer)),
  );
});

afterEach(cleanup);

describe("TRI-02 — rechargement de la fiche : la session d'abord", () => {
  it("C2 — demandeur : après rechargement, la fiche porte la demande en attente", async () => {
    const { result, rerender } = renderHook(() => useTribeDetail(SLUG, CITY));
    await flush();
    await finishBootstrap(rerender, REQUESTER);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tribe?.viewer_has_pending_join_request).toBe(true);
  });

  it("C5 — membre : après rechargement, la fiche le reconnaît comme membre", async () => {
    const { result, rerender } = renderHook(() => useTribeDetail(SLUG, CITY));
    await flush();
    await finishBootstrap(rerender, MEMBER);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tribe?.viewer_is_member).toBe(true);
    expect(result.current.tribe?.viewer_role).toBe("member");
  });

  it("C1 — aucun appel pendant l'amorçage, un seul appel ensuite", async () => {
    const { result, rerender } = renderHook(() => useTribeDetail(SLUG, CITY));
    await flush();
    expect(getTribeCalls()).toBe(0);
    expect(result.current.loading).toBe(true);

    await finishBootstrap(rerender, REQUESTER);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getTribeCalls()).toBe(1);
  });

  it("C3 — visiteur anonyme : la fiche se charge à la fin de l'amorçage", async () => {
    const { result, rerender } = renderHook(() => useTribeDetail(SLUG, CITY));
    await flush();
    await finishBootstrap(rerender, null);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getTribeCalls()).toBe(1);
    expect(result.current.error).toBeNull();
    expect(result.current.tribe?.viewer_is_member).toBe(false);
    expect(result.current.tribe?.viewer_has_pending_join_request).toBe(false);
  });

  it("C4 — changement d'identité (A → B, puis déconnexion) : la fiche est rechargée", async () => {
    mocks.server.bearer = REQUESTER;
    setAuth(signedIn(REQUESTER));
    const { result, rerender } = renderHook(() => useTribeDetail(SLUG, CITY));
    await waitFor(() => expect(result.current.tribe?.viewer_has_pending_join_request).toBe(true));
    expect(getTribeCalls()).toBe(1);

    await finishBootstrap(rerender, MEMBER);
    await waitFor(() => expect(result.current.tribe?.viewer_is_member).toBe(true));
    expect(result.current.tribe?.viewer_has_pending_join_request).toBe(false);
    expect(getTribeCalls()).toBe(2);

    await finishBootstrap(rerender, null);
    await waitFor(() => expect(result.current.tribe?.viewer_is_member).toBe(false));
    expect(result.current.tribe?.viewer_has_pending_join_request).toBe(false);
    expect(getTribeCalls()).toBe(3);
    expect(result.current.loading).toBe(false);
  });

  it("C7 — navigation interne (session déjà prête) : un seul chargement, même si l'objet utilisateur change", async () => {
    mocks.server.bearer = REQUESTER;
    setAuth(signedIn(REQUESTER));
    const { result, rerender } = renderHook(() => useTribeDetail(SLUG, CITY));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tribe?.viewer_has_pending_join_request).toBe(true);

    // Même identité, nouvel objet (ex. `refreshUser`) : pas de rechargement.
    await act(async () => {
      setAuth(signedIn(REQUESTER));
      rerender();
    });
    await flush();
    expect(getTribeCalls()).toBe(1);
  });

  it("C8 — une réponse ancienne reçue après un changement d'utilisateur ne remplace pas la nouvelle", async () => {
    let releaseOld: (tribe: Tribe) => void = () => undefined;
    mocks.api.tribes.getTribe.mockImplementationOnce(
      () =>
        new Promise<Tribe>((resolve) => {
          releaseOld = resolve;
        }),
    );
    mocks.server.bearer = REQUESTER;
    setAuth(signedIn(REQUESTER));
    const { result, rerender } = renderHook(() => useTribeDetail(SLUG, CITY));
    await flush();
    expect(getTribeCalls()).toBe(1);

    // B se connecte pendant que la réponse de A est encore en vol.
    await finishBootstrap(rerender, MEMBER);
    await waitFor(() => expect(result.current.tribe?.viewer_is_member).toBe(true));
    expect(getTribeCalls()).toBe(2);

    // La réponse de A arrive en retard.
    await act(async () => {
      releaseOld(tribeSeenBy(REQUESTER));
      await Promise.resolve();
    });
    await flush();

    expect(result.current.tribe?.viewer_is_member).toBe(true);
    expect(result.current.tribe?.viewer_has_pending_join_request).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("C8 — un changement d'identité sans nouvel appel (amorçage en cours) invalide la réponse en vol", async () => {
    let releaseOld: (tribe: Tribe) => void = () => undefined;
    mocks.api.tribes.getTribe.mockImplementationOnce(
      () =>
        new Promise<Tribe>((resolve) => {
          releaseOld = resolve;
        }),
    );
    mocks.server.bearer = REQUESTER;
    setAuth(signedIn(REQUESTER));
    const { result, rerender } = renderHook(() => useTribeDetail(SLUG, CITY));
    await flush();
    expect(getTribeCalls()).toBe(1);

    // L'identité change et la session repasse en amorçage : aucun nouvel appel n'est lancé.
    await act(async () => {
      mocks.server.bearer = null;
      setAuth(BOOTSTRAPPING);
      rerender();
    });
    expect(getTribeCalls()).toBe(1);

    await act(async () => {
      releaseOld(tribeSeenBy(REQUESTER));
      await Promise.resolve();
    });
    await flush();

    expect(result.current.tribe).toBeNull();
    expect(mocks.api.events.listEvents).not.toHaveBeenCalled();
  });

  it("C8 — au démontage, la réponse en vol est invalidée (aucun appel de suite)", async () => {
    let releaseOld: (tribe: Tribe) => void = () => undefined;
    mocks.api.tribes.getTribe.mockImplementationOnce(
      () =>
        new Promise<Tribe>((resolve) => {
          releaseOld = resolve;
        }),
    );
    mocks.server.bearer = REQUESTER;
    setAuth(signedIn(REQUESTER));
    const { unmount } = renderHook(() => useTribeDetail(SLUG, CITY));
    await flush();
    expect(getTribeCalls()).toBe(1);

    unmount();
    await act(async () => {
      releaseOld(tribeSeenBy(REQUESTER));
      await Promise.resolve();
    });
    await flush();

    // Invalidée : le chargement s'arrête après `getTribe`, sans lancer la suite.
    expect(mocks.api.events.listEvents).not.toHaveBeenCalled();
    expect(mocks.api.tribes.listTribeMembers).not.toHaveBeenCalled();
  });
});

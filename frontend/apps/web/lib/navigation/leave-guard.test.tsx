// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — la sortie de `/feed/new` est confirmée, quel que soit le
 * chemin : lien du chrome (top nav, rail, barre basse) ou action du Create Hub.
 */

import { cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLeaveGuard } from "@/hooks/use-leave-guard";
import { navigateFromCreateHub } from "@/lib/create-hub/create-hub-navigation";
import { guardNavigation, internalLeaveTarget } from "@/lib/navigation/leave-guard";

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: vi.fn(), back: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  routerPush.mockReset();
  // La sentinelle d'historique survivrait d'un test à l'autre (jsdom partagé).
  window.history.replaceState(null, "", window.location.href);
});

function clicSur(anchor: HTMLAnchorElement, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
  anchor.dispatchEvent(event);
  return event;
}

describe("internalLeaveTarget", () => {
  const ICI = new URL("/feed/new", window.location.origin).href;

  function lien(href: string, attrs: Record<string, string> = {}): HTMLAnchorElement {
    const a = document.createElement("a");
    a.href = href;
    for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
    document.body.appendChild(a);
    return a;
  }

  function cible(a: HTMLAnchorElement, init: MouseEventInit = {}): string | null {
    let resultat: string | null = null;
    a.addEventListener("click", (e) => {
      resultat = internalLeaveTarget(e, ICI);
      e.preventDefault();
    });
    clicSur(a, init);
    a.remove();
    return resultat;
  }

  it("retient un lien interne vers une autre page", () => {
    expect(cible(lien("/map?zone=1"))).toBe("/map?zone=1");
  });

  it("laisse passer : même page, externe, nouvel onglet, téléchargement, modificateur", () => {
    expect(cible(lien("/feed/new"))).toBeNull();
    expect(cible(lien("https://exemple.test/"))).toBeNull();
    expect(cible(lien("/map", { target: "_blank" }))).toBeNull();
    expect(cible(lien("/fichier.pdf", { download: "" }))).toBeNull();
    expect(cible(lien("/map"), { ctrlKey: true })).toBeNull();
  });
});

describe("useLeaveGuard", () => {
  it("un lien du chrome est retenu puis suivi seulement après confirmation", () => {
    const onIntercept = vi.fn();
    renderHook(() => useLeaveGuard({ active: true, onIntercept }));
    const { getByText } = render(<a href="/map">Carte</a>);

    const event = clicSur(getByText("Carte") as HTMLAnchorElement);
    expect(event.defaultPrevented).toBe(true);
    expect(onIntercept).toHaveBeenCalledTimes(1);
    expect(routerPush).not.toHaveBeenCalled();

    const proceed = onIntercept.mock.calls[0]![0] as () => void;
    proceed();
    expect(routerPush).toHaveBeenCalledWith("/map");
  });

  it("inactive, elle ne retient rien", () => {
    const onIntercept = vi.fn();
    renderHook(() => useLeaveGuard({ active: false, onIntercept }));
    const { getByText } = render(<a href="/map">Carte</a>);
    const a = getByText("Carte") as HTMLAnchorElement;
    a.addEventListener("click", (e) => e.preventDefault());
    clicSur(a);
    expect(onIntercept).not.toHaveBeenCalled();
  });

  it("le Create Hub passe par la même garde", () => {
    const onIntercept = vi.fn();
    renderHook(() => useLeaveGuard({ active: true, onIntercept }));
    const router = { push: vi.fn() };
    navigateFromCreateHub("/stories/new", { pathname: "/feed/new", router });
    expect(router.push).not.toHaveBeenCalled();
    expect(onIntercept).toHaveBeenCalledTimes(1);
  });

  it("choisir dans le Create Hub la page déjà ouverte ne navigue pas", () => {
    const onIntercept = vi.fn();
    renderHook(() => useLeaveGuard({ active: true, onIntercept }));
    const router = { push: vi.fn() };
    navigateFromCreateHub("/feed/new", { pathname: "/feed/new", router });
    expect(router.push).not.toHaveBeenCalled();
    expect(onIntercept).not.toHaveBeenCalled();
  });

  it("le démontage retire la garde", () => {
    const onIntercept = vi.fn();
    const { unmount } = renderHook(() => useLeaveGuard({ active: true, onIntercept }));
    unmount();
    const proceed = vi.fn();
    guardNavigation(proceed);
    expect(proceed).toHaveBeenCalledTimes(1);
    expect(onIntercept).not.toHaveBeenCalled();
  });

  it("le rechargement et la fermeture d'onglet demandent confirmation", () => {
    renderHook(() => useLeaveGuard({ active: true, onIntercept: vi.fn() }));
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("« Précédent » du navigateur est retenu, puis suivi après confirmation", () => {
    const onIntercept = vi.fn();
    const pushState = vi.spyOn(window.history, "pushState");
    const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
    try {
      const { unmount } = renderHook(() => useLeaveGuard({ active: true, onIntercept }));
      // Une sentinelle est empilée, marquée, à la MÊME URL.
      expect(pushState).toHaveBeenCalledTimes(1);
      const [etat, , url] = pushState.mock.calls[0]!;
      expect(etat).toMatchObject({ __yunicityLeaveGuard: true });
      expect(url).toBe(window.location.href);

      window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
      expect(onIntercept).toHaveBeenCalledTimes(1);
      // La sentinelle est réarmée : un second « Précédent » serait lui aussi retenu.
      expect(pushState).toHaveBeenCalledTimes(2);
      expect(go).not.toHaveBeenCalled();

      (onIntercept.mock.calls[0]![0] as () => void)();
      expect(go).toHaveBeenCalledWith(-2);
      unmount();
    } finally {
      pushState.mockRestore();
      go.mockRestore();
    }
  });

  it("pas de seconde sentinelle si l'entrée courante en est déjà une", () => {
    window.history.replaceState({ __yunicityLeaveGuard: true }, "", window.location.href);
    const pushState = vi.spyOn(window.history, "pushState");
    try {
      const { unmount } = renderHook(() => useLeaveGuard({ active: true, onIntercept: vi.fn() }));
      expect(pushState).not.toHaveBeenCalled();
      unmount();
    } finally {
      pushState.mockRestore();
      window.history.replaceState(null, "", window.location.href);
    }
  });
});


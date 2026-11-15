/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";

import {
  DESKTOP_OVERLAY_RVIDE_PAGE_BUDGET,
  DESKTOP_OVERLAY_WHEEL_GESTURE_IDLE_MS,
  DESKTOP_OVERLAY_WHEEL_MIN_LOCK_MS,
  DESKTOP_OVERLAY_WHEEL_THRESHOLD_PX,
  appendPageToSequence,
  applyDesktopOverlayScrollLock,
  createDesktopOverlayWheelGate,
  createTraversalSequence,
  indexInSequence,
  releaseDesktopOverlayScrollLock,
  resolveGridRestoreTarget,
  resolveRVideAfterEmptyCycle,
  shouldIgnoreOverlayArrowKeys,
  shouldIgnoreOverlayWheel,
} from "./desktop-overlay-navigation";

describe("VIDEO-REFONTE-L8 — R-ORD", () => {
  it("pas de répétition : page avec doublon + plus récentes → ajout en fin seulement", () => {
    const S0 = createTraversalSequence(["a", "b", "c"], "c");
    expect(S0).toEqual(["a", "b", "c"]);
    const S1 = appendPageToSequence(S0, ["b", "d", "e"]);
    expect(S1).toEqual(["a", "b", "c", "d", "e"]);
    expect(new Set(S1).size).toBe(S1.length);
  });

  it("pas de saut : parcours ▼ avec pages qui réordonneraient la grille", () => {
    let S = createTraversalSequence(["a", "b", "c"], "a");
    const viewed: string[] = [];
    let index = 0;
    const pages = [
      ["c", "d"], // c déjà vu
      ["e", "a", "f"], // a déjà vu
      ["g"],
    ];
    viewed.push(S[index]!);
    for (const page of pages) {
      S = appendPageToSequence(S, page);
      while (index < S.length - 1) {
        index += 1;
        viewed.push(S[index]!);
      }
    }
    expect(viewed).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
    expect(new Set(viewed).size).toBe(viewed.length);
  });

  it("préserve l'index / id courant après append", () => {
    const S0 = createTraversalSequence(["a", "b", "c"], "b");
    const indexBefore = indexInSequence(S0, "b");
    const S1 = appendPageToSequence(S0, ["d", "e"]);
    expect(indexInSequence(S1, "b")).toBe(indexBefore);
    expect(S1[indexBefore]).toBe("b");
  });

  it("ouverture directe hors grille : S commence par la vidéo demandée, sans doublon", () => {
    const S = createTraversalSequence(["a", "b", "c"], "shared", { directOutsideGrid: true });
    expect(S[0]).toBe("shared");
    expect(S).toEqual(["shared", "a", "b", "c"]);
  });

  it("ouverture directe d'une vidéo aussi dans la grille : un seul exemplaire en tête", () => {
    const S = createTraversalSequence(["a", "b", "c"], "b", { directOutsideGrid: true });
    expect(S[0]).toBe("b");
    expect(S.filter((id) => id === "b")).toHaveLength(1);
    expect(S).toEqual(["b", "a", "c"]);
  });
});

describe("VIDEO-REFONTE-L8 — R-VIDE", () => {
  it("3 pages vides + next_cursor → continue, pas de fin", () => {
    const status = resolveRVideAfterEmptyCycle({
      pagesAttempted: DESKTOP_OVERLAY_RVIDE_PAGE_BUDGET,
      addedCount: 0,
      hasMore: true,
    });
    expect(status).toEqual({ kind: "continue" });
  });

  it("liste épuisée → exhausted", () => {
    const status = resolveRVideAfterEmptyCycle({
      pagesAttempted: 1,
      addedCount: 0,
      hasMore: false,
    });
    expect(status).toEqual({ kind: "exhausted" });
  });

  it("une vidéo trouvée → idle (▼ y mène côté hook)", () => {
    const status = resolveRVideAfterEmptyCycle({
      pagesAttempted: 2,
      addedCount: 1,
      hasMore: true,
    });
    expect(status).toEqual({ kind: "idle" });
  });
});

describe("VIDEO-REFONTE-L8 — R-FOCUS", () => {
  it("dernière vue présente dans la grille", () => {
    expect(
      resolveGridRestoreTarget({
        lastViewedVideoId: "c",
        openingVideoId: "a",
        gridIds: ["a", "b", "c"],
      }),
    ).toEqual({ kind: "tile", videoId: "c" });
  });

  it("dernière vue absente → vignette d'ouverture", () => {
    expect(
      resolveGridRestoreTarget({
        lastViewedVideoId: "gone",
        openingVideoId: "a",
        gridIds: ["a", "b"],
      }),
    ).toEqual({ kind: "tile", videoId: "a" });
  });

  it("ouverture directe sans vignette → titre de grille", () => {
    expect(
      resolveGridRestoreTarget({
        lastViewedVideoId: "x",
        openingVideoId: "x",
        gridIds: ["a", "b"],
      }),
    ).toEqual({ kind: "gridTitle" });
  });
});

describe("VIDEO-REFONTE-L8 — flèches clavier", () => {
  it("ignore saisie et panneaux listbox/menu", () => {
    const input = document.createElement("input");
    expect(shouldIgnoreOverlayArrowKeys(input)).toBe(true);
    const div = document.createElement("div");
    div.setAttribute("role", "listbox");
    const option = document.createElement("div");
    div.appendChild(option);
    document.body.appendChild(div);
    expect(shouldIgnoreOverlayArrowKeys(option)).toBe(true);
    div.remove();
  });
});

describe("VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01 — molette", () => {
  it("Ctrl+molette et panneaux portail sont ignorés", () => {
    const overlay = document.createElement("div");
    overlay.setAttribute("data-videos-desktop-overlay", "");
    const stage = document.createElement("div");
    overlay.appendChild(stage);
    document.body.appendChild(overlay);

    expect(
      shouldIgnoreOverlayWheel({ ctrlKey: true, metaKey: false, deltaY: 80, target: stage }),
    ).toBe(true);

    const portal = document.createElement("div");
    portal.setAttribute("data-yunicity-overlay", "bottom");
    const inside = document.createElement("div");
    portal.appendChild(inside);
    document.body.appendChild(portal);
    expect(
      shouldIgnoreOverlayWheel({ ctrlKey: false, metaKey: false, deltaY: 80, target: inside }),
    ).toBe(true);

    expect(
      shouldIgnoreOverlayWheel({ ctrlKey: false, metaKey: false, deltaY: 80, target: stage }),
    ).toBe(false);

    portal.remove();
    overlay.remove();
  });

  it("gate : une seule nav par geste ; queue d’inertie avalée (trous inclus)", () => {
    const gate = createDesktopOverlayWheelGate({
      thresholdPx: DESKTOP_OVERLAY_WHEEL_THRESHOLD_PX,
      gestureIdleMs: DESKTOP_OVERLAY_WHEEL_GESTURE_IDLE_MS,
      minLockMs: DESKTOP_OVERLAY_WHEEL_MIN_LOCK_MS,
    });
    expect(gate.consume(20, 0)).toBeNull();
    expect(gate.consume(20, 10)).toBeNull();
    expect(gate.consume(20, 20)).toBe("next");
    /* Inertie dense puis espacée, y compris après 650 ms : pas de 2e saut. */
    expect(gate.consume(80, 30)).toBeNull();
    expect(gate.consume(120, 200)).toBeNull();
    expect(gate.consume(200, 600)).toBeNull();
    expect(gate.consume(200, 900)).toBeNull();
    expect(gate.consume(80, 1100)).toBeNull();
    /* Silence après le dernier événement → nouveau geste. */
    const afterIdle = 1100 + DESKTOP_OVERLAY_WHEEL_GESTURE_IDLE_MS + 1;
    expect(gate.consume(60, afterIdle)).toBe("next");
  });

  it("gate : changement de sens = nouveau geste immédiat", () => {
    const gate = createDesktopOverlayWheelGate({
      thresholdPx: 40,
      gestureIdleMs: 450,
      minLockMs: 650,
    });
    expect(gate.consume(50, 0)).toBe("next");
    expect(gate.consume(80, 20)).toBeNull();
    /* Sens inverse lève le verrou de geste. */
    expect(gate.consume(-50, 40)).toBe("previous");
  });

  it("scroll-lock : ouvertures répétées ne cumulent pas paddingRight", () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.scrollbarGutter = "stable";

    const s1 = applyDesktopOverlayScrollLock();
    const pad1 = document.body.style.paddingRight;
    releaseDesktopOverlayScrollLock(s1);
    expect(document.body.style.paddingRight).toBe("");
    expect(document.documentElement.style.scrollbarGutter).toBe("stable");

    const s2 = applyDesktopOverlayScrollLock();
    expect(document.body.style.paddingRight).toBe(pad1);
    releaseDesktopOverlayScrollLock(s2);
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.paddingRight).toBe("");

    const s3 = applyDesktopOverlayScrollLock();
    releaseDesktopOverlayScrollLock(s3);
    expect(document.documentElement.style.overflow).toBe("");
  });
});

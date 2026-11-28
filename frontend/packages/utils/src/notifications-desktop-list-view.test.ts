import { describe, expect, it } from "vitest";

import type { UserNotificationItem } from "@yunicity/types";

import { resolveNotificationDesktopListView } from "./notifications-desktop-list-view";
import { buildNotificationDesktopRow } from "./notifications-desktop-presenter";

const DAY = 86_400_000;

function item(id: string, ageDays: number | "illisible", isRead = false): UserNotificationItem {
  return {
    id,
    type: "POST_COMMENTED",
    actor_id: "a1",
    actor_name: `Acteur ${id}`,
    target_post_id: null,
    deeplink: null,
    payload: {},
    is_read: isRead,
    created_at:
      ageDays === "illisible" ? "pas-une-date" : new Date(Date.now() - ageDays * DAY).toISOString(),
  };
}

function view(items: UserNotificationItem[], showEarlier = false) {
  const rows = items.map((entry) => buildNotificationDesktopRow(entry, "/notifications"));
  return resolveNotificationDesktopListView(rows, items, { showEarlier });
}

function sectionsOf(result: ReturnType<typeof view>) {
  expect(result.kind).toBe("list");
  return result.kind === "list" ? result.sections.map((s) => s.section) : [];
}

describe("resolveNotificationDesktopListView (NOTIF-DESKTOP-EARLIER-01)", () => {
  it("T1 — anciennes seules : dépliées d'office, jamais d'état vide, pas de bouton", () => {
    const result = view([item("a", 30), item("b", 12)]);
    expect(sectionsOf(result)).toEqual(["earlier"]);
    expect(result.kind === "list" && result.canLoadEarlier).toBe(false);
    expect(result.kind === "list" && result.sections[0]?.items.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("T3 — mélange récentes / anciennes : anciennes repliées, bouton offert", () => {
    const result = view([item("r", 0), item("w", 3), item("o", 30)]);
    expect(sectionsOf(result)).toEqual(["today", "this_week"]);
    expect(result.kind === "list" && result.canLoadEarlier).toBe(true);
  });

  it("T3 bis — mélange, anciennes demandées : tout est rendu, plus de bouton", () => {
    const result = view([item("r", 0), item("o", 30)], true);
    expect(sectionsOf(result)).toEqual(["today", "earlier"]);
    expect(result.kind === "list" && result.canLoadEarlier).toBe(false);
  });

  it("T4 / T6 — liste vide (boîte vide ou filtre sans résultat) : état vide légitime", () => {
    expect(view([])).toEqual({ kind: "empty" });
    expect(view([], true)).toEqual({ kind: "empty" });
  });

  it("T5 — date illisible seule : visible parmi « Plus tôt », pas d'état vide", () => {
    const result = view([item("x", "illisible")]);
    expect(sectionsOf(result)).toEqual(["earlier"]);
  });

  it("T5 bis — date illisible avec une récente : repliée derrière le bouton", () => {
    const result = view([item("r", 0), item("x", "illisible")]);
    expect(sectionsOf(result)).toEqual(["today"]);
    expect(result.kind === "list" && result.canLoadEarlier).toBe(true);
  });

  it("seuil inchangé — J-6 est récente, J-7 est « Plus tôt »", () => {
    expect(sectionsOf(view([item("j6", 6), item("j7", 7)]))).toEqual(["this_week"]);
    expect(sectionsOf(view([item("j7", 7)]))).toEqual(["earlier"]);
  });
});

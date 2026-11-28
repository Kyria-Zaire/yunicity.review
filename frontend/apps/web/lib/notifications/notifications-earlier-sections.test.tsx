// @vitest-environment jsdom
// NOTIF-DESKTOP-EARLIER-01 — plus de faux état vide quand aucune notification n'est récente,
// aux trois paliers web. Les vues sont rendues telles quelles ; seule la LISTE est inspectée
// (les encarts « À ne pas manquer » citent aussi des notifications).

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { UserNotificationItem } from "@yunicity/types";
import {
  NOTIFICATIONS_DESKTOP_LOAD_PREVIOUS,
  NOTIFICATIONS_DESKTOP_SECTION_EARLIER,
  NOTIFICATIONS_DESKTOP_TYPE_ALL,
  NOTIFICATIONS_DESKTOP_TYPE_STATUS,
  NOTIFICATIONS_EMPTY_TITLE,
  NOTIFICATIONS_MOBILE_FILTERS_ARIA,
} from "@yunicity/utils";
import { afterEach, describe, expect, it } from "vitest";

import { NotificationsDesktopScreen } from "@/components/notifications/desktop";
import { NotificationsMediumScreen } from "@/components/notifications/medium";
import { NotificationsMobileView } from "@/components/notifications/mobile";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DAY = 86_400_000;

function item(id: string, ageDays: number | "illisible", isRead = false): UserNotificationItem {
  return {
    id,
    type: "POST_COMMENTED",
    actor_id: "a1",
    actor_name: `Acteur-${id}`,
    target_post_id: null,
    deeplink: null,
    payload: {},
    is_read: isRead,
    created_at:
      ageDays === "illisible" ? "pas-une-date" : new Date(Date.now() - ageDays * DAY).toISOString(),
  };
}

function props(allItems: UserNotificationItem[]) {
  return {
    allItems,
    unreadCount: allItems.filter((entry) => !entry.is_read).length,
    preferences: null,
    isLoading: false,
    isSavingPrefs: false,
    error: null,
    sessionExpired: false,
    localHints: [],
    onMarkRead: () => undefined,
    onMarkAllRead: () => undefined,
    onPreferenceChange: () => undefined,
    onReload: () => undefined,
  };
}

/** Sections de la LISTE uniquement : libellé de section → texte rendu. */
function listSections(): Map<string, string> {
  const nodes = document.querySelectorAll(
    "section[data-notifications-desktop-section], [data-notifications-mobile-list] section",
  );
  return new Map(
    [...nodes].map((node) => [node.querySelector("h2")?.textContent?.trim() ?? "", node.textContent ?? ""]),
  );
}

function loadPreviousButton() {
  return screen.queryByRole("button", { name: NOTIFICATIONS_DESKTOP_LOAD_PREVIOUS });
}

function emptyTitle() {
  return screen.queryByText(NOTIFICATIONS_EMPTY_TITLE);
}

function clickUnreadTab() {
  const tab = screen.getAllByRole("tab").find((node) => /non lues/i.test(node.textContent ?? ""));
  expect(tab, "onglet « Non lues » introuvable").toBeDefined();
  fireEvent.click(tab as HTMLElement);
}

/** Filtre de type : liste déroulante (desktop, medium) ou panneau de filtres (mobile). */
function chooseType(label: string) {
  const select = screen
    .queryAllByRole("combobox")
    .find((node) => [...(node as HTMLSelectElement).options].some((option) => option.text === label));
  if (select) {
    const option = [...(select as HTMLSelectElement).options].find((entry) => entry.text === label);
    fireEvent.change(select, { target: { value: option?.value } });
    return;
  }
  fireEvent.click(screen.getByRole("button", { name: NOTIFICATIONS_MOBILE_FILTERS_ARIA }));
  fireEvent.click(screen.getByRole("button", { name: label }));
}

const SCREENS = {
  desktop: NotificationsDesktopScreen,
  medium: NotificationsMediumScreen,
  mobile: NotificationsMobileView,
} as const;

afterEach(cleanup);

describe.each(Object.entries(SCREENS))("palier %s", (_name, Screen) => {
  it("anciennes seules : rendues sous « Plus tôt », sans état vide ni bouton", () => {
    render(<Screen {...props([item("o1", 30), item("o2", 12)])} />);

    expect(emptyTitle()).toBeNull();
    const earlier = listSections().get(NOTIFICATIONS_DESKTOP_SECTION_EARLIER) ?? "";
    expect(earlier).toContain("Acteur-o1");
    expect(earlier).toContain("Acteur-o2");
    expect(loadPreviousButton()).toBeNull();
  });

  it("mélange récentes / anciennes : anciennes repliées derrière le bouton, puis dépliées", () => {
    render(<Screen {...props([item("r1", 0), item("o1", 30)])} />);

    expect(listSections().has(NOTIFICATIONS_DESKTOP_SECTION_EARLIER)).toBe(false);
    expect([...listSections().values()].join(" ")).toContain("Acteur-r1");
    const button = loadPreviousButton();
    expect(button).not.toBeNull();

    fireEvent.click(button as HTMLElement);
    expect(listSections().get(NOTIFICATIONS_DESKTOP_SECTION_EARLIER) ?? "").toContain("Acteur-o1");
    expect(loadPreviousButton()).toBeNull();
  });

  it("onglet « Non lues » ne laissant que des anciennes : pas d'impasse après le changement", () => {
    render(<Screen {...props([item("r1", 0, true), item("o1", 30)])} />);
    expect(loadPreviousButton()).not.toBeNull();

    clickUnreadTab();

    expect(emptyTitle()).toBeNull();
    expect(listSections().get(NOTIFICATIONS_DESKTOP_SECTION_EARLIER) ?? "").toContain("Acteur-o1");
  });

  it("filtre de type sans résultat : état vide légitime, puis retour à la liste sans impasse", () => {
    render(<Screen {...props([item("o1", 30), item("o2", 20)])} />);

    chooseType(NOTIFICATIONS_DESKTOP_TYPE_STATUS);
    expect(emptyTitle()).not.toBeNull();
    expect(listSections().size).toBe(0);

    chooseType(NOTIFICATIONS_DESKTOP_TYPE_ALL);
    expect(emptyTitle()).toBeNull();
    expect(listSections().get(NOTIFICATIONS_DESKTOP_SECTION_EARLIER) ?? "").toContain("Acteur-o2");
  });

  it("boîte vide : état vide légitime", () => {
    render(<Screen {...props([])} />);
    expect(emptyTitle()).not.toBeNull();
    expect(loadPreviousButton()).toBeNull();
  });

  it("date illisible : la notification reste visible sous « Plus tôt »", () => {
    render(<Screen {...props([item("x1", "illisible")])} />);
    expect(emptyTitle()).toBeNull();
    expect(listSections().get(NOTIFICATIONS_DESKTOP_SECTION_EARLIER) ?? "").toContain("Acteur-x1");
  });
});

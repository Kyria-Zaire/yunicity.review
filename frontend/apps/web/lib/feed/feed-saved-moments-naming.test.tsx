// @vitest-environment jsdom

/**
 * FEED-FAVORITES-NAMING-01 (EVT-06) — l'entrée du rail gauche desktop du fil ouvre les
 * moments (événements) enregistrés : elle s'appelle « Moments enregistrés », plus
 * « Mes favoris ». Le panneau dit la fenêtre réellement affichée (30 prochains jours).
 *
 * Vérifie le texte visible, le nom accessible et la navigation inchangée (`saved`).
 * Ne fige ni l'icône ni ses classes : le visuel se contrôle au navigateur.
 */

import type { LocalEvent } from "@yunicity/types";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedDesktopLeftRail } from "@/components/feed/desktop/feed-desktop-left-rail";
import { FeedSavedEventsPanel } from "@/components/feed/portal/feed-saved-events-panel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Enfants du rail hors sujet : le bouton Créer dépend de providers, la météo d'un service.
vi.mock("@/components/create-hub/create-hub-trigger-button", () => ({
  CreateHubTriggerButton: () => null,
}));
vi.mock("@/components/feed/portal/feed-weather-card", () => ({
  FeedWeatherCard: () => null,
}));

const SAVED_LABEL = "Moments enregistrés";
const WINDOW_TEXT = "Dans les 30 prochains jours";

const SAVED_EVENT: LocalEvent = {
  id: "evt-1",
  organization_id: null,
  title: "Marché du Boulingrin",
  description: null,
  event_type: "local_market",
  city: "Reims",
  district: "Centre-ville",
  starts_at: "2026-11-28T09:00:00.000Z",
  ends_at: "2026-11-28T13:00:00.000Z",
  timezone: "Europe/Paris",
  location_name: "Halles du Boulingrin",
  address: null,
  latitude: null,
  longitude: null,
  cover_image_url: null,
  moderation_status: "approved",
  is_cancelled: false,
  interested_by_me: true,
  interest_count: 1,
  organization: null,
  created_at: "2026-11-01T00:00:00.000Z",
};

function renderRail(leftNav: "saved" | null, onNavSelect = vi.fn()) {
  render(
    <FeedDesktopLeftRail
      city="Reims"
      activeView="for_you"
      leftNav={leftNav}
      onNavSelect={onNavSelect}
      weather={{ weather: null, loading: false, error: false }}
    />,
  );
  return onNavSelect;
}

afterEach(() => {
  cleanup();
});

describe("FEED-FAVORITES-NAMING-01 — rail gauche desktop du fil", () => {
  it("nomme l'entrée « Moments enregistrés », texte visible et nom accessible", () => {
    renderRail(null);
    const nav = screen.getByRole("complementary", { name: "Navigation du fil" });
    const entry = within(nav).getByRole("button", { name: SAVED_LABEL });

    expect(entry.textContent?.trim()).toBe(SAVED_LABEL);
    expect(within(nav).queryByText(/favoris/i)).toBeNull();
  });

  it("garde la navigation vers la vue `saved` et l'état actif", () => {
    const onNavSelect = renderRail(null);
    fireEvent.click(screen.getByRole("button", { name: SAVED_LABEL }));
    expect(onNavSelect).toHaveBeenCalledWith("saved");

    cleanup();
    renderRail("saved");
    expect(screen.getByRole("button", { name: SAVED_LABEL }).getAttribute("aria-current")).toBe(
      "page",
    );
  });
});

describe("FEED-FAVORITES-NAMING-01 — panneau des moments enregistrés", () => {
  it("dit la fenêtre des 30 prochains jours quand la liste est vide", () => {
    render(<FeedSavedEventsPanel events={[]} city="Reims" />);
    expect(screen.getByText("Aucun moment enregistré")).toBeTruthy();
    expect(screen.getByText(WINDOW_TEXT)).toBeTruthy();
  });

  it("dit la fenêtre sous le titre, identique au libellé du rail, quand la liste est remplie", () => {
    render(<FeedSavedEventsPanel events={[SAVED_EVENT]} city="Reims" />);
    const region = screen.getByRole("region", { name: SAVED_LABEL });

    expect(within(region).getByRole("heading", { level: 2, name: SAVED_LABEL })).toBeTruthy();
    expect(within(region).getByText(WINDOW_TEXT)).toBeTruthy();
    expect(within(region).getByRole("link", { name: /Marché du Boulingrin/ })).toBeTruthy();
  });
});

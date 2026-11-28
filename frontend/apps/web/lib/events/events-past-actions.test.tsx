// @vitest-environment jsdom

/**
 * EVENTS-PAST-01 — fiche d'un événement terminé, trois formats.
 * - terminé, non enregistré ou visiteur : « Cet événement est terminé. », aucun ajout, aucun lien Google Agenda ;
 * - terminé, enregistré : l'indication + un seul bouton « Retirer de mon agenda » ;
 * - retrait réussi : « Retiré de votre agenda. », sans réenregistrement ;
 * - échec : bouton conservé + erreur, aucun faux succès ;
 * - à venir / en cours : actions inchangées ;
 * - fiche ouverte au franchissement de la fin : bascule sans rechargement.
 */

import type { LocalEvent } from "@yunicity/types";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventDesktopMeta } from "@/components/events/desktop/event-desktop-meta";
import { EventDesktopRightRail } from "@/components/events/desktop/event-desktop-right-rail";
import type { EventEndedRemoval, EventEndedRemovalStatus } from "@/components/events/event-ended-actions";
import { EventMediumParticipateCard } from "@/components/events/medium/event-medium-participate-card";
import { EventMobileDetailInfoCard } from "@/components/events/mobile/event-mobile-detail-info-card";
import { EventMobileDetailShareSave } from "@/components/events/mobile/event-mobile-detail-share-save";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { EventDetailTiming } from "@/hooks/use-event-detail-timing";

const NOW = Date.parse("2026-11-12T19:00:00Z");
const H = 3_600_000;

function fixture(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "00000000-0000-4000-8000-000000000104",
    organization_id: null,
    title: "Concert fictif",
    description: "Événement fictif.",
    event_type: "concert",
    city: "Reims",
    district: null,
    starts_at: new Date(NOW - 3 * 24 * H).toISOString(),
    ends_at: new Date(NOW - 3 * 24 * H + 2 * H).toISOString(),
    timezone: "Europe/Paris",
    location_name: "Lieu fictif",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    interest_count: 3,
    organization: null,
    neighborhood_summary: null,
    created_at: new Date(NOW - 30 * 24 * H).toISOString(),
    ...overrides,
  };
}

function fakeContext(event: LocalEvent, patch: Partial<EventDetailContextState> = {}): EventDetailContextState {
  return {
    loading: false,
    error: false,
    isCancelled: false,
    isNotFound: false,
    event,
    city: "Reims",
    relatedEvents: [],
    nearbyPlaces: [],
    neighborhoods: [],
    neighborhoodContext: null,
    tribes: [],
    passportOffers: [],
    savedEvents: [],
    culturalPlaces: [],
    patchEvent: () => undefined,
    syncPlanningAfterInterest: async () => undefined,
    reload: () => undefined,
    ...patch,
  };
}

const ENDED: EventDetailTiming = { status: "ended", countdownLabel: "Terminé" };
const ONGOING: EventDetailTiming = { status: "ongoing", countdownLabel: "En cours" };
const removal = (status: EventEndedRemovalStatus = "idle", onRemove = () => undefined): EventEndedRemoval => ({
  status,
  onRemove,
});

type Format = { nom: string; rendu: (e: LocalEvent, t: EventDetailTiming, auth: boolean, r: EventEndedRemoval) => ReactNode };

const FORMATS: Format[] = [
  {
    nom: "desktop",
    rendu: (e, t, auth, r) => (
      <>
        <EventDesktopMeta event={e} badges={[]} subtitle="" toggling={false} isAuthenticated={auth} onToggleInterest={() => undefined} isEnded={t.status === "ended"} />
        <EventDesktopRightRail event={e} context={fakeContext(e)} toggling={false} isAuthenticated={auth} onToggleInterest={() => undefined} timing={t} endedRemoval={r} />
      </>
    ),
  },
  {
    nom: "medium",
    rendu: (e, t, auth, r) => (
      <>
        <EventDesktopMeta event={e} badges={[]} subtitle="" toggling={false} isAuthenticated={auth} onToggleInterest={() => undefined} isEnded={t.status === "ended"} />
        <EventMediumParticipateCard event={e} toggling={false} isAuthenticated={auth} onToggleInterest={() => undefined} timing={t} endedRemoval={r} />
      </>
    ),
  },
  {
    nom: "mobile",
    rendu: (e, t, auth, r) => (
      <>
        <EventMobileDetailInfoCard event={e} toggling={false} isAuthenticated={auth} onToggleInterest={() => undefined} timing={t} endedRemoval={r} />
        <EventMobileDetailShareSave eventId={e.id} title={e.title} interestedByMe={e.interested_by_me} toggling={false} isAuthenticated={auth} onToggleInterest={() => undefined} isEnded={t.status === "ended"} />
      </>
    ),
  },
];

const ADD_LABELS = /^(Participer|Ça m'intéresse|Intéressé·e|Enregistrer|Enregistré)$/;

function buttonNames(container: HTMLElement): string[] {
  return within(container)
    .queryAllByRole("button")
    .map((b) => (b.getAttribute("aria-label") ?? b.textContent ?? "").trim());
}

function googleLinks(container: HTMLElement): number {
  return container.querySelectorAll("a[href*='calendar.google.com']").length;
}

afterEach(cleanup);

describe.each(FORMATS)("EVENTS-PAST-01 — composants, format $nom", ({ rendu }) => {
  it("terminé, connecté, non enregistré : indication seule, aucun ajout ni lien Google Agenda", () => {
    const { container } = render(rendu(fixture(), ENDED, true, removal()));
    expect(screen.getByText("Cet événement est terminé.")).toBeTruthy();
    expect(buttonNames(container).filter((n) => ADD_LABELS.test(n))).toEqual([]);
    expect(screen.queryByRole("button", { name: /Retirer de mon agenda/ })).toBeNull();
    expect(googleLinks(container)).toBe(0);
  });

  it("terminé, visiteur : indication seule, aucun bouton désactivé laissé en place", () => {
    const { container } = render(rendu(fixture(), ENDED, false, removal()));
    expect(screen.getByText("Cet événement est terminé.")).toBeTruthy();
    expect(buttonNames(container).filter((n) => ADD_LABELS.test(n))).toEqual([]);
    expect(googleLinks(container)).toBe(0);
  });

  it("terminé, enregistré : indication + UN seul bouton « Retirer de mon agenda »", () => {
    const onRemove = vi.fn();
    const { container } = render(rendu(fixture({ interested_by_me: true }), ENDED, true, removal("idle", onRemove)));
    expect(screen.getByText("Cet événement est terminé.")).toBeTruthy();
    const retirer = screen.getAllByRole("button", { name: "Retirer de mon agenda" });
    expect(retirer).toHaveLength(1);
    expect(buttonNames(container).filter((n) => ADD_LABELS.test(n))).toEqual([]);
    expect(googleLinks(container)).toBe(0);
    fireEvent.click(retirer[0]!);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("retrait en cours : bouton inopérant et occupé, mais focusable (aria-disabled)", () => {
    const onRemove = vi.fn();
    render(rendu(fixture({ interested_by_me: true }), ENDED, true, removal("pending", onRemove)));
    const bouton = screen.getByRole("button", { name: "Retirer de mon agenda" }) as HTMLButtonElement;
    expect(bouton.disabled).toBe(false);
    expect(bouton.getAttribute("aria-disabled")).toBe("true");
    expect(bouton.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(bouton);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("monté avec un état déjà « retiré » : le focus n'est PAS déplacé", () => {
    render(rendu(fixture({ interested_by_me: false }), ENDED, true, removal("removed")));
    expect(screen.getByRole("status")).toBeTruthy();
    expect(document.activeElement).toBe(document.body);
  });

  it("retrait réussi : « Retiré de votre agenda. », plus aucun bouton de retrait ni d'ajout", () => {
    const { container } = render(rendu(fixture({ interested_by_me: false }), ENDED, true, removal("removed")));
    expect(screen.getByRole("status").textContent).toContain("Retiré de votre agenda.");
    expect(screen.queryByRole("button", { name: "Retirer de mon agenda" })).toBeNull();
    expect(buttonNames(container).filter((n) => ADD_LABELS.test(n))).toEqual([]);
  });

  it("échec : bouton conservé + erreur, aucun message de réussite", () => {
    render(rendu(fixture({ interested_by_me: true }), ENDED, true, removal("error")));
    expect(screen.getByRole("button", { name: "Retirer de mon agenda" })).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Le retrait n’a pas abouti. Réessayez.");
    expect(screen.queryByText("Retiré de votre agenda.")).toBeNull();
  });

  it("en cours : actions existantes inchangées, aucune indication « terminé »", () => {
    const { container } = render(rendu(fixture(), ONGOING, true, removal()));
    expect(screen.queryByText("Cet événement est terminé.")).toBeNull();
    expect(screen.getByRole("button", { name: "Participer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ça m'intéresse/ })).toBeTruthy();
    expect(buttonNames(container)).toContain("Enregistrer");
    expect(googleLinks(container)).toBe(1);
  });
});

// ---------- Écran complet : retrait réel (API simulée) et franchissement de la fin ----------

const apiMock = { events: { toggleInterest: vi.fn() } };
let currentUser: { id: string } | null = { id: "u1" };
let initialEvent: LocalEvent = fixture();
const patchSpy = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({ useYunicityApi: () => apiMock }));
vi.mock("@/lib/auth/auth-provider", () => ({ useAuth: () => ({ user: currentUser }) }));
vi.mock("@/components/events/event-detail-app-shell", () => ({
  EventDetailAppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/hooks/use-event-detail-context", () => ({
  useEventDetailContext: () => {
    const [event, setEvent] = useState<LocalEvent>(initialEvent);
    return fakeContext(event, {
      patchEvent: (patch) => {
        patchSpy(patch);
        setEvent((prev) => ({ ...prev, ...patch }));
      },
    });
  },
}));

const { EventDetailScreen } = await import("@/components/events/event-detail-screen");

describe("EVENTS-PAST-01 — écran de la fiche (trois formats montés)", () => {
  beforeEach(() => {
    apiMock.events.toggleInterest.mockReset();
    patchSpy.mockReset();
    currentUser = { id: "u1" };
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retrait réussi : un seul appel, « Retiré de votre agenda. » aux trois formats, aucun réenregistrement", async () => {
    initialEvent = fixture({ interested_by_me: true });
    apiMock.events.toggleInterest.mockResolvedValue({ event_id: initialEvent.id, interested: false, interest_count: 2 });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    const boutons = screen.getAllByRole("button", { name: "Retirer de mon agenda" });
    expect(boutons).toHaveLength(3);
    await act(async () => {
      fireEvent.click(boutons[0]!);
    });
    expect(apiMock.events.toggleInterest).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("status").filter((s) => s.textContent?.includes("Retiré de votre agenda."))).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Retirer de mon agenda" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^(Participer|Ça m'intéresse|Enregistrer)$/ })).toBeNull();
  });

  it("échec réseau : bouton conservé, erreur affichée, aucun succès ; une seconde tentative réussit", async () => {
    initialEvent = fixture({ interested_by_me: true });
    apiMock.events.toggleInterest
      .mockRejectedValueOnce(new Error("réseau"))
      .mockResolvedValueOnce({ event_id: initialEvent.id, interested: false, interest_count: 2 });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Retirer de mon agenda" })[0]!);
    });
    expect(screen.getAllByRole("button", { name: "Retirer de mon agenda" })).toHaveLength(3);
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.queryByText("Retiré de votre agenda.")).toBeNull();
    expect(patchSpy).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Retirer de mon agenda" })[0]!);
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getAllByText("Retiré de votre agenda.")).toHaveLength(3);
  });

  it("réponse incohérente (serveur : toujours enregistré) : erreur, pas de succès", async () => {
    initialEvent = fixture({ interested_by_me: true });
    apiMock.events.toggleInterest.mockResolvedValue({ event_id: initialEvent.id, interested: true, interest_count: 3 });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Retirer de mon agenda" })[0]!);
    });
    expect(screen.queryByText("Retiré de votre agenda.")).toBeNull();
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Retirer de mon agenda" })).toHaveLength(3);
  });

  it("fiche ouverte au franchissement de la fin : statut et actions basculent ensemble, sans rechargement", () => {
    initialEvent = fixture({
      starts_at: new Date(NOW - H).toISOString(),
      ends_at: new Date(NOW + 10 * 60_000).toISOString(),
      interested_by_me: true,
    });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    expect(screen.getAllByText("En cours").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Participer" })).toHaveLength(3);
    expect(screen.queryByText("Cet événement est terminé.")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(10 * 60_000 - 1);
    });
    expect(screen.queryByText("Cet événement est terminé.")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getAllByText("Cet événement est terminé.")).toHaveLength(3);
    expect(screen.getAllByText("Terminé").length).toBeGreaterThan(0);
    expect(screen.queryByText("En cours")).toBeNull();
    expect(screen.queryByRole("button", { name: "Participer" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Retirer de mon agenda" })).toHaveLength(3);
  });

  it("sans heure de fin, début 10:00 Paris : en cours à 23:59, terminé au minuit suivant", () => {
    vi.setSystemTime(Date.parse("2026-11-12T23:59:00+01:00"));
    initialEvent = fixture({ starts_at: "2026-11-12T10:00:00+01:00", ends_at: null });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    expect(screen.getAllByRole("button", { name: "Participer" })).toHaveLength(3);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getAllByText("Cet événement est terminé.")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Participer" })).toBeNull();
  });

  it("visiteur, événement terminé : indication seule aux trois formats", () => {
    currentUser = null;
    initialEvent = fixture();
    render(<EventDetailScreen eventId={initialEvent.id} />);
    expect(screen.getAllByText("Cet événement est terminé.")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /^(Participer|Ça m'intéresse|Enregistrer|Retirer de mon agenda)$/ })).toBeNull();
    expect(document.querySelectorAll("a[href*='calendar.google.com']")).toHaveLength(0);
  });
});

// ---------- Ajustements avant commit : compte à rebours, minuterie, focus ----------

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
}

describe("EVENTS-PAST-01 — compte à rebours, minuterie et focus", () => {
  beforeEach(() => {
    apiMock.events.toggleInterest.mockReset();
    patchSpy.mockReset();
    currentUser = { id: "u1" };
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(NOW);
    setVisibility("visible");
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("« Commence dans… » se met à jour fiche ouverte, minute après minute", () => {
    initialEvent = fixture({ starts_at: new Date(NOW + 150 * 60_000).toISOString(), ends_at: null });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    expect(screen.getAllByText("Commence dans 2 h 30 min").length).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getAllByText("Commence dans 2 h 30 min").length).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getAllByText("Commence dans 2 h 29 min").length).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getAllByText("Commence dans 2 h 28 min").length).toBeGreaterThan(0);
    expect(screen.queryByText("Commence dans 2 h 30 min")).toBeNull();
  });

  it("événement à 4 mois : minuteur à 30 s (pas de délai débordant ni de boucle) ; le compte à rebours avance", () => {
    const espion = vi.spyOn(window, "setTimeout");
    initialEvent = fixture({ starts_at: new Date(NOW + 120 * 24 * H).toISOString(), ends_at: null });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    expect(screen.getAllByText("Commence dans 2880 h").length).toBeGreaterThan(0);
    const delais = espion.mock.calls.map((appel) => appel[1]);
    expect(delais).toContain(30_001);
    expect(delais.every((d) => d === undefined || d <= 24 * H)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getAllByText("Commence dans 2880 h").length).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(screen.getAllByText("Commence dans 2879 h 59 min").length).toBeGreaterThan(0);
    espion.mockRestore();
  });

  it("en cours, fin dans 90 jours : minuteur borné à 24 h, statut juste à la fin", () => {
    const espion = vi.spyOn(window, "setTimeout");
    initialEvent = fixture({
      starts_at: new Date(NOW - H).toISOString(),
      ends_at: new Date(NOW + 90 * 24 * H).toISOString(),
    });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    expect(espion.mock.calls.map((appel) => appel[1])).toContain(24 * H);
    espion.mockRestore();
    act(() => {
      vi.advanceTimersByTime(24 * H);
    });
    expect(screen.getAllByText("En cours").length).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(89 * 24 * H - 1);
    });
    expect(screen.queryByText("Cet événement est terminé.")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getAllByText("Cet événement est terminé.")).toHaveLength(3);
  });

  it.each([
    ["visibilitychange", () => document.dispatchEvent(new Event("visibilitychange"))],
    ["resume", () => document.dispatchEvent(new Event("resume"))],
    ["pageshow", () => window.dispatchEvent(new Event("pageshow"))],
    ["focus", () => window.dispatchEvent(new Event("focus"))],
  ])("onglet en arrière-plan au-delà de la fin, minuteur gelé : à la reprise (%s), statut et actions à l'heure actuelle", (_nom, reprise) => {
    initialEvent = fixture({
      starts_at: new Date(NOW - H).toISOString(),
      ends_at: new Date(NOW + 10 * 60_000).toISOString(),
      interested_by_me: true,
    });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    setVisibility("hidden");
    vi.setSystemTime(NOW + 2 * H); // le temps passe, aucun minuteur ne s'exécute
    expect(screen.getAllByText("En cours").length).toBeGreaterThan(0);
    setVisibility("visible");
    act(() => {
      reprise();
    });
    expect(screen.getAllByText("Terminé").length).toBeGreaterThan(0);
    expect(screen.queryByText("En cours")).toBeNull();
    expect(screen.queryByRole("button", { name: "Participer" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Retirer de mon agenda" })).toHaveLength(3);
  });

  it("onglet en arrière-plan, minuteur exécuté en retard : statut à l'heure actuelle", () => {
    initialEvent = fixture({
      starts_at: new Date(NOW - H).toISOString(),
      ends_at: new Date(NOW + 10 * 60_000).toISOString(),
    });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    vi.setSystemTime(NOW + 2 * H);
    act(() => {
      vi.runOnlyPendingTimers(); // le minuteur de la fin (dû depuis 1 h 50) s'exécute en retard
    });
    expect(screen.getAllByText("Cet événement est terminé.")).toHaveLength(3);
  });

  it("passage automatique à « terminé » : le focus resté sur « Partager » n'est pas déplacé", () => {
    initialEvent = fixture({
      starts_at: new Date(NOW - H).toISOString(),
      ends_at: new Date(NOW + 60_000).toISOString(),
      interested_by_me: true,
    });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    const partager = screen.getAllByRole("button", { name: "Partager" })[0]!;
    partager.focus();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getAllByText("Cet événement est terminé.")).toHaveLength(3);
    expect(document.activeElement).toBe(partager);
  });

  it("passage automatique à « terminé » alors que le focus était sur « Participer » : aucun focus envoyé vers le bloc « terminé »", () => {
    initialEvent = fixture({
      starts_at: new Date(NOW - H).toISOString(),
      ends_at: new Date(NOW + 60_000).toISOString(),
      interested_by_me: true,
    });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    screen.getAllByRole("button", { name: "Participer" })[0]!.focus();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    const actif = document.activeElement;
    for (const bloc of document.querySelectorAll("[data-event-ended-actions]")) {
      expect(bloc.contains(actif)).toBe(false);
    }
  });

  it("retrait demandé puis confirmé : le focus passe à « Retiré de votre agenda. »", async () => {
    initialEvent = fixture({ interested_by_me: true });
    apiMock.events.toggleInterest.mockResolvedValue({ event_id: initialEvent.id, interested: false, interest_count: 2 });
    render(<EventDetailScreen eventId={initialEvent.id} />);
    const bouton = screen.getAllByRole("button", { name: "Retirer de mon agenda" })[0]!;
    bouton.focus();
    await act(async () => {
      fireEvent.click(bouton);
    });
    expect(document.activeElement?.getAttribute("role")).toBe("status");
    expect(document.activeElement?.textContent).toContain("Retiré de votre agenda.");
  });

  it("retrait en échec : le focus reste sur le bouton « Retirer de mon agenda »", async () => {
    initialEvent = fixture({ interested_by_me: true });
    apiMock.events.toggleInterest.mockRejectedValue(new Error("réseau"));
    render(<EventDetailScreen eventId={initialEvent.id} />);
    const bouton = screen.getAllByRole("button", { name: "Retirer de mon agenda" })[0]!;
    bouton.focus();
    await act(async () => {
      fireEvent.click(bouton);
    });
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(document.activeElement).toBe(bouton);
  });
});

/**
 * SEARCH-EVENT-PAST-STATUS-01 — « Terminé » sur une carte d'événement des résultats de recherche.
 *
 * Décision D3 (13/11) :
 * - clé `ends_at` absente (ancienne réponse) → jamais « Terminé » ;
 * - `ends_at` explicitement `null` → convention de fin estimée d'EVENTS-PAST-01 ;
 * - `ends_at` valide → règle partagée ;
 * - `ends_at` non nulle mais inexploitable (illisible, antérieure au début) → jamais « Terminé ».
 * Instants en heure de Paris ; « maintenant » toujours passé explicitement.
 */
import type { SearchResultItem } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import { EVENT_DETAIL_DESKTOP_ENDED } from "./event-detail-portal-labels";
import { resolveEventTimeStatus } from "./event-time-status";
import { SEARCH_EVENT_ENDED_LABEL, isSearchEventEnded } from "./search-event-status";

const NOW = new Date("2026-11-13T12:00:00+01:00");

type EventFields = Pick<SearchResultItem, "starts_at" | "ends_at">;

const ended = (fields: EventFields, now: Date = NOW) => isSearchEventEnded(fields, now);

describe("isSearchEventEnded — fin renseignée et valide : règle partagée", () => {
  it("à venir → non", () => {
    expect(ended({ starts_at: "2026-11-14T20:00:00+01:00", ends_at: "2026-11-14T23:00:00+01:00" })).toBe(false);
  });

  it("en cours sur la journée → non", () => {
    expect(ended({ starts_at: "2026-11-13T10:00:00+01:00", ends_at: "2026-11-13T18:00:00+01:00" })).toBe(false);
  });

  it("terminé la veille → oui", () => {
    expect(ended({ starts_at: "2026-11-12T20:00:00+01:00", ends_at: "2026-11-12T23:00:00+01:00" })).toBe(true);
  });

  it("fin atteinte pile → oui (terminé dès maintenant ≥ fin)", () => {
    expect(ended({ starts_at: "2026-11-13T10:00:00+01:00", ends_at: "2026-11-13T12:00:00+01:00" })).toBe(true);
  });

  it("une milliseconde avant la fin → non", () => {
    const now = new Date(Date.parse("2026-11-13T12:00:00+01:00") - 1);
    expect(ended({ starts_at: "2026-11-13T10:00:00+01:00", ends_at: "2026-11-13T12:00:00+01:00" }, now)).toBe(false);
  });

  it("plusieurs jours, en cours → non, là où la convention estimée aurait dit « terminé »", () => {
    const fields = { starts_at: "2026-11-11T10:00:00+01:00", ends_at: "2026-11-14T18:00:00+01:00" };
    expect(ended(fields)).toBe(false);
    expect(resolveEventTimeStatus(fields.starts_at, null, NOW)).toBe("ended");
  });

  it("plusieurs jours, terminé → oui", () => {
    expect(ended({ starts_at: "2026-11-08T10:00:00+01:00", ends_at: "2026-11-11T18:00:00+01:00" })).toBe(true);
  });

  it("fin égale au début → règle partagée (fin valide)", () => {
    expect(ended({ starts_at: "2026-11-12T20:00:00+01:00", ends_at: "2026-11-12T20:00:00+01:00" })).toBe(true);
  });
});

describe("isSearchEventEnded — fin explicitement null : convention de fin estimée", () => {
  it("avant le repli (minuit suivant) → non", () => {
    const now = new Date("2026-11-13T23:30:00+01:00");
    expect(ended({ starts_at: "2026-11-13T20:00:00+01:00", ends_at: null }, now)).toBe(false);
  });

  it("au minuit suivant → oui", () => {
    const now = new Date("2026-11-13T00:00:00+01:00");
    expect(ended({ starts_at: "2026-11-12T20:00:00+01:00", ends_at: null }, now)).toBe(true);
  });

  it("début tardif : repli à début + 2 h, pas au minuit → non à 01:00", () => {
    const now = new Date("2026-11-14T01:00:00+01:00");
    expect(ended({ starts_at: "2026-11-13T23:30:00+01:00", ends_at: null }, now)).toBe(false);
  });

  it("début tardif : oui à 01:30", () => {
    const now = new Date("2026-11-14T01:30:00+01:00");
    expect(ended({ starts_at: "2026-11-13T23:30:00+01:00", ends_at: null }, now)).toBe(true);
  });

  it("passage à l'heure d'hiver (25/10/2026) : repli au minuit de Paris", () => {
    const fields = { starts_at: "2026-10-25T20:00:00+01:00", ends_at: null };
    expect(ended(fields, new Date("2026-10-25T23:59:00+01:00"))).toBe(false);
    expect(ended(fields, new Date("2026-10-26T00:00:00+01:00"))).toBe(true);
  });
});

describe("isSearchEventEnded — jamais de faux « Terminé »", () => {
  const LONG_AGO = "2026-11-01T20:00:00+01:00";

  it("clé ends_at absente (ancienne réponse) → non, même longtemps après le début", () => {
    expect(ended({ starts_at: LONG_AGO })).toBe(false);
  });

  it("ends_at undefined → non", () => {
    expect(ended({ starts_at: LONG_AGO, ends_at: undefined })).toBe(false);
  });

  it("fin illisible → non", () => {
    expect(ended({ starts_at: LONG_AGO, ends_at: "pas-une-date" })).toBe(false);
  });

  it("fin vide → non", () => {
    expect(ended({ starts_at: LONG_AGO, ends_at: "" })).toBe(false);
  });

  it("fin antérieure au début → non (fin inexploitable, pas de repli)", () => {
    expect(ended({ starts_at: LONG_AGO, ends_at: "2026-10-31T20:00:00+01:00" })).toBe(false);
  });

  it("début illisible → non", () => {
    expect(ended({ starts_at: "x", ends_at: null })).toBe(false);
    expect(ended({ starts_at: "x", ends_at: "2026-11-02T20:00:00+01:00" })).toBe(false);
  });

  it("début absent ou null → non", () => {
    expect(ended({ ends_at: null })).toBe(false);
    expect(ended({ starts_at: null, ends_at: "2026-11-02T20:00:00+01:00" })).toBe(false);
  });
});

describe("libellé", () => {
  it("reprend celui de la fiche d'événement", () => {
    expect(SEARCH_EVENT_ENDED_LABEL).toBe(EVENT_DETAIL_DESKTOP_ENDED);
    expect(SEARCH_EVENT_ENDED_LABEL).toBe("Terminé");
  });
});

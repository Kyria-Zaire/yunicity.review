import type { AdminCockpitAgendaHealth } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import { buildCockpitAgendaAlert } from "@/lib/cockpit-agenda-alert";

/**
 * RF-03B — présentation de l'alerte agenda.
 *
 * La décision vient du backend ; on vérifie ici que l'admin la restitue
 * fidèlement : visible seulement sous le seuil, compteur et seuil exacts,
 * territoire nommé, action proposée. Aucun seuil n'est recalculé côté client,
 * et c'est précisément ce que ces tests verrouillent.
 */

const VILLE = "Reims";

function sante(
  compte: number,
  status: AdminCockpitAgendaHealth["status"],
  label: string,
): AdminCockpitAgendaHealth {
  return {
    status,
    upcoming_count: compte,
    threshold: 3,
    label,
    is_alerting: status !== "healthy",
  };
}

const VIDE = sante(0, "critical", "Aucun événement à venir");
const FAIBLE_1 = sante(1, "warning", "Agenda faible");
const FAIBLE_2 = sante(2, "warning", "Agenda faible");
const SAIN = sante(3, "healthy", "Agenda vivant");

describe("visibilité de l'alerte", () => {
  it("alerte quand l'agenda est vide", () => {
    const vue = buildCockpitAgendaAlert(VIDE, VILLE);
    expect(vue.visible).toBe(true);
    if (!vue.visible) return;
    expect(vue.severite).toBe("critical");
  });

  it("alerte à 1 et à 2 événements", () => {
    for (const sanTe of [FAIBLE_1, FAIBLE_2]) {
      const vue = buildCockpitAgendaAlert(sanTe, VILLE);
      expect(vue.visible).toBe(true);
      if (!vue.visible) return;
      expect(vue.severite).toBe("warning");
    }
  });

  it("n'affiche rien à partir de 3 événements", () => {
    expect(buildCockpitAgendaAlert(SAIN, VILLE).visible).toBe(false);
  });

  it("ne recalcule aucun seuil : elle suit `is_alerting` du serveur", () => {
    // Cas volontairement incohérent : 0 événement mais serveur non alertant.
    // Le client ne doit pas décider à sa place.
    const force = { ...VIDE, is_alerting: false };
    expect(buildCockpitAgendaAlert(force, VILLE).visible).toBe(false);
  });
});

describe("libellé et compteur", () => {
  it("reprend le libellé serveur comme titre", () => {
    const vue = buildCockpitAgendaAlert(FAIBLE_2, VILLE);
    if (!vue.visible) throw new Error("alerte attendue");
    expect(vue.titre).toBe("Agenda faible");
  });

  it("nomme le territoire et le seuil attendu", () => {
    const vue = buildCockpitAgendaAlert(FAIBLE_2, VILLE);
    if (!vue.visible) throw new Error("alerte attendue");
    expect(vue.detail).toContain("Reims");
    expect(vue.detail).toContain("2 événements");
    expect(vue.detail).toContain("sur 3 attendus");
  });

  it("formule l'agenda vide sans compteur trompeur", () => {
    const vue = buildCockpitAgendaAlert(VIDE, VILLE);
    if (!vue.visible) throw new Error("alerte attendue");
    expect(vue.detail).toContain("Aucun événement à venir");
    expect(vue.detail).not.toContain("0 événement à venir pour");
  });

  it("accorde le pluriel", () => {
    const un = buildCockpitAgendaAlert(FAIBLE_1, VILLE);
    const deux = buildCockpitAgendaAlert(FAIBLE_2, VILLE);
    if (!un.visible || !deux.visible) throw new Error("alertes attendues");
    expect(un.detail).toContain("1 événement à venir");
    expect(deux.detail).toContain("2 événements à venir");
    // 1 présent sur 3 => 2 manquants ; 2 présents => 1 manquant.
    expect(un.detail).toContain("Publiez 2 événements de plus");
    expect(deux.detail).toContain("Publiez 1 événement de plus");
  });

  it("respecte un seuil serveur différent sans le coder en dur", () => {
    const autre: AdminCockpitAgendaHealth = { ...FAIBLE_1, threshold: 5 };
    const vue = buildCockpitAgendaAlert(autre, VILLE);
    if (!vue.visible) throw new Error("alerte attendue");
    expect(vue.detail).toContain("sur 5 attendus");
    expect(vue.detail).toContain("Publiez 4 événements de plus");
  });
});

describe("action recommandée", () => {
  it("renvoie vers la gestion des événements", () => {
    const vue = buildCockpitAgendaAlert(VIDE, VILLE);
    if (!vue.visible) throw new Error("alerte attendue");
    expect(vue.actionHref).toBe("/events");
    expect(vue.actionLabel).toBe("Gérer les événements");
  });
});

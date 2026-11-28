import { afterEach, describe, expect, it, vi } from "vitest";

import {
  __resetStoryRingsFreshnessForTests,
  markStoryRingsStale,
  storyRingsVersion,
  subscribeStoryRings,
} from "./story-rings-freshness";

/**
 * Fraîcheur des anneaux Story — PR202-MOBILE-P0.
 *
 * Le défaut corrigé : une Story publiée restait invisible dans le rail de
 * l'accueil, qui continuait d'afficher l'entrée précédente. Les deux surfaces
 * lisent le même endpoint ; c'est le MOMENT de la lecture qui posait problème.
 *
 * Ce signal doit tenir deux promesses opposées : ne jamais laisser passer une
 * publication, et ne jamais provoquer d'appel réseau sans raison.
 */

afterEach(() => {
  __resetStoryRingsFreshnessForTests();
});

describe("signal de fraîcheur des anneaux", () => {
  it("part d'une version stable", () => {
    expect(storyRingsVersion()).toBe(0);
    expect(storyRingsVersion()).toBe(0);
  });

  it("chaque publication fait avancer la version", () => {
    markStoryRingsStale();
    expect(storyRingsVersion()).toBe(1);
    markStoryRingsStale();
    expect(storyRingsVersion()).toBe(2);
  });

  it("deux publications successives ne se confondent pas avec une seule", () => {
    // C'est la raison d'être du compteur : un booléen remis à faux après le
    // premier rechargement perdrait la seconde publication.
    const vue = storyRingsVersion();
    markStoryRingsStale();
    const apresPremiere = storyRingsVersion();
    markStoryRingsStale();

    expect(apresPremiere).not.toBe(vue);
    expect(storyRingsVersion()).not.toBe(apresPremiere);
  });

  it("prévient les abonnés au moment de la publication", () => {
    const abonne = vi.fn();
    subscribeStoryRings(abonne);

    markStoryRingsStale();

    expect(abonne).toHaveBeenCalledTimes(1);
  });

  it("ne prévient plus après désabonnement", () => {
    const abonne = vi.fn();
    const desabonner = subscribeStoryRings(abonne);
    desabonner();

    markStoryRingsStale();

    expect(abonne).not.toHaveBeenCalled();
  });

  it("un abonné qui se retire pendant la notification n'interrompt pas les autres", () => {
    // Cas réel : l'accueil se démonte en réaction au rechargement qu'il vient
    // de déclencher. Itérer sur l'ensemble vivant ferait sauter les suivants.
    const second = vi.fn();
    let retirerPremier: () => void = () => {};
    retirerPremier = subscribeStoryRings(() => retirerPremier());
    subscribeStoryRings(second);

    markStoryRingsStale();

    expect(second).toHaveBeenCalledTimes(1);
  });

  it("ne notifie pas sans publication", () => {
    const abonne = vi.fn();
    subscribeStoryRings(abonne);

    expect(storyRingsVersion()).toBe(0);
    expect(abonne).not.toHaveBeenCalled();
  });

  it("plusieurs abonnés sont tous prévenus", () => {
    const a = vi.fn();
    const b = vi.fn();
    subscribeStoryRings(a);
    subscribeStoryRings(b);

    markStoryRingsStale();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});

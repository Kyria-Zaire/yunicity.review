// @vitest-environment jsdom
/**
 * VIDEO-04D — le formulaire d'upload affiche la limite du créateur connecté.
 *
 * Le client ne choisit jamais son palier : aucun sélecteur de tier ne doit
 * exister. La limite arrive en prop depuis la politique serveur, et le backend
 * reste l'autorité finale.
 */
import type { Neighborhood } from "@yunicity/types";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NewLocalVideoForm } from "@/components/videos/new-local-video-form";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const QUARTIERS: Neighborhood[] = [];

function afficher(maxDurationSeconds: number, error: string | null = null) {
  return render(
    <NewLocalVideoForm
      neighborhoods={QUARTIERS}
      loadingNeighborhoods={false}
      submitting={false}
      error={error}
      maxDurationSeconds={maxDurationSeconds}
      onCancel={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
}

afterEach(cleanup);

describe("limite affichée sur /videos/new", () => {
  it("affiche 90 s pour un créateur pilote", () => {
    afficher(90);
    expect(screen.getByText(/max\. 90 s/)).toBeTruthy();
    expect(screen.queryByText(/max\. 180 s/)).toBeNull();
  });

  it("affiche 180 s pour un créateur vérifié", () => {
    afficher(180);
    expect(screen.getByText(/max\. 180 s/)).toBeTruthy();
    expect(screen.queryByText(/max\. 90 s/)).toBeNull();
  });

  it("n'annonce jamais 300 s ni 5 min", () => {
    for (const limite of [90, 180]) {
      const { container, unmount } = afficher(limite);
      expect(container.textContent ?? "").not.toContain("300");
      expect(container.textContent ?? "").not.toContain("5 min");
      unmount();
    }
  });

  it("conserve la taille maximale annoncée", () => {
    afficher(180);
    expect(screen.getByText(/50 Mo/)).toBeTruthy();
  });
});

describe("le client ne peut pas choisir son palier", () => {
  it("n'expose aucun sélecteur de tier", () => {
    const { container } = afficher(90);
    const champs = [...container.querySelectorAll("input, select, textarea")];
    for (const champ of champs) {
      const identite = `${champ.getAttribute("name") ?? ""} ${champ.getAttribute("id") ?? ""}`;
      expect(identite.toLowerCase()).not.toContain("tier");
      expect(identite.toLowerCase()).not.toContain("duration");
    }
    expect(container.textContent ?? "").not.toContain("Créateur vérifié");
  });
});

describe("erreur backend", () => {
  it("affiche le message renvoyé par l'API dans une alerte accessible", () => {
    afficher(90, "Vidéo trop longue (max. 90 s).");
    const alerte = screen.getByRole("alert");
    expect(alerte.textContent).toBe("Vidéo trop longue (max. 90 s).");
  });
});

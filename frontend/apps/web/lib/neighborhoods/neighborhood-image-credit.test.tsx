// @vitest-environment jsdom

import {
  resolveNeighborhoodEditorialImageCredit,
  resolveCreativeCommonsLicenseUrl,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CulturalImageCredit } from "@/components/culture/cultural-image";
import { NeighborhoodDetailHeroMedia } from "@/components/neighborhoods/detail/shared";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup);

const croixRouge = resolveNeighborhoodEditorialImageCredit({
  slug: "croix-rouge",
  cover_image_url: null,
})!;

describe("attribution compacte d'une image Wikimedia", () => {
  it("n'affiche pas de longue ligne sous la carte", () => {
    const { container } = render(
      <CulturalImageCredit variant="compact" editorialCredit={croixRouge} />,
    );
    expect(container.textContent).not.toContain("via Wikimedia Commons");
    expect(screen.getByRole("button", { name: /Crédits de la photographie/i })).toBeTruthy();
  });

  it("ouvre un popover accessible avec auteur, licence et source", () => {
    render(<CulturalImageCredit variant="compact" editorialCredit={croixRouge} />);
    fireEvent.click(screen.getByRole("button", { name: /Crédits de la photographie/i }));
    const dialog = screen.getByRole("dialog", { name: /Crédits de la photographie/i });
    expect(dialog.textContent).toContain(croixRouge.commonsFile);
    expect(dialog.textContent).toContain(croixRouge.author);
    expect(dialog.textContent).toContain(croixRouge.license);
    expect(dialog.textContent).toContain("Wikimedia Commons");
    const titleLink = screen.getByRole("link", { name: croixRouge.commonsFile });
    expect(titleLink.getAttribute("href")).toBe(croixRouge.sourceUrl);
    const licenseLink = screen.getByRole("link", { name: croixRouge.license });
    expect(licenseLink.getAttribute("href")).toBe(croixRouge.licenseUrl);
  });

  it("ferme le popover avec Escape", () => {
    render(<CulturalImageCredit variant="compact" editorialCredit={croixRouge} />);
    fireEvent.click(screen.getByRole("button", { name: /Crédits de la photographie/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("n'affiche rien sans crédit", () => {
    const { container } = render(
      <CulturalImageCredit variant="compact" editorialCredit={null} />,
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("attribution textuelle legacy (default)", () => {
  it("conserve le rendu ligne pour les autres surfaces", () => {
    render(
      <CulturalImageCredit
        credit={`${croixRouge.author} / ${croixRouge.license} via Wikimedia Commons`}
        sourceUrl={croixRouge.sourceUrl}
      />,
    );
    expect(screen.getByRole("link").getAttribute("href")).toBe(croixRouge.sourceUrl);
  });
});

describe("licence Creative Commons canonique", () => {
  it("résout les URLs CC BY-SA 3.0 et 4.0", () => {
    expect(resolveCreativeCommonsLicenseUrl("CC BY-SA 3.0")).toBe(
      "https://creativecommons.org/licenses/by-sa/3.0/",
    );
    expect(resolveCreativeCommonsLicenseUrl("CC BY-SA 4.0")).toBe(
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );
  });
});

describe("le hero ne crédite que l'image qu'il affiche", () => {
  const base = {
    title: "Croix-Rouge – Hauts de Murigny",
    galleryUrls: [],
    sizes: "100vw",
    aspectClassName: "aspect-[21/9]",
    photoLabel: (n: number) => `${n} photos`,
  };

  it("superpose le bouton compact quand l'image créditée est bien rendue", () => {
    render(
      <NeighborhoodDetailHeroMedia {...base} imageUrl={croixRouge.url} imageCredit={croixRouge} />,
    );
    expect(screen.getByRole("button", { name: /Crédits de la photographie/i })).toBeTruthy();
    expect(screen.queryByText(/via Wikimedia Commons/)).toBeNull();
  });

  it("n'affiche aucune attribution quand une autre image est rendue", () => {
    render(
      <NeighborhoodDetailHeroMedia
        {...base}
        imageUrl={null}
        galleryUrls={["https://media.yunicity.city/gallery/1.jpg"]}
        imageCredit={croixRouge}
      />,
    );
    expect(screen.queryByRole("button", { name: /Crédits de la photographie/i })).toBeNull();
  });

  it("n'affiche aucune attribution sans crédit fourni", () => {
    render(<NeighborhoodDetailHeroMedia {...base} imageUrl={croixRouge.url} imageCredit={null} />);
    expect(screen.queryByRole("button", { name: /Crédits de la photographie/i })).toBeNull();
  });
});

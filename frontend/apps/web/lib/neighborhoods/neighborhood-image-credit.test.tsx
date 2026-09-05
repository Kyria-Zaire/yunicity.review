// @vitest-environment jsdom

import {
  formatEditorialImageAttribution,
  resolveNeighborhoodEditorialImageCredit,
} from "@yunicity/utils";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CulturalImageCredit } from "@/components/culture/cultural-image";
import { NeighborhoodDetailHeroMedia } from "@/components/neighborhoods/detail/shared";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup);

const croixRouge = resolveNeighborhoodEditorialImageCredit({
  slug: "croix-rouge",
  cover_image_url: null,
})!;

describe("attribution accessible d'une image Wikimedia", () => {
  it("expose auteur, licence, plateforme et un lien source atteignable", () => {
    render(
      <CulturalImageCredit
        credit={formatEditorialImageAttribution(croixRouge)}
        sourceUrl={croixRouge.sourceUrl}
      />,
    );
    const link = screen.getByRole("link");
    // Rôle link => focalisable au clavier et annoncé par les lecteurs d'écran.
    expect(link.getAttribute("href")).toBe(croixRouge.sourceUrl);
    expect(link.getAttribute("rel")).toContain("license");
    expect(link.getAttribute("rel")).toContain("noopener");
    const accessibleName = link.getAttribute("aria-label") ?? "";
    expect(accessibleName).toContain(croixRouge.author);
    expect(accessibleName).toContain(croixRouge.license);
    expect(accessibleName).toContain("Wikimedia Commons");
  });

  it("reste du texte lisible, jamais un commentaire ni un contenu masqué", () => {
    const { container } = render(
      <CulturalImageCredit credit={formatEditorialImageAttribution(croixRouge)} sourceUrl={null} />,
    );
    const node = container.querySelector("p");
    expect(node?.textContent).toContain(croixRouge.author);
    expect(node?.getAttribute("aria-hidden")).toBeNull();
    expect(node?.className).not.toContain("sr-only");
    expect(node?.className).not.toContain("hidden");
  });

  it("n'affiche rien sans crédit", () => {
    const { container } = render(<CulturalImageCredit credit={null} />);
    expect(container.innerHTML).toBe("");
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

  it("affiche l'attribution quand l'image créditée est bien rendue", () => {
    render(
      <NeighborhoodDetailHeroMedia {...base} imageUrl={croixRouge.url} imageCredit={croixRouge} />,
    );
    expect(screen.getByRole("link").getAttribute("href")).toBe(croixRouge.sourceUrl);
  });

  it("n'affiche aucune attribution quand une autre image est rendue", () => {
    // heroSrc retombe sur la galerie : créditer Wikimedia désignerait la mauvaise photo.
    render(
      <NeighborhoodDetailHeroMedia
        {...base}
        imageUrl={null}
        galleryUrls={["https://media.yunicity.city/gallery/1.jpg"]}
        imageCredit={croixRouge}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("n'affiche aucune attribution sans crédit fourni", () => {
    render(<NeighborhoodDetailHeroMedia {...base} imageUrl={croixRouge.url} imageCredit={null} />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  formatEditorialImageAttribution,
  NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE,
  resolveNeighborhoodEditorialImage,
  resolveNeighborhoodEditorialImageCredit,
  type EditorialImageCredit,
} from "./editorial-fallback-images";
import { resolveNeighborhoodsDesktopImageCredit } from "./neighborhoods-desktop-presenter";

/** Les 12 secteurs officiels — miroir du lock backend `test_reims_official_sectors.py`. */
const SECTORS = [
  "saint-remi",
  "courlancy",
  "centre-ville",
  "cernay-jean-jaures",
  "clairmarais",
  "chatillons",
  "chemin-vert",
  "croix-rouge",
  "la-neuvillette",
  "orgeval",
  "maison-blanche",
  "murigny",
] as const;

const hood = (slug: string, cover: string | null = null) => ({ slug, cover_image_url: cover });

const creditOf = (slug: string): EditorialImageCredit => {
  const credit = resolveNeighborhoodEditorialImageCredit(hood(slug));
  if (!credit) throw new Error(`crédit manquant pour ${slug}`);
  return credit;
};

describe("registre : métadonnées légales des 12 secteurs", () => {
  it("chaque secteur porte url, auteur, licence et page source", () => {
    for (const slug of SECTORS) {
      const c = creditOf(slug);
      expect(c.url, slug).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
      expect(c.author.trim(), slug).not.toBe("");
      expect(c.license, slug).toMatch(/^CC BY-SA \d\.\d$/);
      expect(c.licenseUrl, slug).toMatch(/^https:\/\/creativecommons\.org\/licenses\/by-sa\//);
      expect(c.sourceUrl, slug).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(c.commonsFile.trim(), slug).not.toBe("");
    }
  });

  it("les 12 fichiers Commons sont distincts", () => {
    const files = SECTORS.map((s) => creditOf(s).commonsFile);
    expect(new Set(files).size).toBe(SECTORS.length);
  });

  it("la page source pointe le fichier réellement rendu", () => {
    for (const slug of SECTORS) {
      const c = creditOf(slug);
      const fileFromSource = decodeURIComponent(c.sourceUrl.split("/wiki/File:")[1] ?? "").replace(
        /_/g,
        " ",
      );
      expect(fileFromSource, slug).toBe(c.commonsFile);
      // L'URL de rendu et la page source désignent le même fichier.
      expect(decodeURIComponent(c.url).replace(/_/g, " "), slug).toContain(c.commonsFile);
    }
  });

  it("l'attribution nomme l'auteur, la licence et la plateforme", () => {
    const c = creditOf("croix-rouge");
    const line = formatEditorialImageAttribution(c);
    expect(line).toContain(c.author);
    expect(line).toContain(c.license);
    expect(line).toContain("Wikimedia Commons");
  });
});

describe("croix-rouge : la carte schématique est remplacée", () => {
  it("utilise désormais Croix Rouge passerelle.jpg", () => {
    const c = creditOf("croix-rouge");
    expect(c.commonsFile).toBe("Croix Rouge passerelle.jpg");
    expect(c.author).toBe("G.Garitan");
    expect(c.license).toBe("CC BY-SA 3.0");
    expect(c.sourceUrl).toBe("https://commons.wikimedia.org/wiki/File:Croix_Rouge_passerelle.jpg");
  });

  it("l'ancienne carte n'est plus référencée nulle part", () => {
    expect(NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE).not.toContain("Quartier_Reims_Croix_Rouge");
    for (const slug of SECTORS) {
      expect(creditOf(slug).commonsFile, slug).not.toContain("Quartier Reims Croix Rouge");
    }
  });
});

describe("le crédit correspond toujours à l'image rendue", () => {
  it("un cover propre au quartier supprime le crédit Wikimedia", () => {
    const withCover = hood("croix-rouge", "https://media.yunicity.city/neighborhoods/reims/croix-rouge/hero.jpg");
    // L'image rendue n'est plus celle de Commons -> ne jamais afficher son attribution.
    expect(resolveNeighborhoodEditorialImage(withCover)).toBe(withCover.cover_image_url);
    expect(resolveNeighborhoodEditorialImageCredit(withCover)).toBeNull();
  });

  it("un cover yunicity.city en attente laisse le repli ET son crédit", () => {
    const pending = hood("croix-rouge", "/neighborhoods/reims/croix-rouge/hero.jpg");
    expect(resolveNeighborhoodEditorialImage(pending)).toBe(creditOf("croix-rouge").url);
    expect(resolveNeighborhoodEditorialImageCredit(pending)?.commonsFile).toBe(
      "Croix Rouge passerelle.jpg",
    );
  });

  it("le crédit des surfaces portail suit la photo Wikimedia du slug", () => {
    for (const slug of SECTORS) {
      const c = resolveNeighborhoodsDesktopImageCredit({ slug });
      expect(c?.commonsFile, slug).toBe(creditOf(slug).commonsFile);
    }
  });

  it("un slug inconnu ne fabrique aucun crédit", () => {
    expect(resolveNeighborhoodEditorialImageCredit(hood("quartier-inexistant"))).toBeNull();
  });
});

describe("contrat existant préservé", () => {
  it("le résolveur d'image garde sa signature et ses priorités", () => {
    expect(resolveNeighborhoodEditorialImage(hood("murigny"))).toBe(creditOf("murigny").url);
    expect(resolveNeighborhoodEditorialImage(hood("quartier-inexistant"))).toBeNull();
    const realCover = hood("murigny", "https://media.yunicity.city/x.jpg");
    expect(resolveNeighborhoodEditorialImage(realCover)).toBe("https://media.yunicity.city/x.jpg");
  });

  it("les exports historiques restent des chaînes non vides", () => {
    expect(typeof NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE).toBe("string");
    expect(NEIGHBORHOOD_EDITORIAL_IMAGE_CROIX_ROUGE.length).toBeGreaterThan(0);
  });
});

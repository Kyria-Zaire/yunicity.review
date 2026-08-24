import { describe, expect, it } from "vitest";

import {
  DESKTOP_FEED_EDGE_REQUIREMENTS,
  FEED_EDGE_MIN_WIDTH_RATIO,
  FEED_EDGE_TOLERANCE_PX,
  FEED_EDGE_ZONE_DEFINITION,
  FEED_MEDIUM_CARD_EDGE_REQUIREMENTS,
  FEED_SEPARATOR_MIN_WIDTH_RATIO,
  fillsAvailableWidth,
  mediumContentZone,
  isEdgeAligned,
} from "@/lib/layout/feed-medium-edges";

const zone = { left: 128, right: 752, width: 624 };

describe("contrat d'alignement des axes du Feed", () => {
  it("définit la zone disponible sans jamais autoriser le passage sous le rail", () => {
    expect(FEED_EDGE_ZONE_DEFINITION.medium).toContain("rail.right");
    expect(FEED_EDGE_ZONE_DEFINITION.desktop).toContain("entre les rails/asides");
  });

  it("dérive la zone du rail et du shell, jamais d'une colonne déjà mise en page", () => {
    const rail = { left: 0, right: 88, width: 88 };
    const shell = { left: 0, right: 768, width: 768 };
    expect(mediumContentZone(rail, shell)).toEqual({ left: 88, right: 768, width: 680 });
  });

  it("refuse la définition circulaire fondée sur une colonne rétrécie", () => {
    const rail = { left: 16, right: 104, width: 88 };
    const shell = { left: 0, right: 768, width: 768 };
    // Colonne telle qu'elle etait mise en page en M3.1 : 24px de gap a gauche,
    // 16px de padding a droite. Elle remplissait « 100 % » d'elle-meme mais
    // n'atteignait ni le rail ni le bord de l'application.
    const colonne = { left: 128, right: 752, width: 624 };
    expect(isEdgeAligned(colonne, mediumContentZone(rail, shell))).toBe(false);
  });

  it("accepte un bloc aligné et un écart purement subpixel", () => {
    expect(isEdgeAligned({ left: 128, right: 752, width: 624 }, zone)).toBe(true);
    expect(isEdgeAligned({ left: 128.4, right: 751.6, width: 623.2 }, zone)).toBe(true);
  });

  it("refuse une marge réelle, même faible", () => {
    expect(isEdgeAligned({ left: 136, right: 744, width: 608 }, zone)).toBe(false);
    expect(isEdgeAligned({ left: 128, right: 744, width: 616 }, zone)).toBe(false);
  });

  it("la tolérance reste un arrondi, pas une échappatoire", () => {
    expect(FEED_EDGE_TOLERANCE_PX).toBe(1);
    expect(FEED_EDGE_MIN_WIDTH_RATIO).toBeGreaterThanOrEqual(0.99);
    expect(FEED_SEPARATOR_MIN_WIDTH_RATIO).toBeGreaterThanOrEqual(0.99);
  });

  it("exige que le bloc remplisse la largeur disponible", () => {
    expect(fillsAvailableWidth({ left: 128, right: 752, width: 624 }, zone)).toBe(true);
    expect(fillsAvailableWidth({ left: 136, right: 744, width: 608 }, zone)).toBe(false);
  });

  it("enregistre les exigences futures des cartes medium et du desktop", () => {
    expect(FEED_MEDIUM_CARD_EDGE_REQUIREMENTS).toHaveLength(8);
    expect(FEED_MEDIUM_CARD_EDGE_REQUIREMENTS).toContain("même bord gauche que le header");
    expect(DESKTOP_FEED_EDGE_REQUIREMENTS).toContain(
      "aucun passage sous le rail gauche ou l'aside droit",
    );
  });
});

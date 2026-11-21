import { describe, expect, it } from "vitest";

import { resolveVideoRankingReason } from "./local-video-ranking-reason";

/**
 * VIDEO-03 — mise en mots du classement territorial côté web.
 *
 * Le frontend NE reconstruit PAS le classement : il affiche ce que l'API a
 * décidé. Ces tests verrouillent la seule règle qu'il applique lui-même — un
 * garde-fou défensif : le motif « Parce que tu es à … » ne doit jamais
 * apparaître pour autre chose qu'un `neighborhood_match`, même si le serveur
 * envoyait un jour ce libellé par erreur ou depuis un cache périmé.
 */
const item = (
  reason_code?: string,
  reason_label?: string,
): Parameters<typeof resolveVideoRankingReason>[0] =>
  ({ reason_code, reason_label }) as Parameters<typeof resolveVideoRankingReason>[0];

describe("resolveVideoRankingReason", () => {
  it("affiche le motif de quartier quand l'API l'annonce", () => {
    const vue = resolveVideoRankingReason(
      item("neighborhood_match", "Parce que tu es à Saint-Remi"),
    );
    expect(vue.visible).toBe(true);
    expect(vue.label).toBe("Parce que tu es à Saint-Remi");
    expect(vue.emphasis).toBe(true);
  });

  it("affiche le libellé de ville tel que fourni", () => {
    const vue = resolveVideoRankingReason(item("same_city", "Autour de vous à Reims"));
    expect(vue.visible).toBe(true);
    expect(vue.label).toBe("Autour de vous à Reims");
    expect(vue.emphasis).toBe(false);
  });

  it("affiche le libellé de repli tel que fourni", () => {
    const vue = resolveVideoRankingReason(item("territory_fallback", "À découvrir à Reims"));
    expect(vue.visible).toBe(true);
    expect(vue.label).toBe("À découvrir à Reims");
    expect(vue.emphasis).toBe(false);
  });

  it("n'affiche rien pour une réponse ancienne sans reason_code", () => {
    expect(resolveVideoRankingReason(item(undefined, undefined)).visible).toBe(false);
  });

  it("n'affiche rien quand le libellé est vide", () => {
    expect(resolveVideoRankingReason(item("same_city", "   ")).visible).toBe(false);
  });

  it("n'affiche rien pour un code inconnu", () => {
    expect(resolveVideoRankingReason(item("something_else", "Un libellé")).visible).toBe(false);
  });

  it("supprime un motif de quartier envoyé à tort sur same_city", () => {
    const vue = resolveVideoRankingReason(item("same_city", "Parce que tu es à Saint-Remi"));
    expect(vue.visible).toBe(false);
  });

  it("supprime un motif de quartier envoyé à tort sur territory_fallback", () => {
    const vue = resolveVideoRankingReason(
      item("territory_fallback", "Parce que tu es à Croix-Rouge"),
    );
    expect(vue.visible).toBe(false);
  });

  it("ne se laisse pas contourner par la casse ou les espaces", () => {
    expect(
      resolveVideoRankingReason(item("same_city", "  PARCE QUE TU ES À Orgeval  ")).visible,
    ).toBe(false);
  });
});

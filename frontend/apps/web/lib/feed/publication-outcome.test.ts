/**
 * §3.4 bis (c) du contrat — liste blanche du renouvellement de clé.
 *
 * Ce test est la garde de l'asymétrie : conserver une clé à tort coûte un rejeu,
 * la renouveler à tort coûte un doublon irréparable.
 */

import { describe, expect, it } from "vitest";

import { classifyCreationError } from "@/lib/feed/publication-outcome";

function erreur(status: number, code?: string): Error {
  return Object.assign(
    new Error(`statut ${status}`),
    code === undefined ? { status } : { status, code },
  );
}

describe("classement d'une erreur de création", () => {
  it("409 : la publication existe déjà", () => {
    expect(classifyCreationError(erreur(409, "POST_REQUEST_CONFLICT"))).toEqual({
      kind: "already_sent",
    });
  });

  it("422 et 429 SEULS renouvellent la clé", () => {
    for (const status of [422, 429]) {
      expect(classifyCreationError(erreur(status)), `statut ${status}`).toEqual({
        kind: "rejected",
        renewKey: true,
      });
    }
  });

  it("400, 403 et 404 conservent la clé", () => {
    for (const status of [400, 403, 404]) {
      expect(classifyCreationError(erreur(status)), `statut ${status}`).toEqual({
        kind: "rejected",
        renewKey: false,
      });
    }
  });

  it("5xx est indéterminé : un échec après commit reste possible", () => {
    for (const status of [500, 502, 503, 504]) {
      expect(classifyCreationError(erreur(status)), `statut ${status}`).toEqual({
        kind: "undetermined",
      });
    }
  });

  it("sans statut, l'issue est indéterminée — jamais un échec annoncé", () => {
    const sansStatut: unknown[] = [
      new TypeError("Failed to fetch"),
      new DOMException("aborted", "AbortError"),
      new Error("quelque chose"),
      undefined,
      null,
      "chaîne",
    ];
    for (const cas of sansStatut) {
      expect(classifyCreationError(cas)).toEqual({ kind: "undetermined" });
    }
  });

  it("un statut non numérique ne vaut pas preuve", () => {
    const douteux = Object.assign(new Error("bizarre"), { status: "429" });
    expect(classifyCreationError(douteux)).toEqual({ kind: "undetermined" });
  });
});

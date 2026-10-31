import { describe, expect, it } from "vitest";

import { AuthError } from "./auth/auth-errors";
import {
  PUBLICATION_DELETE_ERROR_FORBIDDEN,
  PUBLICATION_DELETE_ERROR_GENERIC,
  PUBLICATION_DELETE_ERROR_GONE,
  PUBLICATION_DELETE_ERROR_SESSION,
  humanizePublicationDeleteFailure,
} from "./publication-delete";

describe("humanizePublicationDeleteFailure", () => {
  it("distingue la publication déjà supprimée (404)", () => {
    expect(
      humanizePublicationDeleteFailure(
        new AuthError("POST_NOT_FOUND", "Publication introuvable.", 404),
      ),
    ).toBe(PUBLICATION_DELETE_ERROR_GONE);
  });

  it("distingue le refus d'autorisation (403)", () => {
    expect(
      humanizePublicationDeleteFailure(new AuthError("FORBIDDEN", "Action non autorisée.", 403)),
    ).toBe(PUBLICATION_DELETE_ERROR_FORBIDDEN);
  });

  it("distingue la session expirée (401)", () => {
    expect(
      humanizePublicationDeleteFailure(new AuthError("UNAUTHORIZED", "Non authentifié.", 401)),
    ).toBe(PUBLICATION_DELETE_ERROR_SESSION);
  });

  it("retombe sur le message générique pour un 500", () => {
    expect(
      humanizePublicationDeleteFailure(new AuthError("UNKNOWN_ERROR", "Erreur API (500)", 500)),
    ).toBe(PUBLICATION_DELETE_ERROR_GENERIC);
  });

  it("retombe sur le message générique hors erreur API (réseau coupé)", () => {
    // Un `TypeError: Failed to fetch` ne porte ni code ni statut : le message
    // brut du navigateur ne doit jamais atteindre l'utilisateur.
    expect(humanizePublicationDeleteFailure(new TypeError("Failed to fetch"))).toBe(
      PUBLICATION_DELETE_ERROR_GENERIC,
    );
    expect(humanizePublicationDeleteFailure(undefined)).toBe(PUBLICATION_DELETE_ERROR_GENERIC);
  });

  it("ne lit pas le détail serveur comme un message d'interface", () => {
    const message = humanizePublicationDeleteFailure(
      new AuthError("FORBIDDEN", "fuite interne: user 42 lacks moderation.manage", 403),
    );
    expect(message).toBe(PUBLICATION_DELETE_ERROR_FORBIDDEN);
    expect(message).not.toContain("moderation.manage");
  });
});

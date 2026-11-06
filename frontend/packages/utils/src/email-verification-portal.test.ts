import { describe, expect, it } from "vitest";

import { AuthError } from "./auth/auth-errors";
import {
  buildEmailVerificationView,
  buildResendVerificationPayload,
  normalizeVerificationEmail,
  resolveInitialVerificationStatus,
  resolveVerificationFailure,
  shouldInviteEmailVerification,
  validateResendVerificationEmail,
} from "./email-verification-portal";
import { VERIFY_EMAIL_RESEND_DONE } from "./email-verification-portal-labels";

describe("resolveInitialVerificationStatus", () => {
  it("attend une action quand aucun jeton n'est présent", () => {
    // Arriver sans jeton, c'est sortir de l'inscription — pas une erreur.
    expect(resolveInitialVerificationStatus(null)).toBe("pending");
    expect(resolveInitialVerificationStatus(undefined)).toBe("pending");
    expect(resolveInitialVerificationStatus("   ")).toBe("pending");
  });

  it("vérifie dès qu'un jeton est présent", () => {
    expect(resolveInitialVerificationStatus("abc")).toBe("checking");
  });
});

describe("resolveVerificationFailure", () => {
  it.each([
    ["INVALID_VERIFICATION_TOKEN", "invalid"],
    ["VERIFICATION_TOKEN_EXPIRED", "expired"],
    ["VERIFICATION_TOKEN_ALREADY_USED", "already_used"],
  ])("traduit %s en %s", (code, expected) => {
    expect(resolveVerificationFailure(new AuthError(code, "peu importe", 400))).toBe(expected);
  });

  it("retombe sur un échec générique pour un code inconnu", () => {
    expect(resolveVerificationFailure(new AuthError("AUTRE_CHOSE", "x", 500))).toBe("failed");
  });

  it("retombe sur un échec générique pour une panne réseau", () => {
    expect(resolveVerificationFailure(new Error("network down"))).toBe("failed");
  });
});

describe("buildEmailVerificationView", () => {
  it("ne propose ni renvoi ni connexion pendant la vérification", () => {
    const view = buildEmailVerificationView("checking");
    expect(view.canResend).toBe(false);
    expect(view.showLoginCta).toBe(false);
  });

  it("mène à la connexion une fois l'adresse confirmée, sans proposer de renvoi", () => {
    const view = buildEmailVerificationView("verified");
    expect(view.showLoginCta).toBe(true);
    expect(view.canResend).toBe(false);
  });

  it.each(["invalid", "expired", "failed"] as const)(
    "propose un renvoi après l'échec %s",
    (status) => {
      expect(buildEmailVerificationView(status).canResend).toBe(true);
    },
  );

  it("propose les deux sorties quand le lien a déjà servi", () => {
    // Un lien consommé signifie souvent que le compte est déjà confirmé.
    const view = buildEmailVerificationView("already_used");
    expect(view.showLoginCta).toBe(true);
    expect(view.canResend).toBe(true);
  });

  it("donne un titre et un corps non vides à chaque état", () => {
    const statuses = [
      "pending",
      "checking",
      "verified",
      "invalid",
      "expired",
      "already_used",
      "failed",
    ] as const;
    for (const status of statuses) {
      const view = buildEmailVerificationView(status);
      expect(view.status).toBe(status);
      expect(view.title.length).toBeGreaterThan(0);
      expect(view.body.length).toBeGreaterThan(0);
    }
  });
});

describe("validateResendVerificationEmail", () => {
  it("refuse une adresse malformée", () => {
    expect(validateResendVerificationEmail("pas-une-adresse").valid).toBe(false);
    expect(validateResendVerificationEmail("").message).not.toBeNull();
  });

  it("accepte une adresse valide, espaces et casse compris", () => {
    expect(validateResendVerificationEmail("  Citoyen@Exemple.FR ").valid).toBe(true);
  });
});

describe("buildResendVerificationPayload", () => {
  it("normalise l'adresse avant l'envoi", () => {
    expect(buildResendVerificationPayload("  Citoyen@Exemple.FR ")).toEqual({
      email: "citoyen@exemple.fr",
    });
    expect(normalizeVerificationEmail(" A@B.C ")).toBe("a@b.c");
  });
});

describe("shouldInviteEmailVerification", () => {
  it("invite un compte connecté non vérifié", () => {
    expect(shouldInviteEmailVerification({ is_verified: false })).toBe(true);
  });

  it("n'invite ni un compte vérifié ni un visiteur anonyme", () => {
    expect(shouldInviteEmailVerification({ is_verified: true })).toBe(false);
    expect(shouldInviteEmailVerification(null)).toBe(false);
    expect(shouldInviteEmailVerification(undefined)).toBe(false);
  });
});

describe("anti-énumération", () => {
  it("la confirmation de renvoi ne révèle pas si le compte existe", () => {
    // Garde-fou : ce message est le SEUL retour du renvoi. S'il devient
    // conditionnel, il donne un moyen d'énumérer les comptes.
    expect(VERIFY_EMAIL_RESEND_DONE).toMatch(/^Si un compte/);
    expect(VERIFY_EMAIL_RESEND_DONE).not.toMatch(/inconnue|introuvable|n'existe pas|déjà vérifié/i);
  });
});

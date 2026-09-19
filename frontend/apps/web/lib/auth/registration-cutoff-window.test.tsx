// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fenêtre PILOT vue du frontend — AUTH-04B.
 *
 * Le backend referme désormais les inscriptions tout seul à l'échéance. Ce
 * fichier vérifie que l'écran suit ce basculement — et, tout aussi important,
 * qu'il ne le devance pas : `closes_at` est une information à afficher, jamais
 * une barrière. Une horloge côté navigateur se règle depuis les paramètres de la
 * machine ; en faire une sécurité reviendrait à confier la fermeture à
 * l'utilisateur.
 *
 * Les charges ci-dessous sont celles que `/auth/registration-status` émet
 * réellement à chaque phase — voir `backend/tests/test_registration_cutoff.py`,
 * qui épingle les mêmes trois états côté serveur.
 */

const mocks = vi.hoisted(() => ({
  useRegistrationStatus: vi.fn(),
  retry: vi.fn(),
}));

vi.mock("@/hooks/use-registration-status", () => ({
  useRegistrationStatus: mocks.useRegistrationStatus,
}));
vi.mock("@/hooks/use-register-wizard", () => ({
  useRegisterWizard: () => ({ draft: { accountType: "citizen" } }),
}));
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ register: vi.fn(), error: null, clearError: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("@/components/brand", () => ({ YunicityLogo: () => <div data-testid="logo" /> }));
vi.mock("@/components/register/shared/register-portal-footer", () => ({
  RegisterPortalFooter: () => <footer />,
}));
vi.mock("@/components/register/mobile", () => ({ RegisterMobileScreen: () => null }));
vi.mock("@/components/register/medium", () => ({ RegisterMediumScreen: () => null }));
vi.mock("@/components/register/desktop", () => ({
  RegisterDesktopScreen: () => <form data-testid="registration-form" />,
}));
vi.mock("@/components/register/turnstile-widget", () => ({
  TurnstileWidget: () => <div data-testid="turnstile-widget" />,
}));

import { RegisterScreen } from "@/components/register/register-screen";

const ECHEANCE = "2026-09-20T12:00:00+00:00";

/** Pendant la fenêtre : le backend ouvre et annonce la fin. */
const PENDANT = {
  open: true,
  mode: "pilot",
  temporarily_unavailable: false,
  turnstile_required: false,
  turnstile_site_key: null,
  closes_at: ECHEANCE,
};

/** À l'échéance et après : fermé, mais l'échéance reste visible. */
const TERMINEE = { ...PENDANT, open: false };

/** Cutoff absent ou illisible : indisponibilité de configuration, pas fin de fenêtre. */
const MAL_CONFIGUREE = {
  ...PENDANT,
  open: false,
  temporarily_unavailable: true,
  closes_at: null,
};

function hookState(overrides: Record<string, unknown> = {}) {
  return {
    status: null,
    isLoading: false,
    isUnavailable: false,
    retry: mocks.retry,
    ...overrides,
  };
}

function monter(status: Record<string, unknown>) {
  mocks.useRegistrationStatus.mockReturnValue(hookState({ status }));
  return render(<RegisterScreen />);
}

describe("AUTH-04B — l'écran suit la fenêtre PILOT sans jamais la décider", () => {
  beforeEach(() => {
    mocks.retry.mockReset();
    mocks.useRegistrationStatus.mockReset();
  });
  afterEach(cleanup);

  it("pendant la fenêtre : le formulaire est monté", () => {
    monter(PENDANT);
    expect(screen.getByTestId("registration-form")).toBeTruthy();
  });

  it("à l'échéance : plus aucun formulaire, et aucun champ de saisie", () => {
    const view = monter(TERMINEE);
    expect(screen.queryByTestId("registration-form")).toBeNull();
    expect(view.container.querySelectorAll("input")).toHaveLength(0);
  });

  it("après l'échéance : l'écran reste fermé, appel après appel", () => {
    for (let i = 0; i < 3; i += 1) {
      monter(TERMINEE);
      expect(screen.queryByTestId("registration-form")).toBeNull();
      cleanup();
    }
  });

  it("configuration PILOT incomplète : indisponible, jamais un formulaire ouvert", () => {
    const view = monter(MAL_CONFIGUREE);
    expect(screen.queryByTestId("registration-form")).toBeNull();
    expect(view.container.querySelectorAll("input")).toHaveLength(0);
  });

  it("aucune horloge frontend : seul `open` décide, jamais `closes_at`", () => {
    // Échéance largement dépassée, mais le backend dit encore ouvert. Le seul
    // comportement correct est de suivre le backend : si l'écran se fermait
    // ici, c'est qu'il aurait sa propre horloge — donc une barrière que
    // l'utilisateur peut régler depuis les paramètres de sa machine.
    monter({ ...PENDANT, closes_at: "2020-01-01T00:00:00+00:00" });
    expect(screen.getByTestId("registration-form")).toBeTruthy();
  });

  it("aucune date future ne force l'ouverture d'un backend fermé", () => {
    // La réciproque : `closes_at` dans le futur ne doit jamais rouvrir un écran
    // que le backend a fermé.
    monter({ ...TERMINEE, closes_at: "2099-01-01T00:00:00+00:00" });
    expect(screen.queryByTestId("registration-form")).toBeNull();
  });
});

describe("AUTH-04B — soumission tardive depuis une page restée ouverte", () => {
  it("le 403 du backend remonte son message, pas un libellé générique", async () => {
    const { parseApiError, humanizeAuthFailure } = await import("@yunicity/utils");

    // Corps exact de la route `register` une fois l'échéance passée.
    const reponse = new Response(
      JSON.stringify({
        code: "REGISTRATION_CLOSED",
        detail:
          "Les inscriptions à la bêta Yunicity sont temporairement fermées. " +
          "Vous possédez déjà un compte ? Connectez-vous.",
      }),
      { status: 403, headers: { "content-type": "application/json" } },
    );

    const erreur = await parseApiError(reponse);
    expect(erreur.code).toBe("REGISTRATION_CLOSED");
    expect(erreur.status).toBe(403);

    // L'utilisateur qui a laissé l'onglet ouvert doit lire POURQUOI. Un
    // « Inscription impossible. » générique le laisserait réessayer en boucle.
    const message = humanizeAuthFailure(erreur, "Inscription impossible.");
    expect(message).toContain("temporairement fermées");
    expect(message).not.toBe("Inscription impossible.");
  });

  it("une erreur non typée retombe sur le libellé de repli, sans inventer de cause", async () => {
    const { humanizeAuthFailure } = await import("@yunicity/utils");
    expect(humanizeAuthFailure(new Error("boom"), "Inscription impossible.")).toBe(
      "Inscription impossible.",
    );
  });
});

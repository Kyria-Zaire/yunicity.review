// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthError, daysUntilDeletion, formatDeletionDate } from "@yunicity/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccountDeletionSection } from "@/components/settings/account-deletion-section";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const api = vi.hoisted(() => ({
  accountDeletionStatus: vi.fn(),
  requestAccountDeletion: vi.fn(),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ yunicityApi: { auth: api } }),
}));

beforeEach(() => {
  api.accountDeletionStatus.mockReset();
  api.requestAccountDeletion.mockReset();
});

afterEach(cleanup);

function activer(): void {
  api.accountDeletionStatus.mockResolvedValue({
    pending: false,
    requested_at: null,
    scheduled_for: null,
  });
}

describe("feature flag", () => {
  it("n'affiche RIEN quand le backend répond 404", async () => {
    // Drapeau absent : la fonctionnalite n'existe pas, l'interface ne doit donc
    // ni la nommer ni proposer d'action.
    api.accountDeletionStatus.mockRejectedValue(new AuthError("NOT_FOUND", "x", 404));

    const { container } = render(<AccountDeletionSection />);

    await waitFor(() => expect(api.accountDeletionStatus).toHaveBeenCalled());
    expect(container.innerHTML).toBe("");
    expect(screen.queryByText(/Supprimer mon compte/i)).toBeNull();
  });

  it("n'affiche rien non plus si le statut est illisible", async () => {
    api.accountDeletionStatus.mockRejectedValue(new Error("reseau"));

    const { container } = render(<AccountDeletionSection />);

    await waitFor(() => expect(api.accountDeletionStatus).toHaveBeenCalled());
    expect(container.innerHTML).toBe("");
  });

  it("affiche la section quand le backend la déclare disponible", async () => {
    activer();
    render(<AccountDeletionSection />);

    expect(await screen.findByTestId("account-deletion")).toBeTruthy();
    expect(screen.getByText(/Supprimer mon compte/i)).toBeTruthy();
  });
});

describe("contenu et honnêteté", () => {
  it("annonce le délai sans promettre une conformité juridique", async () => {
    activer();
    render(<AccountDeletionSection />);
    const section = await screen.findByTestId("account-deletion");

    expect(section.textContent).toMatch(/rien n'est effacé/i);
    // Aucune affirmation de conformite : c'est une qualification juridique.
    expect(section.textContent).not.toMatch(/RGPD|conforme au règlement/i);
  });

  it("énumère les conséquences, solde Yuni compris", async () => {
    activer();
    render(<AccountDeletionSection />);
    const section = await screen.findByTestId("account-deletion");

    expect(section.textContent).toMatch(/déconnecté de tous vos appareils/i);
    expect(section.textContent).toMatch(/solde Yuni/i);
    expect(section.textContent).toMatch(/restent en place pendant le délai/i);
  });
});

describe("validation et soumission", () => {
  it("exige le mot de passe avant tout appel", async () => {
    activer();
    render(<AccountDeletionSection />);
    await screen.findByTestId("account-deletion");

    fireEvent.click(screen.getByRole("button", { name: /Demander la suppression/i }));

    await screen.findByText(/Saisissez votre mot de passe/i);
    expect(api.requestAccountDeletion).not.toHaveBeenCalled();
  });

  it("exige la confirmation explicite", async () => {
    activer();
    render(<AccountDeletionSection />);
    await screen.findByTestId("account-deletion");

    fireEvent.change(screen.getByLabelText(/Votre mot de passe/i), {
      target: { value: "MotDePasseSolide1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Demander la suppression/i }));

    await screen.findByText(/Cochez la case de confirmation/i);
    expect(api.requestAccountDeletion).not.toHaveBeenCalled();
  });

  it("transmet la demande et annonce la date prévue", async () => {
    activer();
    api.requestAccountDeletion.mockResolvedValue({
      message: "ok",
      scheduled_for: "2026-10-11T09:00:00+00:00",
      email_sent: true,
    });

    render(<AccountDeletionSection />);
    await screen.findByTestId("account-deletion");

    fireEvent.change(screen.getByLabelText(/Votre mot de passe/i), {
      target: { value: "MotDePasseSolide1!" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Demander la suppression/i }));

    await screen.findByTestId("account-deletion-done");
    expect(api.requestAccountDeletion).toHaveBeenCalledWith({
      password: "MotDePasseSolide1!",
      confirm: true,
    });
    expect(screen.getByText(/11 octobre 2026/i)).toBeTruthy();
    expect(screen.getByText(/lien contenu dans l'e-mail/i)).toBeTruthy();
  });

  it("dit la vérité quand l'e-mail n'a pas pu partir", async () => {
    activer();
    api.requestAccountDeletion.mockResolvedValue({
      message: "ok",
      scheduled_for: "2026-10-11T09:00:00+00:00",
      email_sent: false,
    });

    render(<AccountDeletionSection />);
    await screen.findByTestId("account-deletion");
    fireEvent.change(screen.getByLabelText(/Votre mot de passe/i), {
      target: { value: "MotDePasseSolide1!" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Demander la suppression/i }));

    await screen.findByTestId("account-deletion-done");
    // Aucune file de reprise n'existe : ne pas annoncer un envoi qui n'a pas eu lieu.
    expect(screen.getByText(/momentanément indisponible/i)).toBeTruthy();
    expect(screen.queryByText(/lien contenu dans l'e-mail/i)).toBeNull();
  });

  it("affiche l'instruction exacte d'un cas bloquant", async () => {
    activer();
    api.requestAccountDeletion.mockRejectedValue(
      new AuthError(
        "TRIBE_TRANSFER_REQUIRED",
        "Vous êtes seul membre d'une tribu que vous avez créée. Transférez-la d'abord.",
        409,
      ),
    );

    render(<AccountDeletionSection />);
    await screen.findByTestId("account-deletion");
    fireEvent.change(screen.getByLabelText(/Votre mot de passe/i), {
      target: { value: "MotDePasseSolide1!" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Demander la suppression/i }));

    // L'instruction du backend doit s'afficher telle quelle : un message
    // generique laisserait l'utilisateur sans savoir quoi faire.
    const alerte = await screen.findByRole("alert");
    expect(alerte.textContent).toMatch(/Transférez-la d'abord/i);
  });
});

describe("accessibilité", () => {
  it("relie le titre à la section et décrit le champ mot de passe", async () => {
    activer();
    render(<AccountDeletionSection />);
    const section = await screen.findByTestId("account-deletion");

    expect(section.getAttribute("aria-labelledby")).toBe("suppression-titre");
    const champ = screen.getByLabelText(/Votre mot de passe/i);
    expect(champ.getAttribute("aria-describedby")).toBe("suppression-mdp-aide");
  });

  it("offre des cibles tactiles suffisantes", async () => {
    activer();
    render(<AccountDeletionSection />);
    await screen.findByTestId("account-deletion");

    // min-h-11 = 44px, le minimum recommande sur mobile.
    expect(screen.getByLabelText(/Votre mot de passe/i).className).toContain("min-h-11");
    expect(
      screen.getByRole("button", { name: /Demander la suppression/i }).className,
    ).toContain("min-h-11");
  });
});

describe("calculs de date", () => {
  it("compte les jours restants sans jamais passer sous zéro", () => {
    const maintenant = new Date("2026-09-11T12:00:00Z");
    expect(daysUntilDeletion("2026-10-11T12:00:00Z", maintenant)).toBe(30);
    expect(daysUntilDeletion("2026-09-01T12:00:00Z", maintenant)).toBe(0);
    expect(daysUntilDeletion("pas-une-date", maintenant)).toBe(0);
  });

  it("formate la date en français et tolère une valeur illisible", () => {
    expect(formatDeletionDate("2026-10-11T09:00:00+00:00")).toMatch(/octobre 2026/);
    expect(formatDeletionDate("n'importe quoi")).toBe("");
  });
});

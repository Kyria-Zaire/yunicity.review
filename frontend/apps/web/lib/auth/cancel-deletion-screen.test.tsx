// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthError } from "@yunicity/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CancelDeletionScreen } from "@/components/login/cancel-deletion-screen";
import { NO_REFERRER_HEADER, TOKEN_BEARING_PATHS } from "@/lib/security-headers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const routerMock = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
const searchParamsMock = vi.hoisted(() => ({ token: null as string | null }));
const clientMock = vi.hoisted(() => ({
  cancelAccountDeletion: vi.fn(),
  resendCancellationLink: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => ({ get: () => searchParamsMock.token }),
}));

vi.mock("@/components/brand", () => ({ YunicityLogo: () => null }));

vi.mock("@yunicity/utils", async () => {
  const actual = await vi.importActual<typeof import("@yunicity/utils")>("@yunicity/utils");
  return {
    ...actual,
    createAuthClient: () => clientMock,
    getWebApiBaseUrl: () => "http://api.test",
  };
});

beforeEach(() => {
  searchParamsMock.token = null;
  routerMock.replace.mockClear();
  clientMock.cancelAccountDeletion.mockReset();
  clientMock.resendCancellationLink.mockReset();
});

afterEach(cleanup);

describe("aucune mutation sans action de l'utilisateur", () => {
  it("n'émet AUCUN POST au montage, même avec un jeton valide", async () => {
    // Le point de la revue : certains produits de sécurité exécutent le
    // JavaScript de la page. Un POST au montage annulerait la suppression à la
    // place de l'utilisateur.
    searchParamsMock.token = "jeton-valide";
    clientMock.cancelAccountDeletion.mockResolvedValue({ message: "ok" });

    render(<CancelDeletionScreen />);

    await screen.findByTestId("confirmer-annulation");
    // Laisse passer tout effet différé avant de conclure.
    await new Promise((r) => setTimeout(r, 50));

    expect(clientMock.cancelAccountDeletion).not.toHaveBeenCalled();
  });

  it("demande une confirmation explicite avant de consommer", async () => {
    searchParamsMock.token = "jeton-valide";
    render(<CancelDeletionScreen />);

    expect(await screen.findByText(/Annuler la suppression \?/i)).toBeTruthy();
    const bouton = screen.getByTestId("confirmer-annulation");
    expect(bouton.textContent).toMatch(/Annuler la suppression/i);
  });

  it("laisse le compte en attente si la page est fermée sans confirmer", async () => {
    searchParamsMock.token = "jeton-valide";
    const { unmount } = render(<CancelDeletionScreen />);

    await screen.findByTestId("confirmer-annulation");
    unmount();

    expect(clientMock.cancelAccountDeletion).not.toHaveBeenCalled();
  });
});

describe("consommation au clic", () => {
  it("envoie EXACTEMENT un POST, avec le jeton capturé", async () => {
    searchParamsMock.token = "jeton-valide";
    clientMock.cancelAccountDeletion.mockResolvedValue({
      message: "Votre compte est réactivé.",
    });

    render(<CancelDeletionScreen />);
    fireEvent.click(await screen.findByTestId("confirmer-annulation"));

    await screen.findByText(/Suppression annulée/i);
    expect(clientMock.cancelAccountDeletion).toHaveBeenCalledTimes(1);
    expect(clientMock.cancelAccountDeletion).toHaveBeenCalledWith({ token: "jeton-valide" });
  });

  it("empêche la double soumission", async () => {
    searchParamsMock.token = "jeton-valide";
    let resoudre: ((v: unknown) => void) | null = null;
    clientMock.cancelAccountDeletion.mockReturnValue(
      new Promise((r) => {
        resoudre = r;
      }),
    );

    render(<CancelDeletionScreen />);
    const bouton = await screen.findByTestId("confirmer-annulation");

    fireEvent.click(bouton);
    fireEvent.click(bouton);
    fireEvent.click(bouton);

    expect(clientMock.cancelAccountDeletion).toHaveBeenCalledTimes(1);
    expect((bouton as HTMLButtonElement).disabled).toBe(true);
    resoudre?.({ message: "ok" });
  });

  it("annonce l'échec de manière accessible", async () => {
    searchParamsMock.token = "jeton-perime";
    clientMock.cancelAccountDeletion.mockRejectedValue(
      new AuthError("INVALID_CANCELLATION_TOKEN", "Ce lien n'est plus valide.", 400),
    );

    render(<CancelDeletionScreen />);
    fireEvent.click(await screen.findByTestId("confirmer-annulation"));

    const annonce = await screen.findByRole("status");
    expect(annonce.textContent).toMatch(/n'est plus valide/i);
    // Une voie de secours reste offerte.
    expect(screen.getByRole("button", { name: /Recevoir un nouveau lien/i })).toBeTruthy();
  });

  it("ne restaure aucune session : il faut se reconnecter", async () => {
    searchParamsMock.token = "jeton-valide";
    clientMock.cancelAccountDeletion.mockResolvedValue({
      message: "Votre compte est réactivé. Reconnectez-vous pour continuer.",
    });

    render(<CancelDeletionScreen />);
    fireEvent.click(await screen.findByTestId("confirmer-annulation"));

    await screen.findByText(/Suppression annulée/i);
    expect(screen.getByRole("button", { name: /Se connecter/i })).toBeTruthy();
    expect(screen.getByText(/Reconnectez-vous/i)).toBeTruthy();
  });
});

describe("containment du jeton", () => {
  it("retire le jeton de l'URL dès le montage, sans l'avoir consommé", async () => {
    searchParamsMock.token = "jeton-valide";
    render(<CancelDeletionScreen />);

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/login/cancel-deletion");
    });
    expect(clientMock.cancelAccountDeletion).not.toHaveBeenCalled();
  });

  it("garde le jeton en mémoire : le nettoyage de l'URL ne le perd pas", async () => {
    searchParamsMock.token = "jeton-valide";
    clientMock.cancelAccountDeletion.mockResolvedValue({ message: "ok" });

    render(<CancelDeletionScreen />);
    // L'URL est nettoyee avant le clic ; le jeton doit malgre tout partir.
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId("confirmer-annulation"));

    await waitFor(() => {
      expect(clientMock.cancelAccountDeletion).toHaveBeenCalledWith({ token: "jeton-valide" });
    });
  });

  it("la page figure parmi celles servies en no-referrer", () => {
    expect(TOKEN_BEARING_PATHS).toContain("/login/cancel-deletion");
    expect(NO_REFERRER_HEADER.value).toBe("no-referrer");
  });
});

describe("arrivée sans jeton", () => {
  it("propose le renvoi plutôt qu'une erreur", async () => {
    render(<CancelDeletionScreen />);

    expect(
      await screen.findByRole("button", { name: /Recevoir un nouveau lien/i }),
    ).toBeTruthy();
    expect(screen.queryByTestId("confirmer-annulation")).toBeNull();
    expect(clientMock.cancelAccountDeletion).not.toHaveBeenCalled();
  });

  it("répond la même chose quelle que soit l'issue du renvoi", async () => {
    clientMock.resendCancellationLink.mockRejectedValue(
      new AuthError("RATE_LIMITED", "trop", 429),
    );

    render(<CancelDeletionScreen />);
    fireEvent.change(await screen.findByLabelText(/Adresse de votre compte/i), {
      target: { value: "citoyen@exemple.fr" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /Recevoir un nouveau lien/i }).closest("form")!,
    );

    // Anti-enumeration : l'interface ne trahit pas ce que le backend cache.
    expect(await screen.findByText(/Si une suppression est en cours/i)).toBeTruthy();
  });
});

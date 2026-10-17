// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthError } from "@yunicity/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VerifyEmailScreen } from "@/components/login/verify-email-screen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const routerMock = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
const searchParamsMock = vi.hoisted(() => ({ token: null as string | null }));
const clientMock = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => ({ get: () => searchParamsMock.token }),
}));

vi.mock("@/components/brand", () => ({
  YunicityLogo: () => null,
}));

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
  clientMock.verifyEmail.mockReset();
  clientMock.resendVerification.mockReset();
  window.sessionStorage.clear();
});

afterEach(cleanup);

describe("VerifyEmailScreen — arrivée sans jeton", () => {
  it("affiche l'attente post-inscription et propose un renvoi", async () => {
    render(<VerifyEmailScreen />);

    const card = await screen.findByText(/Vérifiez votre boîte de réception/i);
    expect(card).toBeTruthy();
    expect(screen.getByRole("button", { name: /Recevoir un nouveau lien/i })).toBeTruthy();
    expect(clientMock.verifyEmail).not.toHaveBeenCalled();
  });

  it("pré-remplit l'adresse mémorisée à l'inscription", async () => {
    window.sessionStorage.setItem("yunicity.pending-verification-email", "citoyen@exemple.fr");

    render(<VerifyEmailScreen />);

    await waitFor(() => {
      const field = screen.getByLabelText(/Votre adresse e-mail/i) as HTMLInputElement;
      expect(field.value).toBe("citoyen@exemple.fr");
    });
  });
});

describe("VerifyEmailScreen — confirmation par jeton", () => {
  it("confirme l'adresse et retire le jeton de l'URL", async () => {
    searchParamsMock.token = "jeton-valide";
    clientMock.verifyEmail.mockResolvedValue({ message: "ok" });

    render(<VerifyEmailScreen />);

    await screen.findByText(/Adresse confirmée/i);
    expect(clientMock.verifyEmail).toHaveBeenCalledWith({ token: "jeton-valide" });
    // Le jeton ne doit pas rester dans l'historique.
    expect(routerMock.replace).toHaveBeenCalledWith("/login/verify-email");
  });

  it("ne consomme le jeton qu'une seule fois malgré un remontage", async () => {
    searchParamsMock.token = "jeton-valide";
    clientMock.verifyEmail.mockResolvedValue({ message: "ok" });

    const { rerender } = render(<VerifyEmailScreen />);
    await screen.findByText(/Adresse confirmée/i);
    rerender(<VerifyEmailScreen />);

    await waitFor(() => {
      expect(clientMock.verifyEmail).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    ["VERIFICATION_TOKEN_EXPIRED", /Lien expiré/i],
    ["VERIFICATION_TOKEN_ALREADY_USED", /Lien déjà utilisé/i],
    ["INVALID_VERIFICATION_TOKEN", /Lien invalide/i],
  ])("affiche l'état correspondant au code %s", async (code, expected) => {
    searchParamsMock.token = "jeton-rejete";
    clientMock.verifyEmail.mockRejectedValue(new AuthError(code, "refusé", 400));

    render(<VerifyEmailScreen />);

    await screen.findByText(expected);
    // Un échec laisse toujours une porte de sortie.
    expect(screen.getByRole("button", { name: /Recevoir un nouveau lien/i })).toBeTruthy();
  });

  it("retire le jeton de l'URL même quand la confirmation échoue", async () => {
    searchParamsMock.token = "jeton-rejete";
    clientMock.verifyEmail.mockRejectedValue(new AuthError("INVALID_VERIFICATION_TOKEN", "x", 400));

    render(<VerifyEmailScreen />);

    await screen.findByText(/Lien invalide/i);
    expect(routerMock.replace).toHaveBeenCalledWith("/login/verify-email");
  });
});

describe("VerifyEmailScreen — renvoi", () => {
  it("refuse une adresse malformée sans appeler l'API", async () => {
    render(<VerifyEmailScreen />);

    fireEvent.change(screen.getByLabelText(/Votre adresse e-mail/i), {
      target: { value: "pas-une-adresse" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Recevoir un nouveau lien/i }).closest("form")!);

    await screen.findByText(/Indiquez une adresse e-mail valide/i);
    expect(clientMock.resendVerification).not.toHaveBeenCalled();
  });

  it("affiche la même confirmation que l'envoi réussisse ou échoue", async () => {
    // Anti-énumération : l'interface ne doit pas trahir ce que le backend cache.
    clientMock.resendVerification.mockRejectedValue(new AuthError("RATE_LIMITED", "trop", 429));

    render(<VerifyEmailScreen />);

    fireEvent.change(screen.getByLabelText(/Votre adresse e-mail/i), {
      target: { value: "citoyen@exemple.fr" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Recevoir un nouveau lien/i }).closest("form")!);

    const confirmation = await screen.findByText(/Si un compte non vérifié existe/i);
    expect(confirmation).toBeTruthy();
    expect(clientMock.resendVerification).toHaveBeenCalledWith({ email: "citoyen@exemple.fr" });
  });

  it("normalise l'adresse avant de la transmettre", async () => {
    clientMock.resendVerification.mockResolvedValue({ message: "ok" });

    render(<VerifyEmailScreen />);

    fireEvent.change(screen.getByLabelText(/Votre adresse e-mail/i), {
      target: { value: "  Citoyen@Exemple.FR  " },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Recevoir un nouveau lien/i }).closest("form")!);

    await waitFor(() => {
      expect(clientMock.resendVerification).toHaveBeenCalledWith({ email: "citoyen@exemple.fr" });
    });
  });
});

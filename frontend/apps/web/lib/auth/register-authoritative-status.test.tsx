// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const CLOSED = {
  open: false,
  mode: "closed",
  temporarily_unavailable: false,
  turnstile_required: false,
  turnstile_site_key: null,
  closes_at: null,
};
const PILOT = { ...CLOSED, open: true, mode: "pilot" };
const PUBLIC = {
  ...PILOT,
  mode: "public",
  turnstile_required: true,
  turnstile_site_key: "1x00000000000000000000AA",
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

describe("RegisterScreen — statut backend autoritaire", () => {
  beforeEach(() => {
    mocks.retry.mockReset();
    mocks.useRegistrationStatus.mockReset();
  });
  afterEach(cleanup);

  it("ne monte aucun formulaire au premier rendu ni avant résolution", () => {
    mocks.useRegistrationStatus.mockReturnValue(hookState({ isLoading: true }));
    const view = render(<RegisterScreen />);
    expect(screen.queryByTestId("registration-form")).toBeNull();
    expect(document.querySelector('[data-register-state="loading"]')).not.toBeNull();

    mocks.useRegistrationStatus.mockReturnValue(hookState({ status: PILOT }));
    view.rerender(<RegisterScreen />);
    expect(screen.getByTestId("registration-form")).not.toBeNull();
  });

  it("CLOSED affiche l'écran fermé sans formulaire", () => {
    mocks.useRegistrationStatus.mockReturnValue(hookState({ status: CLOSED }));
    render(<RegisterScreen />);
    expect(document.querySelector('[data-register-state="closed"]')).not.toBeNull();
    expect(screen.queryByTestId("registration-form")).toBeNull();
  });

  it("PILOT ouvert monte le formulaire sans Turnstile", () => {
    mocks.useRegistrationStatus.mockReturnValue(hookState({ status: PILOT }));
    render(<RegisterScreen />);
    expect(screen.getByTestId("registration-form")).not.toBeNull();
    expect(screen.queryByTestId("turnstile-widget")).toBeNull();
  });

  it("PUBLIC valide monte le formulaire et Turnstile", () => {
    mocks.useRegistrationStatus.mockReturnValue(hookState({ status: PUBLIC }));
    render(<RegisterScreen />);
    expect(screen.getByTestId("registration-form")).not.toBeNull();
    expect(screen.getByTestId("turnstile-widget")).not.toBeNull();
  });

  it("PUBLIC mal configuré reste indisponible sans formulaire", () => {
    mocks.useRegistrationStatus.mockReturnValue(
      hookState({ status: { ...PUBLIC, turnstile_site_key: null } }),
    );
    render(<RegisterScreen />);
    expect(document.querySelector('[data-register-state="unavailable"]')).not.toBeNull();
    expect(screen.queryByTestId("registration-form")).toBeNull();
  });

  it("indisponibilité backend ou temporaire ne monte rien et retry agit une fois", () => {
    mocks.useRegistrationStatus.mockReturnValue(hookState({ isUnavailable: true }));
    const view = render(<RegisterScreen />);
    expect(screen.queryByTestId("registration-form")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(mocks.retry).toHaveBeenCalledTimes(1);

    mocks.useRegistrationStatus.mockReturnValue(
      hookState({ status: { ...PUBLIC, open: false, temporarily_unavailable: true } }),
    );
    view.rerender(<RegisterScreen />);
    expect(document.querySelector('[data-register-state="unavailable"]')).not.toBeNull();
    expect(screen.queryByTestId("registration-form")).toBeNull();
  });
});

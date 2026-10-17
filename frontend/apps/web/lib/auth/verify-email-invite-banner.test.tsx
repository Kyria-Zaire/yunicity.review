// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { VerifyEmailInviteBanner } from "@/components/login/verify-email-invite-banner";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup);

describe("VerifyEmailInviteBanner", () => {
  it("invite un compte non vérifié sans rien bloquer", () => {
    render(<VerifyEmailInviteBanner user={{ is_verified: false }} />);

    expect(screen.getByTestId("verify-email-invite")).toBeTruthy();
    // Le libellé doit dire explicitement que l'accès n'est pas suspendu.
    expect(screen.getByText(/reste accessible/i)).toBeTruthy();
    // Une sortie sans action est toujours offerte : une invitation, pas une barrière.
    expect(screen.getByRole("button", { name: /Plus tard/i })).toBeTruthy();
  });

  it("reste invisible pour un compte déjà vérifié", () => {
    render(<VerifyEmailInviteBanner user={{ is_verified: true }} />);
    expect(screen.queryByTestId("verify-email-invite")).toBeNull();
  });

  it("reste invisible pour un visiteur non connecté", () => {
    render(<VerifyEmailInviteBanner user={null} />);
    expect(screen.queryByTestId("verify-email-invite")).toBeNull();
  });

  it("disparaît quand on la referme", () => {
    render(<VerifyEmailInviteBanner user={{ is_verified: false }} />);

    fireEvent.click(screen.getByRole("button", { name: /Plus tard/i }));

    expect(screen.queryByTestId("verify-email-invite")).toBeNull();
  });

  it("mène à l'écran de confirmation", () => {
    render(<VerifyEmailInviteBanner user={{ is_verified: false }} />);

    const cta = screen.getByRole("link", { name: /Confirmer mon adresse/i });
    expect(cta.getAttribute("href")).toBe("/login/verify-email");
  });
});

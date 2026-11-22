// @vitest-environment jsdom

/**
 * TRIBE-JOIN-PENDING-RELOAD-01 (TRI-02) — bouton « Demander à rejoindre » d'une tribu privée.
 *
 * - Un 409 `TRIBE_REQUEST_PENDING` dit que le serveur connaît DÉJÀ la demande : l'écran
 *   passe à « en attente », sans erreur. Les autres refus 409 gardent leur message.
 * - L'état local suit la fiche rechargée (prop modifiée sans remontage du bouton).
 */

import type { Tribe, TribeJoinRequestPayload } from "@yunicity/types";
import { AuthError } from "@yunicity/utils";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TribeJoinRequestButton } from "@/components/tribes/tribe-join-request-button";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  createTribeJoinRequest:
    vi.fn<(slug: string, city: string, payload: TribeJoinRequestPayload) => Promise<void>>(),
}));

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ tribes: { createTribeJoinRequest: mocks.createTribeJoinRequest } }),
}));

const REQUEST_CTA = "Demander à rejoindre";
const PENDING_TEXT = "Votre demande a été envoyée — elle est en attente de validation.";

function privateTribe(pending: boolean): Tribe {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "qa-tribu-privee",
    name: "QA Tribu privée",
    description: "Tribu de recette.",
    city: "Reims",
    category: "other",
    visibility: "private_invite",
    persistence_kind: "permanent",
    cover_image_url: null,
    is_featured: false,
    member_limit: 50,
    active_member_count: 3,
    is_archived: false,
    viewer_is_member: false,
    viewer_role: null,
    viewer_notifications_muted: false,
    viewer_has_pending_join_request: pending,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

async function clickRequest() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: REQUEST_CTA }));
  });
}

beforeEach(() => {
  mocks.createTribeJoinRequest.mockReset();
});

afterEach(cleanup);

describe("TRI-02 — réponse 409 à une demande d'adhésion", () => {
  it("C6 — 409 TRIBE_REQUEST_PENDING : « en attente », sans message d'erreur", async () => {
    const detail = "Vous avez déjà une demande en attente pour cette tribu.";
    mocks.createTribeJoinRequest.mockRejectedValueOnce(
      new AuthError("TRIBE_REQUEST_PENDING", detail, 409),
    );
    render(<TribeJoinRequestButton tribe={privateTribe(false)} />);
    await clickRequest();

    expect(screen.getByText(PENDING_TEXT)).toBeTruthy();
    expect(screen.queryByRole("button", { name: REQUEST_CTA })).toBeNull();
    expect(screen.queryByText(detail)).toBeNull();
  });

  it.each([
    ["TRIBE_ALREADY_MEMBER", "Vous êtes déjà membre de cette tribu."],
    ["TRIBE_REJOIN_COOLDOWN", "Vous pourrez demander à rejoindre cette tribu plus tard."],
  ])("C6 — 409 %s : le message d'erreur reste, pas d'« en attente »", async (code, detail) => {
    mocks.createTribeJoinRequest.mockRejectedValueOnce(new AuthError(code, detail, 409));
    render(<TribeJoinRequestButton tribe={privateTribe(false)} />);
    await clickRequest();

    expect(screen.getByText(detail)).toBeTruthy();
    expect(screen.queryByText(PENDING_TEXT)).toBeNull();
    expect(screen.getByRole("button", { name: REQUEST_CTA })).toBeTruthy();
  });

  it("un autre statut portant le même code n'est pas pris pour une demande en attente", async () => {
    mocks.createTribeJoinRequest.mockRejectedValueOnce(
      new AuthError("TRIBE_REQUEST_PENDING", "Erreur API (500)", 500),
    );
    render(<TribeJoinRequestButton tribe={privateTribe(false)} />);
    await clickRequest();

    expect(screen.getByText("Erreur API (500)")).toBeTruthy();
    expect(screen.queryByText(PENDING_TEXT)).toBeNull();
  });

  it("succès (201) : « en attente » (comportement inchangé)", async () => {
    mocks.createTribeJoinRequest.mockResolvedValueOnce(undefined);
    render(<TribeJoinRequestButton tribe={privateTribe(false)} />);
    await clickRequest();

    expect(screen.getByText(PENDING_TEXT)).toBeTruthy();
    expect(mocks.createTribeJoinRequest).toHaveBeenCalledWith("qa-tribu-privee", "Reims", {
      message: null,
    });
  });
});

describe("TRI-02 — l'état local suit la fiche rechargée", () => {
  it("C2 — fiche reçue avec une demande en attente : « en attente », pas de bouton", () => {
    render(<TribeJoinRequestButton tribe={privateTribe(true)} />);

    expect(screen.getByText(PENDING_TEXT)).toBeTruthy();
    expect(screen.queryByRole("button", { name: REQUEST_CTA })).toBeNull();
  });

  it("C9 — fiche rechargée avec une demande en attente : le bouton laisse place à « en attente »", () => {
    const { rerender } = render(<TribeJoinRequestButton tribe={privateTribe(false)} />);
    expect(screen.getByRole("button", { name: REQUEST_CTA })).toBeTruthy();

    rerender(<TribeJoinRequestButton tribe={privateTribe(true)} />);

    expect(screen.getByText(PENDING_TEXT)).toBeTruthy();
    expect(screen.queryByRole("button", { name: REQUEST_CTA })).toBeNull();
  });

  it("C9 — fiche rechargée sans demande (ex. demande refusée) : le bouton revient", () => {
    const { rerender } = render(<TribeJoinRequestButton tribe={privateTribe(true)} />);
    expect(screen.getByText(PENDING_TEXT)).toBeTruthy();

    rerender(<TribeJoinRequestButton tribe={privateTribe(false)} />);

    expect(screen.getByRole("button", { name: REQUEST_CTA })).toBeTruthy();
    expect(screen.queryByText(PENDING_TEXT)).toBeNull();
  });

  it("une demande envoyée n'est pas effacée par un re-rendu sans changement de fiche", async () => {
    mocks.createTribeJoinRequest.mockResolvedValueOnce(undefined);
    const tribe = privateTribe(false);
    const { rerender } = render(<TribeJoinRequestButton tribe={tribe} />);
    await clickRequest();
    expect(screen.getByText(PENDING_TEXT)).toBeTruthy();

    rerender(<TribeJoinRequestButton tribe={{ ...tribe }} />);

    expect(screen.getByText(PENDING_TEXT)).toBeTruthy();
  });
});

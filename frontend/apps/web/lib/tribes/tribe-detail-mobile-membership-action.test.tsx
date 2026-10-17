// @vitest-environment jsdom

import type { Tribe, TribeMemberRole } from "@yunicity/types";
import {
  TRIBE_DETAIL_MOBILE_JOIN_CTA,
  TRIBE_DETAIL_MOBILE_MEMBER_CTA,
  TRIBE_LEAVE_CTA,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TribeDetailMobileMembershipAction } from "@/components/tribes/mobile/tribe-detail-mobile-membership-action";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(cleanup);

function tribu(surcharge: Partial<Tribe> = {}): Tribe {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "qa-tribu-publique",
    name: "QA Tribu publique",
    description: "Tribu de recette.",
    city: "Reims",
    category: "other",
    visibility: "public",
    persistence_kind: "permanent",
    cover_image_url: null,
    is_featured: false,
    member_limit: 50,
    active_member_count: 3,
    is_archived: false,
    viewer_is_member: true,
    viewer_role: "member" as TribeMemberRole,
    viewer_notifications_muted: false,
    viewer_has_pending_join_request: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...surcharge,
  };
}

type Rendu = {
  onLeave: ReturnType<typeof vi.fn>;
  onJoin: ReturnType<typeof vi.fn>;
};

function monter(
  options: { tribe?: Partial<Tribe>; leaving?: boolean; actionError?: string | null } = {},
): Rendu {
  const onLeave = vi.fn(() => Promise.resolve());
  const onJoin = vi.fn(() => Promise.resolve());
  render(
    <TribeDetailMobileMembershipAction
      tribe={tribu(options.tribe)}
      isAuthenticated
      joining={false}
      leaving={options.leaving ?? false}
      actionError={options.actionError ?? null}
      onJoin={onJoin}
      onLeave={onLeave}
    />,
  );
  return { onLeave, onJoin };
}

/** Le déclencheur « Membre » — nom exact, car l'onglet « Membres » le contient. */
function membre(): HTMLElement {
  return screen.getByRole("button", { name: TRIBE_DETAIL_MOBILE_MEMBER_CTA });
}

/**
 * Montée mobile du contrôle d'adhésion.
 *
 * Mesuré avant ce montage : sur mobile, une fois la tribu publique rejointe, la
 * carte d'adhésion disparaissait et RIEN ne la remplaçait — aucun contrôle
 * « Membre », donc aucun moyen de quitter. La spec 06 échouait là, et c'était
 * une lacune produit, pas un contrat de test périmé.
 *
 * Les cas ci-dessous couvrent ce que le parcours Playwright ne peut pas prouver
 * de façon déterministe : l'annulation, le refus serveur et la réentrance.
 */
describe("TribeDetailMobileMembershipAction", () => {
  it("expose le contrôle « Membre » replié, sans départ déclenché", () => {
    const { onLeave } = monter();
    expect(membre().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: TRIBE_LEAVE_CTA })).toBeNull();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("ouvre le menu et quitte via « Quitter », une seule fois", () => {
    const { onLeave } = monter();
    fireEvent.click(membre());
    expect(membre().getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: TRIBE_LEAVE_CTA }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("ANNULATION : refermer le menu ne quitte pas", () => {
    const { onLeave } = monter();
    fireEvent.click(membre());
    expect(screen.getByRole("button", { name: TRIBE_LEAVE_CTA })).not.toBeNull();

    fireEvent.click(membre());
    expect(membre().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: TRIBE_LEAVE_CTA })).toBeNull();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("DOUBLE CLIC : le menu se referme au premier, donc aucun second départ", () => {
    const { onLeave } = monter();
    fireEvent.click(membre());
    const quitter = screen.getByRole("button", { name: TRIBE_LEAVE_CTA });

    fireEvent.click(quitter);
    fireEvent.click(quitter);

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("DOUBLE CLIC : pendant le départ en cours, « Quitter » est désactivé", () => {
    const { onLeave } = monter({ leaving: true });
    fireEvent.click(membre());
    const quitter = screen.getByRole("button", { name: TRIBE_LEAVE_CTA });

    expect((quitter as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(quitter);
    expect(onLeave).not.toHaveBeenCalled();
  });

  it("ERREUR API : le refus du serveur est LU, et non avalé par le menu", () => {
    // Message réel du backend pour un propriétaire unique (409
    // TRIBE_OWNER_CANNOT_LEAVE) — le seul refus métier de `/leave`.
    const refus = "Transférez la responsabilité ou archivez la tribu avant de partir.";
    monter({ actionError: refus });

    expect(screen.getByRole("alert").textContent).toBe(refus);
  });

  it("PROPRIÉTAIRE : l'action reste offerte, le serveur restant seul juge", () => {
    // Le refus dépend du NOMBRE de propriétaires actifs, que le client ne
    // connaît pas : `viewer_role` ne dit pas s'il y a des co-propriétaires. Un
    // propriétaire qui en a peut partir. Masquer l'action par anticipation
    // interdirait donc un départ légitime.
    const { onLeave } = monter({ tribe: { viewer_role: "owner" } });
    fireEvent.click(membre());
    fireEvent.click(screen.getByRole("button", { name: TRIBE_LEAVE_CTA }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("MODÉRATEUR : même traitement qu'un membre", () => {
    const { onLeave } = monter({ tribe: { viewer_role: "moderator" } });
    fireEvent.click(membre());
    fireEvent.click(screen.getByRole("button", { name: TRIBE_LEAVE_CTA }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("ARCHIVÉE : aucune action, le départ n'a plus d'objet", () => {
    monter({ tribe: { is_archived: true } });
    expect(screen.queryByRole("button", { name: TRIBE_DETAIL_MOBILE_MEMBER_CTA })).toBeNull();
    expect(screen.queryByRole("button", { name: TRIBE_LEAVE_CTA })).toBeNull();
  });

  it("NON MEMBRE : le contrôle propose de rejoindre, jamais de quitter", () => {
    monter({ tribe: { viewer_is_member: false } });
    expect(screen.getByRole("button", { name: TRIBE_DETAIL_MOBILE_JOIN_CTA })).not.toBeNull();
    expect(screen.queryByRole("button", { name: TRIBE_LEAVE_CTA })).toBeNull();
  });
});

// @vitest-environment jsdom

import type { VideoPortalCreator } from "@yunicity/utils";
import {
  VIDEOS_FEED_CREATORS_TITLE,
  VIDEOS_MOBILE_PUBLISH_ARIA,
  formatVideoTemporalLabel,
} from "@yunicity/utils";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VideosMobileSubscriptionsRail } from "@/components/videos/mobile/videos-mobile-subscriptions-rail";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

/**
 * VIDEO-REFONTE-L1B-CREATEURS-01 — la section liste les créateurs du fil (pas des abonnements),
 * sans statut de présence fabriqué ni anneaux en dégradé ; ses liens restent fonctionnels.
 */
function creator(n: number, publishedAt: string): VideoPortalCreator {
  return {
    authorUserId: `author-${n}`,
    displayName: `Créateur ${n}`,
    handle: `@createur${n}`,
    avatarUrl: null,
    latestVideoId: `video-${n}`,
    latestPublishedAt: publishedAt,
  };
}

// Quatre créateurs : avant L1B, les rangs 0 et 3 (index % 3 === 0) étaient affichés « En ligne ».
const CREATORS: VideoPortalCreator[] = [
  creator(1, "2026-11-13T08:00:00.000Z"),
  creator(2, "2026-11-12T08:00:00.000Z"),
  creator(3, "2026-11-05T08:00:00.000Z"),
  creator(4, "2026-10-01T08:00:00.000Z"),
];

afterEach(() => {
  cleanup();
});

describe("Créateurs du fil", () => {
  it("s'intitule « Créateurs du fil », titre et navigation compris", () => {
    render(<VideosMobileSubscriptionsRail creators={CREATORS} />);

    // Libellé littéral : une constante absente (undefined) accepterait n'importe quel nom.
    expect(VIDEOS_FEED_CREATORS_TITLE).toBe("Créateurs du fil");
    expect(screen.getByRole("heading", { name: "Créateurs du fil" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Créateurs du fil" })).toBeTruthy();
  });

  it("n'affiche ni « Abonnements », ni « En ligne », ni « Voir tout »", () => {
    const { container } = render(<VideosMobileSubscriptionsRail creators={CREATORS} />);

    expect(container.textContent ?? "").not.toMatch(/Abonnements|En ligne|Voir tout/);
    for (const el of Array.from(container.querySelectorAll("[aria-label]"))) {
      expect(el.getAttribute("aria-label") ?? "").not.toMatch(/Abonnements|En ligne/);
    }
  });

  it("affiche pour chaque créateur l'ancienneté réelle de sa dernière vidéo, quel que soit son rang", () => {
    render(<VideosMobileSubscriptionsRail creators={CREATORS} />);

    for (const c of CREATORS) {
      const link = screen.getByRole("link", { name: new RegExp(c.handle) });
      expect(within(link).getByText(formatVideoTemporalLabel(c.latestPublishedAt))).toBeTruthy();
    }
  });

  it("ne suggère aucun statut : ni pastille de présence, ni style vert, ni anneau en dégradé", () => {
    const { container } = render(<VideosMobileSubscriptionsRail creators={CREATORS} />);

    const classes = Array.from(container.querySelectorAll("[class]")).map((el) => el.getAttribute("class") ?? "");
    expect(classes.filter((c) => /gradient|emerald|from-|via-/.test(c))).toEqual([]);
  });

  it("conserve les liens vers la dernière vidéo de chaque créateur et la tuile Publier", () => {
    render(<VideosMobileSubscriptionsRail creators={CREATORS} />);

    for (const c of CREATORS) {
      const link = screen.getByRole("link", { name: new RegExp(c.handle) });
      expect(link.getAttribute("href")).toBe(`/videos?video=${c.latestVideoId}`);
    }
    expect(screen.getByRole("link", { name: VIDEOS_MOBILE_PUBLISH_ARIA }).getAttribute("href")).toBe("/videos/new");
  });

  it("ne rend rien sans créateur", () => {
    const { container } = render(<VideosMobileSubscriptionsRail creators={[]} />);
    expect(container.innerHTML).toBe("");
  });
});

"use client";

import type { PartnerOfferPublic } from "@yunicity/types";
import type { FeedPortalView } from "@yunicity/utils";
import type { MutableRefObject, Ref } from "react";

import { FeedDesktopLeftRail } from "@/components/feed/desktop/feed-desktop-left-rail";
import type { FeedDesktopPassportRailData } from "@/components/feed/desktop/feed-desktop-right-rail";
import { FeedDesktopRightRail } from "@/components/feed/desktop/feed-desktop-right-rail";
import { FeedDesktopHeader } from "@/components/feed/feed-desktop-header";
import type { FeedEditorialMainColumnProps } from "@/components/feed/feed-editorial-main-column";
import { FeedEditorialMainColumn } from "@/components/feed/feed-editorial-main-column";
import { FeedMobileHeader } from "@/components/feed/mobile/feed-mobile-header";
import { FeedMediumHeader } from "@/components/feed/portal/feed-medium-header";
import type { FeedWeatherCardData } from "@/components/feed/portal/feed-weather-card";

type FeedShellLeftNav = Parameters<typeof FeedDesktopLeftRail>[0]["leftNav"];

type FeedResponsiveShellProps = FeedEditorialMainColumnProps & {
  activeView: FeedPortalView;
  leftNav: FeedShellLeftNav;
  onLeftNavSelect: (nav: FeedShellLeftNav) => void;

  filterPanelOpen: boolean;
  filterActive: boolean;
  onOpenFilter: (trigger: HTMLButtonElement) => void;
  filterButtonRef?: Ref<HTMLButtonElement>;

  highlightOffer: PartnerOfferPublic | null;
  weather: FeedWeatherCardData;
  passport: FeedDesktopPassportRailData;
  /** Sonde posée sur le rail gauche : arme les requêtes de rail au premier Desktop réel. */
  desktopProbeRef?: MutableRefObject<HTMLElement | null>;
};

/**
 * Squelette responsive du fil — C3-FEED-RESPONSIVE-SHELL-R4.
 *
 * UN seul arbre DOM pour les trois paliers. La colonne centrale
 * (`.feed-main-column`) est montée en permanence et ne dépend d'aucune mesure
 * de largeur : elle rend une unique `FeedEditorialMainColumn`, donc une unique
 * liste de publications et une unique pagination.
 *
 * Seuls les éléments de shell varient, et uniquement par media query dans
 * `globals.css` — aucun `matchMedia`, aucun `resize`, aucun `innerWidth` ici :
 *   • `.web-mobile-feed-only` (header mobile) → visible sous 640px
 *   • `.feed-medium-header`                   → visible de 640 à 1279,98px
 *   • `.feed-shell-desktop-header`            → visible à partir de 1280px
 *   • `.feed-desktop-left-rail` / `.feed-desktop-right-rail` → à partir de 1280px
 *
 * Les deux premiers portent déjà leur propre media query : les envelopper
 * casserait leur `position: sticky`, qui doit rester relatif à la colonne.
 *
 * Les rails Desktop restent montés sous 1280px : ils sont purement
 * présentationnels et ne déclenchent aucune requête — leurs données arrivent en
 * props depuis le contrôleur, qui reste seul propriétaire du réseau.
 */
export function FeedResponsiveShell({
  activeView,
  leftNav,
  onLeftNavSelect,
  filterPanelOpen,
  filterActive,
  onOpenFilter,
  filterButtonRef,
  highlightOffer,
  weather,
  passport,
  desktopProbeRef,
  ...column
}: FeedResponsiveShellProps) {
  const { city, userFirstName, portalEvents, showSaved } = column;

  return (
    <div className="feed-shell feed-desktop-layout">
      <FeedDesktopLeftRail
        city={city}
        activeView={activeView}
        leftNav={leftNav}
        onNavSelect={onLeftNavSelect}
        weather={weather}
        desktopProbeRef={desktopProbeRef}
      />

      <div className="feed-main-column feed-desktop-center">
        {!showSaved ? <FeedMobileHeader /> : null}

        <FeedMediumHeader
          city={city}
          filterPanelOpen={filterPanelOpen}
          filterActive={filterActive}
          onOpenFilter={onOpenFilter}
          filterButtonRef={filterButtonRef}
        />

        <FeedDesktopHeader
          city={city}
          userFirstName={userFirstName}
          filterPanelOpen={filterPanelOpen}
          filterActive={filterActive}
          onOpenFilter={onOpenFilter}
        />

        <FeedEditorialMainColumn {...column} interestFilterActive={filterActive} />
      </div>

      <FeedDesktopRightRail
        events={portalEvents}
        city={city}
        highlightOffer={highlightOffer}
        passport={passport}
      />
    </div>
  );
}

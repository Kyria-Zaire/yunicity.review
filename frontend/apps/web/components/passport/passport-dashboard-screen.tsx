"use client";

import { PassportAchievementsRow } from "@/components/passport/passport-achievements-row";
import { PassportAppShell } from "@/components/passport/passport-app-shell";
import { PassportDashboardHero } from "@/components/passport/passport-dashboard-hero";
import { PassportInternalSidebar } from "@/components/passport/passport-internal-sidebar";
import { PassportProgressionTrack } from "@/components/passport/passport-progression-track";
import { PassportRecentBadges } from "@/components/passport/passport-recent-badges";
import { PassportTipsAside } from "@/components/layout/web-page-asides";
import type { PassportDashboardNavId } from "@/hooks/use-passport-dashboard-context";
import { usePassportDashboardContext } from "@/hooks/use-passport-dashboard-context";
import { yunicityBtnPrimaryLg } from "@/lib/brand-classes";
import {
  PASSPORT_ACTIVATE_BODY,
  PASSPORT_ACTIVATE_CTA,
  PASSPORT_ACTIVATE_TITLE,
  PASSPORT_LOADING,
} from "@yunicity/utils";
import { useCallback, useState } from "react";

import { PassportPartnerOffersSection } from "./passport-partner-offers-section";
import { PassportPartnersPanel } from "./passport-partners-panel";
import { PassportOffersList } from "./passport-offers-section";
import { PassportStampsList, PassportStampsSection } from "./passport-stamps-section";

export function PassportDashboardScreen() {
  const ctx = usePassportDashboardContext();
  const [activeNav, setActiveNav] = useState<PassportDashboardNavId>("overview");

  const scrollToId = useCallback((targetId: string) => {
    const el = document.getElementById(targetId);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goToNav = useCallback((navId: PassportDashboardNavId) => {
    setActiveNav(navId);
  }, []);

  return (
    <PassportAppShell>
      {ctx.isLoading ? (
        <p className="py-12 text-center text-sm text-neutral-500" role="status">
          {PASSPORT_LOADING}
        </p>
      ) : !ctx.hasPassport || !ctx.passport || !ctx.levelView ? (
        <div className="mx-auto max-w-lg rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">
            Territoire · Identité
          </p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">{PASSPORT_ACTIVATE_TITLE}</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{PASSPORT_ACTIVATE_BODY}</p>
          {ctx.error ? <p className="mt-3 text-sm text-red-600">{ctx.error}</p> : null}
          <button
            type="button"
            onClick={() => void ctx.activate()}
            disabled={ctx.isActivating}
            className={`mt-6 w-full ${yunicityBtnPrimaryLg} disabled:opacity-60`}
          >
            {ctx.isActivating ? "Activation…" : PASSPORT_ACTIVATE_CTA}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8 pb-12 lg:flex-row lg:items-start lg:gap-10">
          <PassportInternalSidebar
            activeNav={activeNav}
            onNavigate={goToNav}
            onAmbassadorCta={() => {
              goToNav("overview");
              requestAnimationFrame(() => scrollToId("passport-progression"));
            }}
          />

          <div className="min-w-0 flex-1 space-y-10">
            {activeNav === "overview" ? (
              <>
                <PassportDashboardHero
                  levelView={ctx.levelView}
                  onScrollProgression={() => scrollToId("passport-progression")}
                />
                <PassportAchievementsRow
                  items={ctx.achievements}
                  onViewAllBadges={() => goToNav("badges")}
                />
                <PassportProgressionTrack steps={ctx.progression} />
                <PassportRecentBadges badges={ctx.badges} onViewAll={() => goToNav("badges")} />
                <PassportPartnerOffersSection offers={ctx.publicOffers} />
                <PassportPartnersPanel
                  partners={ctx.featuredPartners}
                  offers={ctx.publicOffers}
                />
                <PassportStampsSection stamps={ctx.stamps} isLoading={ctx.stampsLoading} />
              </>
            ) : null}

            {activeNav === "stats" ? (
              <PassportAchievementsRow
                items={ctx.achievements}
                onViewAllBadges={() => goToNav("badges")}
              />
            ) : null}

            {activeNav === "badges" ? (
              <PassportRecentBadges badges={ctx.badges} showAll onViewAll={() => goToNav("badges")} />
            ) : null}

            {activeNav === "privileges" ? (
              <section id="passport-privileges" className="scroll-mt-28">
                <PassportOffersList offers={ctx.publicOffers} isLoading={ctx.offersLoading} />
              </section>
            ) : null}

            {activeNav === "history" ? (
              <section id="passport-history" className="scroll-mt-28">
                <PassportStampsList stamps={ctx.stamps} isLoading={ctx.stampsLoading} />
              </section>
            ) : null}

            {activeNav === "tips" ? (
              <section id="passport-tips" className="scroll-mt-28">
                <PassportTipsAside />
              </section>
            ) : null}
          </div>
        </div>
      )}
    </PassportAppShell>
  );
}

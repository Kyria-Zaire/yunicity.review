"use client";

import { PassportDesktopEditorialHeader } from "@/components/passport/desktop/passport-desktop-editorial-header";
import { PassportDesktopFlashBanner } from "@/components/passport/desktop/passport-desktop-flash-banner";
import { PassportDesktopHeroCard } from "@/components/passport/desktop/passport-desktop-hero-card";
import { PassportDesktopHowItWorks } from "@/components/passport/desktop/passport-desktop-how-it-works";
import { PassportDesktopLeftRail } from "@/components/passport/desktop/passport-desktop-left-rail";
import { PassportDesktopNextSteps } from "@/components/passport/desktop/passport-desktop-next-steps";
import { PassportDesktopOffersGrid } from "@/components/passport/desktop/passport-desktop-offers-grid";
import { PassportDesktopOffersSidebar } from "@/components/passport/desktop/passport-desktop-offers-sidebar";
import { PassportDesktopOffersTab } from "@/components/passport/desktop/passport-desktop-offers-tab";
import { PassportDesktopPartnersRail } from "@/components/passport/desktop/passport-desktop-partners-rail";
import { PassportDesktopRightRail } from "@/components/passport/desktop/passport-desktop-right-rail";
import {
  PassportMediumDualPanel,
  PassportMediumHeroHeader,
  PassportMediumSummaryRow,
} from "@/components/passport/medium";
import { PassportMobileHeader } from "@/components/passport/mobile";
import { PassportRulesPanel } from "@/components/passport/passport-rail-panels";
import { usePassportDesktopExtras } from "@/hooks/use-passport-desktop-extras";
import type {
  PartnerOfferPublic,
  PassportMe,
  PassportOverviewResponse,
  PassportStamp,
  ProfileMe,
} from "@yunicity/types";
import type { PassportNavId } from "@yunicity/utils";
import {
  buildPassportDesktopActivityItems,
  buildPassportDesktopNextSteps,
  buildPassportDesktopSavedOfferPreview,
  buildPassportDesktopSegmentProgress,
  pickPassportDesktopFlashOffer,
  filterPassportOffersTab,
  buildPassportLevel,
  buildPassportLevelFromReputation,
} from "@yunicity/utils";
import { useCallback, useMemo, useState } from "react";

export type { PassportNavId as PassportDesktopNavId };

type PassportDesktopViewProps = {
  profile: ProfileMe;
  displayName: string;
  overview: PassportOverviewResponse;
  passportMe: PassportMe | null;
  qrPayload: string | null;
  qrLoading: boolean;
  offers: PartnerOfferPublic[];
  stamps: PassportStamp[];
  stampsLoading: boolean;
  offersMessage?: string | null;
  savedEventsCount?: number;
};

export function PassportDesktopView({
  profile,
  displayName,
  overview,
  passportMe,
  qrPayload,
  qrLoading,
  offers,
  stamps,
  stampsLoading,
  offersMessage,
  savedEventsCount = 0,
}: PassportDesktopViewProps) {
  const city = profile.city?.trim() || "Reims";
  const { partners } = usePassportDesktopExtras(true, city);
  const [activeNav, setActiveNav] = useState<PassportNavId>("overview");
  const [offerCategoryId, setOfferCategoryId] = useState("all");
  const [offerQuery, setOfferQuery] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  const levelView = useMemo(() => {
    if (passportMe) return buildPassportLevel(passportMe);
    return buildPassportLevelFromReputation(
      overview.reputation.total_points,
      overview.summary.passport_tier ?? "Citoyen",
    );
  }, [overview.reputation.total_points, overview.summary.passport_tier, passportMe]);

  const segmentProgress = useMemo(
    () => buildPassportDesktopSegmentProgress(levelView),
    [levelView],
  );

  const nextSteps = useMemo(
    () =>
      buildPassportDesktopNextSteps({
        stampsCount: stamps.length,
        savedEventsCount,
        redemptionsCount: passportMe?.stats.redemptions_count ?? 0,
      }),
    [passportMe?.stats.redemptions_count, savedEventsCount, stamps.length],
  );

  const activityItems = useMemo(
    () => (stampsLoading ? [] : buildPassportDesktopActivityItems(stamps, 3)),
    [stamps, stampsLoading],
  );

  const savedOffers = useMemo(() => {
    const saved = offers.filter((offer) => savedIds.has(offer.id));
    if (saved.length > 0) return saved.slice(0, 2);
    return buildPassportDesktopSavedOfferPreview(offers, 2);
  }, [offers, savedIds]);
  const flashOffer = useMemo(() => pickPassportDesktopFlashOffer(offers), [offers]);
  const filteredOffers = useMemo(
    () =>
      filterPassportOffersTab({
        offers,
        query: offerQuery,
        categoryId: offerCategoryId,
        availableNow,
        savedOnly,
        savedIds,
      }),
    [availableNow, offerCategoryId, offerQuery, offers, savedIds, savedOnly],
  );
  const featuredOffer = useMemo(
    () => pickPassportDesktopFlashOffer(filteredOffers) ?? filteredOffers[0] ?? null,
    [filteredOffers],
  );

  const goToTab = useCallback((navId: PassportNavId, targetId?: string) => {
    if (navId === "saved") {
      setSavedOnly(true);
      setActiveNav("offers");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setActiveNav(navId);
    if (navId === "offers" || navId === "overview") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(targetId ?? "");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollTo = useCallback((targetId: string, navId: PassportNavId) => {
    goToTab(navId, targetId);
  }, [goToTab]);

  const selectCategory = useCallback((categoryId: string) => {
    setOfferCategoryId(categoryId);
    setActiveNav("offers");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleSaved = useCallback((offerId: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(offerId)) next.delete(offerId);
      else next.add(offerId);
      return next;
    });
  }, []);

  const isOffers = activeNav === "offers";

  return (
    <div className="passport-shell passport-desktop-layout px-0 pb-10 sm:px-0">
      <div className="passport-left-shell-only">
        <PassportDesktopLeftRail
          city={city}
          activeNav={activeNav}
          onNavigate={scrollTo}
          onSelectCategory={selectCategory}
          activeCategory={isOffers ? offerCategoryId : undefined}
        />
      </div>

      <div className="passport-main-column min-w-0 space-y-5">
        <PassportMobileHeader />
        <div className="passport-medium-only">
          <PassportMediumHeroHeader
            city={city}
            activeNav={activeNav}
            onNavigate={scrollTo}
            editorial={<PassportDesktopEditorialHeader city={city} variant={isOffers ? "offers" : "overview"} />}
            showCategories={!isOffers}
            activeCategory={offerCategoryId}
            onCategorySelect={selectCategory}
          />
        </div>

        <div className="passport-desktop-editorial-only">
          <PassportDesktopEditorialHeader city={city} variant={isOffers ? "offers" : "overview"} />
        </div>

        {isOffers ? (
          <PassportDesktopOffersTab
            city={city}
            offers={filteredOffers}
            featuredOffer={featuredOffer}
            savedIds={savedIds}
            activeNav={activeNav}
            onNavigate={scrollTo}
            categoryId={offerCategoryId}
            onCategoryChange={selectCategory}
            query={offerQuery}
            onQueryChange={setOfferQuery}
            availableNow={availableNow}
            onAvailableNowChange={setAvailableNow}
            savedOnly={savedOnly}
            onSavedOnlyChange={setSavedOnly}
            onToggleSaved={toggleSaved}
            displayName={displayName}
            levelView={levelView}
            segmentProgress={segmentProgress}
            savedOffers={savedOffers}
            onOpenPassport={() => goToTab("overview")}
            onViewAllSaved={() => {
              setSavedOnly(true);
              setActiveNav("offers");
            }}
          />
        ) : (
          <>
            <PassportDesktopHeroCard
              city={city}
              displayName={displayName}
              levelView={levelView}
              segmentProgress={segmentProgress}
              onOpenHistory={() => scrollTo("passport-desktop-history", "history")}
            />

            <div className="passport-medium-only">
              <PassportMediumSummaryRow
                displayName={displayName}
                city={city}
                qrPayload={qrPayload}
                qrLoading={qrLoading}
                segmentProgress={segmentProgress}
                onOpenProgress={() => scrollTo("passport-desktop-how", "overview")}
              />
            </div>

            {flashOffer ? <PassportDesktopFlashBanner offer={flashOffer} /> : null}
            <PassportDesktopNextSteps steps={nextSteps} />
            <PassportDesktopOffersGrid offers={offers} message={offersMessage} />

            <div className="passport-medium-only">
              <PassportMediumDualPanel
                savedOffers={savedOffers}
                activityItems={activityItems}
                onOpenHistory={() => scrollTo("passport-desktop-history", "history")}
              />
            </div>

            <PassportDesktopPartnersRail partners={partners} />
            <PassportDesktopHowItWorks />
            <div className="passport-medium-only">
              <PassportRulesPanel />
            </div>
          </>
        )}
      </div>

      <div className="passport-desktop-shell-only">
        {isOffers ? (
          <PassportDesktopOffersSidebar
            displayName={displayName}
            levelView={levelView}
            segmentProgress={segmentProgress}
            savedOffers={savedOffers}
            onOpenPassport={() => goToTab("overview")}
            onViewAllSaved={() => {
              setSavedOnly(true);
              setActiveNav("offers");
            }}
          />
        ) : (
          <PassportDesktopRightRail
            displayName={displayName}
            city={city}
            qrPayload={qrPayload}
            qrLoading={qrLoading}
            segmentProgress={segmentProgress}
            savedOffers={savedOffers}
            activityItems={activityItems}
            onOpenHistory={() => scrollTo("passport-desktop-history", "history")}
            onOpenProgress={() => scrollTo("passport-desktop-how", "overview")}
          />
        )}
      </div>
    </div>
  );
}

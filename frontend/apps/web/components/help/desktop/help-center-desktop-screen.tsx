"use client";

import {
  HelpCenterCategoryGrid,
  HelpCenterContactCard,
  HelpCenterFaq,
  HelpCenterHero,
  useHelpCenterState,
} from "@/components/help/shared";

export function HelpCenterDesktopScreen() {
  const { query, setQuery, openFaqId, toggleFaq, categories, faqItems } = useHelpCenterState();

  return (
    <div className="hidden lg:block" data-help-center-desktop-root="">
      <HelpCenterHero query={query} onQueryChange={setQuery} variant="desktop" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0">
          <HelpCenterCategoryGrid categories={categories} variant="desktop" />
          <HelpCenterFaq items={faqItems} openId={openFaqId} onToggle={toggleFaq} />
        </div>
        <HelpCenterContactCard variant="rail" />
      </div>
    </div>
  );
}

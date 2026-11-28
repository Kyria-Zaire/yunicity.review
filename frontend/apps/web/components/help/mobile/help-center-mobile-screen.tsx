"use client";

import {
  HelpCenterCategoryGrid,
  HelpCenterContactCard,
  HelpCenterFaq,
  HelpCenterHero,
  useHelpCenterState,
} from "@/components/help/shared";

export function HelpCenterMobileScreen() {
  const { query, setQuery, openFaqId, toggleFaq, categories, faqItems } = useHelpCenterState();

  return (
    <div className="flex flex-col sm:hidden" data-help-center-mobile-root="">
      <HelpCenterHero query={query} onQueryChange={setQuery} variant="mobile" />
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <HelpCenterCategoryGrid
          categories={categories}
          variant="mobile"
          titleId="help-center-browse-title-mobile"
        />
        <HelpCenterFaq
          items={faqItems}
          openId={openFaqId}
          onToggle={toggleFaq}
          titleId="help-center-faq-title-mobile"
        />
        <div className="mt-8">
          <HelpCenterContactCard variant="inline" />
        </div>
      </div>
    </div>
  );
}

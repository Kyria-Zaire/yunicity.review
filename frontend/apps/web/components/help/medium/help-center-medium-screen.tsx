"use client";

import {
  HelpCenterCategoryGrid,
  HelpCenterContactCard,
  HelpCenterFaq,
  HelpCenterHero,
  useHelpCenterState,
} from "@/components/help/shared";

export function HelpCenterMediumScreen() {
  const { query, setQuery, openFaqId, toggleFaq, categories, faqItems } = useHelpCenterState();

  return (
    <div className="hidden flex-col sm:flex lg:hidden" data-help-center-medium-root="">
      <HelpCenterHero query={query} onQueryChange={setQuery} variant="medium" />
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <HelpCenterCategoryGrid
          categories={categories}
          variant="medium"
          titleId="help-center-browse-title-medium"
        />
        <HelpCenterFaq
          items={faqItems}
          openId={openFaqId}
          onToggle={toggleFaq}
          titleId="help-center-faq-title-medium"
        />
        <div className="mt-8 max-w-xl mx-auto">
          <HelpCenterContactCard variant="inline" />
        </div>
      </div>
    </div>
  );
}

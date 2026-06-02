"use client";

import type { TribeDetailTab, TribeDetailTabId } from "@yunicity/utils";
import { TRIBE_DETAIL_HERO_SHARE } from "@yunicity/utils";
import { Share2 } from "lucide-react";
import { useCallback, useState } from "react";

export function TribeDetailTabs({ tabs, onShare }: { tabs: TribeDetailTab[]; onShare?: () => void }) {
  const [activeId, setActiveId] = useState<TribeDetailTabId>("about");

  const scrollTo = useCallback((tab: TribeDetailTab) => {
    setActiveId(tab.id);
    document.querySelector(tab.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="sticky top-[var(--web-top-nav-offset,4rem)] z-20 -mx-1 border-b border-neutral-200/90 bg-[#F4F5F7]/95 px-1 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <nav aria-label="Sections de la tribu" className="-mb-px flex min-w-0 gap-1 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const active = activeId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollTo(tab)}
                className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-yunicity-primary text-yunicity-primary"
                    : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
        {onShare ? (
          <button
            type="button"
            onClick={onShare}
            className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 sm:inline-flex"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {TRIBE_DETAIL_HERO_SHARE}
          </button>
        ) : null}
      </div>
    </div>
  );
}

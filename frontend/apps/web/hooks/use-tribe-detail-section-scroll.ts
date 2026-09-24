"use client";

import { useCallback, useState } from "react";

export type TribeDetailSectionTab = {
  id: string;
  label: string;
  anchor: string;
};

function resolveScrollOffset(): number {
  if (typeof window === "undefined") return 80;
  const root = document.documentElement;
  const navRaw = getComputedStyle(root).getPropertyValue("--web-top-nav-offset").trim();
  const nav = navRaw ? Number.parseFloat(navRaw) : 64;
  return (Number.isFinite(nav) ? nav : 64) + 16;
}

export function useTribeDetailSectionScroll<T extends string>(
  tabs: readonly TribeDetailSectionTab[],
  defaultId: T,
) {
  const [activeId, setActiveId] = useState<T>(defaultId);

  const scrollTo = useCallback((tab: TribeDetailSectionTab) => {
    setActiveId(tab.id as T);
    const target = document.querySelector(tab.anchor);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - resolveScrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  const scrollToAnchor = useCallback((anchor: string) => {
    const tab = tabs.find((item) => item.anchor === anchor);
    if (tab) {
      scrollTo(tab);
      return;
    }
    const target = document.querySelector(anchor);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - resolveScrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [scrollTo, tabs]);

  return { activeId, setActiveId, scrollTo, scrollToAnchor };
}

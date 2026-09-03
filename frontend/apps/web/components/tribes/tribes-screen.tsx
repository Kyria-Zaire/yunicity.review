"use client";

import { TribesDesktopScreen } from "@/components/tribes/desktop";
import { TribesMediumShell } from "@/components/tribes/medium";
import { TribesAppShell } from "@/components/tribes/tribes-app-shell";
import { TribesMobileView } from "@/components/tribes/mobile";
import { useTribesPortalContext } from "@/hooks/use-tribes-portal-context";
import type { TribesDesktopCategoryId, TribesDesktopNavId, TribesDesktopVisibilityId } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_CATEGORY_IDS,
  TRIBES_DESKTOP_NAV_IDS,
  TRIBES_DESKTOP_VISIBILITY_IDS,
} from "@yunicity/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

function parseDesktopNav(value: string | null): TribesDesktopNavId {
  if (value === "mine") return "mine";
  if (value === "invitations") return "invitations";
  if (value === "sent_requests") return "sent_requests";
  if (value === "saved") return "saved";
  if (value && (TRIBES_DESKTOP_NAV_IDS as readonly string[]).includes(value)) {
    return value as TribesDesktopNavId;
  }
  return "discover";
}

function parseDesktopVisibility(value: string | null): TribesDesktopVisibilityId {
  if (value && (TRIBES_DESKTOP_VISIBILITY_IDS as readonly string[]).includes(value)) {
    return value as TribesDesktopVisibilityId;
  }
  return "all";
}

function parseDesktopCategory(value: string | null): TribesDesktopCategoryId {
  if (value && (TRIBES_DESKTOP_CATEGORY_IDS as readonly string[]).includes(value)) {
    return value as TribesDesktopCategoryId;
  }
  return "for_you";
}

export function TribesScreen() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const context = useTribesPortalContext(cityParam);

  const [desktopNav, setDesktopNav] = useState<TribesDesktopNavId>(() =>
    parseDesktopNav(searchParams.get("view")),
  );
  const [desktopVisibility, setDesktopVisibility] = useState<TribesDesktopVisibilityId>(() =>
    parseDesktopVisibility(searchParams.get("visibility")),
  );
  const [desktopCategory, setDesktopCategory] = useState<TribesDesktopCategoryId>(() =>
    parseDesktopCategory(searchParams.get("tribeCategory")),
  );
  const [desktopNeighborhood, setDesktopNeighborhood] = useState(
    () => searchParams.get("neighborhood")?.trim() || "all",
  );
  const [desktopSearch, setDesktopSearch] = useState(() => searchParams.get("q")?.trim() ?? "");

  const replaceDesktopFilters = useCallback(
    (next: {
      nav?: TribesDesktopNavId;
      visibility?: TribesDesktopVisibilityId;
      category?: TribesDesktopCategoryId;
      neighborhood?: string;
      search?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      const nav = next.nav ?? desktopNav;
      const visibility = next.visibility ?? desktopVisibility;
      const category = next.category ?? desktopCategory;
      const neighborhood = next.neighborhood ?? desktopNeighborhood;
      const search = next.search ?? desktopSearch;

      if (nav === "discover") params.delete("view");
      else params.set("view", nav);

      if (visibility === "all") params.delete("visibility");
      else params.set("visibility", visibility);

      if (category === "for_you") params.delete("tribeCategory");
      else params.set("tribeCategory", category);

      if (!neighborhood || neighborhood === "all") params.delete("neighborhood");
      else params.set("neighborhood", neighborhood);

      if (!search.trim()) params.delete("q");
      else params.set("q", search.trim());

      if (!params.get("city")) params.set("city", context.city);

      setDesktopNav(nav);
      setDesktopVisibility(visibility);
      setDesktopCategory(category);
      setDesktopNeighborhood(neighborhood);
      setDesktopSearch(search);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [
      context.city,
      desktopCategory,
      desktopNav,
      desktopNeighborhood,
      desktopSearch,
      desktopVisibility,
      pathname,
      router,
      searchParams,
    ],
  );

  const handleDesktopReset = useCallback(() => {
    setDesktopSearch("");
    replaceDesktopFilters({
      nav: "discover",
      visibility: "all",
      category: "for_you",
      neighborhood: "all",
      search: "",
    });
  }, [replaceDesktopFilters]);

  const desktopSharedProps = {
    city: context.city,
    tribes: context.tribes,
    events: context.events,
    neighborhoods: context.neighborhoods,
    invitations: context.invitations,
    loading: context.loading,
    error: context.error,
    searchQuery: desktopSearch,
    activeNav: desktopNav,
    activeVisibility: desktopVisibility,
    activeCategory: desktopCategory,
    activeNeighborhood: desktopNeighborhood,
    onSearchChange: (query: string) => replaceDesktopFilters({ search: query }),
    onNavChange: (nav: TribesDesktopNavId) => replaceDesktopFilters({ nav }),
    onVisibilityChange: (visibility: TribesDesktopVisibilityId) =>
      replaceDesktopFilters({ visibility }),
    onCategoryChange: (category: TribesDesktopCategoryId) => replaceDesktopFilters({ category }),
    onNeighborhoodChange: (slug: string) => replaceDesktopFilters({ neighborhood: slug }),
    onResetFilters: handleDesktopReset,
    onReload: () => void context.reload(),
  };

  return (
    <TribesAppShell>
      <TribesMobileView {...desktopSharedProps} />

      <TribesMediumShell {...desktopSharedProps} />

      <div className="tribes-desktop-shell-only mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 sm:py-4">
        <TribesDesktopScreen {...desktopSharedProps} />
      </div>
    </TribesAppShell>
  );
}

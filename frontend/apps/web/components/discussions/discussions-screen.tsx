"use client";

import type { DiscussionCategoryId } from "@yunicity/types";
import { DISCUSSIONS_LOADING } from "@yunicity/utils";
import { useState } from "react";

import { DiscussionsAppShell } from "@/components/discussions/discussions-app-shell";
import { DiscussionsDesktopScreen } from "@/components/discussions/desktop";
import { DiscussionsMediumScreen } from "@/components/discussions/medium";
import { DiscussionsMobileScreen } from "@/components/discussions/mobile";
import { DiscussionsRightRail } from "@/components/discussions/discussions-right-rail";
import { useDiscussionsList } from "@/hooks/use-discussions-list";
import { useDiscussionsPortalContext } from "@/hooks/use-discussions-portal-context";

export function DiscussionsScreen() {
  const portal = useDiscussionsPortalContext();
  const [category, setCategory] = useState<DiscussionCategoryId>("all");
  const list = useDiscussionsList(category);

  if (portal.loading && list.isLoading) {
    return (
      <DiscussionsAppShell>
        <p className="flex-1 py-16 text-center text-sm text-neutral-500" role="status">
          {DISCUSSIONS_LOADING}
        </p>
      </DiscussionsAppShell>
    );
  }

  return (
    <DiscussionsAppShell
      rightRail={
        <DiscussionsRightRail
          insights={portal.insights}
          loading={portal.loading}
          onSelectTopic={(topicId) => setCategory(topicId as DiscussionCategoryId)}
        />
      }
    >
      <div className="web-mobile-discussions-only w-full">
        <DiscussionsMobileScreen category={category} />
      </div>

      <div className="web-medium-discussions-only w-full pb-6 md:pb-8">
        <DiscussionsMediumScreen category={category} />
      </div>

      <div className="web-desktop-discussions-only w-full pb-8 pt-5 lg:pt-6">
        <DiscussionsDesktopScreen category={category} />
      </div>
    </DiscussionsAppShell>
  );
}

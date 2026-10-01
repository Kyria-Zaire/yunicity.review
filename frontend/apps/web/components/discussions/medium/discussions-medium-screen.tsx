"use client";

import type { DiscussionCategoryId } from "@yunicity/types";
import { useCallback, useRef, useState } from "react";

import { DiscussionsDesktopInbox } from "@/components/discussions/desktop/discussions-desktop-inbox";
import { DiscussionsDesktopThreadPanel } from "@/components/discussions/desktop/discussions-desktop-thread-panel";
import { DiscussionsMediumFilterSheet } from "@/components/discussions/medium/discussions-medium-filter-sheet";
import { DiscussionsMediumHeader } from "@/components/discussions/medium/discussions-medium-header";
import { useDiscussionsInboxScreen } from "@/hooks/use-discussions-inbox-screen";
import { useDiscussionsPortalContext } from "@/hooks/use-discussions-portal-context";

type DiscussionsMediumScreenProps = {
  category?: DiscussionCategoryId;
};

export function DiscussionsMediumScreen({ category = "all" }: DiscussionsMediumScreenProps) {
  const portal = useDiscussionsPortalContext();
  const inbox = useDiscussionsInboxScreen(category);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filterActive = inbox.activeTab !== "all";

  const focusDiscussionsSearch = useCallback(() => {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => searchInputRef.current?.focus(), 180);
  }, []);

  function handleResetFilters() {
    inbox.setActiveTab("all");
    inbox.setSearchQuery("");
  }

  return (
    <div className="discussions-medium-root w-full min-w-0" data-discussions-medium-root="">
      <DiscussionsMediumHeader
        city={portal.city}
        filterPanelOpen={filterOpen}
        filterActive={filterActive}
        onOpenFilter={() => setFilterOpen(true)}
        onFocusSearch={focusDiscussionsSearch}
        filterButtonRef={filterButtonRef}
      />

      <DiscussionsMediumFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        activeTab={inbox.activeTab}
        onTabChange={inbox.setActiveTab}
        onResetFilters={handleResetFilters}
        returnFocusRef={filterButtonRef}
      />

      <div
        className="discussions-medium-shell grid min-h-[calc(100dvh-5rem)] gap-3 md:gap-4"
        data-discussions-medium=""
      >
        <DiscussionsDesktopInbox
          variant="medium"
          items={inbox.filteredItems}
          activeTab={inbox.activeTab}
          selectedId={inbox.selectedId}
          searchQuery={inbox.searchQuery}
          isLoading={inbox.list.isLoading}
          searchInputRef={searchInputRef}
          hideFilterTabs
          onTabChange={inbox.setActiveTab}
          onSearchChange={inbox.setSearchQuery}
          onSelect={inbox.handleSelect}
        />
        <DiscussionsDesktopThreadPanel
          thread={inbox.selectedThread}
          messages={inbox.messages}
          isLoading={inbox.commentsLoading}
          isSubmitting={inbox.isSubmitting}
          onSendMessage={inbox.handleSendMessage}
        />
      </div>
    </div>
  );
}

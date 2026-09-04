"use client";

import type { DiscussionCategoryId } from "@yunicity/types";

import { DiscussionsDesktopInbox } from "@/components/discussions/desktop/discussions-desktop-inbox";
import { DiscussionsMobileThreadView } from "@/components/discussions/mobile/discussions-mobile-thread-view";
import { useDiscussionsInboxScreen } from "@/hooks/use-discussions-inbox-screen";

type DiscussionsMobileScreenProps = {
  category?: DiscussionCategoryId;
};

export function DiscussionsMobileScreen({ category = "all" }: DiscussionsMobileScreenProps) {
  const inbox = useDiscussionsInboxScreen(category, { autoSelectFirst: false });

  if (inbox.selectedThread) {
    return (
      <DiscussionsMobileThreadView
        thread={inbox.selectedThread}
        messages={inbox.messages}
        isLoading={inbox.commentsLoading}
        isSubmitting={inbox.isSubmitting}
        onBack={inbox.handleClearSelection}
        onSendMessage={inbox.handleSendMessage}
      />
    );
  }

  return (
    <div className="discussions-mobile-inbox-shell min-w-0 bg-white" data-discussions-mobile-inbox="">
      <DiscussionsDesktopInbox
        variant="mobile"
        highlightSelection={false}
        items={inbox.filteredItems}
        activeTab={inbox.activeTab}
        selectedId={inbox.selectedId}
        searchQuery={inbox.searchQuery}
        isLoading={inbox.list.isLoading}
        onTabChange={inbox.setActiveTab}
        onSearchChange={inbox.setSearchQuery}
        onSelect={inbox.handleSelect}
      />
    </div>
  );
}

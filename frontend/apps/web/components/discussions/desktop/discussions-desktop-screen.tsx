"use client";

import type { DiscussionCategoryId } from "@yunicity/types";

import { DiscussionsDesktopContextRail } from "@/components/discussions/desktop/discussions-desktop-context-rail";
import { DiscussionsDesktopInbox } from "@/components/discussions/desktop/discussions-desktop-inbox";
import { DiscussionsDesktopThreadPanel } from "@/components/discussions/desktop/discussions-desktop-thread-panel";
import { useDiscussionsInboxScreen } from "@/hooks/use-discussions-inbox-screen";
import { useDiscussionsPortalContext } from "@/hooks/use-discussions-portal-context";

type DiscussionsDesktopScreenProps = {
  category?: DiscussionCategoryId;
};

export function DiscussionsDesktopScreen({ category = "all" }: DiscussionsDesktopScreenProps) {
  const portal = useDiscussionsPortalContext();
  const inbox = useDiscussionsInboxScreen(category);

  return (
    <div
      className="discussions-desktop-shell grid min-h-[calc(100dvh-6rem)] gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,280px)]"
      data-discussions-desktop=""
    >
      <DiscussionsDesktopInbox
        variant="desktop"
        items={inbox.filteredItems}
        activeTab={inbox.activeTab}
        selectedId={inbox.selectedId}
        searchQuery={inbox.searchQuery}
        isLoading={inbox.list.isLoading}
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
      <DiscussionsDesktopContextRail
        thread={inbox.selectedThread}
        city={portal.city}
        onReport={() => void inbox.handleReport()}
      />
    </div>
  );
}

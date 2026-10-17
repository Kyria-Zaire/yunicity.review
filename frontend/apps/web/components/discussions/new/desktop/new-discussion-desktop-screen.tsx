"use client";

import type { DiscussionCategoryId, Tribe } from "@yunicity/types";
import { NewDiscussionHeroHeader } from "@/components/discussions/new/new-discussion-hero-header";
import { NewDiscussionWizard } from "@/components/discussions/new/new-discussion-wizard";
import { NewDiscussionRightRail } from "@/components/discussions/new-discussion-right-rail";
import type { DiscussionNewExample } from "@yunicity/utils";

type NewDiscussionDesktopScreenProps = {
  memberTribes: Tribe[];
  examples: DiscussionNewExample[];
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (payload: {
    category: DiscussionCategoryId;
    title: string;
    body: string;
    tags: string[];
    linkedTribeId: string | null;
    mediaUrl: string | null;
  }) => Promise<void>;
};

export function NewDiscussionDesktopScreen({
  memberTribes,
  examples,
  submitting,
  error,
  onCancel,
  onSubmit,
}: NewDiscussionDesktopScreenProps) {
  return (
    <div
      className="web-desktop-discussion-new-only grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      data-discussion-new-desktop=""
    >
      <div className="min-w-0">
        <NewDiscussionHeroHeader variant="desktop" onBack={onCancel} />

        <NewDiscussionWizard
          variant="desktop"
          memberTribes={memberTribes}
          submitting={submitting}
          error={error}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      </div>

      <aside className="hidden min-w-0 xl:block">
        <div className="sticky top-24">
          <NewDiscussionRightRail examples={examples} />
        </div>
      </aside>
    </div>
  );
}

"use client";

import type { DiscussionCategoryId, Tribe } from "@yunicity/types";
import { NewDiscussionHeroHeader } from "@/components/discussions/new/new-discussion-hero-header";
import { NewDiscussionWizard } from "@/components/discussions/new/new-discussion-wizard";
import { NewDiscussionRightRail } from "@/components/discussions/new-discussion-right-rail";
import type { DiscussionNewExample } from "@yunicity/utils";

type NewDiscussionMediumScreenProps = {
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

export function NewDiscussionMediumScreen({
  memberTribes,
  examples,
  submitting,
  error,
  onCancel,
  onSubmit,
}: NewDiscussionMediumScreenProps) {
  return (
    <div
      className="web-medium-discussion-new-only mx-auto w-full max-w-3xl px-4 pb-10 pt-3 md:px-6"
      data-discussion-new-medium=""
    >
      <NewDiscussionHeroHeader variant="medium" onBack={onCancel} />

      <NewDiscussionWizard
        variant="medium"
        memberTribes={memberTribes}
        submitting={submitting}
        error={error}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />

      <div className="mt-6">
        <NewDiscussionRightRail examples={examples} />
      </div>
    </div>
  );
}

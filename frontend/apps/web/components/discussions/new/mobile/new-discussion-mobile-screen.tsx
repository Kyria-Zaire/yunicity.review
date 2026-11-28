"use client";

import type { DiscussionCategoryId, Tribe } from "@yunicity/types";
import type { DiscussionNewExample } from "@yunicity/utils";
import { useState } from "react";

import { NewDiscussionRightRail } from "@/components/discussions/new-discussion-right-rail";
import { NewDiscussionWizard } from "@/components/discussions/new/new-discussion-wizard";
import { NewDiscussionMobileActionBar } from "@/components/discussions/new/mobile/new-discussion-mobile-action-bar";
import { NewDiscussionMobileHeader } from "@/components/discussions/new/mobile/new-discussion-mobile-header";

const FORM_ID = "discussion-new-form";

type NewDiscussionMobileScreenProps = {
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

export function NewDiscussionMobileScreen({
  memberTribes,
  examples,
  submitting,
  error,
  onCancel,
  onSubmit,
}: NewDiscussionMobileScreenProps) {
  const [progressPercent, setProgressPercent] = useState(0);

  return (
    <div className="web-mobile-discussion-new-only min-w-0 bg-white" data-discussion-new-mobile="">
      <NewDiscussionMobileHeader progressPercent={progressPercent} />
      <div className="px-4 pb-28 pt-4">
        <NewDiscussionWizard
          variant="mobile"
          formId={FORM_ID}
          memberTribes={memberTribes}
          submitting={submitting}
          error={error}
          onCancel={onCancel}
          onSubmit={onSubmit}
          onProgressChange={setProgressPercent}
        />
        <div className="mt-6">
          <NewDiscussionRightRail examples={examples} compact />
        </div>
      </div>
      <NewDiscussionMobileActionBar formId={FORM_ID} submitting={submitting} onCancel={onCancel} />
    </div>
  );
}

"use client";

import type { DiscussionCategoryId } from "@yunicity/types";
import {
  DISCUSSION_NEW_ERROR_GENERIC,
  DISCUSSION_NEW_PAGE_SUBTITLE,
  DISCUSSION_NEW_PAGE_TITLE,
  buildDiscussionNewExamples,
  discussionThreadHref,
  validateDiscussionNewForm,
} from "@yunicity/utils";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DiscussionsAppShell } from "@/components/discussions/discussions-app-shell";
import { DiscussionsLeftRail } from "@/components/discussions/discussions-left-rail";
import { NewDiscussionForm } from "@/components/discussions/new-discussion-form";
import { NewDiscussionRightRail } from "@/components/discussions/new-discussion-right-rail";
import { useDiscussionsPortalContext } from "@/hooks/use-discussions-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function NewDiscussionScreen() {
  const router = useRouter();
  const api = useYunicityApi();
  const portal = useDiscussionsPortalContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exampleThreads, setExampleThreads] = useState<Awaited<
    ReturnType<typeof api.listDiscussions>
  >["items"]>([]);

  useEffect(() => {
    void api.listDiscussions({ limit: 4, require_comments: true }).then((response) => {
      setExampleThreads(response.items);
    });
  }, [api]);

  const memberTribes = useMemo(
    () => portal.tribes.filter((tribe) => !tribe.is_archived && tribe.viewer_is_member),
    [portal.tribes],
  );

  const examples = useMemo(() => buildDiscussionNewExamples(exampleThreads), [exampleThreads]);

  async function handleSubmit(payload: {
    category: DiscussionCategoryId;
    title: string;
    body: string;
    tags: string[];
    linkedTribeId: string | null;
    mediaUrl: string | null;
  }) {
    const validationError = validateDiscussionNewForm({
      category: payload.category,
      title: payload.title,
      body: payload.body,
      tags: payload.tags,
      linkedTribeId: payload.linkedTribeId,
      mediaUrl: payload.mediaUrl,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createDiscussion({
        title: payload.title,
        body: payload.body,
        category: payload.category,
        tags: payload.tags,
        linked_tribe_id: payload.linkedTribeId,
        media_url: payload.mediaUrl,
      });
      router.push(discussionThreadHref(created.id));
    } catch {
      setError(DISCUSSION_NEW_ERROR_GENERIC);
    } finally {
      setSubmitting(false);
    }
  }

  const rightRail = <NewDiscussionRightRail examples={examples} />;

  return (
    <DiscussionsAppShell rightRail={rightRail}>
      <DiscussionsLeftRail
        city={portal.city}
        tribes={portal.tribes}
        activeSection="new"
      />

      <div className="min-w-0 flex-1">
        <header className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF0FF] text-yunicity-primary">
            <MessageCircle className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {DISCUSSION_NEW_PAGE_TITLE}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {DISCUSSION_NEW_PAGE_SUBTITLE}
            </p>
          </div>
        </header>

        <div className="mt-6">
          <NewDiscussionForm
            memberTribes={memberTribes}
            submitting={submitting}
            error={error}
            onCancel={() => router.push("/discussions")}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="mt-8 2xl:hidden">{rightRail}</div>
      </div>
    </DiscussionsAppShell>
  );
}

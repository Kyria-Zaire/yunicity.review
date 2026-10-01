"use client";

import type { DiscussionCategoryId } from "@yunicity/types";
import {
  DISCUSSION_NEW_ERROR_GENERIC,
  buildDiscussionNewExamples,
  discussionThreadHref,
  validateDiscussionNewForm,
} from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { NewDiscussionAppShell } from "@/components/discussions/new/new-discussion-app-shell";
import { NewDiscussionDesktopScreen } from "@/components/discussions/new/desktop/new-discussion-desktop-screen";
import { NewDiscussionMediumScreen } from "@/components/discussions/new/medium/new-discussion-medium-screen";
import { NewDiscussionMobileScreen } from "@/components/discussions/new/mobile/new-discussion-mobile-screen";
import { useDiscussionsPortalContext } from "@/hooks/use-discussions-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function NewDiscussionScreen() {
  const router = useRouter();
  const api = useYunicityApi();
  const portal = useDiscussionsPortalContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exampleThreads, setExampleThreads] = useState<
    Awaited<ReturnType<typeof api.listDiscussions>>["items"]
  >([]);

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

  const sharedProps = {
    memberTribes,
    examples,
    submitting,
    error,
    onCancel: () => router.push("/discussions"),
    onSubmit: handleSubmit,
  };

  return (
    <NewDiscussionAppShell>
      <NewDiscussionMobileScreen {...sharedProps} />
      <NewDiscussionMediumScreen {...sharedProps} />
      <NewDiscussionDesktopScreen {...sharedProps} />
    </NewDiscussionAppShell>
  );
}

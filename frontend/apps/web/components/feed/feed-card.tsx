"use client";

import type { FeedComment, FeedPost, FeedReportReason } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { CitizenPostCard } from "@/components/feed/citizen-post-card";
import { CommentComposer } from "@/components/feed/comment-composer";
import { CommentList } from "@/components/feed/comment-list";
import { FeedCardShell } from "@/components/feed/feed-card-shell";
import { EventFeedCard } from "@/components/events/event-feed-card";
import { OfferFeedCard } from "@/components/feed/offer-feed-card";
import { OrganizationPostCard } from "@/components/feed/organization-post-card";
import { ReportAction } from "@/components/feed/report-action";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

function feedCardVariant(post: FeedPost): "default" | "event" | "offer" | "organization" {
  if (post.type === "offer") return "offer";
  if (post.type === "event") return "event";
  if (post.author.type === "organization") return "organization";
  return "default";
}

function FeedCardBody({ post }: { post: FeedPost }) {
  if (post.type === "offer") {
    return <OfferFeedCard post={post} />;
  }
  if (post.type === "event") {
    return <EventFeedCard post={post} />;
  }
  if (post.author.type === "organization") {
    return <OrganizationPostCard post={post} />;
  }
  return <CitizenPostCard post={post} />;
}

export function FeedCard({
  post: initialPost,
  onToggleLike,
  onReport,
}: {
  post: FeedPost;
  onToggleLike: (post: FeedPost) => Promise<void>;
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
}) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const response = await api.listFeedComments(post.id, { limit: 50 });
      setComments(response.items);
    } finally {
      setCommentsLoading(false);
    }
  }, [api, post.id]);

  async function toggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments.length === 0) {
      await loadComments();
    }
  }

  async function addComment(body: string) {
    const created = await api.createFeedComment(post.id, { body });
    setComments((prev) => [...prev, created]);
    setPost((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }));
  }

  async function removeComment(commentId: string) {
    await api.deleteFeedComment(commentId);
    await loadComments();
    setPost((prev) => ({ ...prev, comment_count: Math.max(0, prev.comment_count - 1) }));
  }

  return (
    <FeedCardShell
      variant={feedCardVariant(post)}
      footer={
        <>
          <button
            type="button"
            onClick={() => void onToggleLike(post)}
            aria-pressed={post.liked_by_me}
            className={`min-h-[44px] text-sm ${
              post.liked_by_me ? "font-medium text-yunicity-primary" : "text-neutral-600"
            } hover:text-yunicity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary`}
          >
            {post.liked_by_me ? "Aimé" : "J’aime"}
            {post.like_count > 0 ? ` · ${post.like_count}` : ""}
          </button>
          <button
            type="button"
            onClick={() => void toggleComments()}
            className="min-h-[44px] text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            Commentaires
            {post.comment_count > 0 ? ` · ${post.comment_count}` : ""}
          </button>
          <ReportAction onReport={(reason) => onReport(post.id, reason)} />
        </>
      }
      expanded={
        commentsOpen ? (
          <>
            {commentsLoading ? (
              <p className="text-sm text-neutral-500">Chargement des commentaires…</p>
            ) : (
              <CommentList
                comments={comments}
                currentUserId={user?.id}
                onDelete={removeComment}
              />
            )}
            <CommentComposer onSubmit={addComment} />
          </>
        ) : undefined
      }
    >
      <FeedCardBody post={post} />
    </FeedCardShell>
  );
}

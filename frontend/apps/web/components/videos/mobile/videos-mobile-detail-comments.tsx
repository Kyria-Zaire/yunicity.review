"use client";

import type { LocalVideoComment, LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_COMMENT_LOAD_ERROR,
  LOCAL_VIDEO_COMMENT_PLACEHOLDER,
  LOCAL_VIDEO_COMMENT_SEND_ERROR,
  LOCAL_VIDEO_COMMENT_SUBMIT_LABEL,
  LOCAL_VIDEO_COMMENTS_EMPTY,
  VIDEO_DETAIL_COMMENTS_TITLE,
  VIDEO_DETAIL_MOBILE_VIEW_ALL,
  VIDEO_DETAIL_REPLY,
  formatVideoTemporalLabel,
} from "@yunicity/utils";
import { Heart, Loader2, SendHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import {
  CITIZEN_MOBILE_BOTTOM_NAV_PADDING,
  CITIZEN_MOBILE_DOCKED_NAV_HEIGHT,
} from "@/lib/layout/feed-mobile-refonte";

type VideosMobileDetailCommentsProps = {
  video: LocalVideoFeedItem;
  onCommentCountDelta?: (videoId: string, delta: number) => void;
};

const MOBILE_PREVIEW_COUNT = 3;

function commentAuthorLabel(comment: LocalVideoComment): string {
  if (comment.author_username?.trim()) {
    return comment.author_username.replace(/^@/, "");
  }
  return comment.author_display_name;
}

function commentAuthorInitials(comment: LocalVideoComment): string {
  return commentAuthorLabel(comment).slice(0, 2).toUpperCase();
}

type CommentComposerProps = {
  draft: string;
  userInitial: string;
  isSubmitting: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  variant?: "mobile-fixed" | "medium-inline";
};

function CommentComposer({
  draft,
  userInitial,
  isSubmitting,
  onDraftChange,
  onSubmit,
  className = "",
  style,
  variant = "mobile-fixed",
}: CommentComposerProps) {
  const isMedium = variant === "medium-inline";

  return (
    <form onSubmit={onSubmit} className={className} style={style}>
      <div className={`flex items-center gap-2.5 ${isMedium ? "items-start" : ""}`}>
        <span
          className={`flex shrink-0 items-center justify-center rounded-full bg-yunicity-primary font-bold text-white ${
            isMedium ? "h-10 w-10 text-sm" : "h-9 w-9 text-xs"
          }`}
        >
          {userInitial}
        </span>
        {isMedium ? (
          <div className="min-w-0 flex-1">
            <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm focus-within:border-yunicity-primary/40 focus-within:ring-2 focus-within:ring-yunicity-primary/15">
              <input
                type="text"
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                placeholder={LOCAL_VIDEO_COMMENT_PLACEHOLDER}
                maxLength={500}
                className="min-h-10 flex-1 bg-transparent py-2 text-sm text-neutral-800 outline-none"
                aria-label="Ajouter un commentaire"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isSubmitting}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-yunicity-primary disabled:opacity-40"
                aria-label={LOCAL_VIDEO_COMMENT_SUBMIT_LABEL}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <SendHorizontal className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={LOCAL_VIDEO_COMMENT_PLACEHOLDER}
              maxLength={500}
              className="min-h-10 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-800 outline-none focus:border-yunicity-primary/40 focus:ring-2 focus:ring-yunicity-primary/15"
              aria-label="Ajouter un commentaire"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSubmitting}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-white disabled:opacity-40"
              aria-label={LOCAL_VIDEO_COMMENT_SUBMIT_LABEL}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <SendHorizontal className="h-4 w-4" aria-hidden />
              )}
            </button>
          </>
        )}
      </div>
    </form>
  );
}

/**
 * Commentaires détail vidéo — mobile ≤639 : composer fixe au-dessus de la bottom nav ;
 * medium 640–1023 : composer inline dans le flux (pas de bande flottante).
 */
export function VideosMobileDetailComments({
  video,
  onCommentCountDelta,
}: VideosMobileDetailCommentsProps) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [comments, setComments] = useState<LocalVideoComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listLocalVideoComments(video.id, { limit: 50 });
      setComments(response.items);
    } catch {
      setError(LOCAL_VIDEO_COMMENT_LOAD_ERROR);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [api, video.id]);

  useEffect(() => {
    setDraft("");
    setExpanded(false);
    void loadComments();
  }, [loadComments, video.id]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.createLocalVideoComment(video.id, { body });
      setComments((prev) => [...prev, created]);
      setDraft("");
      onCommentCountDelta?.(video.id, 1);
    } catch {
      setError(LOCAL_VIDEO_COMMENT_SEND_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleComments = expanded ? comments : comments.slice(0, MOBILE_PREVIEW_COUNT);
  const hasHiddenComments = !expanded && comments.length > MOBILE_PREVIEW_COUNT;
  const userInitial = user?.full_name?.trim()?.slice(0, 1).toUpperCase() || "K";

  const composerBottom = `calc(${CITIZEN_MOBILE_DOCKED_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`;

  const composerProps = {
    draft,
    userInitial,
    isSubmitting,
    onDraftChange: setDraft,
    onSubmit: (event: React.FormEvent) => void handleSubmit(event),
  };

  return (
    <>
      <section
        id="video-detail-comments"
        className={`scroll-mt-24 space-y-4 ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-neutral-900">
            {VIDEO_DETAIL_COMMENTS_TITLE} ({video.comment_count})
          </h2>
          {hasHiddenComments ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-sm font-semibold text-yunicity-primary"
            >
              {VIDEO_DETAIL_MOBILE_VIEW_ALL} →
            </button>
          ) : null}
        </div>

        <CommentComposer
          {...composerProps}
          variant="medium-inline"
          className="hidden min-[640px]:block"
        />

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" aria-hidden />
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
            {LOCAL_VIDEO_COMMENTS_EMPTY}
          </p>
        ) : (
          <ul className="space-y-5">
            {visibleComments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">
                  {commentAuthorInitials(comment)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-bold text-neutral-900">{commentAuthorLabel(comment)}</span>{" "}
                      <span className="text-neutral-500">{formatVideoTemporalLabel(comment.created_at)}</span>
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-neutral-500">
                      <Heart className="h-3.5 w-3.5" aria-hidden />0
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-800">{comment.body}</p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-neutral-500"
                    disabled
                  >
                    {VIDEO_DETAIL_REPLY}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CommentComposer
        {...composerProps}
        variant="mobile-fixed"
        className="fixed inset-x-0 z-[var(--z-chrome)] border-t border-neutral-200 bg-white px-4 py-2.5 min-[640px]:hidden"
        style={{ bottom: composerBottom }}
      />
    </>
  );
}

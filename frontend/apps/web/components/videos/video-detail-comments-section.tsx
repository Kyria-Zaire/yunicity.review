"use client";

import type { LocalVideoComment, LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_COMMENT_LOAD_ERROR,
  LOCAL_VIDEO_COMMENT_PLACEHOLDER,
  LOCAL_VIDEO_COMMENT_SEND_ERROR,
  LOCAL_VIDEO_COMMENT_SUBMIT_LABEL,
  LOCAL_VIDEO_COMMENTS_EMPTY,
  VIDEO_DETAIL_COMMENTS_TITLE,
  VIDEO_DETAIL_REPLY,
  formatVideoTemporalLabel,
} from "@yunicity/utils";
import { Heart, Loader2, SendHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

type VideoDetailCommentsSectionProps = {
  video: LocalVideoFeedItem;
  onCommentCountDelta?: (videoId: string, delta: number) => void;
};

function commentAuthorLabel(comment: LocalVideoComment): string {
  if (comment.author_username?.trim()) {
    return `@${comment.author_username.replace(/^@/, "")}`;
  }
  return comment.author_display_name;
}

export function VideoDetailCommentsSection({
  video,
  onCommentCountDelta,
}: VideoDetailCommentsSectionProps) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [comments, setComments] = useState<LocalVideoComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleDelete(comment: LocalVideoComment) {
    if (comment.author_user_id !== user?.id) return;
    try {
      await api.deleteLocalVideoComment(comment.id);
      setComments((prev) => prev.filter((item) => item.id !== comment.id));
      onCommentCountDelta?.(video.id, -1);
    } catch {
      setError(LOCAL_VIDEO_COMMENT_SEND_ERROR);
    }
  }

  const userInitial = user?.full_name?.trim()?.slice(0, 1).toUpperCase() || "K";

  return (
    <section id="video-detail-comments" className="scroll-mt-24 space-y-4">
      <h2 className="text-lg font-bold text-neutral-900">
        {VIDEO_DETAIL_COMMENTS_TITLE} ({video.comment_count})
      </h2>

      <form onSubmit={(event) => void handleSubmit(event)} className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-sm font-bold text-white">
          {userInitial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm focus-within:border-yunicity-primary/40 focus-within:ring-2 focus-within:ring-yunicity-primary/15">
            <textarea
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={LOCAL_VIDEO_COMMENT_PLACEHOLDER}
              maxLength={500}
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-neutral-800 outline-none"
              aria-label="Ajouter un commentaire"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSubmitting}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-yunicity-primary disabled:opacity-40"
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
      </form>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" aria-hidden />
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
          {LOCAL_VIDEO_COMMENTS_EMPTY}
        </p>
      ) : (
        <ul className="space-y-5">
          {comments.map((comment) => {
            const isMine = comment.author_user_id === user?.id;
            return (
              <li key={comment.id} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-700">
                  {commentAuthorLabel(comment).replace("@", "").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {commentAuthorLabel(comment)}{" "}
                      <span className="font-normal text-neutral-500">
                        {formatVideoTemporalLabel(comment.created_at)}
                      </span>
                    </p>
                    {isMine ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete(comment)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                        aria-label="Supprimer mon commentaire"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-800">{comment.body}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                    <button type="button" className="font-semibold hover:text-neutral-700" disabled>
                      {VIDEO_DETAIL_REPLY}
                    </button>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" aria-hidden />0
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

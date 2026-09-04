"use client";

import type { LocalVideoComment, LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_COMMENT_LOAD_ERROR,
  LOCAL_VIDEO_COMMENT_PLACEHOLDER,
  LOCAL_VIDEO_COMMENT_SEND_ERROR,
  LOCAL_VIDEO_COMMENT_SUBMIT_LABEL,
  LOCAL_VIDEO_COMMENTS_EMPTY,
} from "@yunicity/utils";
import { Loader2, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

type VideoCommentsSheetProps = {
  open: boolean;
  video: LocalVideoFeedItem | null;
  onClose: () => void;
  onCommentCountDelta?: (videoId: string, delta: number) => void;
};

function formatCommentTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VideoCommentsSheet({
  open,
  video,
  onClose,
  onCommentCountDelta,
}: VideoCommentsSheetProps) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [keyboardExpanded, setKeyboardExpanded] = useState(false);
  const [comments, setComments] = useState<LocalVideoComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!video) return;
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
  }, [api, video]);

  useEffect(() => {
    if (!open || !video) {
      setDraft("");
      setComments((current) => (current.length === 0 ? current : []));
      setError(null);
      return;
    }
    void loadComments();
  }, [loadComments, open, video]);

  useEffect(() => {
    if (!open) {
      setKeyboardExpanded((expanded) => (expanded ? false : expanded));
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!video) return;
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
    if (!video || comment.author_user_id !== user?.id) return;
    try {
      await api.deleteLocalVideoComment(comment.id);
      setComments((prev) => prev.filter((item) => item.id !== comment.id));
      onCommentCountDelta?.(video.id, -1);
    } catch {
      setError(LOCAL_VIDEO_COMMENT_SEND_ERROR);
    }
  }

  if (!open || !video) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fermer les commentaires"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Commentaires"
        className={`relative z-10 flex flex-col rounded-t-3xl bg-white shadow-2xl transition-[height] duration-200 ${
          keyboardExpanded ? "h-[90dvh]" : "h-[60dvh]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-bold text-neutral-900">Commentaires</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" aria-hidden />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="text-sm text-neutral-600">{LOCAL_VIDEO_COMMENTS_EMPTY}</p>
            </div>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-3">
              {comments.map((comment) => {
                const isMine = comment.author_user_id === user?.id;
                return (
                  <li key={comment.id} className="rounded-2xl bg-neutral-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">
                          {comment.author_display_name}
                        </p>
                        <p className="text-xs text-neutral-500">{formatCommentTime(comment.created_at)}</p>
                      </div>
                      {isMine ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(comment)}
                          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                          aria-label="Supprimer mon commentaire"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-800">{comment.body}</p>
                  </li>
                );
              })}
            </ul>
          )}

          {error ? (
            <p className="pb-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <form onSubmit={(event) => void handleSubmit(event)} className="border-t border-neutral-200 pt-3">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={LOCAL_VIDEO_COMMENT_PLACEHOLDER}
                maxLength={500}
                onFocus={() => setKeyboardExpanded(true)}
                onBlur={() => setKeyboardExpanded(false)}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800"
                aria-label="Écrire un commentaire"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isSubmitting}
                className="inline-flex min-h-11 items-center rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : LOCAL_VIDEO_COMMENT_SUBMIT_LABEL}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

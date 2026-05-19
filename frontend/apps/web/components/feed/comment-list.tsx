"use client";

import type { FeedComment } from "@yunicity/types";
import { formatFeedDate } from "@yunicity/utils";

export function CommentList({
  comments,
  currentUserId,
  onDelete,
}: {
  comments: FeedComment[];
  currentUserId: string | undefined;
  onDelete: (commentId: string) => Promise<void>;
}) {
  if (comments.length === 0) {
    return <p className="text-sm text-neutral-500">Aucun commentaire pour le moment.</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-xl bg-yunicity-surface px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-neutral-900">{comment.author_display_name}</p>
              <p className="mt-1 text-sm text-neutral-700">{comment.body}</p>
              <p className="mt-1 text-xs text-neutral-500">{formatFeedDate(comment.created_at)}</p>
            </div>
            {currentUserId === comment.user_id ? (
              <button
                type="button"
                onClick={() => void onDelete(comment.id)}
                className="shrink-0 text-xs text-neutral-500 hover:text-neutral-800"
              >
                Supprimer
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

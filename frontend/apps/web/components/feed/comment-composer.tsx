"use client";

import { useState } from "react";

export function CommentComposer({ onSubmit }: { onSubmit: (body: string) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      setBody("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <input
        type="text"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={500}
        placeholder="Ajouter un commentaire…"
        className="min-h-[44px] flex-1 rounded-xl border border-yunicity-border px-3 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void handleSubmit();
          }
        }}
      />
      <button
        type="button"
        disabled={isSubmitting || !body.trim()}
        onClick={() => void handleSubmit()}
        className="rounded-xl px-4 py-2 text-sm font-medium text-yunicity-primary hover:bg-yunicity-primary-soft disabled:opacity-50"
      >
        Envoyer
      </button>
    </div>
  );
}

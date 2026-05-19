"use client";

import { FEED_COMPOSER_PLACEHOLDER } from "@yunicity/utils";
import { useState } from "react";

export function FeedComposer({
  onSubmit,
}: {
  onSubmit: (body: string, mediaUrl?: string | null) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed, mediaUrl.trim() || null);
      setBody("");
      setMediaUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-yunicity-border bg-white p-5 shadow-sm">
      <label className="sr-only" htmlFor="feed-composer-body">
        Nouveau message local
      </label>
      <textarea
        id="feed-composer-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={FEED_COMPOSER_PLACEHOLDER}
        rows={3}
        maxLength={4000}
        className="w-full resize-none rounded-xl border border-yunicity-border bg-yunicity-surface px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
      />
      <button
        type="button"
        onClick={() => setShowMedia((value) => !value)}
        className="mt-2 text-xs text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline"
      >
        {showMedia ? "Masquer l’image" : "Ajouter une image (URL)"}
      </button>
      {showMedia ? (
        <input
          id="feed-composer-media"
          type="url"
          value={mediaUrl}
          onChange={(event) => setMediaUrl(event.target.value)}
          placeholder="https://…"
          className="mt-2 w-full rounded-lg border border-yunicity-border px-3 py-2 text-sm text-neutral-800 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
        />
      ) : null}
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={isSubmitting || !body.trim()}
          onClick={() => void handleSubmit()}
          className="rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-yunicity-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
        >
          {isSubmitting ? "Publication…" : "Publier"}
        </button>
      </div>
    </section>
  );
}

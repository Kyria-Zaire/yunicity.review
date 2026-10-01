"use client";

import type { DiscussionThread } from "@yunicity/types";
import type { DiscussionChatMessage } from "@yunicity/utils";
import {
  DISCUSSIONS_DESKTOP_EVENT_CTA,
  DISCUSSIONS_DESKTOP_TODAY,
  DISCUSSIONS_LOADING,
  formatDiscussionEventSchedule,
} from "@yunicity/utils";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DiscussionsMessageBubble } from "@/components/discussions/discussions-message-bubble";
import { DiscussionsMobileComposerBar } from "@/components/discussions/mobile/discussions-mobile-composer-bar";
import { DiscussionsMobileThreadHeader } from "@/components/discussions/mobile/discussions-mobile-thread-header";

type DiscussionsMobileThreadViewProps = {
  thread: DiscussionThread;
  messages: DiscussionChatMessage[];
  isLoading: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onSendMessage: (body: string) => Promise<void>;
};

export function DiscussionsMobileThreadView({
  thread,
  messages,
  isLoading,
  isSubmitting,
  onBack,
  onSendMessage,
}: DiscussionsMobileThreadViewProps) {
  const [body, setBody] = useState("");
  const eventMeta = thread.event;

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting) return;
    await onSendMessage(trimmed);
    setBody("");
  }

  return (
    <div
      className="discussions-mobile-thread-shell flex min-h-dvh flex-col bg-white"
      data-discussions-mobile-thread=""
    >
      <DiscussionsMobileThreadHeader thread={thread} onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 pb-4 pt-3">
        {eventMeta ? (
          <div className="mb-4 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarDays className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">
                  {thread.title ?? "Sortie locale"}
                </p>
                <p className="mt-0.5 text-xs text-neutral-600">
                  {formatDiscussionEventSchedule(eventMeta.starts_at)}
                </p>
                <Link
                  href={`/sortir/${eventMeta.local_event_id}`}
                  className="mt-2 inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary"
                >
                  {DISCUSSIONS_DESKTOP_EVENT_CTA}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-neutral-500">{DISCUSSIONS_LOADING}</p>
        ) : (
          <div className="space-y-4">
            <div className="relative py-2">
              <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-200" aria-hidden />
              <p className="relative mx-auto w-fit bg-white px-3 text-xs font-medium text-neutral-400">
                {DISCUSSIONS_DESKTOP_TODAY}
              </p>
            </div>
            {messages.map((message) => (
              <DiscussionsMessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 shrink-0 border-t border-neutral-200/90 bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <DiscussionsMobileComposerBar
          body={body}
          isSubmitting={isSubmitting}
          onBodyChange={setBody}
          onSubmit={() => void handleSubmit()}
        />
      </div>
    </div>
  );
}

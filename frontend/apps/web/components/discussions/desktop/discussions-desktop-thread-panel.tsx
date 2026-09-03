"use client";

import type { DiscussionThread } from "@yunicity/types";
import type { DiscussionChatMessage } from "@yunicity/utils";
import {
  DISCUSSIONS_DESKTOP_EVENT_CTA,
  DISCUSSIONS_DESKTOP_SELECT_THREAD,
  DISCUSSIONS_DESKTOP_TODAY,
  DISCUSSIONS_DESKTOP_VIEW_PROFILE,
  DISCUSSIONS_LOADING,
  discussionAuthorProfileHref,
  formatDiscussionEventSchedule,
  resolveDiscussionStreamMaxWidth,
} from "@yunicity/utils";
import { CalendarDays, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DiscussionsComposerBar } from "@/components/discussions/discussions-composer-bar";
import { DiscussionsMessageBubble } from "@/components/discussions/discussions-message-bubble";

type DiscussionsDesktopThreadPanelProps = {
  thread: DiscussionThread | null;
  messages: DiscussionChatMessage[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSendMessage: (body: string) => Promise<void>;
};

export function DiscussionsDesktopThreadPanel({
  thread,
  messages,
  isLoading,
  isSubmitting,
  onSendMessage,
}: DiscussionsDesktopThreadPanelProps) {
  const [body, setBody] = useState("");
  const streamMaxWidth = useMemo(() => resolveDiscussionStreamMaxWidth(messages), [messages]);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting) return;
    await onSendMessage(trimmed);
    setBody("");
  }

  if (!thread) {
    return (
      <section
        className="flex min-h-[calc(100dvh-7rem)] items-center justify-center rounded-2xl border border-neutral-200/90 bg-white px-6 shadow-sm"
        data-discussions-desktop-thread=""
      >
        <p className="max-w-sm text-center text-sm text-neutral-500">{DISCUSSIONS_DESKTOP_SELECT_THREAD}</p>
      </section>
    );
  }

  const profileHref = discussionAuthorProfileHref(thread);
  const locationLabel = thread.neighborhood_summary?.display_name ?? thread.city ?? "Reims";
  const eventMeta = thread.event;

  return (
    <section
      className="flex max-h-[calc(100dvh-7rem)] min-h-[min(100%,28rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-discussions-desktop-thread=""
    >
      <header className="shrink-0 border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {thread.author.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thread.author.logo_url}
                alt=""
                className="inline-flex h-11 w-11 shrink-0 flex-none self-start rounded-full object-cover"
              />
            ) : (
              <span className="inline-flex h-11 w-11 shrink-0 flex-none items-center justify-center self-start rounded-full bg-[#EEF0FF] text-sm font-bold text-yunicity-primary">
                {thread.author.display_name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-neutral-900">
                {thread.linked_tribe_name ?? thread.discussion_title ?? thread.author.display_name}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {thread.author.display_name} · {locationLabel}
              </p>
            </div>
          </div>
          <Link
            href={profileHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-yunicity-primary px-3 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            {DISCUSSIONS_DESKTOP_VIEW_PROFILE}
            <Info className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      {eventMeta ? (
        <div className="shrink-0 border-b border-neutral-100 px-5 py-3">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {thread.title ?? "Sortie locale"}
              </p>
              <p className="text-xs text-neutral-600">{formatDiscussionEventSchedule(eventMeta.starts_at)}</p>
            </div>
            <Link
              href={`/sortir/${eventMeta.local_event_id}`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {DISCUSSIONS_DESKTOP_EVENT_CTA}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div
          className={`mx-auto w-full transition-[max-width] duration-300 ease-out ${streamMaxWidth}`}
          data-discussions-desktop-stream=""
        >
          {isLoading ? (
            <p className="py-8 text-center text-sm text-neutral-500">{DISCUSSIONS_LOADING}</p>
          ) : (
            <>
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

              <div className="sticky bottom-0 z-[1] mt-4 bg-white pt-3 pb-1" data-discussions-desktop-composer="">
                <DiscussionsComposerBar
                  body={body}
                  isSubmitting={isSubmitting}
                  onBodyChange={setBody}
                  onSubmit={() => void handleSubmit()}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

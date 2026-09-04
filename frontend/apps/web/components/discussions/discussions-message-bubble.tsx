"use client";

import type { DiscussionChatMessage } from "@yunicity/utils";

export function DiscussionsMessageBubble({ message }: { message: DiscussionChatMessage }) {
  if (message.isOwn) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] sm:max-w-[92%]">
          <div className="rounded-2xl rounded-br-md bg-[#EEF0FF] px-4 py-2.5 text-sm leading-relaxed text-neutral-800">
            {message.body}
          </div>
          <p className="mt-1 text-right text-[11px] text-neutral-400">{message.timeLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <span className="inline-flex h-8 w-8 shrink-0 flex-none items-center justify-center self-end rounded-full bg-[#EEF0FF] text-[10px] font-bold leading-none text-yunicity-primary">
        {message.authorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.authorAvatarUrl} alt="" className="size-full rounded-full object-cover" />
        ) : (
          message.authorName.slice(0, 1).toUpperCase()
        )}
      </span>
      <div className="max-w-[88%] sm:max-w-[92%]">
        <div className="rounded-2xl rounded-bl-md border border-neutral-200/90 bg-white px-4 py-2.5 text-sm leading-relaxed text-neutral-800 shadow-sm">
          {message.body}
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">{message.timeLabel}</p>
      </div>
    </div>
  );
}

"use client";

import {
  DISCUSSIONS_DESKTOP_SEND,
  DISCUSSIONS_MOBILE_COMPOSER_PLACEHOLDER,
  insertTextAtSelection,
} from "@yunicity/utils";
import { Send } from "lucide-react";
import { useRef } from "react";

import { DiscussionsEmojiPicker } from "@/components/discussions/discussions-emoji-picker";

type DiscussionsMobileComposerBarProps = {
  body: string;
  isSubmitting: boolean;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
};

export function DiscussionsMobileComposerBar({
  body,
  isSubmitting,
  onBodyChange,
  onSubmit,
}: DiscussionsMobileComposerBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      onBodyChange(`${body}${emoji}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const result = insertTextAtSelection(body, start, end, emoji);
    onBodyChange(result.next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.cursor, result.cursor);
    });
  }

  return (
    <div className="flex items-end gap-2">
      <DiscussionsEmojiPicker
        onSelect={insertEmoji}
        placement="top-start"
        triggerClassName="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-700"
      />
      <div className="flex min-h-11 flex-1 items-end rounded-full border border-neutral-200 bg-white px-4 py-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          rows={1}
          maxLength={500}
          placeholder={DISCUSSIONS_MOBILE_COMPOSER_PLACEHOLDER}
          aria-label={DISCUSSIONS_MOBILE_COMPOSER_PLACEHOLDER}
          className="max-h-24 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm leading-relaxed focus:outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
      </div>
      <button
        type="button"
        disabled={isSubmitting || !body.trim()}
        onClick={onSubmit}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-white transition hover:opacity-95 disabled:opacity-50"
        aria-label={DISCUSSIONS_DESKTOP_SEND}
      >
        <Send className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

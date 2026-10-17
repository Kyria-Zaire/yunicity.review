"use client";

import {
  DISCUSSIONS_DESKTOP_COMPOSER_PLACEHOLDER,
  DISCUSSIONS_DESKTOP_SEND,
  insertTextAtSelection,
} from "@yunicity/utils";
import { Send } from "lucide-react";
import { useRef } from "react";

import { DiscussionsEmojiPicker } from "@/components/discussions/discussions-emoji-picker";

type DiscussionsComposerBarProps = {
  body: string;
  isSubmitting: boolean;
  variant?: "default" | "mobile";
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
};

export function DiscussionsComposerBar({
  body,
  isSubmitting,
  variant = "default",
  onBodyChange,
  onSubmit,
}: DiscussionsComposerBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mobile = variant === "mobile";

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
    <div
      className={
        mobile
          ? "flex items-end gap-2 rounded-2xl border border-neutral-200 bg-white px-2 py-2 shadow-sm"
          : "flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/70 px-3 py-2 shadow-sm"
      }
    >
      <DiscussionsEmojiPicker
        onSelect={insertEmoji}
        placement="top-start"
        triggerClassName={
          mobile
            ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-700"
            : undefined
        }
      />
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        rows={1}
        maxLength={500}
        placeholder={DISCUSSIONS_DESKTOP_COMPOSER_PLACEHOLDER}
        aria-label={DISCUSSIONS_DESKTOP_COMPOSER_PLACEHOLDER}
        className="max-h-28 min-h-[2.75rem] flex-1 resize-none bg-transparent py-2.5 text-sm focus:outline-none"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
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

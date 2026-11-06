"use client";

import { Popover, type PopoverPlacement, type PopoverTriggerProps } from "@yunicity/ui/primitives";
import { DISCUSSIONS_COMPOSER_EMOJI_LABEL, DISCUSSIONS_COMPOSER_EMOJIS } from "@yunicity/utils";
import { Smile } from "lucide-react";
import { useState, type ReactNode } from "react";

type DiscussionsEmojiPickerProps = {
  onSelect: (emoji: string) => void;
  placement?: PopoverPlacement;
  triggerClassName?: string;
  renderTrigger?: (props: PopoverTriggerProps) => ReactNode;
};

export function DiscussionsEmojiPicker({
  onSelect,
  placement = "top-start",
  triggerClassName,
  renderTrigger,
}: DiscussionsEmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      trigger={(props) =>
        renderTrigger ? (
          renderTrigger(props)
        ) : (
          <button
            {...props}
            type="button"
            className={
              triggerClassName ??
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white hover:text-neutral-600"
            }
            aria-label={DISCUSSIONS_COMPOSER_EMOJI_LABEL}
          >
            <Smile className="h-5 w-5" aria-hidden />
          </button>
        )
      }
      className="rounded-2xl border border-neutral-200/90 bg-white p-2 shadow-lg"
    >
      {(controls) => (
        <div
          role="listbox"
          aria-label={DISCUSSIONS_COMPOSER_EMOJI_LABEL}
          className="grid grid-cols-5 gap-0.5"
        >
          {DISCUSSIONS_COMPOSER_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="option"
              aria-label={emoji}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40"
              onClick={() => {
                onSelect(emoji);
                controls.close("programmatic");
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

"use client";

import { Drawer } from "@yunicity/ui/primitives";
import {
  LOCAL_VIDEO_SHARE_COPIED,
  LOCAL_VIDEO_SHARE_FAILED_CLOSE,
  LOCAL_VIDEO_SHARE_FAILED_COPY,
  LOCAL_VIDEO_SHARE_FAILED_TITLE,
  LOCAL_VIDEO_SHARE_UNAVAILABLE_BODY,
  LOCAL_VIDEO_SHARE_UNAVAILABLE_CLOSE,
  LOCAL_VIDEO_SHARE_UNAVAILABLE_FIELD_LABEL,
  LOCAL_VIDEO_SHARE_UNAVAILABLE_SELECT_ALL,
  LOCAL_VIDEO_SHARE_UNAVAILABLE_TITLE,
} from "@yunicity/utils";
import { Check, Link2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef } from "react";

import { useLocalVideoShareFeedback } from "@/lib/videos/local-video-share-feedback-context";
import { Z_INDEX } from "@/lib/layout/z-index";
import { VIDEO_CANVAS_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

type LocalVideoShareFeedbackProps = {
  onCopyFromFailed: () => void | Promise<void>;
};

/**
 * VIDEO-REFONTE-L2-PARTAGE-01 — H1 / H2 / H3 montés une seule fois (videos-screen).
 */
export function LocalVideoShareFeedback({ onCopyFromFailed }: LocalVideoShareFeedbackProps) {
  const { feedback, clearFeedback, shareTriggerRef } = useLocalVideoShareFeedback();
  const copyButtonRef = useRef<HTMLButtonElement | null>(null);
  const linkFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const fieldId = useId();

  const restoreShareFocus = () => {
    const trigger = shareTriggerRef.current;
    if (trigger && document.contains(trigger)) {
      trigger.focus();
    }
  };

  const closePanels = () => {
    clearFeedback();
    window.setTimeout(restoreShareFocus, 0);
  };

  useEffect(() => {
    if (feedback.kind !== "failed") return;
    const frame = window.requestAnimationFrame(() => {
      copyButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [feedback]);

  useLayoutEffect(() => {
    if (feedback.kind !== "manual") return;
    const field = linkFieldRef.current;
    if (!field) return;
    field.focus();
    field.select();
  }, [feedback]);

  const selectFullLink = () => {
    const field = linkFieldRef.current;
    if (!field) return;
    field.focus();
    field.setSelectionRange(0, field.value.length);
  };

  return (
    <>
      {feedback.kind === "copied" ? (
        <div
          role="status"
          data-videos-share-h1=""
          className="pointer-events-none fixed left-1/2 top-[36%] z-[80] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          <Check className="h-[18px] w-[18px]" aria-hidden />
          {LOCAL_VIDEO_SHARE_COPIED}
        </div>
      ) : null}

      {feedback.kind === "failed" ? (
        <div
          role="alert"
          data-videos-share-h2=""
          className="fixed left-1/2 top-[32%] z-[80] w-[min(342px,calc(100vw-48px))] -translate-x-1/2 rounded-2xl bg-neutral-900 p-4 text-white shadow-xl"
        >
          <div className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs font-bold"
              aria-hidden
            >
              !
            </span>
            <p className="m-0 text-[15px] font-semibold leading-[21px]">
              {LOCAL_VIDEO_SHARE_FAILED_TITLE}
            </p>
          </div>
          <div className="mt-2.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={closePanels}
              className={`${VIDEO_TOUCH_TARGET} rounded-full px-3.5 text-sm font-semibold text-white ${VIDEO_CANVAS_FOCUS}`}
            >
              {LOCAL_VIDEO_SHARE_FAILED_CLOSE}
            </button>
            <button
              ref={copyButtonRef}
              type="button"
              onClick={() => void onCopyFromFailed()}
              className={`${VIDEO_TOUCH_TARGET} gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-neutral-900 ${VIDEO_CANVAS_FOCUS}`}
            >
              <Link2 className="h-4 w-4" aria-hidden />
              {LOCAL_VIDEO_SHARE_FAILED_COPY}
            </button>
          </div>
        </div>
      ) : null}

      <Drawer
        open={feedback.kind === "manual"}
        onOpenChange={(open) => {
          if (!open) closePanels();
        }}
        title={LOCAL_VIDEO_SHARE_UNAVAILABLE_TITLE}
        zIndex={Z_INDEX.VIDEO_COMMENTS}
        returnFocusRef={shareTriggerRef}
      >
        {feedback.kind === "manual" ? (
          <div data-videos-share-h3="" className="flex flex-col gap-2.5 px-1 pb-2 pt-1">
            <p className="m-0 text-sm leading-5 text-neutral-600">
              {LOCAL_VIDEO_SHARE_UNAVAILABLE_BODY}
            </p>
            <label htmlFor={fieldId} className="sr-only">
              {LOCAL_VIDEO_SHARE_UNAVAILABLE_FIELD_LABEL}
            </label>
            <textarea
              ref={linkFieldRef}
              id={fieldId}
              readOnly
              rows={3}
              value={feedback.url}
              className="w-full resize-none overflow-hidden break-all rounded-xl border-2 border-yunicity-primary bg-[#C7CCFF] px-3.5 py-2.5 text-[15px] leading-[22px] text-neutral-900"
            />
            <button
              type="button"
              onClick={selectFullLink}
              className={`${VIDEO_TOUCH_TARGET} self-start px-1 text-[15px] font-semibold text-yunicity-primary ${VIDEO_CANVAS_FOCUS}`}
            >
              {LOCAL_VIDEO_SHARE_UNAVAILABLE_SELECT_ALL}
            </button>
            <button
              type="button"
              onClick={closePanels}
              className={`${VIDEO_TOUCH_TARGET} rounded-full border border-neutral-200 bg-white text-[15px] font-semibold text-neutral-900 ${VIDEO_CANVAS_FOCUS}`}
            >
              {LOCAL_VIDEO_SHARE_UNAVAILABLE_CLOSE}
            </button>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

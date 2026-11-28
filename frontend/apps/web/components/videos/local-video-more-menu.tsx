"use client";

import { Drawer } from "@yunicity/ui/primitives";
import { VIDEOS_MOBILE_CANCEL, VIDEOS_MOBILE_MORE_TITLE, VIDEOS_MOBILE_REPORT_ACTION } from "@yunicity/utils";
import { Flag } from "lucide-react";
import type { RefObject } from "react";

import { Z_INDEX } from "@/lib/layout/z-index";
import { VIDEO_CANVAS_FOCUS } from "@/lib/videos/video-playback-a11y";

type LocalVideoMoreMenuProps = {
  open: boolean;
  onClose: () => void;
  onReport: () => void;
  /** Bouton « … » : cible explicite du retour du focus (WebKit ne focalise pas un bouton au clic). */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

/**
 * Menu « … » (écran I, v2.3) : « Signaler la vidéo » en première ligne, puis « Annuler ».
 * Signaler ouvre la feuille de motifs existante (`local-video-report-sheet`).
 */
export function LocalVideoMoreMenu({ open, onClose, onReport, returnFocusRef }: LocalVideoMoreMenuProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={VIDEOS_MOBILE_MORE_TITLE}
      zIndex={Z_INDEX.VIDEO_COMMENTS}
      returnFocusRef={returnFocusRef}
      className="rounded-t-3xl bg-white"
    >
      <div className="flex flex-col pb-2">
        <button
          type="button"
          onClick={onReport}
          className={`flex min-h-14 items-center gap-3.5 rounded-xl px-3 text-left text-base font-semibold text-red-700 hover:bg-red-50 ${VIDEO_CANVAS_FOCUS}`}
        >
          <Flag className="h-[22px] w-[22px]" aria-hidden />
          {VIDEOS_MOBILE_REPORT_ACTION}
        </button>
        <div className="mx-3 my-1 h-px bg-neutral-200" aria-hidden />
        <button
          type="button"
          onClick={onClose}
          className={`min-h-[52px] rounded-xl px-3 text-left text-base font-semibold text-neutral-900 hover:bg-neutral-50 ${VIDEO_CANVAS_FOCUS}`}
        >
          {VIDEOS_MOBILE_CANCEL}
        </button>
      </div>
    </Drawer>
  );
}

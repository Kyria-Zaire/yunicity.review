"use client";

import type { LocalVideoReportReason } from "@yunicity/types";
import { Drawer } from "@yunicity/ui/primitives";
import {
  LOCAL_VIDEO_REPORT_LABEL,
  LOCAL_VIDEO_REPORT_REASON_LABELS,
  LOCAL_VIDEO_REPORT_REASONS,
  LOCAL_VIDEO_REPORT_SUCCESS,
} from "@yunicity/utils";
import { useEffect, useState } from "react";

import { Z_INDEX } from "@/lib/layout/z-index";

type LocalVideoReportSheetProps = {
  open: boolean;
  onClose: () => void;
  onReport: (reason: LocalVideoReportReason) => Promise<void>;
  alreadyReported?: boolean;
  errorMessage?: string | null;
};

/**
 * Signalement vidéo — panneau bas (C3.0-T4).
 *
 * Le chrome d'overlay (portail, backdrop, Escape, verrou de scroll, piège de focus,
 * restitution du focus, mise en inertie de l'arrière-plan) vient désormais de `Drawer`
 * (`@yunicity/ui/primitives`). Ce composant ne porte plus que le métier : raisons,
 * soumission, état « déjà signalé », erreur.
 *
 * `zIndex` reste celui du registre chrome web (`Z_INDEX.VIDEO_REPORT`) : l'échelle
 * sémantique du design system et ce registre divergent encore, la réconciliation
 * appartient au ticket de migration du chrome.
 */
export function LocalVideoReportSheet({
  open,
  onClose,
  onReport,
  alreadyReported = false,
  errorMessage = null,
}: LocalVideoReportSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyReported);

  useEffect(() => {
    if (!open) return;
    setDone(alreadyReported);
  }, [alreadyReported, open]);

  async function submit(reason: LocalVideoReportReason) {
    setIsSubmitting(true);
    try {
      await onReport(reason);
      setDone(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={LOCAL_VIDEO_REPORT_LABEL}
      zIndex={Z_INDEX.VIDEO_REPORT}
    >
      {done ? (
        <p className="py-4 text-sm text-neutral-600">{LOCAL_VIDEO_REPORT_SUCCESS}</p>
      ) : (
        <div className="flex flex-col gap-1 pb-2">
          {LOCAL_VIDEO_REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              disabled={isSubmitting}
              onClick={() => void submit(reason)}
              className="rounded-xl px-3 py-3 text-left text-sm text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              {LOCAL_VIDEO_REPORT_REASON_LABELS[reason]}
            </button>
          ))}
        </div>
      )}

      {errorMessage ? (
        <p className="pb-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </Drawer>
  );
}

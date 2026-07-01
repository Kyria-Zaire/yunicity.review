"use client";

import { CreateHubActionRow } from "@/components/create-hub/create-hub-action-row";
import {
  CREATE_HUB_ACTIONS_ARIA_LABEL,
  CREATE_HUB_BACKDROP_LABEL,
  CREATE_HUB_CLOSE_LABEL,
  CREATE_HUB_SHEET_TITLE,
} from "@/components/create-hub/create-hub-labels";
import { useCreateHubPartnerAccess } from "@/hooks/use-create-hub-partner-access";
import { buildCreateHubActions, type CreateHubAction } from "@/lib/create-hub/create-hub-actions";
import { navigateFromCreateHub } from "@/lib/create-hub/create-hub-navigation";
import { Z_INDEX } from "@/lib/layout/z-index";
import { X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";

type CreateHubSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateHubSheet({ open, onClose }: CreateHubSheetProps) {
  const titleId = useId();
  const listId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { showPartnerAction } = useCreateHubPartnerAccess();

  const actions = useMemo(
    () => buildCreateHubActions({ showPartnerAction }),
    [showPartnerAction],
  );

  const handleSelect = useCallback(
    (action: CreateHubAction) => {
      if (action.kind !== "navigate" || !action.href) {
        return;
      }
      onClose();
      navigateFromCreateHub(action.href, { pathname, router });
    },
    [onClose, pathname, router],
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex flex-col justify-end xl:items-center xl:justify-center xl:p-6"
      style={{ zIndex: Z_INDEX.CREATE_HUB }}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 transition-opacity"
        aria-label={CREATE_HUB_BACKDROP_LABEL}
        onClick={onClose}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl transition-transform duration-200 ease-out xl:max-w-md xl:rounded-3xl"
      >
        <div className="mx-auto mb-4 hidden h-1 w-10 rounded-full bg-neutral-200 xl:hidden" aria-hidden />

        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold text-neutral-900">
            {CREATE_HUB_SHEET_TITLE}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
            aria-label={CREATE_HUB_CLOSE_LABEL}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <ul
          id={listId}
          aria-label={CREATE_HUB_ACTIONS_ARIA_LABEL}
          className="mt-5 space-y-3 pb-1"
        >
          {actions.map((action) => (
            <li key={action.id}>
              <CreateHubActionRow action={action} onSelect={handleSelect} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

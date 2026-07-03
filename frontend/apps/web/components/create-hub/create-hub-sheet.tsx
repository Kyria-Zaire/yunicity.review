"use client";

import { CreateHubActionRow } from "@/components/create-hub/create-hub-action-row";
import { CreateHubLegalFooter } from "@/components/create-hub/create-hub-legal-footer";
import {
  CREATE_HUB_ACTIONS_ARIA_LABEL,
  CREATE_HUB_BACKDROP_LABEL,
  CREATE_HUB_CLOSE_LABEL,
  CREATE_HUB_SHEET_TITLE,
  CREATE_HUB_SHEET_WIDTH_CLASS,
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
      className="fixed inset-0 flex items-center justify-center p-4"
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
        className={`relative z-10 box-border flex h-fit max-h-[85dvh] shrink-0 flex-col overflow-y-auto rounded-xl border border-neutral-200/80 bg-white p-3 shadow-lg ${CREATE_HUB_SHEET_WIDTH_CLASS}`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-base font-bold leading-none text-neutral-900">
            {CREATE_HUB_SHEET_TITLE}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
            aria-label={CREATE_HUB_CLOSE_LABEL}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <ul
          id={listId}
          aria-label={CREATE_HUB_ACTIONS_ARIA_LABEL}
          className="flex w-full flex-col gap-1.5"
        >
          {actions.map((action) => (
            <li key={action.id}>
              <CreateHubActionRow action={action} onSelect={handleSelect} />
            </li>
          ))}
        </ul>

        <CreateHubLegalFooter onNavigate={onClose} />
      </section>
    </div>
  );
}

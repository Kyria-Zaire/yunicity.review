"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CreateHubActionRow } from "@/components/create-hub/create-hub-action-row";
import { CreateHubLegalFooter } from "@/components/create-hub/create-hub-legal-footer";
import {
  CREATE_HUB_ACTIONS_ARIA_LABEL,
  CREATE_HUB_SHEET_TITLE,
} from "@/components/create-hub/create-hub-labels";
import { useCreateHubPartnerAccess } from "@/hooks/use-create-hub-partner-access";
import {
  buildCreateHubActions,
  type CreateHubAction,
} from "@/lib/create-hub/create-hub-actions";
import { buildLoginUrlWithNext, resolveAuthReturnPath } from "@yunicity/utils";
import { usePathname } from "next/navigation";

type CreateHubDialogContentProps = {
  isAuthenticated: boolean;
  onSelect: (action: CreateHubAction) => void;
  onClose: () => void;
};

export function CreateHubDialogContent({
  isAuthenticated,
  onSelect,
  onClose,
}: CreateHubDialogContentProps) {
  const pathname = usePathname();
  const { status: partnerAccessStatus } = useCreateHubPartnerAccess();

  const actions = useMemo(
    () => buildCreateHubActions({ isAuthenticated, partnerAccessStatus }),
    [isAuthenticated, partnerAccessStatus],
  );

  const loginHref = buildLoginUrlWithNext(resolveAuthReturnPath(pathname, "/feed"));

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-600">
          Connectez-vous pour publier sur le fil, créer une story, une vidéo ou une tribu.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={loginHref}
            onClick={onClose}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ul aria-label={CREATE_HUB_ACTIONS_ARIA_LABEL} className="flex w-full flex-col gap-1.5">
        {actions.map((action) => (
          <li key={action.id}>
            <CreateHubActionRow action={action} onSelect={onSelect} />
          </li>
        ))}
      </ul>
      <CreateHubLegalFooter onNavigate={onClose} />
    </>
  );
}

export { CREATE_HUB_SHEET_TITLE as CREATE_HUB_DIALOG_TITLE };

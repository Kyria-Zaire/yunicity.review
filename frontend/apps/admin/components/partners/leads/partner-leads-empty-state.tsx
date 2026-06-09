import type { PartnerLeadEmptyStateCopy } from "@yunicity/utils";
import { PartnersEmptyState } from "@/components/partners/command/partners-empty-state";

type PartnerLeadsEmptyStateProps = PartnerLeadEmptyStateCopy & {
  onAddProspect?: () => void;
  canCreate?: boolean;
};

export function PartnerLeadsEmptyState({
  badge,
  title,
  message,
  onAddProspect,
  canCreate,
}: PartnerLeadsEmptyStateProps) {
  return (
    <PartnersEmptyState
      badge={badge}
      title={title}
      message={message}
      action={
        canCreate && onAddProspect
          ? { label: "Ajouter un prospect", onClick: onAddProspect }
          : !canCreate
            ? { label: "Préparer la prospection", href: "/partners" }
            : undefined
      }
    />
  );
}

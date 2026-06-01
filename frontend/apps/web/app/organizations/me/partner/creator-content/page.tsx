import { PartnerPortalCreatorContent } from "@/components/partner-portal/partner-portal-creator-content";
import { PartnerPortalShell } from "@/components/partner-portal/partner-portal-shell";

export default function PartnerPortalCreatorContentPage() {
  return (
    <PartnerPortalShell
      title="Contenus créateurs"
      subtitle="Articles et stories de votre lieu — brouillon, validation, publication."
    >
      <PartnerPortalCreatorContent />
    </PartnerPortalShell>
  );
}

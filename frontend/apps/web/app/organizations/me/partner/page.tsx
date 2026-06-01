import { PartnerPortalOverview } from "@/components/partner-portal/partner-portal-overview";
import { PartnerPortalShell } from "@/components/partner-portal/partner-portal-shell";

export default function PartnerPortalOverviewPage() {
  return (
    <PartnerPortalShell
      title="Aperçu"
      subtitle="Vue d’ensemble de votre espace partenaire et checklist recette pilote."
    >
      <PartnerPortalOverview />
    </PartnerPortalShell>
  );
}

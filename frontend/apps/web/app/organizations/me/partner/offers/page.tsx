import { PartnerPortalOffers } from "@/components/partner-portal/partner-portal-offers";
import { PartnerPortalShell } from "@/components/partner-portal/partner-portal-shell";

export default function PartnerPortalOffersPage() {
  return (
    <PartnerPortalShell
      title="Offres Passport"
      subtitle="Vos avantages citoyens — statuts réels de publication et d’activation."
    >
      <PartnerPortalOffers />
    </PartnerPortalShell>
  );
}

import { PartnerPortalEvents } from "@/components/partner-portal/partner-portal-events";
import { PartnerPortalShell } from "@/components/partner-portal/partner-portal-shell";

export default function PartnerPortalEventsPage() {
  return (
    <PartnerPortalShell
      title="Événements"
      subtitle="Moments annoncés par votre lieu — soumis à validation avant publication."
    >
      <PartnerPortalEvents />
    </PartnerPortalShell>
  );
}

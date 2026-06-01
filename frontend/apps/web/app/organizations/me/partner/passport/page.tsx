import { PartnerPassportQrPanel } from "@/components/organizations/partner-passport-qr-screen";
import { PartnerPortalShell } from "@/components/partner-portal/partner-portal-shell";
import { PARTNER_PORTAL_QR_EXPLANATION } from "@yunicity/utils";

export default function PartnerPortalPassportPage() {
  return (
    <PartnerPortalShell title="QR Passport" subtitle={PARTNER_PORTAL_QR_EXPLANATION}>
      <PartnerPassportQrPanel />
    </PartnerPortalShell>
  );
}

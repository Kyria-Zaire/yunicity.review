"use client";

import { ProfileCompactScreen } from "@/components/profile/profile-compact-screen";
import type { useProfilePortalContext } from "@/hooks/use-profile-portal-context";

type ProfilePortalCtx = ReturnType<typeof useProfilePortalContext>;

type ProfileMobileViewProps = {
  ctx: ProfilePortalCtx;
};

/** Vue mobile Profil — hero full-bleed + maquette compacte, bottom nav conservée. */
export function ProfileMobileView({ ctx }: ProfileMobileViewProps) {
  return (
    <div className="web-mobile-profile-portal-only min-w-0 bg-[#F4F5F7]" data-profile-mobile="">
      <ProfileCompactScreen ctx={ctx} variant="mobile" />
    </div>
  );
}

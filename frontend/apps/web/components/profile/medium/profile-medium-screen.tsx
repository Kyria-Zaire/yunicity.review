"use client";

import { ProfileMediumChromeHeader } from "@/components/profile/medium/profile-medium-chrome-header";
import { ProfileCompactScreen } from "@/components/profile/profile-compact-screen";
import type { useProfilePortalContext } from "@/hooks/use-profile-portal-context";

type ProfilePortalCtx = ReturnType<typeof useProfilePortalContext>;

type ProfileMediumScreenProps = {
  ctx: ProfilePortalCtx;
};

/** Portail profil medium — 640 → 1023 px, rail citoyen + hero maquette. */
export function ProfileMediumScreen({ ctx }: ProfileMediumScreenProps) {
  return (
    <div className="web-medium-profile-portal-only" data-profile-medium="">
      <ProfileMediumChromeHeader city={ctx.city} />

      <div className="profile-medium-shell mx-auto w-full max-w-[960px] px-3 pb-4 sm:px-4 sm:pb-5">
        <ProfileCompactScreen ctx={ctx} variant="medium" />
      </div>
    </div>
  );
}

"use client";

import { ProfileDesktopOwnerScreen } from "@/components/profile/desktop/profile-desktop-owner-screen";
import { ProfileMediumScreen } from "@/components/profile/medium";
import { ProfileMobileView } from "@/components/profile/mobile";
import { ProfileAppShell } from "@/components/profile/profile-app-shell";
import { useProfilePortalContext } from "@/hooks/use-profile-portal-context";
import {
  PROFILE_PORTAL_ERROR,
  PROFILE_PORTAL_LOADING,
  PROFILE_PORTAL_RETRY,
} from "@yunicity/utils";

/** Mon profil connecté — /profile/me uniquement. */
export function ProfilePortalScreen() {
  const ctx = useProfilePortalContext();

  if (ctx.loading) {
    return (
      <ProfileAppShell>
        <p
          className="web-mobile-profile-portal-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {PROFILE_PORTAL_LOADING}
        </p>
        <p
          className="web-medium-profile-portal-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {PROFILE_PORTAL_LOADING}
        </p>
        <p
          className="web-desktop-profile-portal-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {PROFILE_PORTAL_LOADING}
        </p>
      </ProfileAppShell>
    );
  }

  if (ctx.error || !ctx.profile) {
    return (
      <ProfileAppShell>
        <div className="web-mobile-profile-portal-only mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm text-red-800">{PROFILE_PORTAL_ERROR}</p>
            <button
              type="button"
              onClick={() => void ctx.reload()}
              className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PROFILE_PORTAL_RETRY}
            </button>
          </div>
        </div>
        <div className="web-medium-profile-portal-only mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm text-red-800">{PROFILE_PORTAL_ERROR}</p>
            <button
              type="button"
              onClick={() => void ctx.reload()}
              className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PROFILE_PORTAL_RETRY}
            </button>
          </div>
        </div>
        <div className="web-desktop-profile-portal-only mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm text-red-800">{PROFILE_PORTAL_ERROR}</p>
          <button
            type="button"
            onClick={() => void ctx.reload()}
            className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_PORTAL_RETRY}
          </button>
        </div>
      </ProfileAppShell>
    );
  }

  return (
    <ProfileAppShell>
      <ProfileMobileView ctx={ctx} />
      <ProfileMediumScreen ctx={ctx} />
      <ProfileDesktopOwnerScreen ctx={ctx} />
    </ProfileAppShell>
  );
}

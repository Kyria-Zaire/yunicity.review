"use client";

import { ProfileDesktopPublicScreen } from "@/components/profile/desktop/profile-desktop-public-screen";
import { ProfileMediumPublicScreen } from "@/components/profile/medium/profile-medium-public-screen";
import { ProfileMobilePublicScreen } from "@/components/profile/mobile/profile-mobile-public-screen";
import { ProfileAppShell } from "@/components/profile/profile-app-shell";
import { useProfilePublicPortalContext } from "@/hooks/use-profile-public-portal-context";
import type { ProfilePublicPortalTarget } from "@/hooks/use-profile-public-portal-context";
import {
  PROFILE_PORTAL_ERROR,
  PROFILE_PORTAL_LOADING,
  PROFILE_PORTAL_RETRY,
} from "@yunicity/utils";
import Link from "next/link";

type ProfilePublicPortalScreenProps = ProfilePublicPortalTarget;

/** Profil public d'un autre citoyen — /user/{id} ou /profile/{username}. */
export function ProfilePublicPortalScreen(props: ProfilePublicPortalScreenProps) {
  const ctx = useProfilePublicPortalContext(props);

  if (ctx.loading || ctx.isRedirecting) {
    return (
      <ProfileAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {PROFILE_PORTAL_LOADING}
        </p>
      </ProfileAppShell>
    );
  }

  if (ctx.isPrivate) {
    return (
      <ProfileAppShell>
        <div className="mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
            <p className="text-4xl font-light text-neutral-300">404</p>
            <p className="mt-4 font-medium text-neutral-800">Profil introuvable</p>
            <p className="mt-2 text-sm text-neutral-600">
              Ce profil est privé ou n&apos;existe pas.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </ProfileAppShell>
    );
  }

  if (ctx.error || !ctx.profile) {
    return (
      <ProfileAppShell>
        <div className="mx-auto max-w-lg px-4 py-10">
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
      </ProfileAppShell>
    );
  }

  const publicCtx = {
    profile: ctx.profile,
    city: ctx.city,
    userPosts: ctx.userPosts,
    tribes: ctx.tribes,
    contributions: ctx.contributions,
    savedEvents: ctx.savedEvents,
  };

  return (
    <ProfileAppShell>
      <ProfileMobilePublicScreen ctx={publicCtx} />
      <ProfileMediumPublicScreen ctx={publicCtx} />
      <ProfileDesktopPublicScreen ctx={publicCtx} />
    </ProfileAppShell>
  );
}

"use client";

import { TribeDetailDesktopView } from "@/components/tribes/detail/desktop";
import { TribeDetailMediumView } from "@/components/tribes/detail/medium";
import { TribeDetailMobileView } from "@/components/tribes/mobile";
import { TribesAppShell } from "@/components/tribes/tribes-app-shell";
import { useTribeDetail } from "@/hooks/use-tribe-detail";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  TRIBE_DETAIL_LOADING,
  TRIBE_NOT_FOUND,
  TRIBES_RETRY,
  buildTribeShareText,
} from "@yunicity/utils";

export function TribeDetailScreen({ slug, city }: { slug: string; city: string }) {
  const { isAuthenticated, user } = useAuth();
  const {
    tribe,
    loading,
    error,
    events,
    places,
    members,
    membersTotal,
    postsPreview,
    actionError,
    joining,
    leaving,
    reload,
    join,
    leave,
  } = useTribeDetail(slug, city);

  if (loading) {
    return (
      <TribesAppShell>
        <p className="px-3 py-12 text-center text-sm text-neutral-500">{TRIBE_DETAIL_LOADING}</p>
      </TribesAppShell>
    );
  }

  if (error || !tribe) {
    return (
      <TribesAppShell>
        <div className="mx-auto max-w-lg px-3 py-12 text-center">
          <p className="text-sm text-neutral-700">{error ?? TRIBE_NOT_FOUND}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {TRIBES_RETRY}
          </button>
        </div>
      </TribesAppShell>
    );
  }

  const currentTribe = tribe;

  async function shareTribe() {
    const text = buildTribeShareText(currentTribe);
    const url = `${window.location.origin}/tribes/${encodeURIComponent(currentTribe.slug)}?city=${encodeURIComponent(city)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentTribe.name, text, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
  }

  const sharedProps = {
    tribe: currentTribe,
    city,
    events,
    places,
    members,
    postsPreview,
    isAuthenticated,
    joining,
    leaving,
    actionError,
    onJoin: async (accepted: boolean) => {
      await join(accepted);
    },
    onLeave: leave,
    onShare: () => void shareTribe(),
  };

  return (
    <TribesAppShell>
      <TribeDetailMobileView
        {...sharedProps}
        slug={slug}
        membersTotal={membersTotal}
        currentUserId={user?.id ?? null}
      />

      <TribeDetailMediumView {...sharedProps} />

      <TribeDetailDesktopView {...sharedProps} slug={slug} membersTotal={membersTotal} />
    </TribesAppShell>
  );
}

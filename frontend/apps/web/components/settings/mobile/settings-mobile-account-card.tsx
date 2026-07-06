"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { AuthUser } from "@yunicity/types";
import type { SettingsAccountStatus, SettingsVerificationView } from "@yunicity/utils";
import {
  SETTINGS_RAIL_MEMBER_SINCE,
  SETTINGS_RAIL_STATUS,
} from "@yunicity/utils";
import { BadgeCheck } from "lucide-react";

type SettingsMobileAccountCardProps = {
  user: AuthUser | null;
  displayName: string;
  verification: SettingsVerificationView;
  accountStatus: SettingsAccountStatus | null;
};

/** Carte compte mobile (MOBILE-SETTINGS-01). */
export function SettingsMobileAccountCard({
  user,
  displayName,
  verification,
  accountStatus,
}: SettingsMobileAccountCardProps) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <ProfileAvatar name={displayName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-neutral-900">{displayName}</p>
          <p className="truncate text-sm text-neutral-500">{user?.email}</p>
          {verification.verified ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-yunicity-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-yunicity-primary">
              <BadgeCheck className="h-3 w-3" aria-hidden />
              {verification.verifiedLabel}
            </span>
          ) : null}
        </div>
      </div>

      {accountStatus ? (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            {SETTINGS_RAIL_STATUS}
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            {SETTINGS_RAIL_MEMBER_SINCE} : {accountStatus.memberSinceLabel}
          </p>
        </div>
      ) : null}
    </section>
  );
}

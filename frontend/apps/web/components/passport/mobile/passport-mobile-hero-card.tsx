"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { PassportMe, PassportOverviewResponse, ProfileMe } from "@yunicity/types";
import {
  PASSPORT_MOBILE_LEVEL_PREFIX,
  PASSPORT_MOBILE_QR_ERROR,
  PASSPORT_MOBILE_QR_LABEL,
  PASSPORT_MOBILE_QR_LOADING,
  PASSPORT_MOBILE_STAT_BADGES,
  PASSPORT_MOBILE_STAT_OFFERS,
  PASSPORT_MOBILE_STAT_USES,
  PASSPORT_MOBILE_STAT_XP,
  PASSPORT_MOBILE_STATUS_ACTIVE,
  buildPassportLevel,
  formatPassportMobileMemberSince,
  formatProfileMobileStatCount,
  resolvePassportMobileLevelNumber,
  resolveProfileMobileLevelXpLabel,
} from "@yunicity/utils";
import { Star } from "lucide-react";
import { useMemo } from "react";

type PassportMobileHeroCardProps = {
  profile: ProfileMe;
  displayName: string;
  overview: PassportOverviewResponse;
  passportMe: PassportMe | null;
  qrPayload: string | null;
  qrLoading: boolean;
  offersCount: number;
};

export function PassportMobileHeroCard({
  profile,
  displayName,
  overview,
  passportMe,
  qrPayload,
  qrLoading,
  offersCount,
}: PassportMobileHeroCardProps) {
  const levelView = useMemo(
    () => (passportMe ? buildPassportLevel(passportMe) : null),
    [passportMe],
  );

  const levelNumber = levelView ? resolvePassportMobileLevelNumber(levelView) : 1;
  const xpLabel = levelView
    ? resolveProfileMobileLevelXpLabel(levelView.points, levelView.nextLevel?.threshold ?? null)
    : `${overview.reputation.total_points} XP`;
  const progressPercent = levelView?.progressPercent ?? 0;

  const memberSince = formatPassportMobileMemberSince(
    passportMe?.activated_at ?? passportMe?.created_at ?? overview.passport.created_at,
  );

  const stats = [
    {
      label: PASSPORT_MOBILE_STAT_XP,
      value: formatProfileMobileStatCount(levelView?.points ?? overview.reputation.total_points),
    },
    {
      label: PASSPORT_MOBILE_STAT_BADGES,
      value: formatProfileMobileStatCount(overview.summary.earned_badges),
    },
    {
      label: PASSPORT_MOBILE_STAT_OFFERS,
      value: formatProfileMobileStatCount(offersCount),
    },
    {
      label: PASSPORT_MOBILE_STAT_USES,
      value: formatProfileMobileStatCount(passportMe?.stats.redemptions_count ?? 0),
    },
  ];

  const avatarUrl = profile.avatar_url?.trim() || null;
  const qrImageSrc = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload)}`
    : null;

  const isActive = overview.passport.status === "active";

  return (
    <section className="overflow-hidden rounded-3xl bg-yunicity-premium p-4 text-yunicity-premium-fg shadow-lg">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-14 w-14 shrink-0 rounded-full border-2 border-yunicity-premium-fg/30 object-cover"
              />
            ) : (
              <ProfileAvatar name={displayName} size="md" />
            )}

            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{displayName}</h2>
              {isActive ? (
                <span className="mt-1 inline-flex rounded-full bg-yunicity-premium-fg/15 px-2.5 py-0.5 text-[11px] font-semibold text-yunicity-premium-accent">
                  {PASSPORT_MOBILE_STATUS_ACTIVE}
                </span>
              ) : null}
              {memberSince ? (
                <p className="mt-1 text-xs text-yunicity-premium-fg/70">{memberSince}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-yunicity-premium-accent">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" aria-hidden />
              {PASSPORT_MOBILE_LEVEL_PREFIX} {levelNumber}
            </div>
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-[11px] text-yunicity-premium-fg/70">
                <span>{xpLabel}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-yunicity-premium-fg/15">
                <div
                  className="h-full rounded-full bg-yunicity-primary transition-[width]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-white p-2">
            {qrLoading ? (
              <span className="text-[10px] text-neutral-500">{PASSPORT_MOBILE_QR_LOADING}</span>
            ) : qrImageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrImageSrc} alt={PASSPORT_MOBILE_QR_LABEL} className="h-full w-full" />
            ) : (
              <span className="px-1 text-center text-[10px] leading-tight text-neutral-500">
                {PASSPORT_MOBILE_QR_ERROR}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium text-yunicity-premium-fg/80">{PASSPORT_MOBILE_QR_LABEL}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-yunicity-premium-fg/10 pt-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-base font-bold tabular-nums">{stat.value}</p>
            <p className="mt-0.5 text-[10px] text-yunicity-premium-fg/65">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

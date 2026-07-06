"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { TribeDetailMemberPreview } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MOBILE_MEMBERS_SEE_ALL,
  TRIBE_DETAIL_MOBILE_MEMBERS_TITLE,
  TRIBE_DETAIL_MOBILE_VIEW_ALL,
} from "@yunicity/utils";

type TribeDetailMobileMembersRailProps = {
  members: TribeDetailMemberPreview[];
  membersTotal: number;
  onViewAll?: () => void;
};

/** Rail membres actifs détail tribu mobile (MOBILE-TRIBE-DETAIL-01). */
export function TribeDetailMobileMembersRail({
  members,
  membersTotal,
  onViewAll,
}: TribeDetailMobileMembersRailProps) {
  if (members.length === 0) return null;

  const overflow = Math.max(0, membersTotal - members.length);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_MOBILE_MEMBERS_TITLE}</h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-semibold text-yunicity-primary"
          >
            {TRIBE_DETAIL_MOBILE_VIEW_ALL} →
          </button>
        ) : null}
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-4">
          {members.map((member) => (
            <li key={member.id} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
              <ProfileAvatar name={member.label} size="lg" />
              <p className="line-clamp-1 w-full text-center text-[11px] font-semibold text-neutral-800">
                {member.label}
              </p>
              {member.roleLabel !== "Membre" ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-yunicity-primary">
                  {member.roleLabel}
                </span>
              ) : null}
            </li>
          ))}
          {overflow > 0 ? (
            <li className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-600">
                +{overflow}
              </span>
              {onViewAll ? (
                <button
                  type="button"
                  onClick={onViewAll}
                  className="text-[11px] font-semibold text-yunicity-primary"
                >
                  {TRIBE_DETAIL_MOBILE_MEMBERS_SEE_ALL}
                </button>
              ) : null}
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

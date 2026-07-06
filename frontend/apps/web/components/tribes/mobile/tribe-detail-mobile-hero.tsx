"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { Tribe, TribeMember } from "@yunicity/types";
import {
  formatTribeDetailMobileMembersLine,
  TRIBE_DETAIL_MOBILE_VISIBILITY_PRIVATE,
  TRIBE_DETAIL_MOBILE_VISIBILITY_PUBLIC,
  resolveTribeHeroImage,
} from "@yunicity/utils";
import { BadgeCheck, Globe, Lock } from "lucide-react";

type TribeDetailMobileHeroProps = {
  tribe: Tribe;
  members: TribeMember[];
  membershipAction: React.ReactNode;
};

/** Hero détail tribu mobile (MOBILE-TRIBE-DETAIL-01). */
export function TribeDetailMobileHero({ tribe, members, membershipAction }: TribeDetailMobileHeroProps) {
  const imageUrl = resolveTribeHeroImage(tribe);
  const membersLine = formatTribeDetailMobileMembersLine(tribe.active_member_count);
  const isPublic = tribe.visibility === "public";

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-900 shadow-sm">
      <div className="relative min-h-[260px]">
        <CulturalImage
          src={imageUrl}
          alt={tribe.name}
          placeName={tribe.name}
          className="absolute inset-0 size-full object-cover"
          sizes="100vw"
          priority
          showFallbackCaption={false}
          overlay={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/50 to-neutral-900/20" />

        <div className="relative flex min-h-[260px] flex-col justify-end p-4">
          <div className="absolute left-4 top-4 h-14 w-14 overflow-hidden rounded-xl border-2 border-white/80 shadow-md">
            <CulturalImage
              src={imageUrl}
              alt=""
              placeName={tribe.name}
              className="size-full"
              sizes="56px"
              showFallbackCaption={false}
              overlay={false}
            />
          </div>

          <div className="pr-28">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-xl font-bold leading-tight text-white">{tribe.name}</h1>
              {tribe.is_featured ? (
                <BadgeCheck className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
              ) : null}
            </div>
            {tribe.description?.trim() ? (
              <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/85">
                {tribe.description.trim()}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2" aria-hidden>
                  {members.slice(0, 4).map((member) => (
                    <ProfileAvatar
                      key={member.user_id}
                      name={member.user_id.slice(0, 2)}
                      size="sm"
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-white/90">{membersLine}</span>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {isPublic ? (
                  <Globe className="h-3 w-3" aria-hidden />
                ) : (
                  <Lock className="h-3 w-3" aria-hidden />
                )}
                {isPublic ? TRIBE_DETAIL_MOBILE_VISIBILITY_PUBLIC : TRIBE_DETAIL_MOBILE_VISIBILITY_PRIVATE}
              </span>
            </div>

            <div className="shrink-0">{membershipAction}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

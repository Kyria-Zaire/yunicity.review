import type { FeedPost, LocalEvent, PassportMe, PassportStamp, ProfileMe, Tribe } from "@yunicity/types";

import {
  PROFILE_EDIT_BIO_MAX_LENGTH,
  PROFILE_EDIT_COMPLETION_AVATAR,
  PROFILE_EDIT_COMPLETION_BANNER,
  PROFILE_EDIT_COMPLETION_BIO,
  PROFILE_EDIT_COMPLETION_CITY,
  PROFILE_EDIT_COMPLETION_INTERESTS,
} from "./profile-edit-portal-labels";
import {
  PROFILE_PORTAL_STAT_MOMENTS,
  PROFILE_PORTAL_STAT_NEIGHBORHOODS,
  PROFILE_PORTAL_STAT_TRIBES,
} from "./profile-portal-labels";
import { buildProfilePortalStats } from "./profile-portal";

export { PROFILE_EDIT_BIO_MAX_LENGTH };

export type ProfileEditCompletionItemId =
  | "avatar"
  | "banner"
  | "bio"
  | "city"
  | "interests";

export type ProfileEditCompletionItem = {
  id: ProfileEditCompletionItemId;
  label: string;
  done: boolean;
};

export type ProfileEditDraft = {
  firstName: string;
  lastName: string;
  bio: string;
  city: string;
  interests: string[];
};

export type ProfileEditPreviewStat = {
  id: "neighborhoods" | "moments" | "tribes";
  label: string;
  valueLabel: string;
};

export type ProfileEditPreviewView = {
  displayName: string;
  username: string;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  stats: ProfileEditPreviewStat[];
  publicProfileHref: string;
};

export function splitDisplayName(displayName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (displayName ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  };
}

export function joinDisplayName(firstName: string, lastName: string): string | null {
  const joined = `${firstName.trim()} ${lastName.trim()}`.trim();
  return joined || null;
}

export function buildProfileEditDraft(profile: ProfileMe): ProfileEditDraft {
  const { firstName, lastName } = splitDisplayName(profile.display_name);
  return {
    firstName,
    lastName,
    bio: profile.bio ?? "",
    city: profile.city ?? "",
    interests: [...profile.interests],
  };
}

export function buildProfileEditCompletion(profile: ProfileMe): {
  percent: number;
  items: ProfileEditCompletionItem[];
} {
  const items: ProfileEditCompletionItem[] = [
    {
      id: "avatar",
      label: PROFILE_EDIT_COMPLETION_AVATAR,
      done: Boolean(profile.avatar_url?.trim()),
    },
    {
      id: "banner",
      label: PROFILE_EDIT_COMPLETION_BANNER,
      done: Boolean(profile.banner_url?.trim()),
    },
    {
      id: "bio",
      label: PROFILE_EDIT_COMPLETION_BIO,
      done: Boolean(profile.bio?.trim()),
    },
    {
      id: "city",
      label: PROFILE_EDIT_COMPLETION_CITY,
      done: Boolean(profile.city?.trim()),
    },
    {
      id: "interests",
      label: PROFILE_EDIT_COMPLETION_INTERESTS,
      done: profile.interests.length > 0,
    },
  ];
  const doneCount = items.filter((item) => item.done).length;
  return {
    percent: Math.round((doneCount / items.length) * 100),
    items,
  };
}

export function buildProfileEditPreview(input: {
  profile: ProfileMe;
  draft: ProfileEditDraft;
  passport: PassportMe | null;
  stamps: PassportStamp[];
  tribes: Tribe[];
  savedEvents: LocalEvent[];
  feedPosts: FeedPost[];
}): ProfileEditPreviewView {
  const displayName =
    joinDisplayName(input.draft.firstName, input.draft.lastName) ??
    input.profile.display_name?.trim() ??
    input.profile.username;

  const stats = buildProfilePortalStats({
    profile: input.profile,
    passport: input.passport,
    stamps: input.stamps,
    tribes: input.tribes,
    savedEvents: input.savedEvents,
    feedPosts: input.feedPosts,
  });

  const statLabels: Record<string, string> = {
    neighborhoods: PROFILE_PORTAL_STAT_NEIGHBORHOODS,
    moments: PROFILE_PORTAL_STAT_MOMENTS,
    tribes: PROFILE_PORTAL_STAT_TRIBES,
  };

  const previewStats: ProfileEditPreviewStat[] = stats
    .filter((stat) => stat.id === "neighborhoods" || stat.id === "moments" || stat.id === "tribes")
    .map((stat) => ({
      id: stat.id as ProfileEditPreviewStat["id"],
      label: statLabels[stat.id] ?? stat.id,
      valueLabel: stat.unavailable ? "—" : stat.valueLabel,
    }));

  return {
    displayName,
    username: input.profile.username,
    bio: input.draft.bio.trim() || null,
    city: input.draft.city.trim() || null,
    avatarUrl: input.profile.avatar_url?.trim() || null,
    bannerUrl: input.profile.banner_url?.trim() || null,
    stats: previewStats,
    publicProfileHref: `/profile/${encodeURIComponent(input.profile.username)}`,
  };
}

export function buildProfileEditSavePayload(
  profile: ProfileMe,
  draft: ProfileEditDraft,
): {
  display_name: string | null;
  bio: string | null;
  city: string | null;
  interests: string[];
} {
  return {
    display_name: joinDisplayName(draft.firstName, draft.lastName),
    bio: draft.bio.trim() || null,
    city: draft.city.trim() || null,
    interests: draft.interests,
  };
}

export function profileEditDraftEquals(a: ProfileEditDraft, b: ProfileEditDraft): boolean {
  return (
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.bio === b.bio &&
    a.city === b.city &&
    a.interests.length === b.interests.length &&
    a.interests.every((item, index) => item === b.interests[index])
  );
}

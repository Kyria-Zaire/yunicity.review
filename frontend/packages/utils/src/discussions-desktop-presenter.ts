import type { DiscussionThread, FeedComment } from "@yunicity/types";

import { formatDiscussionActivityAgo } from "./discussions-portal";

export type DiscussionInboxTab = "all" | "unread" | "requests";

export type DiscussionInboxItem = {
  id: string;
  title: string;
  preview: string;
  timestampLabel: string;
  unreadCount: number;
  avatarUrl: string | null;
  avatarInitial: string;
  thread: DiscussionThread;
};

export type DiscussionChatMessage = {
  id: string;
  body: string;
  authorName: string;
  authorAvatarUrl: string | null;
  createdAt: string;
  timeLabel: string;
  isOwn: boolean;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export function formatDiscussionInboxTimestamp(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (date >= startOfYesterday) {
    return "Hier";
  }
  if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function mapThreadToInboxItem(thread: DiscussionThread, now = new Date()): DiscussionInboxItem {
  const title =
    thread.linked_tribe_name?.trim() ||
    thread.discussion_title?.trim() ||
    thread.author.display_name;
  const preview = thread.excerpt?.trim() || thread.body?.trim() || "Nouvelle discussion";
  const activityAt = thread.last_activity_at ?? thread.created_at;

  return {
    id: thread.id,
    title,
    preview,
    timestampLabel: formatDiscussionInboxTimestamp(activityAt, now),
    unreadCount: thread.comment_count > 0 ? Math.min(thread.comment_count, 99) : 0,
    avatarUrl: thread.author.logo_url,
    avatarInitial: initialsFromName(title),
    thread,
  };
}

export function filterInboxItems(
  items: DiscussionInboxItem[],
  tab: DiscussionInboxTab,
  query: string,
): DiscussionInboxItem[] {
  let filtered = items;

  if (tab === "unread") {
    filtered = filtered.filter((item) => item.unreadCount > 0);
  } else if (tab === "requests") {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return filtered;

  return filtered.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.preview.toLowerCase().includes(normalizedQuery),
  );
}

export function buildDiscussionChatMessages(
  thread: DiscussionThread,
  comments: FeedComment[],
  currentUserId: string | null,
  now = new Date(),
): DiscussionChatMessage[] {
  const openingBody = thread.body?.trim() || thread.excerpt?.trim() || thread.discussion_title;
  const opening: DiscussionChatMessage = {
    id: `post-${thread.id}`,
    body: openingBody,
    authorName: thread.author.display_name,
    authorAvatarUrl: thread.author.logo_url,
    createdAt: thread.created_at,
    timeLabel: formatDiscussionActivityAgo(thread.created_at, now),
    isOwn: currentUserId != null && thread.author.id === currentUserId,
  };

  const commentMessages = comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    authorName: comment.author_display_name,
    authorAvatarUrl: null,
    createdAt: comment.created_at,
    timeLabel: formatDiscussionActivityAgo(comment.created_at, now),
    isOwn: currentUserId != null && comment.user_id === currentUserId,
  }));

  return [opening, ...commentMessages];
}

export function discussionAuthorProfileHref(thread: DiscussionThread): string {
  if (thread.author.username?.trim()) {
    return `/profile/${thread.author.username.trim()}`;
  }
  return `/user/${thread.author.id}`;
}

export function formatDiscussionEventSchedule(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const hour = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${hour}`;
}

/** Largeur du fil : étroite au début, s’élargit avec la conversation. */
export function resolveDiscussionStreamMaxWidth(messages: DiscussionChatMessage[]): string {
  const count = messages.length;
  const longestBody = messages.reduce((max, message) => Math.max(max, message.body.length), 0);

  if (count <= 1) {
    if (longestBody > 140) return "max-w-xl";
    if (longestBody > 72) return "max-w-lg";
    return "max-w-md";
  }
  if (count <= 3) return "max-w-xl";
  if (count <= 6) return "max-w-2xl";
  if (count <= 10) return "max-w-3xl";
  return "max-w-full";
}

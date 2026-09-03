"use client";

import type { DiscussionInboxItem, DiscussionInboxTab } from "@yunicity/utils";
import {
  DISCUSSIONS_DESKTOP_NEW_MESSAGE,
  DISCUSSIONS_DESKTOP_REQUESTS_EMPTY,
  DISCUSSIONS_DESKTOP_SEARCH_PLACEHOLDER,
  DISCUSSIONS_DESKTOP_SUBTITLE,
  DISCUSSIONS_DESKTOP_TAB_ALL,
  DISCUSSIONS_DESKTOP_TAB_REQUESTS,
  DISCUSSIONS_DESKTOP_TAB_UNREAD,
  DISCUSSIONS_DESKTOP_TITLE,
  DISCUSSIONS_DESKTOP_UNREAD_EMPTY,
  DISCUSSIONS_LOADING,
} from "@yunicity/utils";
import { PenSquare, Search } from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";

const TABS: Array<{ id: DiscussionInboxTab; label: string }> = [
  { id: "all", label: DISCUSSIONS_DESKTOP_TAB_ALL },
  { id: "unread", label: DISCUSSIONS_DESKTOP_TAB_UNREAD },
  { id: "requests", label: DISCUSSIONS_DESKTOP_TAB_REQUESTS },
];

type DiscussionsDesktopInboxProps = {
  items: DiscussionInboxItem[];
  activeTab: DiscussionInboxTab;
  selectedId: string | null;
  searchQuery: string;
  isLoading: boolean;
  variant?: "medium" | "desktop" | "mobile";
  highlightSelection?: boolean;
  hideFilterTabs?: boolean;
  searchInputRef?: Ref<HTMLInputElement>;
  onTabChange: (tab: DiscussionInboxTab) => void;
  onSearchChange: (query: string) => void;
  onSelect: (id: string) => void;
};

function InboxAvatar({ item }: { item: DiscussionInboxItem }) {
  const avatarClass =
    "inline-flex h-11 w-11 shrink-0 flex-none items-center justify-center self-start rounded-full";

  if (item.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.avatarUrl} alt="" className={`${avatarClass} object-cover`} />
    );
  }
  return (
    <span className={`${avatarClass} bg-[#EEF0FF] text-sm font-bold text-yunicity-primary`}>
      {item.avatarInitial}
    </span>
  );
}

export function DiscussionsDesktopInbox({
  items,
  activeTab,
  selectedId,
  searchQuery,
  isLoading,
  variant = "desktop",
  highlightSelection = true,
  hideFilterTabs = false,
  searchInputRef,
  onTabChange,
  onSearchChange,
  onSelect,
}: DiscussionsDesktopInboxProps) {
  const compact = variant === "medium" || variant === "mobile";
  const mobile = variant === "mobile";
  const emptyMessage =
    activeTab === "requests"
      ? DISCUSSIONS_DESKTOP_REQUESTS_EMPTY
      : activeTab === "unread"
        ? DISCUSSIONS_DESKTOP_UNREAD_EMPTY
        : null;

  return (
    <aside
      className={`flex min-h-0 flex-col ${
        mobile
          ? "min-h-0 bg-white"
          : `rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${
              compact ? "min-h-[calc(100dvh-5rem)]" : "min-h-[calc(100dvh-7rem)]"
            }`
      }`}
      data-discussions-desktop-inbox=""
      data-discussions-inbox-variant={variant}
    >
      <div
        className={`border-b border-neutral-100 ${mobile ? "px-4 py-4" : compact ? "px-4 py-4" : "px-5 py-5"}`}
      >
        <h1
          className={`font-bold tracking-tight text-neutral-900 ${
            mobile ? "text-2xl" : compact ? "text-xl" : "text-2xl"
          }`}
        >
          {DISCUSSIONS_DESKTOP_TITLE}
        </h1>
        {!compact ? (
          <p className="mt-1 text-sm text-neutral-600">{DISCUSSIONS_DESKTOP_SUBTITLE}</p>
        ) : null}
        <Link
          href="/discussions/new"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] ${
            compact ? "mt-3 px-3 py-2" : "mt-4 px-4 py-2.5"
          }`}
        >
          <PenSquare className="h-4 w-4" aria-hidden />
          {DISCUSSIONS_DESKTOP_NEW_MESSAGE}
        </Link>
      </div>

      <div className={`border-b border-neutral-100 ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={DISCUSSIONS_DESKTOP_SEARCH_PLACEHOLDER}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 py-2.5 pl-10 pr-3 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
          />
        </label>

        {!hideFilterTabs ? (
          <div className={`flex gap-3 border-b border-neutral-100 ${compact ? "mt-2.5" : "mt-3 gap-4"}`}>
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${
                    active
                      ? "border-yunicity-primary text-yunicity-primary"
                      : "border-transparent text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">{DISCUSSIONS_LOADING}</p>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">
            {emptyMessage ?? "Aucune discussion trouvée."}
          </p>
        ) : null}

        <ul className="divide-y divide-neutral-100">
          {items.map((item) => {
            const selected = item.id === selectedId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-start gap-3 text-left transition ${
                    mobile ? "px-4 py-3.5" : compact ? "gap-2.5 px-3 py-3 md:gap-3" : "gap-3 px-4 py-3.5"
                  } ${
                    highlightSelection && selected
                      ? "border-l-4 border-yunicity-primary bg-[#EEF0FF]/50 pl-[calc(1rem-4px)]"
                      : "border-l-4 border-transparent hover:bg-neutral-50"
                  }`}
                >
                  <InboxAvatar item={item} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-bold text-neutral-900">{item.title}</span>
                      <span className="shrink-0 text-[11px] font-medium tabular-nums text-neutral-400">
                        {item.timestampLabel}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm text-neutral-500">{item.preview}</span>
                      {item.unreadCount > 0 ? (
                        <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-yunicity-primary px-1.5 text-[10px] font-bold text-white">
                          {item.unreadCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

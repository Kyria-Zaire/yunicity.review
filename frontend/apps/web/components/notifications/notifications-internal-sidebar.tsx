"use client";

import type { NotificationInboxTab, UserNotificationPreferences } from "@yunicity/types";
import {
  NOTIFICATIONS_MARK_ALL_READ,
  NOTIFICATIONS_PREF_OFFERS_HINT,
  NOTIFICATIONS_PREF_OFFERS_LABEL,
  NOTIFICATIONS_PREF_PASSPORT_HINT,
  NOTIFICATIONS_PREF_PASSPORT_LABEL,
  NOTIFICATIONS_PREF_SOCIAL_HINT,
  NOTIFICATIONS_PREF_SOCIAL_LABEL,
  NOTIFICATIONS_SIDEBAR_ACTIVATE_BODY,
  NOTIFICATIONS_SIDEBAR_ACTIVATE_TITLE,
  NOTIFICATIONS_SIDEBAR_PROFILE_LINK,
  NOTIFICATIONS_SIDEBAR_SECTION_ACCOUNT,
  NOTIFICATIONS_SIDEBAR_SECTION_INBOX,
  NOTIFICATIONS_SIDEBAR_SECTION_LOCAL,
  NOTIFICATIONS_SIDEBAR_SECTION_PREFS,
  NOTIFICATIONS_SIDEBAR_SECTION_SYSTEM,
  NOTIFICATIONS_SIDEBAR_SUBTITLE,
  NOTIFICATIONS_SIDEBAR_TITLE,
  NOTIFICATIONS_TAB_ALL,
  NOTIFICATIONS_TAB_EVENTS,
  NOTIFICATIONS_TAB_MENTIONS,
  NOTIFICATIONS_TAB_PASSPORT,
  NOTIFICATIONS_TAB_SOCIAL,
  NOTIFICATIONS_TAB_SYSTEM,
  NOTIFICATIONS_TAB_UNREAD,
  notificationTabLabel,
} from "@yunicity/utils";
import {
  AtSign,
  Award,
  Bell,
  Calendar,
  CheckCheck,
  MessageCircle,
  Settings2,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type SectionItem = {
  id: NotificationInboxTab;
  label: string;
  icon: LucideIcon;
  unread?: number;
};

type NotificationsInternalSidebarProps = {
  activeTab: NotificationInboxTab;
  unreadCount: number;
  sectionUnread: {
    mentions: number;
    social: number;
    events: number;
    passport: number;
    system: number;
  };
  preferences: UserNotificationPreferences | null;
  isSavingPrefs: boolean;
  onTabChange: (tab: NotificationInboxTab) => void;
  onMarkAllRead: () => void;
  onPreferenceChange: (key: keyof UserNotificationPreferences, value: boolean) => void;
};

function SectionDivider() {
  return <div className="my-5 border-t border-neutral-200/70" role="presentation" />;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 mt-7 first:mt-0 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
      {children}
    </p>
  );
}

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: SectionItem;
  active: boolean;
  onSelect: (id: NotificationInboxTab) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
        active
          ? "bg-yunicity-primary text-white shadow-sm"
          : "text-neutral-700 hover:bg-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.unread != null && item.unread > 0 ? (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
            active ? "bg-white text-yunicity-primary" : "bg-yunicity-primary text-white"
          }`}
        >
          {item.unread > 9 ? "9+" : item.unread}
        </span>
      ) : null}
    </button>
  );
}

function PrefToggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-2 rounded-lg px-1 py-2 hover:bg-white/60">
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-neutral-800">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary"
      />
    </label>
  );
}

export function NotificationsInternalSidebar({
  activeTab,
  unreadCount,
  sectionUnread,
  preferences,
  isSavingPrefs,
  onTabChange,
  onMarkAllRead,
  onPreferenceChange,
}: NotificationsInternalSidebarProps) {
  const inboxItems: SectionItem[] = [
    { id: "all", label: NOTIFICATIONS_TAB_ALL, icon: Bell },
    {
      id: "unread",
      label: NOTIFICATIONS_TAB_UNREAD,
      icon: CheckCheck,
      unread: unreadCount,
    },
    {
      id: "mentions",
      label: NOTIFICATIONS_TAB_MENTIONS,
      icon: AtSign,
      unread: sectionUnread.mentions,
    },
  ];

  const localItems: SectionItem[] = [
    {
      id: "social",
      label: NOTIFICATIONS_TAB_SOCIAL,
      icon: MessageCircle,
      unread: sectionUnread.social,
    },
    {
      id: "events",
      label: NOTIFICATIONS_TAB_EVENTS,
      icon: Calendar,
      unread: sectionUnread.events,
    },
    {
      id: "passport",
      label: NOTIFICATIONS_TAB_PASSPORT,
      icon: Award,
      unread: sectionUnread.passport,
    },
  ];

  const systemItems: SectionItem[] = [
    {
      id: "system",
      label: NOTIFICATIONS_TAB_SYSTEM,
      icon: Sparkles,
      unread: sectionUnread.system,
    },
  ];

  return (
    <aside className="hidden w-60 shrink-0 lg:block xl:w-64">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-yunicity-primary text-white shadow-sm">
            <Bell className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-neutral-900">{NOTIFICATIONS_SIDEBAR_TITLE}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
              {NOTIFICATIONS_SIDEBAR_SUBTITLE}
            </p>
          </div>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            aria-label={NOTIFICATIONS_MARK_ALL_READ}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-yunicity-primary/25 bg-white px-4 py-3 text-xs font-semibold text-yunicity-primary shadow-sm transition hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            {NOTIFICATIONS_MARK_ALL_READ}
          </button>
        ) : null}

        <nav className="mt-6" aria-label="Sections notifications">
          <SectionLabel>{NOTIFICATIONS_SIDEBAR_SECTION_INBOX}</SectionLabel>
          <div className="flex flex-col gap-1">
            {inboxItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onSelect={onTabChange}
              />
            ))}
          </div>

          <SectionDivider />
          <SectionLabel>{NOTIFICATIONS_SIDEBAR_SECTION_LOCAL}</SectionLabel>
          <div className="flex flex-col gap-1">
            {localItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onSelect={onTabChange}
              />
            ))}
          </div>

          <SectionDivider />
          <SectionLabel>{NOTIFICATIONS_SIDEBAR_SECTION_SYSTEM}</SectionLabel>
          <div className="flex flex-col gap-1">
            {systemItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onSelect={onTabChange}
              />
            ))}
          </div>

          <SectionDivider />
          <SectionLabel>{NOTIFICATIONS_SIDEBAR_SECTION_PREFS}</SectionLabel>
          <div
            id="notifications-preferences"
            className="scroll-mt-28 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-3"
          >
            {preferences ? (
              <>
                <PrefToggle
                  label={NOTIFICATIONS_PREF_SOCIAL_LABEL}
                  hint={NOTIFICATIONS_PREF_SOCIAL_HINT}
                  checked={preferences.social}
                  disabled={isSavingPrefs}
                  onChange={(value) => onPreferenceChange("social", value)}
                />
                <PrefToggle
                  label={NOTIFICATIONS_PREF_PASSPORT_LABEL}
                  hint={NOTIFICATIONS_PREF_PASSPORT_HINT}
                  checked={preferences.passport}
                  disabled={isSavingPrefs}
                  onChange={(value) => onPreferenceChange("passport", value)}
                />
                <PrefToggle
                  label={NOTIFICATIONS_PREF_OFFERS_LABEL}
                  hint={NOTIFICATIONS_PREF_OFFERS_HINT}
                  checked={preferences.offers}
                  disabled={isSavingPrefs}
                  onChange={(value) => onPreferenceChange("offers", value)}
                />
              </>
            ) : (
              <p className="px-2 py-2 text-xs text-neutral-500">Préférences indisponibles.</p>
            )}
          </div>

          <SectionDivider />
          <SectionLabel>{NOTIFICATIONS_SIDEBAR_SECTION_ACCOUNT}</SectionLabel>
          <Link
            href="/profile/me"
            className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-neutral-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            <User className="h-4 w-4 shrink-0" aria-hidden />
            {NOTIFICATIONS_SIDEBAR_PROFILE_LINK}
          </Link>
        </nav>

        <div className="mt-8 rounded-2xl bg-[#EEF0FF] p-5">
          <div className="flex items-start gap-2">
            <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {NOTIFICATIONS_SIDEBAR_ACTIVATE_TITLE}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                {NOTIFICATIONS_SIDEBAR_ACTIVATE_BODY}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function notificationActiveHeading(tab: NotificationInboxTab): string {
  return notificationTabLabel(tab);
}

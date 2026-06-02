"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { AuthUser } from "@yunicity/types";
import {
  SETTINGS_RAIL_ACCOUNT,
  SETTINGS_RAIL_CURRENT_DEVICE,
  SETTINGS_RAIL_DELETE,
  SETTINGS_RAIL_DEVICES,
  SETTINGS_RAIL_EXPORT,
  SETTINGS_RAIL_LAST_UPDATE,
  SETTINGS_RAIL_MEMBER_SINCE,
  SETTINGS_RAIL_PUSH_DEVICES,
  SETTINGS_RAIL_SECURITY_BODY,
  SETTINGS_RAIL_SECURITY_LINK,
  SETTINGS_RAIL_SECURITY_TITLE,
  SETTINGS_RAIL_SHORTCUTS,
  SETTINGS_RAIL_STATUS,
  SETTINGS_RAIL_VIEW_DEVICES,
  SETTINGS_SOON,
  settingsSectionDomId,
  type SettingsAccountStatus,
  type SettingsVerificationView,
} from "@yunicity/utils";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Download,
  Laptop,
  Lock,
  Monitor,
  Smartphone,
  Trash2,
} from "lucide-react";

type SettingsRightRailProps = {
  user: AuthUser | null;
  displayName: string;
  verification: SettingsVerificationView;
  accountStatus: SettingsAccountStatus | null;
  onScrollToDevices: () => void;
  onScrollToExport: () => void;
  onScrollToDelete: () => void;
};

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-sm font-medium text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function ShortcutButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof Monitor;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
        disabled
          ? "cursor-not-allowed text-neutral-400"
          : "text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
      <span className="min-w-0 flex-1">{label}</span>
      {disabled ? (
        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          {SETTINGS_SOON}
        </span>
      ) : null}
    </button>
  );
}

export function SettingsRightRail({
  user,
  displayName,
  verification,
  accountStatus,
  onScrollToDevices,
  onScrollToExport,
  onScrollToDelete,
}: SettingsRightRailProps) {
  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
            {SETTINGS_RAIL_ACCOUNT}
          </p>
          <div className="mt-4 flex flex-col items-center text-center">
            <ProfileAvatar name={displayName} size="lg" />
            <p className="mt-3 text-base font-bold text-neutral-900">{displayName}</p>
            <p className="mt-1 truncate text-sm text-neutral-500">{user?.email}</p>
            {verification.verified ? (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yunicity-primary-soft px-3 py-1 text-xs font-semibold text-yunicity-primary">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                {verification.verifiedLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
            {SETTINGS_RAIL_SHORTCUTS}
          </p>
          <div className="mt-2 space-y-0.5">
            <ShortcutButton icon={Monitor} label={SETTINGS_RAIL_DEVICES} onClick={onScrollToDevices} />
            <ShortcutButton
              icon={Download}
              label={SETTINGS_RAIL_EXPORT}
              disabled
              onClick={onScrollToExport}
            />
            <ShortcutButton
              icon={Trash2}
              label={SETTINGS_RAIL_DELETE}
              disabled
              onClick={onScrollToDelete}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-5">
          <Lock className="mx-auto h-8 w-8 text-sky-600" aria-hidden />
          <p className="mt-3 text-center text-sm font-semibold text-neutral-900">
            {SETTINGS_RAIL_SECURITY_TITLE}
          </p>
          <p className="mt-2 text-center text-xs leading-relaxed text-neutral-600">
            {SETTINGS_RAIL_SECURITY_BODY}
          </p>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById(settingsSectionDomId("security"))
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="mt-3 block w-full text-center text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {SETTINGS_RAIL_SECURITY_LINK} →
          </button>
        </div>

        {accountStatus ? (
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
              {SETTINGS_RAIL_STATUS}
            </p>
            <div className="mt-2 divide-y divide-neutral-100">
              <StatusRow
                icon={CalendarDays}
                label={SETTINGS_RAIL_MEMBER_SINCE}
                value={accountStatus.memberSinceLabel}
              />
              <StatusRow
                icon={Clock3}
                label={SETTINGS_RAIL_LAST_UPDATE}
                value={accountStatus.lastUpdateLabel}
              />
              <StatusRow
                icon={Laptop}
                label={SETTINGS_RAIL_CURRENT_DEVICE}
                value={accountStatus.currentDeviceLabel}
              />
              <StatusRow
                icon={Smartphone}
                label={SETTINGS_RAIL_PUSH_DEVICES}
                value={
                  accountStatus.pushDeviceCount > 0
                    ? `${accountStatus.pushDeviceCount} appareil${accountStatus.pushDeviceCount > 1 ? "s" : ""}`
                    : "Aucun"
                }
              />
            </div>
            <button
              type="button"
              onClick={onScrollToDevices}
              className="mt-3 text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {SETTINGS_RAIL_VIEW_DEVICES} →
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

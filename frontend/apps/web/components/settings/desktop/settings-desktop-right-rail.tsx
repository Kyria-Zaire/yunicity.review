"use client";

import type { SettingsAccountStatus } from "@yunicity/utils";
import {
  SETTINGS_DESKTOP_ACTIVE_SESSIONS,
  SETTINGS_DESKTOP_CURRENT_SESSION,
  SETTINGS_DESKTOP_HELP_CENTER,
  SETTINGS_DESKTOP_HELP_CONTACT,
  SETTINGS_DESKTOP_HELP_REPORT,
  SETTINGS_DESKTOP_MANAGE_SECURITY,
  SETTINGS_DESKTOP_OPEN_HELP,
  SETTINGS_DESKTOP_PASSWORD,
  SETTINGS_DESKTOP_PASSWORD_EDIT,
  SETTINGS_DESKTOP_PRIVACY_POLICY,
  SETTINGS_DESKTOP_RAIL_ABOUT,
  SETTINGS_DESKTOP_RAIL_HELP,
  SETTINGS_DESKTOP_RAIL_SECURITY,
  SETTINGS_DESKTOP_RAIL_SHORTCUTS,
  SETTINGS_DESKTOP_SHORTCUT_BLOCKED,
  SETTINGS_DESKTOP_SHORTCUT_EDIT_PROFILE,
  SETTINGS_DESKTOP_SHORTCUT_EXPORT,
  SETTINGS_DESKTOP_SHORTCUT_NOTIFICATIONS,
  SETTINGS_DESKTOP_SOON,
  SETTINGS_DESKTOP_TERMS,
  SETTINGS_DESKTOP_THIS_DEVICE,
  SETTINGS_DESKTOP_VERSION,
  formatSettingsDesktopSessionLabel,
  settingsDesktopScrollToSection,
  settingsDesktopSectionDomId,
} from "@yunicity/utils";
import {
  Ban,
  Bell,
  ChevronRight,
  Download,
  ExternalLink,
  HelpCircle,
  LifeBuoy,
  Lock,
  MessageSquareWarning,
  Monitor,
  Pencil,
  Shield,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type SettingsDesktopRightRailProps = {
  accountStatus: SettingsAccountStatus | null;
  variant?: "desktop" | "medium";
  sectionDomId?: (sectionId: string) => string;
  onScrollToSection?: (sectionId: string) => void;
  notificationsShortcutLabel?: string;
};

function RailCard({
  id,
  title,
  titleIcon,
  children,
}: {
  id?: string;
  title: string;
  titleIcon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
        {titleIcon}
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ShortcutRow({
  icon: Icon,
  label,
  href,
  disabled,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const className =
    "flex w-full items-center gap-2.5 rounded-xl px-1 py-2.5 text-left text-sm text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50";

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
      <span className="min-w-0 flex-1 font-medium">{label}</span>
      {disabled ? (
        <span className="text-[10px] font-bold uppercase text-neutral-400">{SETTINGS_DESKTOP_SOON}</span>
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function SettingsDesktopRightRail({
  accountStatus,
  variant = "desktop",
  sectionDomId = settingsDesktopSectionDomId,
  onScrollToSection = settingsDesktopScrollToSection,
  notificationsShortcutLabel = SETTINGS_DESKTOP_SHORTCUT_NOTIFICATIONS,
}: SettingsDesktopRightRailProps) {
  const isMedium = variant === "medium";
  const sessionLabel = accountStatus
    ? formatSettingsDesktopSessionLabel(accountStatus.currentDeviceLabel)
    : "Navigateur web";

  return (
    <aside
      className={`flex w-full min-w-0 flex-col gap-4 ${
        isMedium ? "md:sticky md:top-24 md:pb-4" : "lg:sticky lg:top-24 lg:pb-4"
      }`}
      aria-label="Sécurité et raccourcis"
      data-settings-desktop-right-rail=""
      data-settings-rail-variant={variant}
    >
      <RailCard
        id={sectionDomId("security")}
        title={SETTINGS_DESKTOP_RAIL_SECURITY}
        titleIcon={
          isMedium ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-yunicity-primary">
              <Shield className="h-4 w-4" aria-hidden />
            </span>
          ) : undefined
        }
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <Lock className="h-4 w-4 text-neutral-400" aria-hidden />
            {SETTINGS_DESKTOP_PASSWORD}
          </div>
          <button
            type="button"
            disabled
            title={SETTINGS_DESKTOP_SOON}
            className="text-sm font-semibold text-yunicity-primary/50"
          >
            {SETTINGS_DESKTOP_PASSWORD_EDIT}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {SETTINGS_DESKTOP_ACTIVE_SESSIONS}
          </p>
          <div className="mt-2 flex items-start gap-2">
            {isMedium ? (
              <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            ) : (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900">
                {SETTINGS_DESKTOP_THIS_DEVICE} · {sessionLabel}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                {isMedium ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                ) : null}
                {SETTINGS_DESKTOP_CURRENT_SESSION}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onScrollToSection("security")}
          className="mt-4 inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {SETTINGS_DESKTOP_MANAGE_SECURITY}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </RailCard>

      <RailCard title={SETTINGS_DESKTOP_RAIL_SHORTCUTS}>
        <div className="divide-y divide-neutral-100">
          <ShortcutRow
            icon={Pencil}
            label={SETTINGS_DESKTOP_SHORTCUT_EDIT_PROFILE}
            href="/profile/me/edit"
          />
          <ShortcutRow
            icon={Bell}
            label={notificationsShortcutLabel}
            onClick={() => onScrollToSection("notifications")}
          />
          <ShortcutRow icon={Ban} label={SETTINGS_DESKTOP_SHORTCUT_BLOCKED} disabled />
          <ShortcutRow icon={Download} label={SETTINGS_DESKTOP_SHORTCUT_EXPORT} disabled />
        </div>
      </RailCard>

      <RailCard id={sectionDomId("help")} title={SETTINGS_DESKTOP_RAIL_HELP}>
        <div className="space-y-1">
          <ShortcutRow
            icon={HelpCircle}
            label={SETTINGS_DESKTOP_HELP_CENTER}
            href="/organizations/request"
          />
          <ShortcutRow icon={MessageSquareWarning} label={SETTINGS_DESKTOP_HELP_REPORT} disabled />
          <ShortcutRow icon={LifeBuoy} label={SETTINGS_DESKTOP_HELP_CONTACT} disabled />
        </div>
        <Link
          href="/organizations/request"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          {SETTINGS_DESKTOP_OPEN_HELP}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </RailCard>

      <RailCard title={SETTINGS_DESKTOP_RAIL_ABOUT}>
        <div className="space-y-2">
          <p className="flex items-center justify-between text-sm text-yunicity-primary">
            <span>{SETTINGS_DESKTOP_TERMS}</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </p>
          <p className="flex items-center justify-between text-sm text-yunicity-primary">
            <span>{SETTINGS_DESKTOP_PRIVACY_POLICY}</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </p>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          {SETTINGS_DESKTOP_VERSION} · v0.0.0
        </p>
      </RailCard>
    </aside>
  );
}

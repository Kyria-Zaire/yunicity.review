"use client";

import { SettingsDesktopScreen } from "@/components/settings/desktop";
import { SettingsMediumScreen } from "@/components/settings/medium";
import { SettingsAppShell } from "@/components/settings/settings-app-shell";
import { SettingsMobileView } from "@/components/settings/mobile";
import { useSettingsPageContext } from "@/hooks/use-settings-page-context";
import { useAuth } from "@/lib/auth/auth-provider";
import { SETTINGS_ERROR, SETTINGS_LOADING, SETTINGS_RETRY } from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function SettingsScreen() {
  const ctx = useSettingsPageContext();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  if (ctx.loading) {
    return (
      <SettingsAppShell>
        <p
          className="web-mobile-settings-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {SETTINGS_LOADING}
        </p>
        <p
          className="web-medium-settings-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {SETTINGS_LOADING}
        </p>
        <p
          className="web-desktop-settings-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {SETTINGS_LOADING}
        </p>
      </SettingsAppShell>
    );
  }

  if (ctx.error || !ctx.profile) {
    return (
      <SettingsAppShell>
        <div className="web-mobile-settings-only mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm text-red-800">{SETTINGS_ERROR}</p>
            <button
              type="button"
              onClick={() => void ctx.reload()}
              className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {SETTINGS_RETRY}
            </button>
          </div>
        </div>
        <div className="web-medium-settings-only mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm text-red-800">{SETTINGS_ERROR}</p>
          <button
            type="button"
            onClick={() => void ctx.reload()}
            className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {SETTINGS_RETRY}
          </button>
        </div>
        <div className="web-desktop-settings-only mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm text-red-800">{SETTINGS_ERROR}</p>
          <button
            type="button"
            onClick={() => void ctx.reload()}
            className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {SETTINGS_RETRY}
          </button>
        </div>
      </SettingsAppShell>
    );
  }

  return (
    <SettingsAppShell>
      <SettingsMobileView
        user={ctx.user}
        profile={ctx.profile}
        preferences={ctx.preferences}
        pushDevices={ctx.pushDevices}
        hubGroups={ctx.hubGroups}
        displayName={ctx.displayName}
        verification={ctx.verification}
        accountStatus={ctx.accountStatus}
        isSavingProfile={ctx.isSavingProfile}
        isSavingPrefs={ctx.isSavingPrefs}
        removingDeviceId={ctx.removingDeviceId}
        onSaveProfile={ctx.updateProfile}
        onPreferenceChange={(key, value) => void ctx.updatePreference(key, value)}
        onRemoveDevice={(deviceId) => void ctx.removePushDevice(deviceId)}
        onLogout={() => void handleLogout()}
      />
      <div className="web-medium-settings-only">
        <SettingsMediumScreen
          user={ctx.user}
          profile={ctx.profile}
          displayName={ctx.displayName}
          preferences={ctx.preferences}
          accountStatus={ctx.accountStatus}
          isSavingProfile={ctx.isSavingProfile}
          isSavingPrefs={ctx.isSavingPrefs}
          onSaveProfile={ctx.updateProfile}
          onPreferenceChange={(key, value) => void ctx.updatePreference(key, value)}
          onLogout={() => void handleLogout()}
        />
      </div>
      <div className="web-desktop-settings-only">
        <SettingsDesktopScreen
          user={ctx.user}
          profile={ctx.profile}
          displayName={ctx.displayName}
          preferences={ctx.preferences}
          accountStatus={ctx.accountStatus}
          isSavingProfile={ctx.isSavingProfile}
          isSavingPrefs={ctx.isSavingPrefs}
          onSaveProfile={ctx.updateProfile}
          onPreferenceChange={(key, value) => void ctx.updatePreference(key, value)}
          onLogout={() => void handleLogout()}
        />
      </div>
    </SettingsAppShell>
  );
}

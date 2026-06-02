"use client";

import { SettingsAppShell } from "@/components/settings/settings-app-shell";
import { SettingsHubRows, scrollToSettingsSection } from "@/components/settings/settings-hub-rows";
import { SettingsInternalSidebar } from "@/components/settings/settings-internal-sidebar";
import { SettingsRightRail } from "@/components/settings/settings-right-rail";
import { SettingsSections } from "@/components/settings/settings-sections";
import { useSettingsPageContext } from "@/hooks/use-settings-page-context";
import { useAuth } from "@/lib/auth/auth-provider";
import { SETTINGS_ERROR, SETTINGS_LOADING, SETTINGS_RETRY } from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function SettingsScreen() {
  const ctx = useSettingsPageContext();
  const { logout } = useAuth();
  const router = useRouter();

  const scrollToHelp = useCallback(() => {
    scrollToSettingsSection("help");
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);

  if (ctx.loading) {
    return (
      <SettingsAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {SETTINGS_LOADING}
        </p>
      </SettingsAppShell>
    );
  }

  if (ctx.error || !ctx.profile) {
    return (
      <SettingsAppShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
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
      <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 lg:px-6">
        <div className="grid gap-8 xl:grid-cols-[16rem_minmax(0,1fr)_18rem]">
          <SettingsInternalSidebar
            unreadCount={ctx.unreadNotifications}
            onScrollToHelp={scrollToHelp}
          />

          <div className="min-w-0">
            <SettingsHubRows
              groups={ctx.hubGroups}
              onNavigate={scrollToSettingsSection}
              onLogout={() => void handleLogout()}
            />

            <SettingsSections
              user={ctx.user}
              profile={ctx.profile}
              preferences={ctx.preferences}
              pushDevices={ctx.pushDevices}
              verification={ctx.verification}
              isSavingProfile={ctx.isSavingProfile}
              isSavingPrefs={ctx.isSavingPrefs}
              removingDeviceId={ctx.removingDeviceId}
              onSaveProfile={ctx.updateProfile}
              onPreferenceChange={(key, value) => void ctx.updatePreference(key, value)}
              onRemoveDevice={(deviceId) => void ctx.removePushDevice(deviceId)}
            />
          </div>

          <SettingsRightRail
            user={ctx.user}
            displayName={ctx.displayName}
            verification={ctx.verification}
            accountStatus={ctx.accountStatus}
            onScrollToDevices={() => scrollToSettingsSection("devices")}
            onScrollToExport={() => scrollToSettingsSection("export")}
            onScrollToDelete={() => scrollToSettingsSection("delete")}
          />
        </div>
      </div>
    </SettingsAppShell>
  );
}

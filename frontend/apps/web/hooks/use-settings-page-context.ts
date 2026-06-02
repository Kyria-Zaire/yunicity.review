"use client";

import type {
  ProfileMe,
  PushSubscription,
  UserNotificationPreferences,
} from "@yunicity/types";
import {
  buildSettingsAccountStatus,
  buildSettingsDisplayName,
  buildSettingsHubGroups,
  buildSettingsVerificationView,
  detectWebClientLabel,
  type SettingsAccountStatus,
  type SettingsHubGroup,
  type SettingsVerificationView,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useNotificationUnread } from "@/hooks/use-notification-unread";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export function useSettingsPageContext() {
  const api = useYunicityApi();
  const { user, refreshUser } = useAuth();
  const unreadNotifications = useNotificationUnread();

  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [pushDevices, setPushDevices] = useState<PushSubscription[]>([]);
  const [webClientLabel, setWebClientLabel] = useState("Navigateur web");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  const hubGroups: SettingsHubGroup[] = useMemo(() => buildSettingsHubGroups(), []);

  const displayName = useMemo(
    () => buildSettingsDisplayName(profile, user),
    [profile, user],
  );

  const verification = useMemo<SettingsVerificationView>(
    () => buildSettingsVerificationView(user, profile),
    [profile, user],
  );

  const accountStatus = useMemo<SettingsAccountStatus | null>(
    () => buildSettingsAccountStatus(user, pushDevices, webClientLabel),
    [pushDevices, user, webClientLabel],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshUser();
      const [profileData, prefsData, devicesData] = await Promise.all([
        api.getProfileMe(),
        api.notifications.getNotificationPreferences(),
        api.listMyPushSubscriptions(),
      ]);
      setProfile(profileData);
      setPreferences(prefsData);
      setPushDevices(devicesData.items);
    } catch {
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  }, [api, refreshUser]);

  useEffect(() => {
    setWebClientLabel(detectWebClientLabel(navigator.userAgent));
    void reload();
  }, [reload]);

  const updateProfile = useCallback(
    async (payload: Parameters<typeof api.updateProfileMe>[0]) => {
      setIsSavingProfile(true);
      try {
        const updated = await api.updateProfileMe(payload);
        setProfile(updated);
        return updated;
      } finally {
        setIsSavingProfile(false);
      }
    },
    [api],
  );

  const updatePreference = useCallback(
    async (key: keyof UserNotificationPreferences, value: boolean) => {
      if (!preferences) return;
      setIsSavingPrefs(true);
      const previous = preferences;
      setPreferences({ ...preferences, [key]: value });
      try {
        const updated = await api.notifications.updateNotificationPreferences({ [key]: value });
        setPreferences(updated);
      } catch {
        setPreferences(previous);
      } finally {
        setIsSavingPrefs(false);
      }
    },
    [api, preferences],
  );

  const removePushDevice = useCallback(
    async (deviceId: string) => {
      setRemovingDeviceId(deviceId);
      try {
        await api.deletePushSubscription(deviceId);
        setPushDevices((items) => items.filter((device) => device.id !== deviceId));
      } finally {
        setRemovingDeviceId(null);
      }
    },
    [api],
  );

  return {
    user,
    profile,
    setProfile,
    preferences,
    pushDevices,
    hubGroups,
    displayName,
    verification,
    accountStatus,
    unreadNotifications,
    loading,
    error,
    isSavingProfile,
    isSavingPrefs,
    removingDeviceId,
    reload,
    updateProfile,
    updatePreference,
    removePushDevice,
  };
}

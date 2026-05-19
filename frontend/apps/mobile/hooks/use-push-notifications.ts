import { useAuth } from "@/lib/auth-provider";
import {
  fetchExpoPushToken,
  getDeviceMetadata,
  getNotificationPermission,
  getPushPlatform,
  requestNotificationPermission,
  type PushPermissionState,
} from "@/lib/notifications";
import type { PushSubscription } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

export type PushUiStatus =
  | "loading"
  | "disabled"
  | "enabled"
  | "denied"
  | "error";

export function usePushNotifications(enabled: boolean) {
  const { yunicityApi } = useAuth();
  const router = useRouter();
  const [permission, setPermission] = useState<PushPermissionState>("undetermined");
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [status, setStatus] = useState<PushUiStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setStatus("disabled");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const perm = await getNotificationPermission();
      setPermission(perm);
      const list = await yunicityApi.listMyPushSubscriptions();
      setSubscriptions(list.items);
      const hasActive = list.items.some((item) => item.is_active);
      if (perm === "denied") {
        setStatus("denied");
      } else if (hasActive && perm === "granted") {
        setStatus("enabled");
      } else {
        setStatus("disabled");
      }
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger les notifications.");
      setStatus("error");
    }
  }, [enabled, yunicityApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const received = Notifications.addNotificationReceivedListener(() => {
      void reload();
    });
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const data = event.notification.request.content.data;
      if (data && typeof data === "object" && "type" in data) {
        router.push("/(protected)/(tabs)/passport");
      }
    });
    return () => {
      received.remove();
      response.remove();
    };
  }, [enabled, reload, router]);

  const activate = useCallback(async () => {
    setIsRegistering(true);
    setError(null);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      const token = await fetchExpoPushToken();
      const meta = getDeviceMetadata();
      await yunicityApi.registerPushDevice({
        expo_push_token: token,
        platform: getPushPlatform(),
        device_name: meta.device_name,
        app_version: meta.app_version,
      });
      await reload();
    } catch (err) {
      setError(
        isAuthError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Activation impossible.",
      );
      setStatus("error");
    } finally {
      setIsRegistering(false);
    }
  }, [reload, yunicityApi]);

  const deactivate = useCallback(async () => {
    setIsRegistering(true);
    setError(null);
    try {
      const active = subscriptions.filter((item) => item.is_active);
      await Promise.all(
        active.map((item) => yunicityApi.deletePushSubscription(item.id)),
      );
      await reload();
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Désactivation impossible.");
      setStatus("error");
    } finally {
      setIsRegistering(false);
    }
  }, [reload, subscriptions, yunicityApi]);

  return {
    status,
    permission,
    subscriptions,
    error,
    isRegistering,
    activate,
    deactivate,
    reload,
  };
}

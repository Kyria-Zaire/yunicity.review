import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { PushPlatform } from "@yunicity/types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushPermissionState = "undetermined" | "granted" | "denied";

export function getPushPlatform(): PushPlatform {
  return Platform.OS === "ios" ? "ios" : "android";
}

export async function getNotificationPermission(): Promise<PushPermissionState> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    return "granted";
  }
  if (settings.ios?.status === Notifications.IosAuthorizationStatus.DENIED) {
    return "denied";
  }
  if (settings.status === "denied") {
    return "denied";
  }
  return "undetermined";
}

export async function requestNotificationPermission(): Promise<PushPermissionState> {
  if (!Device.isDevice) {
    return "denied";
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return "granted";
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ? "granted" : "denied";
}

export async function fetchExpoPushToken(): Promise<string> {
  if (!Device.isDevice) {
    throw new Error("Les notifications push nécessitent un appareil physique.");
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const response = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  const token = response.data?.trim();
  if (!token) {
    throw new Error("Impossible de récupérer le token Expo Push.");
  }
  return token;
}

export function getDeviceMetadata(): { device_name: string | null; app_version: string | null } {
  const appVersion = Constants.expoConfig?.version ?? null;
  const deviceName =
    Device.deviceName ??
    Device.modelName ??
    (Platform.OS === "ios" ? "iPhone" : "Android");
  return {
    device_name: deviceName,
    app_version: appVersion,
  };
}

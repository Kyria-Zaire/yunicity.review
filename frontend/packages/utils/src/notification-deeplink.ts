/**
 * Map API notification deeplinks to platform routes (TICKET-506).
 * Backend paths: /feed, /passport, /events, /events/{id}, /feed?post=…
 */

export type NotificationPlatform = "web" | "mobile";

const MOBILE_ROUTE_BY_PREFIX: ReadonlyArray<{ prefix: string; route: string }> = [
  { prefix: "/passport", route: "/(protected)/(tabs)/passport" },
  { prefix: "/events", route: "/(protected)/(tabs)/events" },
  { prefix: "/feed", route: "/(protected)/(tabs)/feed" },
];

/**
 * Resolve a notification deeplink for navigation.
 * Falls back to feed when missing or unknown.
 */
export function resolveNotificationDeeplink(
  deeplink: string | null | undefined,
  platform: NotificationPlatform,
): string {
  const raw = deeplink?.trim();
  if (!raw || !raw.startsWith("/")) {
    return platform === "web" ? "/feed" : "/(protected)/(tabs)/feed";
  }

  const pathOnly = raw.split("?")[0] ?? raw;

  if (platform === "web") {
    return raw;
  }

  const eventDetail = /^\/events\/([0-9a-f-]{36})$/i.exec(pathOnly);
  if (eventDetail) {
    return `/(protected)/events/${eventDetail[1]}`;
  }

  for (const { prefix, route } of MOBILE_ROUTE_BY_PREFIX) {
    if (pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)) {
      return route;
    }
  }

  return "/(protected)/(tabs)/feed";
}

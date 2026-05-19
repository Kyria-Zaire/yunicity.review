"use client";

import { WebAppShell } from "@/components/layout";
import { NotificationsInbox } from "@/components/notifications/notifications-inbox";

export default function NotificationsPage() {
  return (
    <WebAppShell
      header={{
        title: "Notifications",
        subtitle: "Activité locale sur vos publications",
      }}
      contentWidth="readable"
    >
      <NotificationsInbox />
    </WebAppShell>
  );
}

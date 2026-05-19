"use client";

import type { UserNotificationItem } from "@yunicity/types";
import {
  formatNotificationMessage,
  formatNotificationRelativeTime,
} from "@yunicity/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function NotificationRow({
  item,
  onRead,
}: {
  item: UserNotificationItem;
  onRead: (id: string) => void;
}) {
  const message = formatNotificationMessage(item.type, item.actor_name, item.payload);
  const time = formatNotificationRelativeTime(item.created_at);
  const href = item.deeplink?.startsWith("/") ? item.deeplink : "/feed";

  return (
    <Link
      href={href}
      onClick={() => {
        if (!item.is_read) {
          onRead(item.id);
        }
      }}
      className={`block rounded-xl border px-4 py-3 transition-colors ${
        item.is_read
          ? "border-neutral-200 bg-white"
          : "border-yunicity-primary/20 bg-yunicity-primary-soft/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-xs font-semibold text-yunicity-primary"
          aria-hidden
        >
          {(item.actor_name ?? "Y").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-800">{message}</p>
          <p className="mt-1 text-xs text-neutral-500">{time}</p>
        </div>
        {!item.is_read ? (
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yunicity-primary"
            aria-label="Non lu"
          />
        ) : null}
      </div>
    </Link>
  );
}

export function NotificationsInbox() {
  const { yunicityApi } = useAuth();
  const [items, setItems] = useState<UserNotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await yunicityApi.notifications.listInbox(50);
      setItems(data.items);
      setUnread(data.unread_count);
    } catch {
      setError("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }, [yunicityApi]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    try {
      await yunicityApi.notifications.markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      /* best effort */
    }
  }

  async function markAll() {
    try {
      await yunicityApi.notifications.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      /* best effort */
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Chargement…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {unread > 0 ? (
        <button
          type="button"
          onClick={() => void markAll()}
          className="text-sm font-medium text-yunicity-primary underline-offset-2 hover:underline"
        >
          Tout marquer comme lu
        </button>
      ) : null}
      {items.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          Aucune notification pour l&apos;instant. Vos interactions locales apparaîtront ici.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationRow item={item} onRead={(id) => void markRead(id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

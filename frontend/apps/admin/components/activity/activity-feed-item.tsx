import type { AdminActivityFeedItem } from "@yunicity/types";
import Link from "next/link";

import { ActivitySeverityBadge } from "@/components/activity/activity-severity-badge";
import {
  activityFeedSeverityLabel,
  formatActivityRelativeTime,
} from "@/lib/activity-display";

interface ActivityFeedItemProps {
  item: AdminActivityFeedItem;
}

export function ActivityFeedItemRow({ item }: ActivityFeedItemProps) {
  return (
    <li className="relative pl-6">
      <span
        className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-yunicity-primary/70"
        aria-hidden
      />
      <div className="rounded-xl border border-stone-100 bg-white px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={item.href} className="text-sm font-medium text-stone-900 hover:underline">
              {item.title}
            </Link>
            <p className="mt-1 text-sm text-stone-600">{item.description}</p>
            <p className="mt-2 text-xs text-stone-500">
              {item.actor_label} · {formatActivityRelativeTime(item.created_at)}
            </p>
          </div>
          <ActivitySeverityBadge
            variant="feed"
            severity={item.severity}
            label={activityFeedSeverityLabel(item.severity)}
          />
        </div>
      </div>
    </li>
  );
}

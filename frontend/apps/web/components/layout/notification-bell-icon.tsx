type NotificationBellIconProps = {
  unreadCount?: number;
  className?: string;
  iconClassName?: string;
  withTestMarkers?: boolean;
};

/**
 * Cloche outline + pastille non lue (maquette feed desktop).
 * Le compteur exact reste dans le nom accessible du lien parent.
 */
export function NotificationBellIcon({
  unreadCount = 0,
  className = "relative inline-flex shrink-0",
  iconClassName = "h-5 w-5 shrink-0 text-neutral-900",
  withTestMarkers = false,
}: NotificationBellIconProps) {
  const showBadge = unreadCount > 0;

  return (
    <span
      data-notification-icon-wrap={withTestMarkers ? "" : undefined}
      className={className}
    >
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </svg>
      {showBadge ? (
        <span
          data-notification-badge={withTestMarkers ? "" : undefined}
          aria-hidden="true"
          className="absolute right-0 top-0 h-2 w-2 -translate-y-px translate-x-px rounded-full bg-[#FF2D78] ring-2 ring-white"
        />
      ) : null}
    </span>
  );
}

export function notificationAriaLabel(label: string, unreadCount: number): string {
  if (unreadCount <= 0) return label;
  return `${label}, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`;
}

import type { WebNavIconId } from "@/lib/layout/web-layout-config";
import type { ReactElement, ReactNode } from "react";

type IconProps = { className?: string };

function IconBase({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className ?? "h-5 w-5 shrink-0"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Icônes nav — distinctes, sobres (WEB-HOME-01B). */
const ICONS: Record<WebNavIconId, (props: IconProps) => ReactElement> = {
  feed: (p) => (
    <IconBase {...p}>
      <path d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-8.5z" />
    </IconBase>
  ),
  map: (p) => (
    <IconBase {...p}>
      <path d="M12 21s6-4.35 6-10a6 6 0 10-12 0c0 5.65 6 10 6 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </IconBase>
  ),
  search: (p) => (
    <IconBase {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </IconBase>
  ),
  events: (p) => (
    <IconBase {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18M8 15h4" />
    </IconBase>
  ),
  sortir: (p) => (
    <IconBase {...p}>
      <path d="M12 3a6 6 0 109 9 9 9 0 01-9-9z" />
      <path d="M18 4l.8 1.6L20.5 6l-1.7.8L18 8.5l-.8-1.7L15.5 6l1.7-.8L18 4z" />
      <path d="M5 16l.6 1.2L6.8 18l-1.2.6L5 19.8l-.6-1.2L3.2 18l1.2-.6L5 16z" />
    </IconBase>
  ),
  neighborhoods: (p) => (
    <IconBase {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconBase>
  ),
  tribes: (p) => (
    <IconBase {...p}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5M14 19c0-2 1.8-3.5 4-3.5" />
    </IconBase>
  ),
  passport: (p) => (
    <IconBase {...p}>
      <path d="M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <path d="M9 10l2 2 4-4" />
      <path d="M8 16h8" />
    </IconBase>
  ),
  notifications: (p) => (
    <IconBase {...p}>
      <path d="M12 3a4.5 4.5 0 00-4.5 4.5V11l-2 2v1h13v-1l-2-2V7.5A4.5 4.5 0 0012 3z" />
      <path d="M9.5 18a2.5 2.5 0 005 0" />
    </IconBase>
  ),
  profile: (p) => (
    <IconBase {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0114 0" />
    </IconBase>
  ),
  settings: (p) => (
    <IconBase {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </IconBase>
  ),
  organizations: (p) => (
    <IconBase {...p}>
      <path d="M4 21V9l8-5 8 5v12" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 11h1M14 11h1" />
    </IconBase>
  ),
  place: (p) => (
    <IconBase {...p}>
      <path d="M4 7h16l-1.5-3H5.5L4 7z" />
      <path d="M5 7v12" />
      <path d="M19 7v12" />
      <path d="M5 19h14" />
      <path d="M8 12h8" />
      <path d="M9 19v-5a3 3 0 016 0v5" />
    </IconBase>
  ),
  proposePlace: (p) => (
    <IconBase {...p}>
      <path d="M12 21s-5.5-4.5-5.5-9.5a5.5 5.5 0 019.2-3.9" />
      <circle cx="12" cy="10.5" r="2" />
      <path d="M19 4v5M16.5 6.5H21.5" />
    </IconBase>
  ),
  publish: (p) => (
    <IconBase {...p}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  ),
};

export function WebNavIcon({ id, className }: { id: WebNavIconId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={className} />;
}

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
  videos: (p) => (
    <IconBase {...p}>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M11 10v4l4-2-4-2z" />
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
      <path d="M8 4h8" />
      <path d="M8 4L6.5 11.5c0 2.5 2.5 4.5 5.5 4.5s5.5-2 5.5-4.5L16 4" />
      <path d="M7.5 11.2c1.4.9 2.9.9 4.5 0" />
      <path d="M12 16v4" />
      <path d="M9.5 20h5" />
    </IconBase>
  ),
  neighborhoods: (p) => (
    <IconBase {...p}>
      <path d="M2 21h20" />
      <path d="M3 21V15" />
      <path d="M3 15h6" />
      <path d="M6 10.5L3 15h6L6 10.5z" />
      <path d="M11 21V12" />
      <path d="M11 12h9" />
      <path d="M15.5 5.5L11 12h9l-4.5-6.5z" />
      <path d="M14.5 15h3v6" />
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
      <path d="M4 8l2-3.5h12L20 8" />
      <path d="M5 8v11" />
      <path d="M19 8v11" />
      <path d="M5 19h14" />
      <path d="M9 13h6" />
      <path d="M10 19v-4h4v4" />
      <path d="M16.5 4.5l.65 1.32 1.46.21-1.06 1.03.25 1.45-1.3-.68-1.3.68.25-1.45-1.06-1.03 1.46-.21L16.5 4.5z" />
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

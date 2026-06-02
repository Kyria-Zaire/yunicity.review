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
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
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
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
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

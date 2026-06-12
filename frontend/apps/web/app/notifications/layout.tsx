import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Notifications",
  description: "Vos notifications Yunicity.",
  path: "/notifications",
  noIndex: true,
});

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return children;
}

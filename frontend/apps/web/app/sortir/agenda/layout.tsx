import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "Mon agenda",
  description:
    "Retrouvez les sorties que vous avez enregistrées à Reims — aujourd’hui, cette semaine et plus tard.",
  path: "/sortir/agenda",
});

export default function MyAgendaLayout({ children }: { children: ReactNode }) {
  return children;
}

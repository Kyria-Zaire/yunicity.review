import type { ReactNode } from "react";

import { WebSidebar } from "@/components/layout/web-sidebar";

/** Layout legacy — même grille 3 colonnes que WebAppShell. */
export function WebDesktopLayout({
  sidebar,
  main,
  context,
}: {
  sidebar?: ReactNode;
  main: ReactNode;
  context?: ReactNode;
}) {
  const gridClass = context ? "web-three-col web-three-col--with-rail" : "web-three-col";

  return (
    <div className={gridClass}>
      {sidebar ?? <WebSidebar />}
      {main}
      {context ?? null}
    </div>
  );
}

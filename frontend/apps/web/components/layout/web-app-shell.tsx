"use client";

import { WebContentColumn } from "@/components/layout/web-content-column";
import { WebContextRail, WebContextStack } from "@/components/layout/web-context-rail";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebPageHeader, type WebPageHeaderProps } from "@/components/layout/web-page-header";
import { WebSidebar } from "@/components/layout/web-sidebar";
import type { WebContentWidth } from "@/lib/layout/web-layout-config";
import type { ReactNode } from "react";

export type WebAppShellProps = {
  children: ReactNode;
  header?: WebPageHeaderProps;
  context?: ReactNode;
  contentWidth?: WebContentWidth;
};

/**
 * WEB-HOME-01C — Grille 3 colonnes : sidebars sticky dans le flux, centre flexible dominant.
 */
export function WebAppShell({
  children,
  header,
  context,
  contentWidth,
}: WebAppShellProps) {
  const gridClass = context ? "web-three-col web-three-col--with-rail" : "web-three-col";

  return (
    <div className="web-shell-page">
      <WebMobileHeader />

      <div className={gridClass}>
        <WebSidebar />

        <main className="web-main-column min-w-0 pt-4 sm:pt-6">
          {header ? <WebPageHeader {...header} /> : null}
          {contentWidth ? (
            <WebContentColumn width={contentWidth} className="w-full">
              {children}
            </WebContentColumn>
          ) : (
            children
          )}
          {context ? <WebContextStack>{context}</WebContextStack> : null}
        </main>

        {context ? <WebContextRail>{context}</WebContextRail> : null}
      </div>

      <WebMobileFooter />
    </div>
  );
}

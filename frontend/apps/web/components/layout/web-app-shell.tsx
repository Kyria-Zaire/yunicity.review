"use client";

import { WebContentColumn } from "@/components/layout/web-content-column";
import { WebContextRail, WebContextStack } from "@/components/layout/web-context-rail";
import { WebDesktopLayout } from "@/components/layout/web-desktop-layout";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebPageHeader, type WebPageHeaderProps } from "@/components/layout/web-page-header";
import { WebResponsiveContainer } from "@/components/layout/web-responsive-container";
import { WebSidebar } from "@/components/layout/web-sidebar";
import type { WebContentWidth } from "@/lib/layout/web-layout-config";
import type { ReactNode } from "react";

export type WebAppShellProps = {
  children: ReactNode;
  header?: WebPageHeaderProps;
  /** Colonne contextuelle : droite (xl+) + empilée sous le contenu (mobile). */
  context?: ReactNode;
  contentWidth?: WebContentWidth;
};

/**
 * Shell officiel des pages web citoyennes authentifiées.
 * Réutiliser pour feed, événements, messagerie, carte, creators, communautés.
 */
export function WebAppShell({
  children,
  header,
  context,
  contentWidth,
}: WebAppShellProps) {
  const mainColumn = (
    <main className="web-main-column min-w-0">
      {header ? <WebPageHeader {...header} /> : null}
      {contentWidth ? (
        <WebContentColumn width={contentWidth}>{children}</WebContentColumn>
      ) : (
        children
      )}
      {context ? <WebContextStack>{context}</WebContextStack> : null}
    </main>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-blue-50/30">
      <WebMobileHeader />
      <WebResponsiveContainer>
        <WebDesktopLayout
          sidebar={<WebSidebar />}
          main={mainColumn}
          context={context ? <WebContextRail>{context}</WebContextRail> : undefined}
        />
      </WebResponsiveContainer>
      <WebMobileFooter />
    </div>
  );
}

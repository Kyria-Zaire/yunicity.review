"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import type { ReactNode } from "react";

export function DiscussionsAppShell({
  children,
  rightRail,
}: {
  children: ReactNode;
  rightRail?: ReactNode;
}) {
  return (
    <div className="web-shell-page min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />
      <div className="web-three-col places-shell-grid">
        <WebSidebar />
        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <CitizenTopNav />
          <div className="flex gap-6 pb-16 lg:pb-20">
            {children}
            {rightRail ? (
              <aside className="hidden w-72 shrink-0 2xl:block">
                <div className="sticky top-24">{rightRail}</div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
      <WebMobileFooter />
    </div>
  );
}

"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import type { ReactNode } from "react";

type SettingsAppShellProps = {
  children: ReactNode;
};

export function SettingsAppShell({ children }: SettingsAppShellProps) {
  return (
    <div className="web-shell-page min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <CitizenTopNav />
          {children}
        </div>
      </div>

      <WebMobileFooter />
    </div>
  );
}

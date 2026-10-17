"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import type { ReactNode } from "react";

/** Shell création discussion — mobile / medium / desktop. */
export function NewDiscussionAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="web-shell-page discussion-new-mobile-shell discussions-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-discussion-new-only">
            <CitizenTopNav />
          </div>
          <div className="flex gap-6 pb-16 lg:pb-20">{children}</div>
        </main>
      </div>

      <WebMobileFooter />
    </div>
  );
}

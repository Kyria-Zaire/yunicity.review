"use client";

import { WebAppShell } from "@/components/layout";
import type { ReactNode } from "react";

/** Immersive shell for the vertical video feed (C2-S2). */
export function VideosAppShell({ children }: { children: ReactNode }) {
  return (
    <WebAppShell contentWidth="full">
      <div className="videos-app-shell relative min-h-[calc(100dvh-5rem)] w-full md:min-h-[calc(100dvh-6rem)]">
        {children}
      </div>
    </WebAppShell>
  );
}

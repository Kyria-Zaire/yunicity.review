"use client";

import { WebAppShell } from "@/components/layout/web-app-shell";
import type { ReactNode } from "react";

/** Shell citoyen pour les pages créateurs publiques (nav mobile + sidebar). */
export function CreatorPublicShell({ children }: { children: ReactNode }) {
  return <WebAppShell contentWidth="full">{children}</WebAppShell>;
}

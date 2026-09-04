"use client";

import { HelpCenterDesktopScreen } from "@/components/help/desktop";
import { HelpCenterMediumScreen } from "@/components/help/medium";
import { HelpCenterMobileScreen } from "@/components/help/mobile";
import { HelpCenterShell } from "@/components/help/help-center-shell";

export function HelpCenterPage() {
  return (
    <HelpCenterShell>
      <main>
        <HelpCenterMobileScreen />
        <HelpCenterMediumScreen />
        <HelpCenterDesktopScreen />
      </main>
    </HelpCenterShell>
  );
}

"use client";

import { PublicHomeFooter } from "@/components/marketing/public-home-footer";
import { PublicHomeHeader } from "@/components/marketing/public-home-header";
import type { ReactNode } from "react";

type HelpCenterShellProps = {
  children: ReactNode;
};

export function HelpCenterShell({ children }: HelpCenterShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] [padding-left:max(0.75rem,env(safe-area-inset-left))] [padding-right:max(0.75rem,env(safe-area-inset-right))] [padding-top:max(0.75rem,env(safe-area-inset-top))]">
      <div className="pt-4">
        <PublicHomeHeader />
      </div>
      <div className="flex-1">{children}</div>
      <PublicHomeFooter />
    </div>
  );
}

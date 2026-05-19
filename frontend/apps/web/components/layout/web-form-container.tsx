import { WebContentColumn } from "@/components/layout/web-content-column";
import type { ReactNode } from "react";

/** @deprecated Utiliser `<WebContentColumn width="form">` ou `contentWidth="form"` sur WebAppShell. */
export function WebFormContainer({ children }: { children: ReactNode }) {
  return <WebContentColumn width="form">{children}</WebContentColumn>;
}

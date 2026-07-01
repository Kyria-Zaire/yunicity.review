"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type CreateHubOverlayPortalProps = {
  children: ReactNode;
};

/** Monte le chrome Create Hub sur document.body — indépendant des shells page. */
export function CreateHubOverlayPortal({ children }: CreateHubOverlayPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}

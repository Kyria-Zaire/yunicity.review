/**
 * @deprecated Utiliser `WebAppShell` depuis `@/components/layout`.
 * Conservé pour compatibilité ascendante pendant la migration.
 */
import { WebAppShell, type WebAppShellProps } from "@/components/layout";
import type { ReactNode } from "react";

type LegacyAppShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  aside?: ReactNode;
};

function toShellProps({
  title,
  subtitle,
  aside,
  children,
}: LegacyAppShellProps): WebAppShellProps {
  return {
    children,
    context: aside,
    header: title
      ? {
          title,
          subtitle,
        }
      : undefined,
  };
}

/** @deprecated Utiliser `WebAppShell` */
export function AppShell(props: LegacyAppShellProps) {
  return <WebAppShell {...toShellProps(props)} />;
}

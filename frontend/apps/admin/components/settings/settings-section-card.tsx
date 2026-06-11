import type { ReactNode } from "react";

import { SettingsBadge, type SettingsBadgeVariant } from "@/components/settings/settings-badge";

interface SettingsSectionCardProps {
  title: string;
  description: string;
  badge: SettingsBadgeVariant;
  children: ReactNode;
}

export function SettingsSectionCard({
  title,
  description,
  badge,
  children,
}: SettingsSectionCardProps) {
  return (
    <section className="rounded-2xl border border-[#E7EAF3] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>
        <SettingsBadge variant={badge} />
      </div>
      {children}
    </section>
  );
}

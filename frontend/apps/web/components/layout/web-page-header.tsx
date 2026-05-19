import type { ReactNode } from "react";

export type WebPageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function WebPageHeader({ title, subtitle, actions }: WebPageHeaderProps) {
  return (
    <header className="mb-6 lg:mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 lg:text-3xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-2 text-neutral-600">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}


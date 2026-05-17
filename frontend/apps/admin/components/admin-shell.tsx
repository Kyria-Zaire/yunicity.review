import type { ReactNode } from "react";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card p-4 md:block">
        <p className="text-sm font-semibold">Yunicity Admin</p>
        <p className="mt-1 text-xs text-muted-foreground">Shell minimal — pas de features métier</p>
        <nav className="mt-6 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Tableau de bord</p>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold">Administration</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

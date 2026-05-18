"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/passport", label: "Passport" },
  { href: "/profile/me", label: "Profil" },
  { href: "/organizations/me", label: "Lieux" },
  { href: "/organizations/request", label: "Proposer un lieu" },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-blue-50/30">
      <header className="sticky top-0 z-10 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/profile/me" className="text-lg font-bold tracking-tight text-neutral-900">
            Yunicity
          </Link>
          <nav className="flex flex-wrap justify-end gap-1 text-sm">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {title ? (
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
            {subtitle ? <p className="mt-2 text-neutral-600">{subtitle}</p> : null}
          </header>
        ) : null}
        {children}
      </main>

      <footer className="mx-auto max-w-2xl px-4 pb-10 text-center text-xs text-neutral-500">
        <p>{user?.email}</p>
        <button
          type="button"
          onClick={() => void logout().then(() => window.location.assign("/login"))}
          className="mt-2 text-neutral-700 underline-offset-2 hover:underline"
        >
          Déconnexion
        </button>
      </footer>
    </div>
  );
}


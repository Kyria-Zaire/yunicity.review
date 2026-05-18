"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";

function ProtectedContent() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-16">
      <header>
        <p className="text-sm font-medium text-blue-600">Zone protégée</p>
        <h1 className="mt-2 text-2xl font-bold">Bonjour {user?.full_name}</h1>
        <p className="mt-2 text-sm text-neutral-600">{user?.email}</p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <p>
          <span className="font-medium">Rôles :</span> {user?.roles.join(", ") || "—"}
        </p>
        <p className="mt-2">
          <span className="font-medium">Permissions :</span> {user?.permissions.length ?? 0}
        </p>
      </section>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => void logout().then(() => window.location.assign("/login"))}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
        >
          Déconnexion
        </button>
        <Link href="/" className="rounded-md px-4 py-2 text-sm text-blue-600 hover:underline">
          Accueil public
        </Link>
      </div>
    </main>
  );
}

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <ProtectedContent />
    </ProtectedRoute>
  );
}

"use client";

import { YunicityLogo } from "@/components/yunicity-logo";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";

export function UnauthorizedContent() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <YunicityLogo size="lg" href="/" />
      <h1 className="text-2xl font-semibold tracking-tight">Accès refusé</h1>
      <p className="text-sm text-muted-foreground">
        L&apos;admin Yunicity nécessite <strong>moderation.manage</strong> ou{" "}
        <strong>system.admin</strong>. Votre compte n&apos;a pas ces droits.
      </p>
      {user ? (
        <div className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm">
          <p className="text-stone-600">
            Connecté : <strong className="text-stone-900">{user.email}</strong>
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Rôles : {user.roles.length > 0 ? user.roles.join(", ") : "aucun rôle staff"}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            En dev, utilisez le compte bootstrap{" "}
            <code className="text-stone-700">admin@yunicity.dev</code> puis reconnectez-vous.
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/login" className="font-medium text-neutral-900 hover:underline">
          Connexion
        </Link>
        {user ? (
          <button
            type="button"
            onClick={() => void logout()}
            className="font-medium text-yunicity-primary hover:underline"
          >
            Se déconnecter
          </button>
        ) : null}
        <Link href="/partner-offers" className="text-muted-foreground hover:underline">
          Espace partenaire
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useAuth } from "@/lib/auth/auth-provider";

export default function ProtectedAdminPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Zone admin protégée</h2>
      <p className="text-sm text-muted-foreground">
        Connecté en tant que <strong>{user?.email}</strong>
      </p>
      <p className="text-sm">
        Rôles : {user?.roles.join(", ") || "—"}
      </p>
      <button
        type="button"
        onClick={() => void logout().then(() => window.location.assign("/login"))}
        className="rounded-md border border-border px-4 py-2 text-sm"
      >
        Déconnexion
      </button>
    </div>
  );
}

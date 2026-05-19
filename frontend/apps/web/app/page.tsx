import { HealthStatusCard } from "@/components/health-status-card";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-yunicity-primary">Yunicity</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Bienvenue</h1>
        <p className="mt-2 text-neutral-600">
          Réseau social local — Reims et au-delà.
        </p>
      </header>
      <HealthStatusCard />
      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/feed" className="text-yunicity-primary hover:underline">
          Fil local
        </Link>
        <Link href="/login" className="text-yunicity-primary hover:underline">
          Connexion
        </Link>
        <Link href="/register" className="text-yunicity-primary hover:underline">
          Inscription
        </Link>
        <Link href="/profile/me" className="text-yunicity-primary hover:underline">
          Mon profil
        </Link>
        <Link href="/organizations/me" className="text-yunicity-primary hover:underline">
          Mes lieux
        </Link>
      </nav>
    </main>
  );
}

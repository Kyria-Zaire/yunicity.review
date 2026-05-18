import { HealthStatusCard } from "@/components/health-status-card";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Yunicity</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Bienvenue</h1>
        <p className="mt-2 text-neutral-600">
          Application citoyenne — fondation frontend (sans feature métier).
        </p>
      </header>
      <HealthStatusCard />
      <nav className="flex gap-4 text-sm">
        <a href="/login" className="text-blue-600 hover:underline">
          Connexion
        </a>
        <a href="/register" className="text-blue-600 hover:underline">
          Inscription
        </a>
        <a href="/protected" className="text-blue-600 hover:underline">
          Zone protégée
        </a>
      </nav>
    </main>
  );
}

import { ReadinessStatusPanel } from "@/components/readiness-status-panel";
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Yunicity Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Back-office staff — connexion requise avec droits modération ou admin système.
        </p>
      </header>
      <ReadinessStatusPanel />
      <nav className="flex gap-4 text-sm">
        <Link href="/login" className="font-medium text-neutral-900 hover:underline">
          Connexion staff
        </Link>
      </nav>
    </main>
  );
}

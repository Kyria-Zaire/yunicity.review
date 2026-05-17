import { ReadinessStatusPanel } from "@/components/readiness-status-panel";

export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fondation admin — readiness backend uniquement.
        </p>
      </div>
      <ReadinessStatusPanel />
    </div>
  );
}

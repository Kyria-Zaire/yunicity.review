import { HealthStatusCard } from "@/components/health-status-card";
import { isDevOnlySurfaceEnabled } from "@/lib/dev/dev-surfaces";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

export const metadata = buildNoIndexMetadata(
  "Statut API (développement)",
  "Surface interne de diagnostic. Non indexable, absente de la production.",
  "/dev/api-status",
);

export default function DevApiStatusPage() {
  if (!isDevOnlySurfaceEnabled(process.env.NODE_ENV)) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Diagnostic API</h1>
      <p className="text-sm text-neutral-600">
        Surface réservée au développement local. Aucun lien public n’y pointe.
      </p>
      <HealthStatusCard />
    </main>
  );
}

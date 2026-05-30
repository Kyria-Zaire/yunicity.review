import { YunicityLogo } from "@/components/brand";
import Link from "next/link";

/** Page 404 statique — pas de logique client (build stable). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <YunicityLogo size="lg" />
      <h1 className="text-2xl font-bold text-yunicity-ink">Page introuvable</h1>
      <p className="text-yunicity-ink-muted">Cette adresse n&apos;existe pas sur Yunicity.</p>
      <Link href="/" className="text-yunicity-primary hover:underline">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}

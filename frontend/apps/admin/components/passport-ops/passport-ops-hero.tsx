import { PassportOpsReimsSilhouette } from "@/components/passport-ops/passport-ops-reims-silhouette";
import Link from "next/link";
import { QrCode, ScanLine } from "lucide-react";

export function PassportOpsHero() {
  return (
    <section className="space-y-3" aria-label="Scanner terrain">
      <p className="text-sm text-stone-600">
        Recherche et supervision des Passports citoyens
      </p>

      <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-yunicity-primary-soft via-white to-violet-50 shadow-sm">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-yunicity-primary/10 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-28 w-56 opacity-30"
          aria-hidden
          style={{
            background:
              "linear-gradient(to top, rgba(88,28,135,0.35) 0%, transparent 70%), radial-gradient(ellipse at 70% 100%, rgba(109,40,217,0.25), transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-4 top-0 hidden w-36 opacity-40 sm:block"
          aria-hidden
        >
          <PassportOpsReimsSilhouette />
        </div>

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-md">
              <QrCode className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-bold tracking-tight text-stone-950 sm:text-lg">
                Le scan terrain reste disponible
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-stone-600">
                Utilisez le scanner pour rechercher un Passport par QR code ou par tampon.
              </p>
            </div>
          </div>
          <Link
            href="/partner-scan"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-95"
          >
            <ScanLine className="h-4 w-4" aria-hidden />
            Scanner un Passport
          </Link>
        </div>
      </div>
    </section>
  );
}

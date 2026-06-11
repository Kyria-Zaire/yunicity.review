import { Shield } from "lucide-react";

export function SettingsReadonlyFooter() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-violet-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
          <Shield className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-violet-900">Configuration en lecture seule</h2>
          <p className="mt-1 max-w-2xl text-sm text-violet-800/90">
            Ce snapshot agrège des constantes et états non sensibles. Aucune modification n&apos;est
            possible depuis l&apos;admin en V1 — contactez l&apos;équipe technique pour un
            changement de paramètre.
          </p>
        </div>
      </div>
    </section>
  );
}

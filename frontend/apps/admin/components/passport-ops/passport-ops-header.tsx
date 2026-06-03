import Link from "next/link";

export function PassportOpsHeader() {
  return (
    <header className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Passport Ops
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Recherche et supervision des Passports citoyens
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
        <p>Le scan terrain reste disponible dans Scanner Passport.</p>
        <Link
          href="/partner-scan"
          className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          Scanner Passport
        </Link>
      </div>
    </header>
  );
}

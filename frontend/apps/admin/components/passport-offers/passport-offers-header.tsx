import Link from "next/link";

export function PassportOffersHeader() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          Passport Offers
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Gestion et modération des offres partenaires.
        </p>
      </div>
      <Link
        href="/passport-offers/new"
        className="rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-yunicity-primary-hover"
      >
        Créer (staff)
      </Link>
    </header>
  );
}

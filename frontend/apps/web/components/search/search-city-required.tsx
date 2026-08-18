"use client";

import Link from "next/link";

export function SearchCityRequired() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
      <p className="font-medium text-neutral-900">Ville requise pour la recherche</p>
      <p className="mt-1">
        Complétez votre ville dans votre profil pour explorer les contenus locaux autour de vous.
      </p>
      <Link
        href="/profile/me/edit"
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        Compléter mon profil
      </Link>
    </div>
  );
}

"use client";

import { homeGreeting } from "@yunicity/utils";

function formatTodayFr(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function FeedHomeHeader({
  city,
  neighborhoodName,
}: {
  city: string;
  neighborhoodName?: string | null;
}) {
  return (
    <header className="border-b border-neutral-100 pb-6">
      <p className="text-sm font-medium text-yunicity-primary">{formatTodayFr()}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.75rem]">
        {homeGreeting(city)}
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
        {neighborhoodName
          ? `Votre fil pour ${city} — autour de ${neighborhoodName}.`
          : `Votre fil pour ${city} — moments, lieux et vie de quartier.`}
      </p>
    </header>
  );
}

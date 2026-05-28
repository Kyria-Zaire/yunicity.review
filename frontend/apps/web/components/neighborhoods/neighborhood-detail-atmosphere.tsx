"use client";

import { NEIGHBORHOOD_DETAIL_ATMOSPHERE_TITLE } from "@yunicity/utils";

type NeighborhoodDetailAtmosphereProps = {
  line: string;
};

export function NeighborhoodDetailAtmosphere({ line }: NeighborhoodDetailAtmosphereProps) {
  if (!line.trim()) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-yunicity-primary/15 bg-gradient-to-br from-yunicity-primary-soft/40 via-white to-neutral-50 p-5 sm:p-6"
      aria-labelledby="hood-atmosphere-title"
    >
      <h2 id="hood-atmosphere-title" className="text-lg font-bold text-neutral-900">
        {NEIGHBORHOOD_DETAIL_ATMOSPHERE_TITLE}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-neutral-700 sm:text-lg">{line}</p>
    </section>
  );
}

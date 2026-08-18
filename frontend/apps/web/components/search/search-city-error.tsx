"use client";

import { Button } from "@yunicity/ui/primitives";

type SearchCityErrorProps = {
  onRetry: () => void;
};

export function SearchCityError({ onRetry }: SearchCityErrorProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
      <p className="font-medium">Impossible de charger votre ville</p>
      <p className="mt-1">
        Un problème réseau ou serveur empêche de préparer la recherche. Réessayez dans un instant.
      </p>
      <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}

export function ActivationWavesHeader({ city = "Reims" }: { city?: string }) {
  return (
    <header className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight text-stone-900">Vagues d&apos;activation</h2>
      <p className="text-sm text-stone-600">
        Pilotez l&apos;entrée des partenaires dans le réseau local — {city}.
      </p>
      <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
        Les activations définitives se confirment depuis la fiche partenaire 360°.
      </p>
    </header>
  );
}

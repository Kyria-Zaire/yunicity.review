export function PartnerScanHelp() {
  return (
    <section
      className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-4 sm:px-5"
      aria-labelledby="partner-scan-help-title"
    >
      <h2 id="partner-scan-help-title" className="text-sm font-semibold text-stone-900">
        Comment scanner correctement ?
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-stone-700">
        <li>Demandez au citoyen son QR Passport.</li>
        <li>Vérifiez le nom et le statut avant validation.</li>
        <li>En cas d&apos;erreur, recherchez par numéro Passport.</li>
        <li>Ne validez jamais une interaction sans présence du citoyen.</li>
      </ul>
    </section>
  );
}

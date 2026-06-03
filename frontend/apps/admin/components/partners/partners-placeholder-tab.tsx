export function PartnersPlaceholderTab({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <section className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm text-stone-600">{description}</p>
      {bullets && bullets.length > 0 ? (
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-stone-600">
          {bullets.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-stone-400" aria-hidden>
                ·
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        disabled
        className="mt-8 cursor-not-allowed rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-400"
      >
        Bientôt disponible
      </button>
    </section>
  );
}

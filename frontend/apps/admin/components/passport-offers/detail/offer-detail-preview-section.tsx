interface OfferDetailPreviewSectionProps {
  title: string;
  message: string;
}

export function OfferDetailPreviewSection({ title, message }: OfferDetailPreviewSectionProps) {
  return (
    <section className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-5 py-8 text-center">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h2>
      <p className="mt-2 text-sm text-stone-600">{message}</p>
    </section>
  );
}

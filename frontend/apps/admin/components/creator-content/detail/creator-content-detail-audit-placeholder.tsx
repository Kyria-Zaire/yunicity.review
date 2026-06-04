import { creatorContentAuditPlaceholderCopy } from "@yunicity/utils";

export function CreatorContentDetailAuditPlaceholder() {
  return (
    <section className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Historique staff
      </h2>
      <p className="mt-3 text-sm text-stone-600">{creatorContentAuditPlaceholderCopy}</p>
    </section>
  );
}

import { Inbox } from "lucide-react";

export function ActivityEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-400 shadow-sm">
        <Inbox className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm font-medium text-stone-800">Aucune activité récente</p>
      <p className="mt-1 max-w-sm text-sm text-stone-500">
        Les actions staff et signalements apparaîtront ici dès qu&apos;ils seront enregistrés.
      </p>
    </div>
  );
}

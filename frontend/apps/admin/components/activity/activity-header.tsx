import { formatActivityGeneratedAt } from "@/lib/activity-display";

interface ActivityHeaderProps {
  generatedAt: string | null;
}

export function ActivityHeader({ generatedAt }: ActivityHeaderProps) {
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Activité / Notifications
        </h1>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Lecture seule
        </span>
      </div>
      <p className="max-w-3xl text-sm text-stone-600">
        Suivez les alertes opérationnelles et l&apos;activité récente de Yunicity.
      </p>
      {generatedAt ? (
        <p className="text-xs text-stone-500">
          Dernière actualisation : {formatActivityGeneratedAt(generatedAt)}
        </p>
      ) : null}
    </header>
  );
}

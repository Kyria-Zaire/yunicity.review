import type { AdminLocalEventDetail } from "@yunicity/types";
import {
  eventModerationStatusLabel,
  eventTemporalStatus,
  eventTemporalStatusLabel,
  eventVisibilityLabel,
  formatEventDate,
} from "@yunicity/utils";

interface EventDetailKpiStripProps {
  event: AdminLocalEventDetail;
}

const KPI_CELL =
  "rounded-xl border border-yunicity-border bg-white px-3 py-2.5 shadow-sm";

export function EventDetailKpiStrip({ event }: EventDetailKpiStripProps) {
  const temporal = eventTemporalStatus(event.starts_at, event.ends_at);
  const orgLabel = event.organization?.name ?? "—";

  return (
    <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      <div className={KPI_CELL}>
        <dt className="text-[10px] font-medium uppercase tracking-wide text-yunicity-ink-muted">
          Modération
        </dt>
        <dd className="mt-0.5 text-sm font-semibold text-yunicity-ink">
          {eventModerationStatusLabel(event.moderation_status)}
        </dd>
      </div>
      <div className={KPI_CELL}>
        <dt className="text-[10px] font-medium uppercase tracking-wide text-yunicity-ink-muted">
          Visibilité
        </dt>
        <dd className="mt-0.5 text-sm font-semibold text-yunicity-ink">
          {eventVisibilityLabel(event.visibility)}
        </dd>
      </div>
      <div className={KPI_CELL}>
        <dt className="text-[10px] font-medium uppercase tracking-wide text-yunicity-ink-muted">
          Ville
        </dt>
        <dd className="mt-0.5 text-sm font-semibold text-yunicity-ink">{event.city}</dd>
      </div>
      <div className={KPI_CELL}>
        <dt className="text-[10px] font-medium uppercase tracking-wide text-yunicity-ink-muted">
          Début
        </dt>
        <dd className="mt-0.5 text-sm font-semibold text-yunicity-ink">
          {formatEventDate(event.starts_at)}
        </dd>
        <dd className="text-[10px] text-yunicity-ink-muted">
          {eventTemporalStatusLabel(temporal)}
        </dd>
      </div>
      <div className={KPI_CELL}>
        <dt className="text-[10px] font-medium uppercase tracking-wide text-yunicity-ink-muted">
          Organisateur
        </dt>
        <dd className="mt-0.5 truncate text-sm font-semibold text-yunicity-ink">{orgLabel}</dd>
      </div>
    </dl>
  );
}

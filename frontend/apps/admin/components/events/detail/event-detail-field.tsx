export function EventDetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-yunicity-ink-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-yunicity-ink">{value}</dd>
    </div>
  );
}

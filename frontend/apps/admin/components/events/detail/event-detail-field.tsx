export function EventDetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-stone-900">{value}</dd>
    </div>
  );
}

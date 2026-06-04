export function ModerationReportDetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd
        className={`mt-0.5 break-words text-sm text-stone-900 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

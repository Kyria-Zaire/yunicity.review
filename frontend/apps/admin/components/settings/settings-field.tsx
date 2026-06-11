interface SettingsFieldProps {
  label: string;
  value: string;
  hint?: string;
}

export function SettingsField({ label, value, hint }: SettingsFieldProps) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="text-sm font-medium text-stone-900">{value}</dd>
      {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}

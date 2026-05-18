export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return new Date(trimmed).toISOString();
}

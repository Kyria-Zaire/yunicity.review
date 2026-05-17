/** Design tokens minimaux — à étendre avec shadcn/ui (web/admin). */
export const colors = {
  background: "#fafafa",
  foreground: "#0a0a0a",
  muted: "#737373",
  border: "#e5e5e5",
  primary: "#2563eb",
  success: "#16a34a",
  warning: "#ca8a04",
  error: "#dc2626",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;

export const radius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
} as const;

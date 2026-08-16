"use client";

/**
 * Button / ButtonLink — primitive d'action partagée (C3.0-T3).
 *
 * Règle produit encodée dans les TYPES : un CTA ne se rend que s'il a une action réelle.
 * - `Button` exige `onClick` OU `type="submit" | "reset"` (union discriminée) ;
 * - `ButtonLink` exige `href`.
 * Un bouton purement décoratif ne compile pas.
 *
 * Pas de `asChild` : il exigerait un `Slot` (Radix ou clonage d'élément) que l'infrastructure
 * actuelle n'a pas. Deux composants explicites couvrent le besoin réel (action vs destination).
 */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

import { cx } from "./class-names";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "default" | "pill";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-yunicity-primary text-yunicity-text-inverse hover:bg-yunicity-primary-hover",
  secondary: "bg-yunicity-surface text-yunicity-ink hover:bg-yunicity-divider",
  outline:
    "border border-yunicity-border bg-yunicity-canvas text-yunicity-ink hover:bg-yunicity-surface",
  ghost: "bg-transparent text-yunicity-ink hover:bg-yunicity-surface",
  destructive: "bg-yunicity-danger text-yunicity-text-inverse hover:bg-yunicity-danger/90",
};

/** Toutes les tailles respectent la cible tactile 44px (`--yunicity-touch-min`). */
const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "min-h-yunicity-touch px-3 text-sm",
  md: "min-h-yunicity-touch px-4 text-sm",
  lg: "min-h-yunicity-touch px-6 py-3 text-base",
};

const ICON_ONLY_CLASS = "min-w-yunicity-touch px-0";

const BASE_CLASS = [
  "inline-flex items-center justify-center gap-2 font-semibold leading-none",
  "transition-colors duration-yunicity-fast ease-yunicity-standard motion-reduce:transition-none",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-focus focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
].join(" ");

const SHAPE_CLASS: Record<ButtonShape, string> = {
  default: "rounded-yunicity-lg",
  pill: "rounded-yunicity-pill",
};

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  /** Icône seule : impose `aria-label` (voir unions ci-dessous). */
  iconOnly?: boolean;
  loading?: boolean;
  className?: string;
};

function buttonClassName({ variant = "primary", size = "md", shape = "default", iconOnly, className }: StyleProps): string {
  return cx(
    BASE_CLASS,
    SHAPE_CLASS[shape],
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    iconOnly ? ICON_ONLY_CLASS : null,
    className,
  );
}

/** Spinner inline — aucune dépendance d'icônes dans le package. */
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z" />
    </svg>
  );
}

type ContentProps = { loading?: boolean; iconOnly?: boolean; children: ReactNode };

function ButtonContent({ loading, iconOnly, children }: ContentProps) {
  if (!loading) return <>{children}</>;
  return (
    <>
      <Spinner />
      {iconOnly ? null : children}
    </>
  );
}

/* --------------------------------- Button --------------------------------- */

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children" | "type" | "onClick"
>;

/** Un bouton a une action : handler explicite, ou soumission/reset de formulaire. */
type ButtonAction =
  | { onClick: (event: MouseEvent<HTMLButtonElement>) => void; type?: "button" }
  | { type: "submit" | "reset"; onClick?: (event: MouseEvent<HTMLButtonElement>) => void };

type ButtonLabelling =
  | { iconOnly: true; "aria-label": string; children: ReactNode }
  | { iconOnly?: false; children: ReactNode };

export type ButtonProps = NativeButtonProps & StyleProps & ButtonAction & ButtonLabelling;

export function Button(props: ButtonProps) {
  const {
    variant,
    size,
    shape,
    iconOnly,
    loading = false,
    className,
    children,
    disabled,
    onClick,
    type = "button",
    ...rest
  } = props as NativeButtonProps & StyleProps & { children: ReactNode; type?: "button" | "submit" | "reset" } & {
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  };

  const inactive = Boolean(disabled) || loading;

  return (
    <button
      {...rest}
      type={type}
      disabled={inactive}
      aria-busy={loading || undefined}
      data-loading={loading ? "true" : undefined}
      className={buttonClassName({ variant, size, shape, iconOnly, className })}
      onClick={(event) => {
        // Garde anti double-déclenchement : `disabled` suffit dans un navigateur, pas contre
        // un déclenchement programmatique ni pendant la fenêtre de re-render du loading.
        if (inactive) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      <ButtonContent loading={loading} iconOnly={iconOnly}>
        {children}
      </ButtonContent>
    </button>
  );
}

/* ------------------------------- ButtonLink ------------------------------- */

type NativeAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "className" | "children" | "href"
>;

export type ButtonLinkProps = NativeAnchorProps &
  StyleProps & { href: string } & (
    | { iconOnly: true; "aria-label": string; children: ReactNode }
    | { iconOnly?: false; children: ReactNode }
  );

/**
 * Destination réelle obligatoire (`href`). Rendu `<a>` natif : le package ne dépend pas de
 * `next/link` (il est aussi consommé côté admin, et resterait alors couplé à Next).
 * TODO(debt): navigation client — le ticket de migration décidera d'un `linkComponent` injectable.
 */
export function ButtonLink(props: ButtonLinkProps) {
  const { variant, size, shape, iconOnly, loading = false, className, children, href, onClick, ...rest } =
    props as NativeAnchorProps & StyleProps & { href: string; children: ReactNode };

  return (
    <a
      {...rest}
      href={href}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      // Un lien inactif sort de l'ordre de tabulation : le laisser focalisable proposerait
      // une destination qui ne répond pas.
      tabIndex={loading ? -1 : undefined}
      className={buttonClassName({ variant, size, shape, iconOnly, className })}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      <ButtonContent loading={loading} iconOnly={iconOnly}>
        {children}
      </ButtonContent>
    </a>
  );
}

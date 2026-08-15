"use client";

/**
 * Card / Surface — primitive de conteneur partagée (C3.0-T3).
 *
 * Sémantique interactive garantie par les TYPES : la variante `interactive` n'existe pas
 * sans destination (`href` → `<a>`) ni sans action (`onClick` → `<button>`). Il est donc
 * impossible de produire une `<div>` cliquable inaccessible.
 *
 * Variante `premium` : surface navy PLEINE `#0B1533` (token `yunicity-premium`), validée DA.
 * Ni gradient ni glassmorphism (doctrine 306F).
 */
import type { ReactNode } from "react";

import { cx } from "./class-names";

export type CardVariant = "default" | "elevated" | "interactive" | "premium";

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: "bg-yunicity-surface-elevated border border-yunicity-border",
  elevated: "bg-yunicity-surface-elevated border border-yunicity-divider shadow-yunicity-md",
  interactive:
    "bg-yunicity-surface-elevated border border-yunicity-border shadow-yunicity-sm hover:border-yunicity-primary hover:shadow-yunicity-md",
  premium: "bg-yunicity-premium text-yunicity-premium-fg border border-yunicity-premium",
};

const BASE_CLASS = "block rounded-yunicity-xl text-left";

const INTERACTIVE_CLASS = [
  "w-full transition-shadow duration-yunicity-fast ease-yunicity-standard motion-reduce:transition-none",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-focus focus-visible:ring-offset-2",
].join(" ");

type CardBase = {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
};

type StaticCard = CardBase & { variant?: Exclude<CardVariant, "interactive">; href?: never; onClick?: never };
type LinkCard = CardBase & { variant: "interactive"; href: string; onClick?: never; ariaLabel?: string };
type ButtonCard = CardBase & { variant: "interactive"; onClick: () => void; href?: never; ariaLabel?: string };

export type CardProps = StaticCard | LinkCard | ButtonCard;

export function Card(props: CardProps) {
  const variant = props.variant ?? "default";
  const className = cx(BASE_CLASS, VARIANT_CLASS[variant], props.className);

  if ("href" in props && props.href !== undefined) {
    return (
      <a href={props.href} aria-label={props.ariaLabel} className={cx(className, INTERACTIVE_CLASS)}>
        {props.children}
      </a>
    );
  }

  if ("onClick" in props && props.onClick !== undefined) {
    return (
      <button type="button" onClick={props.onClick} aria-label={props.ariaLabel} className={cx(className, INTERACTIVE_CLASS)}>
        {props.children}
      </button>
    );
  }

  return <div className={className}>{props.children}</div>;
}

type SlotProps = { className?: string; children: ReactNode };

export function CardHeader({ className, children }: SlotProps) {
  return <div className={cx("flex flex-col gap-1 p-4 pb-2", className)}>{children}</div>;
}

export function CardContent({ className, children }: SlotProps) {
  return <div className={cx("p-4 pt-2", className)}>{children}</div>;
}

export function CardFooter({ className, children }: SlotProps) {
  return (
    <div className={cx("flex items-center gap-2 border-t border-yunicity-divider p-4", className)}>
      {children}
    </div>
  );
}

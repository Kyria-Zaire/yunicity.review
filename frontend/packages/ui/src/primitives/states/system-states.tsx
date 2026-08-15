"use client";

/**
 * États système obligatoires (C3.0-T3) : Loading · Empty · Error · Offline.
 *
 * Contrat : AUCUNE donnée, métrique ou illustration inventée par la primitive. Tout le
 * texte vient du consommateur ; seul le libellé du bouton « Réessayer » a un défaut,
 * surchargeable. Un CTA sans action n'est pas rendu (`isActionable`).
 *
 * UX-FE-01 : ces primitives préparent le remplacement du loader plein écran de session.
 * Ce ticket ne migre aucun consommateur.
 */
import type { ReactNode } from "react";

import { Button, ButtonLink } from "../button";
import { cx } from "../class-names";
import { Skeleton } from "./skeleton";
import { isActionable, type StateAction } from "./state-action";

type StateShellProps = {
  className?: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: StateAction;
  role?: "status" | "alert";
  ariaLive?: "polite" | "assertive";
};

function StateActionButton({ action }: { action?: StateAction }) {
  if (!isActionable(action)) return null;
  if (action.href !== undefined) {
    return (
      <ButtonLink href={action.href} variant="primary" size="md">
        {action.label}
      </ButtonLink>
    );
  }
  return (
    <Button onClick={action.onClick} variant="primary" size="md">
      {action.label}
    </Button>
  );
}

function StateShell({ className, icon, title, description, action, role, ariaLive }: StateShellProps) {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={cx(
        "flex flex-col items-center justify-center gap-3 rounded-yunicity-xl px-4 py-8 text-center",
        className,
      )}
    >
      {icon ? (
        <span aria-hidden="true" className="text-yunicity-text-muted">
          {icon}
        </span>
      ) : null}
      <p className="text-base font-semibold text-yunicity-ink">{title}</p>
      {description ? <p className="max-w-yunicity-form text-sm text-yunicity-ink-muted">{description}</p> : null}
      <StateActionButton action={action} />
    </div>
  );
}

/* --------------------------------- Loading -------------------------------- */

export type LoadingStateProps = {
  /** Annonce accessible (ex. « Chargement du fil local… »). Toujours fournie par l'appelant. */
  label: string;
  lines?: number;
  className?: string;
};

export function LoadingState({ label, lines = 3, className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={cx("flex w-full flex-col gap-3", className)}>
      <span className="sr-only">{label}</span>
      <Skeleton lines={lines} />
    </div>
  );
}

/* ---------------------------------- Empty --------------------------------- */

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: StateAction;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ className, ...props }: EmptyStateProps) {
  return <StateShell {...props} role="status" ariaLive="polite" className={cx("bg-yunicity-surface", className)} />;
}

/* ---------------------------------- Error --------------------------------- */

export type ErrorStateProps = {
  title: string;
  description?: string;
  /** Retry réellement câblé : sans handler, aucun bouton n'est rendu. */
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
  className?: string;
};

export function ErrorState({ title, description, onRetry, retryLabel = "Réessayer", icon, className }: ErrorStateProps) {
  return (
    <StateShell
      role="alert"
      ariaLive="assertive"
      icon={icon}
      title={title}
      description={description}
      action={onRetry ? { label: retryLabel, onClick: onRetry } : undefined}
      className={cx("bg-yunicity-danger-soft", className)}
    />
  );
}

/* --------------------------------- Offline -------------------------------- */

export type OfflineStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function OfflineState({ title, description, onRetry, retryLabel = "Réessayer", className }: OfflineStateProps) {
  return (
    <StateShell
      role="status"
      ariaLive="polite"
      title={title}
      description={description}
      action={onRetry ? { label: retryLabel, onClick: onRetry } : undefined}
      className={cx("bg-yunicity-warning-soft", className)}
    />
  );
}

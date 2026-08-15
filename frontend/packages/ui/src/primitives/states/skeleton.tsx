"use client";

/**
 * Skeleton — bloc de chargement. Décoratif : `aria-hidden`, l'annonce accessible est portée
 * par `LoadingState`. Animation neutralisée sous `prefers-reduced-motion`.
 */
import { cx } from "../class-names";

export type SkeletonProps = {
  className?: string;
  /** Nombre de barres empilées (liste de texte). */
  lines?: number;
};

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  const bars = Array.from({ length: Math.max(1, lines) }, (_, index) => index);
  return (
    <div aria-hidden="true" className={cx("flex w-full flex-col gap-2", className)}>
      {bars.map((index) => (
        <div
          key={index}
          className={cx(
            "h-4 w-full animate-pulse rounded-yunicity-md bg-yunicity-surface motion-reduce:animate-none",
            index === bars.length - 1 && bars.length > 1 ? "w-2/3" : null,
          )}
        />
      ))}
    </div>
  );
}

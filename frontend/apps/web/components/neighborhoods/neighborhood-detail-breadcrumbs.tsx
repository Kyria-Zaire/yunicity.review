"use client";

import type { NeighborhoodDetailBreadcrumb } from "@yunicity/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type NeighborhoodDetailBreadcrumbsProps = {
  items: NeighborhoodDetailBreadcrumb[];
};

export function NeighborhoodDetailBreadcrumbs({ items }: NeighborhoodDetailBreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
              ) : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="font-medium text-yunicity-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-semibold text-neutral-800" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

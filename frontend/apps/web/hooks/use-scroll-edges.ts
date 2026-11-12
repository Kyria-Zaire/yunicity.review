"use client";

import { useCallback, useEffect, useState } from "react";

import {
  computeScrollEdges,
  NO_SCROLL_EDGES,
  sameScrollEdges,
  type ScrollEdges,
} from "@/lib/layout/rail-scroll-edges";

/**
 * RAIL-SHORT-VIEWPORT-01 — observe un conteneur défilant et indique de quel côté
 * du contenu reste caché.
 *
 * Recalcule au défilement, au redimensionnement du conteneur et à celui de ses
 * enfants directs (le contenu peut grandir sans que la boîte change : police
 * chargée, libellé, pastille). Sans `ResizeObserver` (SSR, jsdom), seul le
 * défilement est suivi : l'état initial reste « rien de caché », ce qui
 * n'affiche aucun repère, jamais un repère erroné.
 */
export function useScrollEdges<T extends HTMLElement>(): {
  ref: (node: T | null) => void;
  edges: ScrollEdges;
} {
  const [node, setNode] = useState<T | null>(null);
  const [edges, setEdges] = useState<ScrollEdges>(NO_SCROLL_EDGES);
  const ref = useCallback((next: T | null) => setNode(next), []);

  useEffect(() => {
    if (!node) return undefined;
    const update = () => {
      const next = computeScrollEdges({
        scrollTop: node.scrollTop,
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
      });
      setEdges((prev) => (sameScrollEdges(prev, next) ? prev : next));
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(node);
      for (const child of Array.from(node.children)) observer.observe(child);
    }
    return () => {
      node.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [node]);

  return { ref, edges };
}

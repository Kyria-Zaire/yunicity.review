"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DESKTOP_OVERLAY_RVIDE_PAGE_BUDGET,
  appendPageToSequence,
  createTraversalSequence,
  indexInSequence,
  resolveRVideAfterEmptyCycle,
  type RVideStatus,
} from "@/lib/videos/desktop-overlay-navigation";

export type OrderedLoadMoreResult = {
  pageIds: readonly string[];
  hasMore: boolean;
  error: boolean;
};

type UseOrderedVideoNavigationArgs = {
  focusVideoId: string;
  gridIds: readonly string[];
  directOutsideGrid: boolean;
  loadPages: (maxPages: number) => Promise<OrderedLoadMoreResult>;
};

/**
 * R-ORD + R-VIDE + D3/D5 — séquence de parcours distincte de la grille live.
 */
export function useOrderedVideoNavigation({
  focusVideoId,
  gridIds,
  directOutsideGrid,
  loadPages,
}: UseOrderedVideoNavigationArgs) {
  const [sequence, setSequence] = useState<string[]>(() =>
    createTraversalSequence(gridIds, focusVideoId, { directOutsideGrid }),
  );
  const [currentId, setCurrentId] = useState(focusVideoId);
  const [rVide, setRVide] = useState<RVideStatus>({ kind: "idle" });
  const sequenceRef = useRef(sequence);
  const loadingRef = useRef(false);
  const seededFromGridRef = useRef(gridIds.length > 0);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  // URL (replace / popstate) : se caler sur l'id sans reconstruire S si déjà connu.
  useEffect(() => {
    setCurrentId(focusVideoId);
    setSequence((prev) => {
      if (prev.includes(focusVideoId)) return prev;
      return createTraversalSequence(gridIds, focusVideoId, {
        directOutsideGrid: !gridIds.includes(focusVideoId),
      });
    });
    // gridIds volontairement omis : la grille live ne réordonne pas S (R-ORD).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusVideoId]);

  // Première arrivée de la grille sous C6 / deep link : compléter S sans réordonner.
  useEffect(() => {
    if (seededFromGridRef.current || gridIds.length === 0) return;
    seededFromGridRef.current = true;
    setSequence((prev) => appendPageToSequence(prev, gridIds));
  }, [gridIds]);

  const index = useMemo(() => indexInSequence(sequence, currentId), [sequence, currentId]);
  const canPrevious = index > 0;
  const atEndOfSequence = index >= 0 && index >= sequence.length - 1;
  const showSeeFeedHint = directOutsideGrid && index === 0 && sequence.length > 1;

  const goPrevious = useCallback(() => {
    if (index <= 0) return null;
    const nextId = sequence[index - 1]!;
    setCurrentId(nextId);
    setRVide({ kind: "idle" });
    return nextId;
  }, [index, sequence]);

  const goNext = useCallback(async (): Promise<string | null> => {
    const seq = sequenceRef.current;
    const idx = indexInSequence(seq, currentId);

    if (idx >= 0 && idx < seq.length - 1) {
      const nextId = seq[idx + 1]!;
      setCurrentId(nextId);
      setRVide({ kind: "idle" });
      return nextId;
    }

    if (loadingRef.current) return null;
    if (rVide.kind === "exhausted") return null;

    loadingRef.current = true;
    setRVide({ kind: "loading" });
    try {
      const result = await loadPages(DESKTOP_OVERLAY_RVIDE_PAGE_BUDGET);
      if (result.error) {
        setRVide({ kind: "error" });
        return null;
      }

      const added = result.pageIds.filter((id) => !sequenceRef.current.includes(id));
      if (added.length > 0) {
        const next = appendPageToSequence(sequenceRef.current, added);
        sequenceRef.current = next;
        setSequence(next);
        const firstNew = added[0]!;
        setCurrentId(firstNew);
        setRVide({ kind: "idle" });
        return firstNew;
      }

      const status = resolveRVideAfterEmptyCycle({
        pagesAttempted: Math.max(result.pageIds.length > 0 ? 1 : DESKTOP_OVERLAY_RVIDE_PAGE_BUDGET, 1),
        addedCount: 0,
        hasMore: result.hasMore,
      });
      // Budget saturé sans ajout : continue ou exhausted selon hasMore.
      if (!result.hasMore) {
        setRVide({ kind: "exhausted" });
      } else {
        setRVide(
          status.kind === "continue" || status.kind === "exhausted"
            ? status
            : { kind: "continue" },
        );
      }
      return null;
    } finally {
      loadingRef.current = false;
    }
  }, [currentId, loadPages, rVide.kind]);

  const continueSearch = useCallback(async (): Promise<string | null> => {
    if (rVide.kind !== "continue") return null;
    setRVide({ kind: "idle" });
    // Relancer un cycle après reset du statut.
    loadingRef.current = false;
    const result = await (async () => {
      loadingRef.current = true;
      setRVide({ kind: "loading" });
      try {
        const pageResult = await loadPages(DESKTOP_OVERLAY_RVIDE_PAGE_BUDGET);
        if (pageResult.error) {
          setRVide({ kind: "error" });
          return null;
        }
        const added = pageResult.pageIds.filter((id) => !sequenceRef.current.includes(id));
        if (added.length > 0) {
          const next = appendPageToSequence(sequenceRef.current, added);
          sequenceRef.current = next;
          setSequence(next);
          const firstNew = added[0]!;
          setCurrentId(firstNew);
          setRVide({ kind: "idle" });
          return firstNew;
        }
        if (!pageResult.hasMore) {
          setRVide({ kind: "exhausted" });
        } else {
          setRVide({ kind: "continue" });
        }
        return null;
      } finally {
        loadingRef.current = false;
      }
    })();
    return result;
  }, [loadPages, rVide.kind]);

  const retryLoad = useCallback(async (): Promise<string | null> => {
    if (rVide.kind !== "error") return null;
    setRVide({ kind: "idle" });
    return goNext();
  }, [goNext, rVide.kind]);

  return {
    sequence,
    currentId,
    index,
    canPrevious,
    atEndOfSequence,
    showSeeFeedHint,
    rVide,
    goPrevious,
    goNext,
    continueSearch,
    retryLoad,
  };
}

"use client";

import { filterHelpCenterContent } from "@/lib/help/help-center-contract";
import { useEffect, useMemo, useState } from "react";

function faqIdFromHash(hash: string): string | null {
  const normalized = hash.replace(/^#/, "");
  if (!normalized.startsWith("faq-")) {
    return null;
  }
  return normalized.slice("faq-".length) || null;
}

export function useHelpCenterState() {
  const [query, setQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>("explorer-sans-compte");

  const { categories, faqItems } = useMemo(() => filterHelpCenterContent(query), [query]);

  useEffect(() => {
    function syncHash() {
      const faqId = faqIdFromHash(window.location.hash);
      if (faqId) {
        setOpenFaqId(faqId);
      }
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function toggleFaq(id: string) {
    setOpenFaqId((current) => (current === id ? null : id));
  }

  return {
    query,
    setQuery,
    openFaqId,
    toggleFaq,
    categories,
    faqItems,
  };
}

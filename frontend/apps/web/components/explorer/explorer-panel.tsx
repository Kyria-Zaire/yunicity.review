"use client";

import Link from "next/link";
import { type FormEvent, type RefObject } from "react";
import type React from "react";

import { SearchCityError } from "@/components/search/search-city-error";
import { SearchCityRequired } from "@/components/search/search-city-required";
import {
  EXPLORER_EMPTY_RECENT_LABEL,
  EXPLORER_VISITOR_HINT,
  buildExplorerLoginHref,
  buildExplorerSearchPath,
  isExplorerQuerySubmittable,
  shouldShowExplorerEmptyRecent,
  shouldShowExplorerVisitorHint,
  type SearchCityState,
} from "@/lib/explorer/explorer-contract";
import { useAuth } from "@/lib/auth/auth-provider";
import { Button } from "@yunicity/ui/primitives";

type ExplorerPanelProps = {
  query: string;
  onQueryChange: (value: string) => void;
  cityState: SearchCityState | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onNavigate: (path: string) => void;
};

export function ExplorerPanel({
  query,
  onQueryChange,
  cityState,
  inputRef,
  onNavigate,
}: ExplorerPanelProps) {
  const { isAuthenticated } = useAuth();
  const showVisitorHint = shouldShowExplorerVisitorHint(isAuthenticated);
  const showEmptyRecent = shouldShowExplorerEmptyRecent({
    isAuthenticated,
    query,
    recentSearches: [],
  });
  const describedBy = showVisitorHint
    ? "explorer-visitor-hint"
    : showEmptyRecent
      ? "explorer-empty-recent"
      : undefined;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const submittedQuery = (inputRef.current?.value || query).trim();
    if (!isAuthenticated) return;
    if (!isExplorerQuerySubmittable(submittedQuery)) return;
    if (!cityState || cityState.status !== "ready") return;
    onNavigate(buildExplorerSearchPath({ query: submittedQuery, city: cityState.city }));
  };

  const loginHref = buildExplorerLoginHref({ query, city: cityState?.status === "ready" ? cityState.city : null });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-800">Que cherchez-vous ?</span>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Lieux, événements, tribus…"
          aria-describedby={describedBy}
          className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          autoComplete="off"
        />
      </label>

      {isAuthenticated ? (
        <>
          {cityState?.status === "loading" ? (
            <p className="text-sm text-neutral-500" role="status">
              Chargement de votre ville…
            </p>
          ) : null}
          {cityState?.status === "missing" ? <SearchCityRequired /> : null}
          {cityState?.status === "error" ? <SearchCityError onRetry={cityState.retry} /> : null}
          {showEmptyRecent ? (
            <p id="explorer-empty-recent" className="text-sm text-neutral-600" role="status">
              {EXPLORER_EMPTY_RECENT_LABEL}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={
              !isExplorerQuerySubmittable(query) || !cityState || cityState.status !== "ready"
            }
          >
            Rechercher
          </Button>
        </>
      ) : (
        <>
          {showVisitorHint ? (
            <p id="explorer-visitor-hint" className="text-sm text-neutral-600">
              {EXPLORER_VISITOR_HINT}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={loginHref}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
            >
              Créer un compte
            </Link>
          </div>
        </>
      )}
    </form>
  );
}

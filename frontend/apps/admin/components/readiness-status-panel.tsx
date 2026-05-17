"use client";

import type { ReadinessResponse } from "@yunicity/types";
import { cn } from "@/lib/utils";
import { getWebApiBaseUrl, safeFetch } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

type LoadState = "loading" | "success" | "error";

function statusClass(status: string): string {
  if (status === "ok" || status === "ready") return "text-green-700";
  if (status === "disabled") return "text-neutral-500";
  return "text-red-600";
}

export function ReadinessStatusPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [ready, setReady] = useState<ReadinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(null);
    const base = getWebApiBaseUrl();
    const result = await safeFetch<ReadinessResponse>(`${base}/api/v1/ready`);
    if (!result.ok) {
      setReady(null);
      setError(result.error);
      setState("error");
      return;
    }
    setReady(result.data);
    setState("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Readiness API</h2>
        <button
          type="button"
          onClick={() => void load()}
          className={cn(
            "rounded-md border border-border px-3 py-1.5 text-sm",
            "hover:bg-muted transition-colors",
          )}
        >
          Actualiser
        </button>
      </div>
      {state === "loading" && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {state === "error" && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {state === "success" && ready && (
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Statut global</dt>
            <dd className={cn("font-medium", statusClass(ready.status))}>{ready.status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Base de données</dt>
            <dd className={cn("font-medium", statusClass(ready.checks.database))}>
              {ready.checks.database}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Redis</dt>
            <dd className={cn("font-medium", statusClass(ready.checks.redis))}>
              {ready.checks.redis}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

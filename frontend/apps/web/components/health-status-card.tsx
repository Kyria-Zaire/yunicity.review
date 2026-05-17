"use client";

import type { HealthResponse } from "@yunicity/types";
import { getAppEnvironmentLabel, getWebApiBaseUrl, safeFetch } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

type LoadState = "loading" | "success" | "error";

export function HealthStatusCard() {
  const [state, setState] = useState<LoadState>("loading");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(null);
    const base = getWebApiBaseUrl();
    const result = await safeFetch<HealthResponse>(`${base}/api/v1/health`);
    if (!result.ok) {
      setHealth(null);
      setError(result.error);
      setState("error");
      return;
    }
    setHealth(result.data);
    setState("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      aria-live="polite"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Statut API</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Actualiser
        </button>
      </div>
      {state === "loading" && <p className="text-sm text-neutral-500">Chargement…</p>}
      {state === "error" && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {state === "success" && health && (
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-neutral-500">Statut</dt>
            <dd className="font-medium text-green-700">{health.status}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Service</dt>
            <dd>{health.service}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Environnement</dt>
            <dd>
              {health.environment} — {getAppEnvironmentLabel(health.environment)}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

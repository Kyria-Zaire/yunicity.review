export type SafeFetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number | null };

export async function safeFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<SafeFetchResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Erreur API (${response.status})`,
        status: response.status,
      };
    }

    const data = (await response.json()) as T;
    return { ok: true, data, status: response.status };
  } catch {
    return {
      ok: false,
      error: "Impossible de joindre l'API. Vérifiez que le backend est démarré.",
      status: null,
    };
  }
}

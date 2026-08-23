/**
 * Cible du reverse-proxy API local/QA.
 * Serveur-only : jamais exposée via NEXT_PUBLIC_*.
 */
export const DEFAULT_LOCAL_API_PROXY_TARGET = "http://127.0.0.1:8010";

const ALLOWED_PORTS = new Set(["8000", "8010"]);
const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost"]);

export type LocalApiProxyEnv = {
  rawTarget: string | undefined;
  nodeEnv: string | undefined;
  railwayEnvironment: string | undefined;
};

export function resolveLocalApiProxyTarget(env: LocalApiProxyEnv): string | null {
  if (env.railwayEnvironment?.trim()) {
    return null;
  }
  if (env.nodeEnv === "production") {
    return null;
  }

  const raw = env.rawTarget?.trim() || DEFAULT_LOCAL_API_PROXY_TARGET;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:") {
    return null;
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return null;
  }
  const port = parsed.port || "80";
  if (!ALLOWED_PORTS.has(port)) {
    return null;
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return null;
  }

  return `${parsed.protocol}//${parsed.hostname}:${port}`;
}

export function resolveConfiguredLocalApiProxyTarget(): string | null {
  return resolveLocalApiProxyTarget({
    rawTarget: process.env.API_PROXY_TARGET,
    nodeEnv: process.env.NODE_ENV,
    railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
  });
}

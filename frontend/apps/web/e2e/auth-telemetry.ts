/** Compteur déterministe des requêtes auth E2E (worker-scoped via fixtures). */
export type AuthTelemetry = {
  login: number;
  register: number;
  refresh: number;
};

const telemetry: AuthTelemetry = { login: 0, register: 0, refresh: 0 };

export function readAuthTelemetry(): Readonly<AuthTelemetry> {
  return { ...telemetry };
}

export function resetAuthTelemetry(): void {
  telemetry.login = 0;
  telemetry.register = 0;
  telemetry.refresh = 0;
}

export function recordAuthRequest(pathname: string): void {
  if (pathname.endsWith("/auth/login")) {
    telemetry.login += 1;
    return;
  }
  if (pathname.endsWith("/auth/register")) {
    telemetry.register += 1;
    return;
  }
  if (pathname.endsWith("/auth/refresh")) {
    telemetry.refresh += 1;
  }
}

export function attachAuthTelemetry(context: {
  on: (event: "request", handler: (request: { url: () => string }) => void) => void;
}): void {
  context.on("request", (request) => {
    try {
      const { pathname } = new URL(request.url());
      if (pathname.includes("/auth/")) {
        recordAuthRequest(pathname);
      }
    } catch {
      // Ignore malformed URLs in telemetry.
    }
  });
}

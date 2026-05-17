export type EnvironmentName = "dev" | "recette" | "preprod" | "prod";

export type ApiStatus = "ok" | "disabled" | "error";

export type CheckStatus = ApiStatus;

export type ReadinessStatus = "ready" | "degraded";

export interface HealthResponse {
  status: "ok";
  service: string;
  environment: EnvironmentName;
}

export interface ReadyChecks {
  database: CheckStatus;
  redis: CheckStatus;
}

export interface ReadinessResponse {
  status: ReadinessStatus;
  checks: ReadyChecks;
}

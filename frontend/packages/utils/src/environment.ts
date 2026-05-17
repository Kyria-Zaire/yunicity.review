import type { EnvironmentName } from "@yunicity/types";

const ENVIRONMENTS: EnvironmentName[] = ["dev", "recette", "preprod", "prod"];

export function isEnvironmentName(value: string): value is EnvironmentName {
  return ENVIRONMENTS.includes(value as EnvironmentName);
}

export function getAppEnvironmentLabel(env: EnvironmentName): string {
  const labels: Record<EnvironmentName, string> = {
    dev: "Développement",
    recette: "Recette",
    preprod: "Préproduction",
    prod: "Production",
  };
  return labels[env];
}

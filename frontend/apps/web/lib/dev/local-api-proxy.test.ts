import { describe, expect, it } from "vitest";

import { resolveLocalApiProxyTarget } from "./local-api-proxy";

describe("local-api-proxy — fail-closed", () => {
  it("autorise uniquement le loopback QA/local 8000/8010 hors production", () => {
    expect(
      resolveLocalApiProxyTarget({
        rawTarget: "http://127.0.0.1:8010",
        nodeEnv: "development",
        railwayEnvironment: undefined,
      }),
    ).toBe("http://127.0.0.1:8010");
    expect(
      resolveLocalApiProxyTarget({
        rawTarget: undefined,
        nodeEnv: "development",
        railwayEnvironment: undefined,
      }),
    ).toBe("http://127.0.0.1:8010");
    expect(
      resolveLocalApiProxyTarget({
        rawTarget: "http://localhost:8000",
        nodeEnv: "development",
        railwayEnvironment: undefined,
      }),
    ).toBe("http://localhost:8000");
  });

  it("refuse production, Railway, LAN, staging et toute cible fournie par le navigateur", () => {
    const denied = [
      { rawTarget: "http://127.0.0.1:8010", nodeEnv: "production", railwayEnvironment: undefined },
      { rawTarget: "http://127.0.0.1:8010", nodeEnv: "development", railwayEnvironment: "production" },
      { rawTarget: "http://172.20.10.3:8010", nodeEnv: "development", railwayEnvironment: undefined },
      { rawTarget: "http://192.168.1.180:8010", nodeEnv: "development", railwayEnvironment: undefined },
      { rawTarget: "https://api.yunicity.app", nodeEnv: "development", railwayEnvironment: undefined },
      { rawTarget: "https://staging.example.com", nodeEnv: "development", railwayEnvironment: undefined },
      { rawTarget: "http://127.0.0.1:5432", nodeEnv: "development", railwayEnvironment: undefined },
    ] as const;

    for (const input of denied) {
      expect(resolveLocalApiProxyTarget(input), JSON.stringify(input)).toBeNull();
    }
  });
});

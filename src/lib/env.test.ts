import { afterEach, describe, expect, it, vi } from "vitest";
import { getHealthStatus } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("JEV readiness status", () => {
  it("reports ready only after explicit web enablement and key rotation", () => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    vi.stubEnv("TYPESAFE_BASE_URL", "https://api.typesafe.ai");
    vi.stubEnv("TYPESAFE_MODEL", "jev-1.14.0");
    vi.stubEnv("TYPESAFE_KEY_ROTATED", "false");
    vi.stubEnv("TYPESAFE_WEB_ENABLED", "true");
    vi.stubEnv("SCAMLENS_DEMO_MODE", "false");
    expect(getHealthStatus().jev).toBe(false);

    vi.stubEnv("TYPESAFE_KEY_ROTATED", "true");
    expect(getHealthStatus().jev).toBe(true);

    vi.stubEnv("TYPESAFE_BASE_URL", "http://api.typesafe.ai");
    expect(getHealthStatus().jev).toBe(false);
  });
});

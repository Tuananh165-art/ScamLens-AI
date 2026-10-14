import { describe, expect, it } from "vitest";
import { inspectUrl } from "./url";

describe("inspectUrl", () => {
  it("uses the registrable domain and flags host confusion without fetching", () => {
    const result = inspectUrl("https://bank.example.com.login-now.test/sign-in");
    expect(result.hostname).toBe("bank.example.com.login-now.test");
    expect(result.registrableDomain).toBe("login-now.test");
  });

  it("flags userinfo, IP hosts, and plain HTTP", () => {
    expect(inspectUrl("http://user:secret@192.0.2.1/login").signals).toHaveLength(3);
  });

  it("rejects executable protocols", () => {
    expect(() => inspectUrl("javascript:alert(1)")).toThrow("unsupported_protocol");
  });
});

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

  it("flags Unicode homographs, nonstandard ports, nested redirects, and impersonated brands without fetching", () => {
    const result = inspectUrl("https://vіetcombank-login.test:8443/continue?next=https%3A%2F%2Ffake.example");
    expect(result.isHomograph).toBe(true);
    expect(result.hasAbnormalPort).toBe(true);
    expect(result.nestedRedirectTarget).toBe("https://fake.example");
    expect(result.spoofedBrand).toBe("Vietcombank");
    expect(result.signals).toHaveLength(5);
    expect(result.isExample).toBe(true);
  });

  it("unwraps redirect destinations through multiple offline URL layers", () => {
    const middle = new URL("https://redirector.example/continue");
    middle.searchParams.set("q", "https://fake-login.example/sign-in");
    const outer = new URL("https://short.example/go");
    outer.searchParams.set("next", middle.href);

    expect(inspectUrl(outer.href).nestedRedirectTarget).toBe("https://fake-login.example/sign-in");
  });
});

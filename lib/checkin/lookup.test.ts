import { describe, expect, it } from "vitest";
import { cleanScannedCode, shortCodeSuffix } from "./lookup";
import { shortTicketCode } from "../tickets/display";

describe("shortCodeSuffix", () => {
  it("reads the short code with or without the prefix, any case", () => {
    expect(shortCodeSuffix("EA-K3J9QZ")).toBe("k3j9qz");
    expect(shortCodeSuffix(" ea-k3j9qz ")).toBe("k3j9qz");
    expect(shortCodeSuffix("K3J9QZ")).toBe("k3j9qz");
  });
  it("round-trips with shortTicketCode", () => {
    const id = "cmhx1y2z3abcdef";
    expect(id.endsWith(shortCodeSuffix(shortTicketCode(id))!)).toBe(true);
  });
  it("ignores names and emails", () => {
    expect(shortCodeSuffix("Maya Chen")).toBeNull();
    expect(shortCodeSuffix("maya@example.com")).toBeNull();
  });
});

describe("cleanScannedCode", () => {
  it("trims and rejects empty, long or non-string values", () => {
    expect(cleanScannedCode("  abc  ")).toBe("abc");
    expect(cleanScannedCode("")).toBeNull();
    expect(cleanScannedCode(42)).toBeNull();
    expect(cleanScannedCode("x".repeat(500))).toBeNull();
  });
});

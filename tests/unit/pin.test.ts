import { describe, expect, it } from "vitest";
import { isValidVaultPin } from "@/lib/pin";

describe("isValidVaultPin", () => {
  it("accepts exactly four digits", () => {
    expect(isValidVaultPin("0000")).toBe(true);
    expect(isValidVaultPin("1234")).toBe(true);
    expect(isValidVaultPin("9999")).toBe(true);
  });

  it("rejects anything else, including Number()-coercible junk", () => {
    expect(isValidVaultPin("")).toBe(false);
    expect(isValidVaultPin("123")).toBe(false);
    expect(isValidVaultPin("12345")).toBe(false);
    expect(isValidVaultPin("12e1")).toBe(false);
    expect(isValidVaultPin("12.3")).toBe(false);
    expect(isValidVaultPin("abcd")).toBe(false);
    expect(isValidVaultPin(" 1234")).toBe(false);
  });
});

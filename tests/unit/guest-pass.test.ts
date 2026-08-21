import { describe, expect, it } from "vitest";
import {
  createGuestPassCode,
  guestPassExpiryMs,
  isGuestPassExpired,
  MS_PER_DAY,
} from "@/lib/guest-pass";

describe("createGuestPassCode", () => {
  it("emits ZEN- plus six digits from a unit random", () => {
    expect(createGuestPassCode(0)).toBe("ZEN-100000");
    expect(createGuestPassCode(0.5)).toBe("ZEN-550000");
  });
});

describe("guest pass expiry", () => {
  const now = 1_700_000_000_000;

  it("offsets expiry by whole days", () => {
    expect(guestPassExpiryMs(7, now)).toBe(now + 7 * MS_PER_DAY);
  });

  it("treats now === expiry as expired", () => {
    const expiry = guestPassExpiryMs(1, now);
    expect(isGuestPassExpired(expiry, now)).toBe(false);
    expect(isGuestPassExpired(expiry, expiry)).toBe(true);
    expect(isGuestPassExpired(expiry, expiry + 1)).toBe(true);
  });
});

export const GUEST_PASS_PREFIX = "ZEN-";
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `ZEN-` plus a six-digit number from a [0, 1) random source. */
export function createGuestPassCode(random: number): string {
  const n = Math.floor(100000 + random * 900000);
  return `${GUEST_PASS_PREFIX}${n}`;
}

export function guestPassExpiryMs(days: number, now: number): number {
  return now + days * MS_PER_DAY;
}

export function isGuestPassExpired(expiry: number, now: number): boolean {
  return now >= expiry;
}

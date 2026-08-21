/** Client-side vault PIN: exactly four decimal digits. */
export const VAULT_PIN_PATTERN = /^\d{4}$/;

export function isValidVaultPin(pin: string): boolean {
  return VAULT_PIN_PATTERN.test(pin);
}

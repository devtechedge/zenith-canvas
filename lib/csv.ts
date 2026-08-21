/** Excel / LibreOffice formula prefixes used in CSV injection attacks. */
export const CSV_FORMULA_PREFIXES = ["=", "+", "-", "@"] as const;

/**
 * Neutralize a spreadsheet cell so Excel will not execute it as a formula.
 * Leading "- " bullets (checklist shorthand) are stripped first, matching
 * the canvas importer. Empty / whitespace-only cells become "".
 */
export function sanitizeCsvCell(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const itemText = trimmed.startsWith("- ") ? trimmed.slice(2) : trimmed;
  if (CSV_FORMULA_PREFIXES.some((prefix) => itemText.startsWith(prefix))) {
    return `'${itemText}`;
  }
  return itemText;
}

/** Split a CSV/text dump into sanitized checklist lines. */
export function parseCsvChecklist(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => sanitizeCsvCell(line))
    .filter((line) => line.length > 0);
}

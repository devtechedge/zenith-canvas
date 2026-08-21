import { describe, expect, it } from "vitest";
import { parseCsvChecklist, sanitizeCsvCell } from "@/lib/csv";

describe("sanitizeCsvCell", () => {
  it("prefixes Excel formula triggers with a quote", () => {
    expect(sanitizeCsvCell("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
    expect(sanitizeCsvCell("+1+1")).toBe("'+1+1");
    expect(sanitizeCsvCell("-SUM(A1)")).toBe("'-SUM(A1)");
    expect(sanitizeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("strips a leading checklist bullet before sanitizing", () => {
    expect(sanitizeCsvCell("- Milk")).toBe("Milk");
    expect(sanitizeCsvCell("- =HYPERLINK(http://evil)")).toBe("'=HYPERLINK(http://evil)");
  });

  it("leaves ordinary cells alone and drops blank lines", () => {
    expect(sanitizeCsvCell("  Groceries  ")).toBe("Groceries");
    expect(sanitizeCsvCell("   ")).toBe("");
  });
});

describe("parseCsvChecklist", () => {
  it("splits, trims, sanitizes, and drops empties", () => {
    const raw = "Eggs\n- Bread\n=IMPORTDATA(\"http://x\")\n\n  Cheese  \n";
    expect(parseCsvChecklist(raw)).toEqual([
      "Eggs",
      "Bread",
      "'=IMPORTDATA(\"http://x\")",
      "Cheese",
    ]);
  });
});

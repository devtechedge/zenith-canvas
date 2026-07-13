import { describe, expect, it } from "vitest";
import { createDefaultCanvases, createDefaultElements } from "@/lib/default-data";

describe("default data", () => {
  it("creates a non-empty starting workspace", () => {
    expect(createDefaultCanvases()).toHaveLength(4);
    expect(createDefaultElements()).toHaveLength(5);
  });
});

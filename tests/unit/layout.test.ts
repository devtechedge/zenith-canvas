import { describe, expect, it } from "vitest";
import {
  HOME_CARD_H,
  HOME_CARD_W,
  columnCount,
  estimateBoardWidth,
  nextEqualSlot,
  packEqualCards,
} from "@/lib/layout";

describe("columnCount", () => {
  it("is one column on a phone-width board", () => {
    expect(columnCount(342)).toBe(1);
  });

  it("fits four equal tiles on a typical desktop board", () => {
    expect(columnCount(1136)).toBe(4);
  });
});

describe("packEqualCards", () => {
  it("gives every card the same width and height", () => {
    const packed = packEqualCards(
      [
        { id: "a", x: 9, y: 9, w: 10, h: 10 },
        { id: "b", x: 1, y: 2, w: 400, h: 90 },
      ],
      800
    );
    expect(packed.every((c) => c.w === HOME_CARD_W && c.h === HOME_CARD_H)).toBe(true);
  });

  it("stacks in a single column when the board is narrow", () => {
    const packed = packEqualCards(
      [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 0, y: 0, w: 1, h: 1 },
      ],
      320
    );
    expect(packed[0].x).toBe(packed[1].x);
    expect(packed[1].y).toBeGreaterThan(packed[0].y);
  });
});

describe("nextEqualSlot", () => {
  it("places the 5th card on the next row of a 4-column board", () => {
    const first = nextEqualSlot(0, 1136);
    const fifth = nextEqualSlot(4, 1136);
    expect(fifth.w).toBe(HOME_CARD_W);
    expect(fifth.h).toBe(HOME_CARD_H);
    expect(fifth.x).toBe(first.x);
    expect(fifth.y).toBeGreaterThan(first.y);
  });
});

describe("estimateBoardWidth", () => {
  it("subtracts the desktop sidebar", () => {
    expect(estimateBoardWidth(1440)).toBe(1440 - 256 - 48);
  });

  it("uses the full viewport on mobile", () => {
    expect(estimateBoardWidth(390)).toBe(390 - 48);
  });
});

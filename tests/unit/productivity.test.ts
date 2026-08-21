import { describe, expect, it } from "vitest";
import { isStampUnlocked, productivityStars } from "@/lib/productivity";

describe("productivityStars", () => {
  it("defaults an empty board to three stars", () => {
    expect(productivityStars([])).toBe(3);
  });

  it("maps completion ratio onto 1–5 stars", () => {
    const n = (done: number, total: number) =>
      Array.from({ length: total }, (_, i) => ({ done: i < done }));

    expect(productivityStars(n(0, 10))).toBe(1);
    expect(productivityStars(n(2, 10))).toBe(1);
    expect(productivityStars(n(3, 10))).toBe(2);
    expect(productivityStars(n(5, 10))).toBe(3);
    expect(productivityStars(n(7, 10))).toBe(4);
    expect(productivityStars(n(9, 10))).toBe(5);
    expect(productivityStars(n(10, 10))).toBe(5);
  });
});

describe("isStampUnlocked", () => {
  const base = {
    elementCount: 0,
    streakCount: 0,
    completedTasksCount: 0,
    canvasCount: 0,
  };

  it("unlocks Pioneer / Streak / Achiever / Master at the documented thresholds", () => {
    expect(isStampUnlocked("pioneer", { ...base, elementCount: 1 })).toBe(true);
    expect(isStampUnlocked("streak", { ...base, streakCount: 3 })).toBe(true);
    expect(isStampUnlocked("achiever", { ...base, completedTasksCount: 5 })).toBe(true);
    expect(isStampUnlocked("master", { ...base, canvasCount: 4 })).toBe(true);
  });

  it("stays locked below those thresholds", () => {
    expect(isStampUnlocked("pioneer", base)).toBe(false);
    expect(isStampUnlocked("streak", { ...base, streakCount: 2 })).toBe(false);
    expect(isStampUnlocked("achiever", { ...base, completedTasksCount: 4 })).toBe(false);
    expect(isStampUnlocked("master", { ...base, canvasCount: 3 })).toBe(false);
  });
});

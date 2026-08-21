export type ChecklistItemLike = { done: boolean };

export type StampId = "pioneer" | "streak" | "achiever" | "master";

export type StampStats = {
  elementCount: number;
  streakCount: number;
  completedTasksCount: number;
  canvasCount: number;
};

/**
 * Map completed-checklist ratio onto a 1–5 star banner.
 * Empty boards default to 3 so a fresh workspace is not a "zero" first paint.
 */
export function productivityStars(items: ChecklistItemLike[]): number {
  if (items.length === 0) return 3;
  const ratio = items.filter((item) => item.done).length / items.length;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.4) return 2;
  if (ratio <= 0.6) return 3;
  if (ratio <= 0.8) return 4;
  return 5;
}

export function isStampUnlocked(stamp: StampId, stats: StampStats): boolean {
  switch (stamp) {
    case "pioneer":
      return stats.elementCount > 0;
    case "streak":
      return stats.streakCount >= 3;
    case "achiever":
      return stats.completedTasksCount >= 5;
    case "master":
      return stats.canvasCount >= 4;
  }
}

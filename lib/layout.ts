/** Shared Home-card size so every widget on first paint is the same tile. */
export const HOME_CARD_W = 260;
export const HOME_CARD_H = 240;
export const HOME_CARD_GAP = 16;
export const HOME_CARD_PAD = 8;
export const SIDEBAR_W = 256;
export const MAIN_PAD = 48;

export function columnCount(
  boardWidth: number,
  cardW = HOME_CARD_W,
  gap = HOME_CARD_GAP,
  pad = HOME_CARD_PAD
): number {
  const usable = Math.max(cardW, boardWidth - pad * 2);
  return Math.max(1, Math.floor((usable + gap) / (cardW + gap)));
}

export function estimateBoardWidth(viewportWidth: number): number {
  const sidebar = viewportWidth >= 768 ? SIDEBAR_W : 0;
  return Math.max(HOME_CARD_W + HOME_CARD_PAD * 2, viewportWidth - sidebar - MAIN_PAD);
}

export function packEqualCards<T extends { x: number; y: number; w: number; h: number }>(
  items: T[],
  boardWidth: number,
  cardW = HOME_CARD_W,
  cardH = HOME_CARD_H,
  gap = HOME_CARD_GAP,
  pad = HOME_CARD_PAD
): T[] {
  const cols = columnCount(boardWidth, cardW, gap, pad);
  return items.map((item, i) => ({
    ...item,
    w: cardW,
    h: cardH,
    x: pad + (i % cols) * (cardW + gap),
    y: pad + Math.floor(i / cols) * (cardH + gap),
  }));
}

export function nextEqualSlot(index: number, boardWidth: number) {
  const cols = columnCount(boardWidth);
  return {
    w: HOME_CARD_W,
    h: HOME_CARD_H,
    x: HOME_CARD_PAD + (index % cols) * (HOME_CARD_W + HOME_CARD_GAP),
    y: HOME_CARD_PAD + Math.floor(index / cols) * (HOME_CARD_H + HOME_CARD_GAP),
  };
}

import type { ActivityLog, CanvasBackgroundTheme, CanvasElement, FamilyCanvas, GuestPass } from "./types";

const CANVASES_KEY = "zenith-canvases";
const ACTIVE_CANVAS_KEY = "zenith-active-canvas-id";
const ELEMENTS_KEY = "zenith-elements";
const PIN_KEY = "zenith-vault-pin";
const GUEST_PASSES_KEY = "zenith-guest-passes";
const LOGS_KEY = "zenith-family-activities";
const ARCHIVED_KEY = "zenith-archived-elements";
const AUTO_ARCHIVE_KEY = "zenith-auto-archive-preference";
const WEEKLY_SPAWNER_KEY = "zenith-weekly-spawner-preference";
const STREAK_KEY = "zenith-streak-count";
const TASKS_KEY = "zenith-completed-tasks";
const THEME_KEY = "zenith-viewport-theme";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadCanvases(): FamilyCanvas[] {
  return safeRead<FamilyCanvas[]>(CANVASES_KEY, []);
}

export function saveCanvases(canvases: FamilyCanvas[]) {
  safeWrite(CANVASES_KEY, canvases);
}

export function loadActiveCanvasId(): string {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(ACTIVE_CANVAS_KEY) ?? "";
}

export function saveActiveCanvasId(canvasId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_CANVAS_KEY, canvasId);
}

export function loadElements(): CanvasElement[] {
  return safeRead<CanvasElement[]>(ELEMENTS_KEY, []);
}

export function saveElements(elements: CanvasElement[]) {
  safeWrite(ELEMENTS_KEY, elements);
}

export function loadVaultPin(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PIN_KEY);
}

export function saveVaultPin(pin: string | null) {
  if (typeof window === "undefined") return;
  if (pin === null) {
    window.localStorage.removeItem(PIN_KEY);
    return;
  }
  window.localStorage.setItem(PIN_KEY, pin);
}

export function loadGuestPasses(): GuestPass[] {
  return safeRead<GuestPass[]>(GUEST_PASSES_KEY, []);
}

export function saveGuestPasses(passes: GuestPass[]) {
  safeWrite(GUEST_PASSES_KEY, passes);
}

export function loadActivityLogs(): ActivityLog[] {
  return safeRead<ActivityLog[]>(LOGS_KEY, []);
}

export function saveActivityLogs(logs: ActivityLog[]) {
  safeWrite(LOGS_KEY, logs);
}

export function loadArchivedElements(): CanvasElement[] {
  return safeRead<CanvasElement[]>(ARCHIVED_KEY, []);
}

export function saveArchivedElements(elements: CanvasElement[]) {
  safeWrite(ARCHIVED_KEY, elements);
}

export function loadBooleanPreference(key: string, fallback = false): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "true";
}

export function saveBooleanPreference(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}

export function loadNumberPreference(key: string, fallback = 0): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function saveNumberPreference(key: string, value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}

export function loadCanvasTheme(): CanvasBackgroundTheme {
  const theme = typeof window === "undefined" ? "default" : window.localStorage.getItem(THEME_KEY);
  return (theme as CanvasBackgroundTheme) || "default";
}

export function saveCanvasTheme(theme: CanvasBackgroundTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
}

export const storageKeys = {
  canvases: CANVASES_KEY,
  activeCanvasId: ACTIVE_CANVAS_KEY,
  elements: ELEMENTS_KEY,
  vaultPin: PIN_KEY,
  guestPasses: GUEST_PASSES_KEY,
  activityLogs: LOGS_KEY,
  archivedElements: ARCHIVED_KEY,
  autoArchive: AUTO_ARCHIVE_KEY,
  weeklySpawner: WEEKLY_SPAWNER_KEY,
  streak: STREAK_KEY,
  tasks: TASKS_KEY,
  theme: THEME_KEY,
} as const;

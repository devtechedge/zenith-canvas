export type CanvasType = "text" | "checklist" | "sketch" | "countdown" | "media" | "sound";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CanvasElement {
  id: string;
  type: CanvasType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  content?: string;
  checklistItems?: ChecklistItem[];
  sketchData?: string;
  countdownTarget?: string;
  mediaUrl?: string;
  soundType?: "rain" | "campfire" | "ocean" | "forest";
  soundVolume?: number;
  createdAt?: number;
  deadline?: string;
  livePreviewActive?: boolean;
  stickers?: string[];
}

export interface FamilyCanvas {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
  stationery: "ivory" | "blueprint" | "cozy" | "terminal" | "cyber";
}

export interface GuestPass {
  id: string;
  code: string;
  label: string;
  expiry: number;
}

export interface ActivityLog {
  id: string;
  member: string;
  avatar: string;
  action: string;
  time: string;
  timestamp: number;
}

export type AccentTheme = "yellow" | "green" | "blue" | "pink";
export type CanvasBackgroundTheme = "default" | "hearth" | "moonlight" | "ivory" | "sunset" | "slate";
export type TextSize = "sm" | "md" | "lg";
export type ActiveTab = "appearance" | "safety" | "sharing" | "audio" | "automations";

export interface SimulationCursor {
  name: string;
  avatar: string;
  x: number;
  y: number;
  color: string;
}

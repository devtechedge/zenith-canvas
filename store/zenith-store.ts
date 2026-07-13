import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  createDefaultCanvases,
  createDefaultElements,
  createDefaultLogs,
} from "@/lib/default-data";
import type {
  ActivityLog,
  AccentTheme,
  ActiveTab,
  CanvasBackgroundTheme,
  CanvasElement,
  FamilyCanvas,
  GuestPass,
  SimulationCursor,
  TextSize,
} from "@/lib/types";
import { createId } from "@/lib/id";

type AppState = {
  canvases: FamilyCanvas[];
  activeCanvasId: string;
  elements: CanvasElement[];
  accentTheme: AccentTheme;
  isCozyStoryMode: boolean;
  borderWeight: number;
  textSize: TextSize;
  shadowDepth: string;
  activeTab: ActiveTab;
  isControlDeckOpen: boolean;
  isReadOnlyMode: boolean;
  isCopyInterceptEnabled: boolean;
  isCursorTrailsEnabled: boolean;
  showShareModal: boolean;
  copiedShareLink: boolean;
  vaultPIN: string | null;
  isVaultUnlocked: boolean;
  pinInput: string;
  pinSetupVal: string;
  pinError: boolean;
  guestPasses: GuestPass[];
  activityLogs: ActivityLog[];
  simulatedCursors: SimulationCursor[];
  archivedElements: CanvasElement[];
  autoArchiveEnabled: boolean;
  weeklySpawnerEnabled: boolean;
  isDraggingFile: boolean;
  showBlueprintModal: boolean;
  isDailyBannerDismissed: boolean;
  highlightIncomplete: boolean;
  incomingEmail: { from: string; subject: string; body: string };
  activeNotifications: string[];
  ambientAudioActive: boolean;
  audioVolumes: { rain: number; campfire: number; ocean: number; forest: number };
  confettiPool: Array<{ id: number; left: number; top: number; color: string; size: number; duration: number; rotate: number }>;
  streakCount: number;
  completedTasksCount: number;
  mascotTipIndex: number;
  isMascotBubbleOpen: boolean;
  canvasBackgroundTheme: CanvasBackgroundTheme;
  showArchitectureModal: boolean;
  activeStickerPickerId: string | null;
  draggedElementId: string | null;
  dragOffset: { x: number; y: number };
  isResizing: boolean;
  resizeStartSize: { w: number; h: number };
  resizeStartPos: { x: number; y: number };
  setCanvases: (value: FamilyCanvas[]) => void;
  setActiveCanvasId: (value: string) => void;
  setElements: (value: CanvasElement[]) => void;
  setAccentTheme: (value: AccentTheme) => void;
  setIsCozyStoryMode: (value: boolean) => void;
  setBorderWeight: (value: number) => void;
  setTextSize: (value: TextSize) => void;
  setShadowDepth: (value: string) => void;
  setActiveTab: (value: ActiveTab) => void;
  setIsControlDeckOpen: (value: boolean) => void;
  setIsReadOnlyMode: (value: boolean) => void;
  setIsCopyInterceptEnabled: (value: boolean) => void;
  setIsCursorTrailsEnabled: (value: boolean) => void;
  setShowShareModal: (value: boolean) => void;
  setCopiedShareLink: (value: boolean) => void;
  setVaultPIN: (value: string | null) => void;
  setIsVaultUnlocked: (value: boolean) => void;
  setPinInput: (value: string) => void;
  setPinSetupVal: (value: string) => void;
  setPinError: (value: boolean) => void;
  setGuestPasses: (value: GuestPass[]) => void;
  setActivityLogs: (value: ActivityLog[]) => void;
  setSimulatedCursors: (value: SimulationCursor[]) => void;
  setArchivedElements: (value: CanvasElement[]) => void;
  setAutoArchiveEnabled: (value: boolean) => void;
  setWeeklySpawnerEnabled: (value: boolean) => void;
  setIsDraggingFile: (value: boolean) => void;
  setShowBlueprintModal: (value: boolean) => void;
  setIsDailyBannerDismissed: (value: boolean) => void;
  setHighlightIncomplete: (value: boolean) => void;
  setIncomingEmail: (value: { from: string; subject: string; body: string }) => void;
  setActiveNotifications: (value: string[]) => void;
  setAmbientAudioActive: (value: boolean) => void;
  setAudioVolumes: (value: { rain: number; campfire: number; ocean: number; forest: number }) => void;
  setConfettiPool: (value: AppState["confettiPool"]) => void;
  setStreakCount: (value: number) => void;
  setCompletedTasksCount: (value: number) => void;
  setMascotTipIndex: (value: number) => void;
  setIsMascotBubbleOpen: (value: boolean) => void;
  setCanvasBackgroundTheme: (value: CanvasBackgroundTheme) => void;
  setShowArchitectureModal: (value: boolean) => void;
  setActiveStickerPickerId: (value: string | null) => void;
  setDraggedElementId: (value: string | null) => void;
  setDragOffset: (value: { x: number; y: number }) => void;
  setIsResizing: (value: boolean) => void;
  setResizeStartSize: (value: { w: number; h: number }) => void;
  setResizeStartPos: (value: { x: number; y: number }) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  addChecklistItem: (id: string, text: string) => void;
  toggleChecklistItem: (elementId: string, itemId: string) => void;
  addCanvas: (name: string, emoji: string) => void;
  setActiveCanvas: (id: string) => void;
  archiveElement: (id: string) => void;
  createGuestPass: (label: string) => void;
  addActivityLog: (entry: ActivityLog) => void;
  createConfettiBurst: () => void;
  loadDefaults: () => void;
};

type AppDataState = Omit<
  AppState,
  | "setCanvases"
  | "setActiveCanvasId"
  | "setElements"
  | "setAccentTheme"
  | "setIsCozyStoryMode"
  | "setBorderWeight"
  | "setTextSize"
  | "setShadowDepth"
  | "setActiveTab"
  | "setIsControlDeckOpen"
  | "setIsReadOnlyMode"
  | "setIsCopyInterceptEnabled"
  | "setIsCursorTrailsEnabled"
  | "setShowShareModal"
  | "setCopiedShareLink"
  | "setVaultPIN"
  | "setIsVaultUnlocked"
  | "setPinInput"
  | "setPinSetupVal"
  | "setPinError"
  | "setGuestPasses"
  | "setActivityLogs"
  | "setSimulatedCursors"
  | "setArchivedElements"
  | "setAutoArchiveEnabled"
  | "setWeeklySpawnerEnabled"
  | "setIsDraggingFile"
  | "setShowBlueprintModal"
  | "setIsDailyBannerDismissed"
  | "setHighlightIncomplete"
  | "setIncomingEmail"
  | "setActiveNotifications"
  | "setAmbientAudioActive"
  | "setAudioVolumes"
  | "setConfettiPool"
  | "setStreakCount"
  | "setCompletedTasksCount"
  | "setMascotTipIndex"
  | "setIsMascotBubbleOpen"
  | "setCanvasBackgroundTheme"
  | "setShowArchitectureModal"
  | "setActiveStickerPickerId"
  | "setDraggedElementId"
  | "setDragOffset"
  | "setIsResizing"
  | "setResizeStartSize"
  | "setResizeStartPos"
  | "addElement"
  | "updateElement"
  | "deleteElement"
  | "duplicateElement"
  | "addChecklistItem"
  | "toggleChecklistItem"
  | "addCanvas"
  | "setActiveCanvas"
  | "archiveElement"
  | "createGuestPass"
  | "addActivityLog"
  | "createConfettiBurst"
  | "loadDefaults"
>;

const createInitialState = (): AppDataState => {
  const now = Date.now();
  return {
    canvases: createDefaultCanvases(now),
    activeCanvasId: "canvas-1",
    elements: createDefaultElements(now),
    accentTheme: "yellow",
    isCozyStoryMode: false,
    borderWeight: 4,
    textSize: "md",
    shadowDepth: "neo-shadow",
    activeTab: "appearance",
    isControlDeckOpen: false,
    isReadOnlyMode: false,
    isCopyInterceptEnabled: false,
    isCursorTrailsEnabled: false,
    showShareModal: false,
    copiedShareLink: false,
    vaultPIN: null,
    isVaultUnlocked: true,
    pinInput: "",
    pinSetupVal: "",
    pinError: false,
    guestPasses: [],
    activityLogs: createDefaultLogs(now),
    simulatedCursors: [],
    archivedElements: [],
    autoArchiveEnabled: true,
    weeklySpawnerEnabled: true,
    isDraggingFile: false,
    showBlueprintModal: false,
    isDailyBannerDismissed: false,
    highlightIncomplete: false,
    incomingEmail: {
      from: "mom-inbox@zenith-mail.com",
      subject: "Vet Appointment update 🐶",
      body: "Please check the vet schedule! Teddy needs his shot on Thursday morning. Make sure to feed him on time.",
    },
    activeNotifications: [],
    ambientAudioActive: false,
    audioVolumes: { rain: 0.3, campfire: 0, ocean: 0, forest: 0 },
    confettiPool: [],
    streakCount: 3,
    completedTasksCount: 5,
    mascotTipIndex: 0,
    isMascotBubbleOpen: true,
    canvasBackgroundTheme: "default",
    showArchitectureModal: false,
    activeStickerPickerId: null,
    draggedElementId: null,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizeStartSize: { w: 0, h: 0 },
    resizeStartPos: { x: 0, y: 0 },
  };
};

export const useZenithStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      setCanvases: (value) => set({ canvases: value }),
      setActiveCanvasId: (value) => set({ activeCanvasId: value }),
      setElements: (value) => set({ elements: value }),
      setAccentTheme: (value) => set({ accentTheme: value }),
      setIsCozyStoryMode: (value) => set({ isCozyStoryMode: value }),
      setBorderWeight: (value) => set({ borderWeight: value }),
      setTextSize: (value) => set({ textSize: value }),
      setShadowDepth: (value) => set({ shadowDepth: value }),
      setActiveTab: (value) => set({ activeTab: value }),
      setIsControlDeckOpen: (value) => set({ isControlDeckOpen: value }),
      setIsReadOnlyMode: (value) => set({ isReadOnlyMode: value }),
      setIsCopyInterceptEnabled: (value) => set({ isCopyInterceptEnabled: value }),
      setIsCursorTrailsEnabled: (value) => set({ isCursorTrailsEnabled: value }),
      setShowShareModal: (value) => set({ showShareModal: value }),
      setCopiedShareLink: (value) => set({ copiedShareLink: value }),
      setVaultPIN: (value) => set({ vaultPIN: value }),
      setIsVaultUnlocked: (value) => set({ isVaultUnlocked: value }),
      setPinInput: (value) => set({ pinInput: value }),
      setPinSetupVal: (value) => set({ pinSetupVal: value }),
      setPinError: (value) => set({ pinError: value }),
      setGuestPasses: (value) => set({ guestPasses: value }),
      setActivityLogs: (value) => set({ activityLogs: value }),
      setSimulatedCursors: (value) => set({ simulatedCursors: value }),
      setArchivedElements: (value) => set({ archivedElements: value }),
      setAutoArchiveEnabled: (value) => set({ autoArchiveEnabled: value }),
      setWeeklySpawnerEnabled: (value) => set({ weeklySpawnerEnabled: value }),
      setIsDraggingFile: (value) => set({ isDraggingFile: value }),
      setShowBlueprintModal: (value) => set({ showBlueprintModal: value }),
      setIsDailyBannerDismissed: (value) => set({ isDailyBannerDismissed: value }),
      setHighlightIncomplete: (value) => set({ highlightIncomplete: value }),
      setIncomingEmail: (value) => set({ incomingEmail: value }),
      setActiveNotifications: (value) => set({ activeNotifications: value }),
      setAmbientAudioActive: (value) => set({ ambientAudioActive: value }),
      setAudioVolumes: (value) => set({ audioVolumes: value }),
      setConfettiPool: (value) => set({ confettiPool: value }),
      setStreakCount: (value) => set({ streakCount: value }),
      setCompletedTasksCount: (value) => set({ completedTasksCount: value }),
      setMascotTipIndex: (value) => set({ mascotTipIndex: value }),
      setIsMascotBubbleOpen: (value) => set({ isMascotBubbleOpen: value }),
      setCanvasBackgroundTheme: (value) => set({ canvasBackgroundTheme: value }),
      setShowArchitectureModal: (value) => set({ showArchitectureModal: value }),
      setActiveStickerPickerId: (value) => set({ activeStickerPickerId: value }),
      setDraggedElementId: (value) => set({ draggedElementId: value }),
      setDragOffset: (value) => set({ dragOffset: value }),
      setIsResizing: (value) => set({ isResizing: value }),
      setResizeStartSize: (value) => set({ resizeStartSize: value }),
      setResizeStartPos: (value) => set({ resizeStartPos: value }),
      addElement: (element) => set({ elements: [...get().elements, element] }),
      updateElement: (id, patch) => set({ elements: get().elements.map((item) => (item.id === id ? { ...item, ...patch } : item)) }),
      deleteElement: (id) => set({ elements: get().elements.filter((item) => item.id !== id) }),
      duplicateElement: (id) => {
        const source = get().elements.find((item) => item.id === id);
        if (!source) return;
        const clone = { ...source, id: createId("elem"), x: source.x + 20, y: source.y + 20 };
        set({ elements: [...get().elements, clone] });
      },
      addChecklistItem: (id, text) => set({
        elements: get().elements.map((item) => item.id === id
          ? { ...item, checklistItems: [...(item.checklistItems ?? []), { id: createId("todo"), text, done: false }] }
          : item),
      }),
      toggleChecklistItem: (elementId, itemId) => set({
        elements: get().elements.map((item) => item.id === elementId
          ? {
              ...item,
              checklistItems: (item.checklistItems ?? []).map((entry) => entry.id === itemId ? { ...entry, done: !entry.done } : entry),
            }
          : item),
      }),
      addCanvas: (name, emoji) => set({
        canvases: [...get().canvases, { id: createId("canvas"), name, emoji, createdAt: Date.now(), stationery: "ivory" }],
      }),
      setActiveCanvas: (id) => set({ activeCanvasId: id }),
      archiveElement: (id) => {
        const source = get().elements.find((item) => item.id === id);
        if (!source) return;
        set({
          elements: get().elements.filter((item) => item.id !== id),
          archivedElements: [...get().archivedElements, source],
        });
      },
      createGuestPass: (label) => set({
        guestPasses: [...get().guestPasses, { id: createId("pass"), code: Math.random().toString(36).slice(2, 8).toUpperCase(), label, expiry: Date.now() + 1000 * 60 * 60 * 24 }],
      }),
      addActivityLog: (entry) => set({ activityLogs: [entry, ...get().activityLogs].slice(0, 50) }),
      createConfettiBurst: () => set({
        confettiPool: Array.from({ length: 12 }, (_, index) => ({
          id: Date.now() + index,
          left: Math.random() * 100,
          top: Math.random() * 100,
          color: ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"][index % 4],
          size: 8 + Math.random() * 8,
          duration: 1200 + Math.random() * 800,
          rotate: Math.random() * 360,
        })),
      }),
      loadDefaults: () => set(createInitialState()),
    }),
    {
      name: "zenith-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        canvases: state.canvases,
        activeCanvasId: state.activeCanvasId,
        elements: state.elements,
        accentTheme: state.accentTheme,
        isCozyStoryMode: state.isCozyStoryMode,
        borderWeight: state.borderWeight,
        textSize: state.textSize,
        shadowDepth: state.shadowDepth,
        activeTab: state.activeTab,
        isControlDeckOpen: state.isControlDeckOpen,
        isReadOnlyMode: state.isReadOnlyMode,
        isCopyInterceptEnabled: state.isCopyInterceptEnabled,
        isCursorTrailsEnabled: state.isCursorTrailsEnabled,
        vaultPIN: state.vaultPIN,
        guestPasses: state.guestPasses,
        activityLogs: state.activityLogs,
        archivedElements: state.archivedElements,
        autoArchiveEnabled: state.autoArchiveEnabled,
        weeklySpawnerEnabled: state.weeklySpawnerEnabled,
        streakCount: state.streakCount,
        completedTasksCount: state.completedTasksCount,
        canvasBackgroundTheme: state.canvasBackgroundTheme,
        activeStickerPickerId: state.activeStickerPickerId,
      }),
    }
  )
);

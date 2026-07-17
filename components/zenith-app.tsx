"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Check, Compass, FileText, Lock, Plus, Share2, Shield, Sliders, Trash2, X } from "lucide-react";
import { useZenithStore } from "@/store/zenith-store";
import type { CanvasElement } from "@/lib/types";

const palette = ["#FEF08A", "#A7F3D0", "#E0F2FE", "#FDE047", "#FBCFE8", "#DDD6FE"] as const;

function formatDate(date: string | undefined) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString();
}

function ElementCard({ element }: { element: CanvasElement }) {
  const updateElement = useZenithStore((state) => state.updateElement);
  const deleteElement = useZenithStore((state) => state.deleteElement);
  const toggleChecklistItem = useZenithStore((state) => state.toggleChecklistItem);
  const addChecklistItem = useZenithStore((state) => state.addChecklistItem);
  const archiveElement = useZenithStore((state) => state.archiveElement);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  return (
    <div className="neo-shadow relative rounded-none border-4 border-black bg-white p-4 text-[#1A1A1A]" style={{ backgroundColor: element.color }}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight">{element.title}</h3>
          <p className="text-[10px] font-semibold uppercase opacity-60">{element.type}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => archiveElement(element.id)} className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase">
            <Archive className="h-3 w-3" />
          </button>
          <button onClick={() => deleteElement(element.id)} className="border-2 border-black bg-rose-500 px-2 py-1 text-[10px] font-black uppercase text-white">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {element.type === "text" && (
        <textarea
          className="min-h-28 w-full resize-none border-2 border-black bg-white/70 p-2 text-sm outline-none"
          value={element.content ?? ""}
          onChange={(event) => updateElement(element.id, { content: event.target.value })}
        />
      )}
      {element.type === "checklist" && (
        <div className="space-y-2">
          <ul className="space-y-1">
            {(element.checklistItems ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-2 border-2 border-black bg-white/70 px-2 py-1 text-sm">
                <button onClick={() => toggleChecklistItem(element.id, item.id)} className="flex h-5 w-5 items-center justify-center border-2 border-black bg-white text-[10px] font-black">
                  {item.done ? <Check className="h-3 w-3" /> : ""}
                </button>
                <span className={item.done ? "line-through opacity-60" : ""}>{item.text}</span>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newChecklistItem.trim()) return;
              addChecklistItem(element.id, newChecklistItem.trim());
              setNewChecklistItem("");
            }}
          >
            <input value={newChecklistItem} onChange={(event) => setNewChecklistItem(event.target.value)} className="min-w-0 flex-1 border-2 border-black bg-white px-2 py-1 text-sm outline-none" placeholder="Add task" />
            <button className="border-2 border-black bg-black px-3 py-1 text-xs font-black uppercase text-white">Add</button>
          </form>
        </div>
      )}
      {element.type === "countdown" && <p className="text-sm font-semibold">Target date: {formatDate(element.countdownTarget)}</p>}
      {element.type === "sound" && <p className="text-sm font-semibold">Ambient sound: {element.soundType ?? "rain"} at volume {(element.soundVolume ?? 0.3).toFixed(1)}</p>}
      {element.type === "sketch" && <p className="text-sm font-semibold">Sketch pad ready. Keep drawing support in a dedicated canvas layer.</p>}
      {element.type === "media" && <p className="text-sm font-semibold break-all">{element.mediaUrl ?? "No media attached."}</p>}
      <div className="mt-3 text-[10px] font-bold uppercase opacity-60">
        Position {element.x}, {element.y} · Size {element.w} x {element.h}
      </div>
    </div>
  );
}

function Sidebar() {
  const canvases = useZenithStore((state) => state.canvases);
  const activeCanvasId = useZenithStore((state) => state.activeCanvasId);
  const setActiveCanvas = useZenithStore((state) => state.setActiveCanvas);
  const addCanvas = useZenithStore((state) => state.addCanvas);
  const elements = useZenithStore((state) => state.elements);
  const archivedElements = useZenithStore((state) => state.archivedElements);

  return (
    <aside className="neo-shadow flex h-full flex-col gap-4 border-4 border-black bg-[#fff7cc] p-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
          <Compass className="h-4 w-4" /> Canvases
        </div>
        <div className="mt-3 space-y-2">
          {canvases.map((canvas) => (
            <button
              key={canvas.id}
              onClick={() => setActiveCanvas(canvas.id)}
              className={`flex w-full items-center justify-between border-2 border-black px-3 py-2 text-left text-sm font-bold ${activeCanvasId === canvas.id ? "bg-black text-white" : "bg-white"}`}
            >
              <span>{canvas.emoji} {canvas.name}</span>
              <span className="text-[10px] uppercase opacity-70">{canvas.stationery}</span>
            </button>
          ))}
        </div>
        <button onClick={() => addCanvas(`Canvas ${canvases.length + 1}`, "🗂️")} className="mt-3 flex w-full items-center justify-center gap-2 border-2 border-black bg-[#FFB703] px-3 py-2 text-xs font-black uppercase">
          <Plus className="h-4 w-4" /> New Canvas
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
        <div className="border-2 border-black bg-white p-2">Active: {elements.length}</div>
        <div className="border-2 border-black bg-white p-2">Archived: {archivedElements.length}</div>
      </div>
    </aside>
  );
}

function ControlDeck() {
  const isControlDeckOpen = useZenithStore((state) => state.isControlDeckOpen);
  const setIsControlDeckOpen = useZenithStore((state) => state.setIsControlDeckOpen);
  const isReadOnlyMode = useZenithStore((state) => state.isReadOnlyMode);
  const setIsReadOnlyMode = useZenithStore((state) => state.setIsReadOnlyMode);
  const isCopyInterceptEnabled = useZenithStore((state) => state.isCopyInterceptEnabled);
  const setIsCopyInterceptEnabled = useZenithStore((state) => state.setIsCopyInterceptEnabled);
  const isCursorTrailsEnabled = useZenithStore((state) => state.isCursorTrailsEnabled);
  const setIsCursorTrailsEnabled = useZenithStore((state) => state.setIsCursorTrailsEnabled);
  const setAccentTheme = useZenithStore((state) => state.setAccentTheme);
  const createConfettiBurst = useZenithStore((state) => state.createConfettiBurst);

  return (
    <aside className="neo-shadow flex h-full flex-col gap-4 border-4 border-black bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black uppercase tracking-widest">
          <Sliders className="mr-2 inline h-4 w-4" /> Control Deck
        </div>
        <button onClick={() => setIsControlDeckOpen(!isControlDeckOpen)} className="border-2 border-black px-2 py-1 text-[10px] font-black uppercase">
          {isControlDeckOpen ? "Close" : "Open"}
        </button>
      </div>
      {isControlDeckOpen ? (
        <div className="space-y-4 text-sm">
          <label className="flex items-center justify-between gap-3 border-2 border-black bg-[#fafafa] p-2">
            <span className="font-semibold">Read-only mode</span>
            <input type="checkbox" checked={isReadOnlyMode} onChange={(event) => setIsReadOnlyMode(event.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3 border-2 border-black bg-[#fafafa] p-2">
            <span className="font-semibold">Copy intercept</span>
            <input type="checkbox" checked={isCopyInterceptEnabled} onChange={(event) => setIsCopyInterceptEnabled(event.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3 border-2 border-black bg-[#fafafa] p-2">
            <span className="font-semibold">Cursor trails</span>
            <input type="checkbox" checked={isCursorTrailsEnabled} onChange={(event) => setIsCursorTrailsEnabled(event.target.checked)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {palette.map((color) => (
              <button
                key={color}
                onClick={() => setAccentTheme(color === "#FEF08A" ? "yellow" : color === "#A7F3D0" ? "green" : color === "#E0F2FE" ? "blue" : "pink")}
                className="h-10 border-2 border-black"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button onClick={() => createConfettiBurst()} className="w-full border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase text-white">Trigger confetti</button>
        </div>
      ) : (
        <p className="text-sm text-stone-500">Open the deck to tune appearance, sharing, audio and automation behavior.</p>
      )}
    </aside>
  );
}

function Notifications({ notifications }: { notifications: string[] }) {
  if (!notifications.length) return null;
  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div key={notification} className="border-2 border-black bg-[#FFB703] p-2 text-xs font-black uppercase">
          {notification}
        </div>
      ))}
    </div>
  );
}

export default function ZenithApp() {
  const elements = useZenithStore((store) => store.elements);
  const isCursorTrailsEnabled = useZenithStore((store) => store.isCursorTrailsEnabled);
  const setSimulatedCursors = useZenithStore((store) => store.setSimulatedCursors);
  const canvasBackgroundTheme = useZenithStore((store) => store.canvasBackgroundTheme);
  const activeCanvas = useZenithStore((store) => store.canvases.find((canvas) => canvas.id === store.activeCanvasId));
  const isVaultUnlocked = useZenithStore((store) => store.isVaultUnlocked);
  const loadDefaults = useZenithStore((store) => store.loadDefaults);
  const setIsVaultUnlocked = useZenithStore((store) => store.setIsVaultUnlocked);
  const setShowShareModal = useZenithStore((store) => store.setShowShareModal);
  const setShowBlueprintModal = useZenithStore((store) => store.setShowBlueprintModal);
  const showShareModal = useZenithStore((store) => store.showShareModal);
  const showBlueprintModal = useZenithStore((store) => store.showBlueprintModal);
  const [hydrated, setHydrated] = useState(false);

  const notifications = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return elements.flatMap((element) => {
      const items: string[] = [];
      if (element.deadline === today) items.push(`Checklist "${element.title}" is due today`);
      if (element.countdownTarget === today) items.push(`Countdown "${element.title}" reaches today`);
      return items;
    });
  }, [elements]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!isCursorTrailsEnabled) {
      setSimulatedCursors([]);
      return;
    }
    const members = [
      { name: "Mom", avatar: "👩‍🦰", color: "#EC4899" },
      { name: "Dad", avatar: "👨‍🦱", color: "#3B82F6" },
      { name: "Lucy", avatar: "👧", color: "#10B981" },
      { name: "Billy", avatar: "👦", color: "#F59E0B" },
    ];
    setSimulatedCursors(members.map((member, index) => ({ ...member, x: 260 + index * 80, y: 160 + index * 60 })));
  }, [isCursorTrailsEnabled, setSimulatedCursors]);

  if (!hydrated) {
    return <div className="p-8 text-sm font-semibold">Loading Zenith Canvas...</div>;
  }

  return (
    <div className={`min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7cc,_#fafafa_55%,_#f3f4f6)] text-[#1A1A1A] ${canvasBackgroundTheme === "slate" ? "bg-slate-100" : ""}`}>
      <header className="border-b-4 border-black bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-500">Zenith Canvas</p>
            <h1 className="text-xl font-black uppercase tracking-tight">Production-ready workspace</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <button onClick={() => setShowShareModal(true)} className="border-2 border-black bg-black px-3 py-2 text-white"><Share2 className="mr-1 inline h-4 w-4" /> Share</button>
            <button onClick={() => setShowBlueprintModal(true)} className="border-2 border-black bg-[#FFB703] px-3 py-2"><FileText className="mr-1 inline h-4 w-4" /> Templates</button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <Sidebar />
        <section className="space-y-4">
          <Notifications notifications={notifications} />
          <div className="neo-shadow border-4 border-black bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-stone-500">Active canvas</div>
                <div className="text-lg font-black">{activeCanvas?.name ?? "No canvas selected"}</div>
              </div>
              <div className="flex items-center gap-2 text-xs font-black uppercase">
                <button onClick={() => setIsVaultUnlocked(!isVaultUnlocked)} className="border-2 border-black px-3 py-2">{isVaultUnlocked ? <><UnlockIcon /> Unlocked</> : <><LockIcon /> Locked</>}</button>
                <button onClick={() => loadDefaults()} className="border-2 border-black px-3 py-2">Reset</button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {elements.map((element) => (
                <ElementCard key={element.id} element={element} />
              ))}
            </div>
          </div>
        </section>
        <ControlDeck />
      </main>
      {showShareModal && <ShareModal />}
      {showBlueprintModal && <BlueprintModal />}
    </div>
  );
}

function UnlockIcon() {
  return <Shield className="mr-1 inline h-4 w-4" />;
}

function LockIcon() {
  return <Lock className="mr-1 inline h-4 w-4" />;
}

function ShareModal() {
  const activeCanvasId = useZenithStore((state) => state.activeCanvasId);
  const setShowShareModal = useZenithStore((state) => state.setShowShareModal);
  const url = typeof window !== "undefined" ? `${window.location.origin}/canvas/${activeCanvasId}` : "";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md border-4 border-black bg-white p-4 neo-shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase">Share link</h2>
          <button onClick={() => setShowShareModal(false)}><X /></button>
        </div>
        <p className="break-all border-2 border-black bg-stone-50 p-2 text-xs">{url}</p>
      </div>
    </div>
  );
}

function BlueprintModal() {
  const setShowBlueprintModal = useZenithStore((state) => state.setShowBlueprintModal);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl border-4 border-black bg-white p-5 neo-shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase">Blueprint templates</h2>
          <button onClick={() => setShowBlueprintModal(false)}><X /></button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { title: "Academic planner", description: "Sticky notes, checklists, countdowns and a study theme." },
            { title: "Pet care log", description: "Vet reminders, walking checklist and family notes." },
            { title: "Wellness guide", description: "Routine checklist and calm visual theme." },
          ].map((item) => (
            <div key={item.title} className="border-2 border-black p-4">
              <h3 className="font-black uppercase">{item.title}</h3>
              <p className="mt-2 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

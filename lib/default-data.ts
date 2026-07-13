import type { ActivityLog, CanvasElement, FamilyCanvas } from "./types";

export function createDefaultCanvases(now = Date.now()): FamilyCanvas[] {
  return [
    { id: "canvas-1", name: "Family Groceries", emoji: "🍎", createdAt: now - 50000, stationery: "blueprint" },
    { id: "canvas-2", name: "Summer Travel Plan", emoji: "✈️", createdAt: now - 40000, stationery: "ivory" },
    { id: "canvas-3", name: "Lucy's Creative Sandbox", emoji: "🎨", createdAt: now - 30000, stationery: "cozy" },
    { id: "canvas-4", name: "Secure Private Archive", emoji: "🔒", createdAt: now - 20000, stationery: "terminal" },
  ];
}

export function createDefaultElements(now = Date.now()): CanvasElement[] {
  return [
    {
      id: "elem-1",
      type: "text",
      title: "📌 Welcome Note",
      x: 40,
      y: 40,
      w: 320,
      h: 200,
      color: "#FEF08A",
      content:
        "Welcome to your Zenith Workspace! This is a real-time responsive family workspace.\n\n👉 Switch canvases in the left panel.\n👉 Add checklist items, sketch drawings, launch timers, or adjust focus noise!\n👉 Check out the right Ops Control Panel for advanced layout themes and safety PIN gates.",
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
      livePreviewActive: false,
    },
    {
      id: "elem-2",
      type: "checklist",
      title: "🛒 Grocery Runs",
      x: 400,
      y: 40,
      w: 280,
      h: 260,
      color: "#A7F3D0",
      checklistItems: [
        { id: "todo-1", text: "Organic Fuji Apples", done: true },
        { id: "todo-2", text: "Lactose-Free Milk", done: false },
        { id: "todo-3", text: "Whole Wheat Bread", done: false },
        { id: "todo-4", text: "Greek Yogurt (Honey flavor)", done: false },
      ],
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
      deadline: new Date(now).toISOString().split("T")[0],
    },
    {
      id: "elem-3",
      type: "sketch",
      title: "✏️ Quick Doodle Pad",
      x: 40,
      y: 280,
      w: 320,
      h: 300,
      color: "#E0F2FE",
      sketchData: "",
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    },
    {
      id: "elem-4",
      type: "countdown",
      title: "⏱️ Family Picnic Countdown",
      x: 720,
      y: 40,
      w: 300,
      h: 210,
      color: "#FDE047",
      countdownTarget: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      createdAt: now - 12 * 60 * 60 * 1000,
    },
    {
      id: "elem-5",
      type: "sound",
      title: "🧘 Focus Noise Engine",
      x: 400,
      y: 330,
      w: 280,
      h: 250,
      color: "#FBCFE8",
      soundType: "rain",
      soundVolume: 0.5,
      createdAt: now - 2 * 60 * 60 * 1000,
    },
  ];
}

export function createDefaultLogs(now = Date.now()): ActivityLog[] {
  return [
    { id: "act-1", member: "Mom", avatar: "👩‍🦰", action: '✏️ Updated checklist: "Grocery Runs"', time: "3 mins ago", timestamp: now - 180000 },
    { id: "act-2", member: "Dad", avatar: "👨‍🦱", action: "🧘 Activated Rain sound loop in Control Deck", time: "10 mins ago", timestamp: now - 600000 },
    { id: "act-3", member: "Lucy", avatar: "👧", action: '🎨 Drew a flower in "Quick Doodle Pad"', time: "1 hr ago", timestamp: now - 3600000 },
  ];
}

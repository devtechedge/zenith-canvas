# Zenith Canvas

Neo-brutalist family canvas workspace — drag-and-drop bento cards, client-side persistence, Web Audio chimes, and a 4-digit PIN vault.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://zenith-canvas.vercel.app)
[![CI](https://github.com/devtechedge/zenith-canvas/actions/workflows/ci.yml/badge.svg)](https://github.com/devtechedge/zenith-canvas/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Live Demo

**https://zenith-canvas.vercel.app**

> **Status:** Client-side only. Canvases, checklists, sketches, guest passes and the vault PIN live in `localStorage`. There is no account system, no database, and no production backend. Do not store secrets on the board.

---

## Screenshots

| Workspace | Control Deck |
|-----------|----------------|
| ![Workspace](docs/screenshots/01-workspace.png) | ![Control Deck](docs/screenshots/02-control-deck.png) |

| Blueprint |
|-----------|
| ![Blueprint](docs/screenshots/03-blueprint.png) |

---

## Features

- Absolute-positioned bento canvas with drag, resize, stickers, and multi-canvas switching
- Checklist, note, sketch, countdown, media, and ambient-sound cards
- Direct-DOM drag/resize so pointer moves do not re-render the React tree
- Web Audio chimes (single cached `AudioContext`) and confetti on milestones
- CSV / text drop import with formula-injection sanitization (`= + - @` → quoted)
- Client-side 4-digit PIN vault, guest-pass codes, and JSON backup export/import
- Recruiter “Fresh Start” reset plus an architecture-blueprint modal

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3, Lucide |
| Data | Browser `localStorage` (no database) |
| Auth | None. Demo PIN is a client-side UX gate — see [SECURITY.md](SECURITY.md) |
| Audio | Native Web Audio API |
| Hosting | Vercel |
| CI | GitHub Actions (unit + typecheck + Playwright) |

---

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

```bash
npm test            # unit (CSV sanitizer, PIN, stars, guest passes)
npm run typecheck
npm run test:e2e    # Playwright Chromium smokes
```

---

## License

MIT. See [LICENSE](LICENSE).

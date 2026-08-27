# 📜 Changelog

All notable changes to **Zenith Workspace** will be documented in this file.

---

## [1.15.0] - 2026-08-28
### Changed
* Control Deck restyle: yellow header, five icon tabs (Look / Lock / Share / Data / Auto), grouped sections, swatches, segmented rows, and toggle knobs. Same features, calmer chrome.

---


### Changed
* Home loads seven equal tiles: Welcome, Try this, Note, Checklist, Sketch, Timer, Sound.
* Overlay / auto-hide scrollbars across the workspace (visible on hover, not a permanent gutter).

---


### Changed
* Quieter first paint: one Home canvas, two non-overlapping cards, sidebar is canvases + Control Deck.
* Mascot, architecture-blueprint modal, stamp book, and family-briefing banner are off the default view. Advanced tools stay in Control Deck.
* Returning demo visitors get the new board (storage key `zenith-ui-version=2`).

---


### Fixed
* CI install: regenerate `package-lock.json` for this repo (it had been left over from a different app) and pin `lucide-react` so `npm ci` resolves on npm 10.
* Restore `test` / `typecheck` / `test:e2e` scripts plus Playwright hooks the workflow already expected.

---


### Added
* Root `SECURITY.md` threat model (client-side PIN, CSV sanitizer, no backend).
* Unit tests for CSV formula injection, vault PIN, productivity stars, and guest-pass expiry.
* Playwright Chromium smokes (workspace shell, Control Deck, streak check-in, blueprint, Fresh Start).
* GitHub Actions CI (unit → typecheck → e2e) on Node 22, plus Dependabot (patch/minor only).
* MIT `LICENSE`, branded `public/favicon.svg`, and an honest product README.

### Changed
* `ignoreBuildErrors` is **false**; `tsc --noEmit` is a first-class script.
* Production security headers (CSP, nosniff, Permissions-Policy) restored.
* Package name is `zenith-canvas`; unused `framer-motion` / `recharts` / `clsx` / `tailwind-merge` removed.

### Removed
* AI Studio leftover `metadata.json` and empty `GEMINI_API_KEY` example.

---

## [1.11.0] - 2026-07-17
### Added
* **Custom Dialogue System (Toast notifications & Confirmation overlays)**: Introduced a custom, non-blocking Neo-Brutalist toast manager and overlay modals, completely replacing blocking browser `alert()` and `confirm()` prompts for sandbox safety.
* **Direct DOM style manipulation hooks**: Added `dragCoordsRef` and `resizeCoordsRef` to support optimized coordinate capture during movement.

### Enhanced
* **Direct-DOM Drag & Resize Engine (60 FPS Performance optimization)**: Re-engineered card drags and resizing to mutate DOM styles directly in real time instead of triggering heavy React state updates on every pixel shifted. Coordinate states are batched and committed only upon cursor release.
* **Unified Web Audio Synth**: Replaced redundant multiple `AudioContext` creations with a cached, lazily initialized single-instance getter `getSafeAudioContext()` to avoid memory leaks and browser-specific audio blocks.
* **OWASP Security CSV Sanitization (Formula Injection Protection)**: Added regex-driven cell verification to automatically escape Excel formula characters (`=`, `+`, `-`, `@`) with protective quotes on text/CSV imports.

### Fixed
* **SSR Hydration Mismatch**: Resolved a hydration discrepancy on date strings during initial client-side paint.
* **Control Deck State Reference Leak**: Patched a missing state reference bug in the Email Simulation pipeline.

---

## [1.10.0] - 2026-07-08
### Added
* **Interactive Help Guide Mascot (Zenny the Owl 🦉)**: A floating interactive mascot placed in the bottom corner that provides tips, architectural guides, and sound chimes on request.
* **Cozy Ambient Mood Backdrops**: Added 5 beautifully designed rich canvas backgrounds (Fireside Hearth, Midnight Forest, Antique Ivory, Crimson Sunset, Obsidian Slate) with embedded dotted grids and gradient shaders.
* **Achievements & Milestones Dashboard**: A vintage amber widget block featuring a 5-star real-time productivity rating, active streak counter with check-in buttons, and a Digital Stamp Book that monitors Pioneer, Streak, Achiever, and Master statuses.
* **Interactive System Architecture Blueprint (⚙️ Blueprint Stack)**: A technical sidebar action and modal window that illustrates absolute canvas layout structures, Web Audio synthesizers, and security vaults.
* **One-Click Fresh Start Reset**: A button in the Control Deck that purges active local coordinates, resets streaks, launches confetti, and spawns clean pre-loaded welcoming cards.
* **Stickers Stamp Deck**: Added the ability to dynamically attach bouncing, border-outlined emojis (🦉, 🚀, ☕, 🔥, 🎉) directly onto the corners of bento canvas elements.

### Enhanced
* **Web Audio API Synth**: Tuned the oscillator frequency ramps (C5 to C6 & E5 to E6) and gain decay curves to produce cleaner, crisper retro-inspired milestone chime sounds.
* **Confetti Floating Celebrations**: Upgraded the physics simulation to support 45 floating multicolored paper particles floating upwards smoothly.

---

## [1.0.0] - 2026-06-15
### Added
* Core bento-style absolute canvas layout engine.
* Multi-canvas workspaces with fast local persistence.
* Neo-brutalist custom visual components (cards, sketchpads, text notes, checklists).
* Safe Shield Vault with 4-digit PIN gate security.
* Simulated cursor trails and real-time active workspace logs.

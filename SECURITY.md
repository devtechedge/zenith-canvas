# Security Assessment — Zenith Canvas

**Date:** 2026-08-21  
**Scope:** Auth, XSS, injection, CORS, secrets, payments, client-side vault  
**Context:** Public deploy is a **client-side workspace** (Vercel). There is no application backend. All canvas state lives in `localStorage`.

---

## Executive summary

| Area | Risk | Notes |
|------|------|--------|
| Authentication | **N/A (by design)** | No user accounts, no NextAuth, no JWT |
| Authorization | **Client-only PIN (accepted)** | 4-digit vault PIN stored in **plaintext** `localStorage` |
| XSS | **Low** | No `dangerouslySetInnerHTML`; React text escaping |
| Injection (SQL) | **N/A** | No database. Prisma / NextAuth are **not** in this repo |
| CSV formula injection | **Mitigated on import** | Cells starting with `= + - @` are quote-prefixed |
| Payments | **N/A** | No checkout, no card data |
| Secrets in repo | **Low** | `.env*` gitignored; `.env.example` has no keys |
| CORS | **N/A** | No cross-origin API |
| Build config | **Hardened** | `ignoreBuildErrors` is **false** — type errors fail CI/build |

**Overall (public Vercel demo):** Low residual risk — browser-only app, no backend secrets, no auth boundary to break.

**Overall (if someone stored secrets in a canvas):** High for that user — `localStorage` is readable by any script on the origin, and the PIN is not a cryptographic lock.

---

## 1. Authentication & session

**Findings**
- No login, no cookies, no server session.
- Template leftovers (`next-auth`, Prisma) are **not present**.

**Verdict:** Auth is intentionally absent. Do not claim “secured with NextAuth” or JWT.

---

## 2. Vault PIN (not a real lock)

**Findings**
- Control Deck can set a 4-digit numeric PIN (`lib/pin.ts` → `/^\d{4}$/`).
- The PIN is written to `localStorage` key `zenith-vault-pin` **in plaintext**.
- Unlock is a client-side string compare. DevTools, another tab, or any XSS on this origin can read or clear it.
- Guest passes (`ZEN-######`) are also client-side tokens with a local expiry timestamp.

**Accepted for portfolio demo.** This is a UX gate, not authentication.

**Not accepted if real secrets go on the board:** hash+salt the PIN, never persist plaintext, and do not store credentials in canvas cards.

---

## 3. Injection (CSV / JSON backup)

**Findings**
- CSV / text drop + file import unpack into checklist cards.
- `lib/csv.ts` prefixes formula triggers (`=`, `+`, `-`, `@`) with `'` so Excel will not execute the cell. Covered by unit tests.
- Full-workspace JSON backup import uses `JSON.parse` and then React state. Malformed JSON is caught; unexpected keys are ignored. This is same-origin file data, not a network parser.

**SQL:** none. No `DATABASE_URL`, no Prisma.

---

## 4. XSS

- Code search found **no** `dangerouslySetInnerHTML`.
- Card titles, checklist text, activity logs, and toast copy render as React text → default escaping.
- Live-preview `{{current_date}}` / `{{current_time}}` substitution is string replace into React text, not HTML.

---

## 5. Dependency / supply chain

**This pass**
- Dropped unused template packages: `framer-motion`, `recharts`, `clsx`, `tailwind-merge` (never imported).
- Dropped AI-studio leftover `metadata.json` (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`) and the empty `GEMINI_API_KEY` example.
- **Held:** `next@14.2.3`, `react@18.3.1`, `lucide-react`. Do **not** `npm audit fix --force` onto Next 15/16.

```bash
npm audit --omit=dev
```

Next 14 advisories that only clear by jumping majors are **accepted residual risk**. CI does not fail on `npm audit`.

---

## 6. Secrets & config

- `.gitignore` excludes `.env`, `.env*.local`.
- `.env.example` documents that **no secrets are required**.
- Never commit API keys. There is no server route to hold them.

---

## 7. HTTP surface

| Path | Auth | Notes |
|------|------|--------|
| `/` workspace | None | Client-side canvas. PIN overlay is cosmetic. |
| API routes | **None** | No `app/api` handlers |

Production responses set `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a conservative CSP (`default-src 'self'` plus Next-friendly `unsafe-inline` for styles/scripts). `ignoreBuildErrors` is off.

---

## 8. Residual risk & acceptance

**Accepted for portfolio demo**
- No user authentication.
- Plaintext PIN and guest passes in `localStorage`.
- Next 14 remaining advisories until a deliberate major upgrade.
- Anyone with the origin can read canvas JSON from DevTools.

**Not accepted if this becomes a multi-user product**
- Server-side auth and authorization.
- Hashed PIN / WebAuthn.
- Signed, server-issued share links (today’s “share” is a client simulation).

---

## 9. How to re-test

```bash
npm install
npm test
npm run typecheck
npm run test:e2e
npm audit --omit=dev
```

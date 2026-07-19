# Stadium Guardian AI

Real-time stadium safety and management platform for fans and staff — a single-page application with offline-resilient architecture.

**Live:** https://stadiumvault-007.web.app

---

## Vertical

**Stadium Safety & Operations** — A dual-portal system where fans access real-time safety info (evacuation routes, fire safety, crowd density, emergency reporting) and staff manage incidents, crowd monitoring, alerts, help queues, and food operations.

---

## Approach

- **Single-page application (SPA)** with React 19 and TanStack Router for instant navigations
- **Firebase Firestore** for data persistence with a fallback data layer — every collection has a static fallback array so the UI works without network
- **Anonymous Firebase Auth** — gates Firestore access; 5-second timeout ensures the app loads even when Auth is unreachable
- **Tailwind CSS v4** with a custom dark glassmorphism theme
- **Firebase Hosting** for deployment with SPA rewrites; deploy via `scripts/deploy-firebase.mjs`
- **Vitest + Testing Library** — 100 unit tests across session logic, AI validation, UI components, staff directory, navigation, and a11y patterns

### Architecture

```
src/
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout (QueryClient, Toaster)
│   ├── index.tsx        # Landing page with Fan/Staff portal entry
│   ├── fan.tsx           # Fan layout (SideDock, TopBar, BottomDock)
│   ├── fan.*.tsx         # 9 fan pages (chat, navigation, food, emergency, etc.)
│   ├── staff.tsx         # Staff layout (SideDock, TopBar)
│   └── staff.*.tsx       # 10 staff pages (dashboard, incidents, orders, etc.)
├── stadium/shared/       # Shared UI components and logic
│   ├── glass.tsx         # GlassCard, GlassIcon, SectionHeader, SeverityPill, StatusDot
│   ├── session.ts        # Client-side session (localStorage, zone mapping)
│   ├── staff-directory.ts # Pure validation + fallback staff records (7 staff IDs)
│   └── ai.functions.ts   # AI chat + translation via Lovable gateway
├── integrations/
│   └── firebase/         # Firebase client, Firestore helpers (getCollection, addDocument, etc.)
└── lib/                  # Utility functions
```

### Key decisions

| Decision | Rationale |
|----------|-----------|
| **No auth layer** | Stadium is a physical venue — fans and staff already authenticated by presence. Session is stored in localStorage with section/seat or staff ID. |
| **Firebase with fallback data** | Firestore reads are wrapped with timeouts; every collection has static fallback arrays. The app works fully without Firebase. |
| **Anonymous Auth timeout** | `ensureAuth()` races `signInAnonymously` against a 5s timeout so no Firestore call ever hangs the UI. |
| **Pure staff directory** | Staff validation is a pure function (`resolveStaffIdentity`) — no DB dependency. Falls back to 7 hardcoded staff records. |
| **Inline CSS** | Custom Vite plugin inlines the CSS bundle into `index.html` at build time — eliminates render-blocking external stylesheet. |
| **SSR avoided** | Pure SPA — no server-side rendering. Static pre-rendered hero shell in `index.html` for fast first paint. |

---

## How It Works

### Fan Portal (no login required)

1. Enter your section, row, and seat on the landing page → session saved to localStorage
2. Dashboard shows your zone, venue occupancy, density, and top alerts
3. **AI Chat** — ask about restrooms, exits, first aid, food; powered by Lovable AI gateway
4. **Navigate** — select an amenity → stadium map highlights your zone + directions
5. **Food** — browse menu by dietary filter, place orders, track status in real time
6. **Emergency** — panic button (medical/security/fire) creates an incident
7. **Fire Safety** — static info panel (exits, muster points, evacuation steps)
8. **Alerts** — live feed filtered by your zone, color-coded by severity
9. **Help** — submit and track help requests with staff replies

### Staff Portal

1. Enter your staff ID on the landing page → validated against fallback directory (Firestore optional)
2. **Dashboard** — counts of open incidents, pending help, active orders, alerts
3. **Incidents** — log and resolve incidents (medical, security, fire, etc.) with real-time feed
4. **Orders** — full food order lifecycle: pending → preparing → ready → delivered
5. **Heatmap** — SVG stadium with color-coded zone density from Firestore `crowd_zones`
6. **Fan Queue** — claim, reply to, and resolve fan help requests
7. **Broadcast** — compose and send zone-targeted alerts; deactivate active alerts
8. **Fire Console** — extinguisher checklist, per-zone evacuation broadcast, trigger alarm
9. **Security** — log field intelligence (suspicious, ejections, watchlist)
10. **Translate** — on-demand translation via AI gateway

---

## Staff IDs (fallback)

| ID | Name | Role | Zone |
|----|------|------|------|
| `SEC-001` | Alex Rivera | Security | N1 |
| `SEC-002` | Jamie Chen | Security | E1 |
| `MED-001` | Dr. Priya Patel | Medical | S1 |
| `MED-002` | Marcus Doe | Medical | W1 |
| `FIRE-001` | Sam Torres | Fire | E2 |
| `VOL-001` | Kai Nguyen | Volunteer | N2 |
| `VOL-002` | Jordan Lee | Volunteer | S2 |

---

## Testing

```bash
npm test           # Run all tests (vitest)
npm run test:watch # Watch mode
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint
```

Test suites (100 tests):
- **session.test.ts** — seat-to-zone mapping boundaries, session save/load/clear
- **ai.functions.test.ts** — Zod schema validation (empty, overflow, invalid roles)
- **staff-directory.test.ts** — format validation, fallback lookup, session conversion
- **navigation.test.ts** — pathfinding, directions generation
- **firestore.test.ts** — auth integration, query building
- **glass.test.tsx** — GlassCard, GlassIcon, SectionHeader, SeverityPill rendering
- **fan-pages.test.tsx** — dashboard, alerts page rendering
- **staff-pages.test.tsx** — dashboard, broadcast, fire console rendering
- **a11y-patterns.test.tsx** — landmark roles, heading hierarchy, ARIA labels
- **utils.test.ts** — cn() tailwind merge with conditionals

---

## Assumptions

- Fans know their section, row, and seat (printed on ticket)
- Staff have a pre-assigned ID (SEC-xxx, MED-xxx, FIRE-xxx, VOL-xxx)
- Firebase may be unavailable — fallback data ensures core UI works offline
- AI gateway (Lovable) handles natural language queries; offline fallback shows static info
- Venue has 8 zones (N1, N2, E1, E2, S1, S2, W1, W2) mapped from section numbers
- Dark mode only — matches stadium control room environments

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Routing | TanStack Router (file-based, auto code-splitting) |
| Data | Firebase Firestore + static fallback arrays |
| Auth | Firebase Anonymous Auth (with timeout fallback) |
| Styling | Tailwind CSS v4 (dark glassmorphism theme) |
| AI | Lovable AI Gateway (Gemini 3 Flash) |
| Hosting | Firebase Hosting |
| Testing | Vitest + Testing Library (100 tests) |
| Code quality | TypeScript strict, ESLint 9 flat config |
| Build | Vite 8 + LightningCSS |

# Stadium Guardian AI

Real-time stadium safety and management platform for fans and staff — built as a single-page application.

**Live:** https://stadiumvault-007.web.app

---

## Vertical

**Stadium Safety & Operations** — A dual-portal system where fans access real-time safety info (evacuation routes, fire safety, crowd density, emergency reporting) and staff manage incidents, crowd monitoring, alerts, help queues, and food operations.

---

## Approach

- **Single-page application (SPA)** with React 19 and TanStack Router for instant navigations
- **Supabase** for data persistence and real-time subscriptions (incidents, alerts, crowd zones, help queue, food orders)
- **Tailwind CSS v4** with a custom dark glassmorphism theme
- **Firebase Hosting** for deployment with SPA rewrites
- **Vitest** for unit tests (35 tests across session logic, AI input validation, utility functions, and UI components)

### Architecture

```
src/
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout (QueryClient, Toaster)
│   ├── index.tsx        # Landing page with Fan/Staff portal entry
│   ├── fan.tsx           # Fan layout (SideDock, TopBar, BottomDock)
│   ├── fan.*.tsx         # 8 fan pages (chat, navigation, food, emergency, etc.)
│   ├── staff.tsx         # Staff layout (SideDock, TopBar)
│   └── staff.*.tsx       # 10 staff pages (dashboard, incidents, orders, etc.)
├── stadium/shared/       # Shared UI components and logic
│   ├── glass.tsx         # GlassCard, GlassIcon, SectionHeader, SeverityPill, StatusDot
│   ├── session.ts        # Client-side session (localStorage, zone mapping)
│   └── ai.functions.ts   # AI chat + translation via Lovable gateway
├── integrations/
│   └── supabase/client.ts # Lazy-initialized Supabase client proxy
└── lib/                   # Utility functions
```

### Key decisions

| Decision | Rationale |
|----------|-----------|
| **No auth layer** | Stadium is a physical venue — fans and staff already authenticated by presence. Session is stored in localStorage with section/seat or staff ID. |
| **Permissive RLS** | All Supabase tables allow `anon` read/write. Acceptable for a closed venue network; simplifies development. |
| **Lazy Supabase client** | Imported via dynamic `import()` inside click handlers on the landing page — avoids loading the Supabase bundle until needed. |
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
6. **Emergency** — panic button (medical/security/fire) creates an incident in Supabase
7. **Fire Safety** — static info panel (exits, muster points, evacuation steps)
8. **Alerts** — live feed filtered by your zone, color-coded by severity
9. **Help** — submit and track help requests with staff replies

### Staff Portal

1. Enter your staff ID on the landing page → loads from Supabase `staff_directory`
2. **Dashboard** — counts of open incidents, pending help, active orders, alerts
3. **Incidents** — log and resolve incidents (medical, security, fire, etc.) with real-time feed
4. **Orders** — full food order lifecycle: pending → preparing → ready → delivered
5. **Heatmap** — SVG stadium with color-coded zone density from Supabase `crowd_zones`
6. **Fan Queue** — claim, reply to, and resolve fan help requests
7. **Broadcast** — compose and send zone-targeted alerts; deactivate active alerts
8. **Fire Console** — extinguisher checklist, per-zone evacuation broadcast, trigger alarm
9. **Security** — log field intelligence (suspicious, ejections, watchlist) to Supabase
10. **Translate** — on-demand translation via AI gateway

### Real-time Subscriptions

Most staff pages subscribe to Supabase `postgres_changes` for instant updates. The fan portal subscribes to `alerts` and `crowd_zones` for live data.

---

## Testing

```bash
npm test          # Run all tests (vitest)
npm run test:watch # Watch mode
```

- **session.test.ts** — seat-to-zone mapping boundaries, session save/load/clear, zone labels, languages
- **ai.functions.test.ts** — Zod schema validation (empty, overflow, invalid roles, content length)
- **utils.test.ts** — cn() tailwind merge with conditionals and multiple args
- **glass.test.tsx** — GlassCard, GlassIcon, SectionHeader, SeverityPill rendering

---

## Assumptions

- Fans know their section, row, and seat (printed on ticket)
- Staff have a pre-assigned ID in the `staff_directory` table
- No internet required after initial load — critical safety info is cached in-app
- AI gateway (Lovable) handles natural language queries; offline fallback shows static info
- Venue has 8 zones (N1, N2, E1, E2, S1, S2, W1, W2) mapped from section numbers
- Dark mode only — matches stadium control room environments

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Routing | TanStack Router (file-based, auto code-splitting) |
| Data | TanStack Query + Supabase real-time subscriptions |
| Styling | Tailwind CSS v4 (dark glassmorphism theme) |
| Database | Supabase (Postgres) |
| AI | Lovable AI Gateway (Gemini 3 Flash) |
| Hosting | Firebase Hosting |
| Testing | Vitest + Testing Library |
| Build | Vite 8 + LightningCSS |

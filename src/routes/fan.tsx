import {
  Link,
  Outlet,
  createFileRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home,
  MessageCircle,
  Map,
  UtensilsCrossed,
  Siren,
  Flame,
  Bell,
  LifeBuoy,
  Ticket,
  LogOut,
} from "lucide-react";

import { GlassCard, GlassIcon, StatusDot } from "@/stadium/shared/glass";
import {
  clearSession,
  loadSession,
  ZONE_LABELS,
  type FanSession,
} from "@/stadium/shared/session";

export const Route = createFileRoute("/fan")({
  component: FanLayout,
  head: () => ({
    meta: [{ title: "Fan Portal — Stadium Guardian AI" }],
  }),
});

const nav = [
  { to: "/fan", label: "Home", icon: Home, tint: "cyan" as const, exact: true },
  { to: "/fan/chat", label: "AI Chat", icon: MessageCircle, tint: "violet" as const },
  { to: "/fan/navigation", label: "Navigate", icon: Map, tint: "cyan" as const },
  { to: "/fan/food", label: "Food", icon: UtensilsCrossed, tint: "green" as const },
  { to: "/fan/emergency", label: "Emergency", icon: Siren, tint: "red" as const },
  { to: "/fan/fire-safety", label: "Fire Safety", icon: Flame, tint: "amber" as const },
  { to: "/fan/alerts", label: "Alerts", icon: Bell, tint: "amber" as const },
  { to: "/fan/help", label: "Help", icon: LifeBuoy, tint: "violet" as const },
  { to: "/fan/ticket", label: "Ticket", icon: Ticket, tint: "green" as const },
];

function FanLayout() {
  const [session, setSession] = useState<FanSession | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  return (
    <div className="relative isolate min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-20 size-96 rounded-full bg-safety-cyan/20 blur-[140px]" />
        <div className="absolute right-0 top-40 size-96 rounded-full bg-safety-violet/20 blur-[140px]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <SideDock session={session} />
        <div className="min-w-0 flex-1">
          <TopBar session={session} />
          <div className="pb-24">
            <Outlet />
          </div>
        </div>
      </div>
      <BottomDock />
    </div>
  );
}

function SideDock({ session }: { session: FanSession | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="glass sticky top-6 hidden h-[calc(100vh-3rem)] w-20 flex-col items-center gap-3 rounded-3xl px-3 py-6 lg:flex">
      <GlassIcon tint="cyan" className="size-12">
        <Ticket className="size-5" />
      </GlassIcon>
      <nav className="mt-4 flex flex-1 flex-col items-center gap-2">
        {nav.map((n) => {
          const active = isActive(n.to, n.exact);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`group relative flex size-12 items-center justify-center rounded-2xl transition ${
                active
                  ? "glass-icon text-safety-cyan"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={n.label}
            >
              <n.icon className="size-5" />
              {active && (
                <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-safety-cyan" />
              )}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => {
          clearSession();
          window.location.href = "/";
        }}
        className="glass flex size-12 items-center justify-center rounded-2xl text-muted-foreground hover:text-safety-red"
        title="Exit"
      >
        <LogOut className="size-5" />
      </button>
      {session && (
        <p className="mt-1 max-w-[3.5rem] truncate text-center text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
          {session.section}·{session.row}
        </p>
      )}
    </aside>
  );
}

function TopBar({ session }: { session: FanSession | null }) {
  return (
    <GlassCard className="mb-6 flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <StatusDot tone={session ? "green" : "amber"} />
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {session ? ZONE_LABELS[session.zone] : "Portal"}
        </div>
        {session && (
          <div className="hidden text-xs text-muted-foreground sm:block">
            Section {session.section} · Row {session.row} · Seat {session.seat}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-[10px] font-mono uppercase tracking-widest text-safety-green sm:inline">
          Guardian AI online
        </span>
        <button
          onClick={() => {
            clearSession();
            window.location.href = "/";
          }}
          className="rounded-full border border-border px-3 py-1 text-[11px] font-medium hover:bg-glass"
        >
          {session ? "Exit" : "Home"}
        </button>
      </div>
    </GlassCard>
  );
}

function BottomDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = nav.slice(0, 6);
  return (
    <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 lg:hidden">
      <div className="glass-strong flex items-center gap-1 rounded-full px-2 py-2 shadow-2xl">
        {items.map((n) => {
          const active = pathname === n.to || pathname.startsWith(n.to + "/");
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex size-10 items-center justify-center rounded-full transition ${
                active
                  ? "bg-safety-cyan text-background"
                  : "text-muted-foreground"
              }`}
              title={n.label}
            >
              <n.icon className="size-4" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

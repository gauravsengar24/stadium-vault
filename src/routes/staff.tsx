import {
  Link,
  Outlet,
  createFileRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Radio,
  ListChecks,
  Activity,
  Users,
  Flame,
  Shield,
  Languages,
  LogOut,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

import { GlassCard, GlassIcon, StatusDot } from "@/stadium/shared/glass";
import {
  clearSession,
  loadSession,
  ZONE_LABELS,
  type StaffSession,
} from "@/stadium/shared/session";

export const Route = createFileRoute("/staff")({
  component: StaffLayout,
  head: () => ({
    meta: [{ title: "Staff Console — Stadium Guardian AI" }],
  }),
});

const nav = [
  { to: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/staff/incidents", label: "Incidents", icon: ListChecks },
  { to: "/staff/orders", label: "Orders", icon: UtensilsCrossed },
  { to: "/staff/heatmap", label: "Heatmap", icon: Activity },
  { to: "/staff/queue", label: "Fan Queue", icon: Users },
  { to: "/staff/broadcast", label: "Broadcast", icon: Radio },
  { to: "/staff/fire", label: "Fire", icon: Flame },
  { to: "/staff/security", label: "Security", icon: Shield },
  { to: "/staff/translate", label: "Translate", icon: Languages },
];

function StaffLayout() {
  const [session, setSession] = useState<StaffSession | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "staff") setSession(s);
  }, []);

  return (
    <div className="relative isolate min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-20 size-96 rounded-full bg-safety-amber/20 blur-[140px]" />
        <div className="absolute right-0 top-40 size-96 rounded-full bg-safety-red/20 blur-[140px]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:px-8">
        <SideDock />
        <div className="min-w-0 flex-1">
          <TopBar session={session} />
          <div className="pb-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

function SideDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="glass sticky top-6 hidden h-[calc(100vh-3rem)] w-56 flex-col gap-2 rounded-3xl p-4 md:flex">
      <div className="mb-2 flex items-center gap-3 px-2 py-2">
        <GlassIcon tint="amber" className="size-10">
          <ShieldCheck className="size-5" />
        </GlassIcon>
        <div>
          <p className="text-sm font-semibold">Guardian</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Staff console
          </p>
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-1">
        {nav.map((n) => {
          const active = isActive(n.to, n.exact);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "glass-icon text-safety-amber"
                  : "text-muted-foreground hover:bg-glass hover:text-foreground"
              }`}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => {
          clearSession();
          window.location.href = "/";
        }}
        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-safety-red"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </aside>
  );
}

function TopBar({ session }: { session: StaffSession | null }) {
  return (
    <GlassCard className="mb-6 flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <StatusDot tone={session ? "green" : "amber"} />
        <div>
          <p className="text-sm font-semibold">
            {session ? (
              <>
                {session.name}{" "}
                <span className="ml-1 rounded-full border border-safety-amber/40 bg-safety-amber/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-safety-amber">
                  {session.staffRole}
                </span>
              </>
            ) : (
              "Explore mode"
            )}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {session ? `${session.staffId} · ${ZONE_LABELS[session.zone]}` : "Sign in to manage"}
          </p>
        </div>
      </div>
      <div className="hidden items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-safety-green sm:flex">
        <StatusDot tone="green" /> live · realtime sync
      </div>
    </GlassCard>
  );
}

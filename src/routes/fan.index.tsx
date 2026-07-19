import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  Map,
  UtensilsCrossed,
  Siren,
  Flame,
  Bell,
  LifeBuoy,
  Ticket,
  ArrowRight,
  Users,
} from "lucide-react";

import { GlassCard, GlassIcon, SectionHeader, StatusDot } from "@/stadium/shared/glass";
import { loadSession, ZONE_LABELS, type FanSession } from "@/stadium/shared/session";
import { listenCollection } from "@/lib/firestore";

export const Route = createFileRoute("/fan/")({
  component: FanDashboard,
});

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  zones: string[];
  created_at: string;
}

interface Zone {
  zone: string;
  name: string;
  density: number;
  current_count: number;
  capacity: number;
}

function FanDashboard() {
  const [session, setSession] = useState<FanSession | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  useEffect(() => {
    const unsub1 = listenCollection<Alert>("alerts", (data) => {
      setAlerts(
        session
          ? data.filter(
              (a) => a.zones.length === 0 || a.zones.includes(session.zone),
            )
          : data,
      );
    }, {
      where: ["active", "==", true],
      orderBy: ["created_at", "desc"],
      limit: 5,
    });
    const unsub2 = listenCollection<Zone>("crowd_zones", setAllZones);
    return () => {
      unsub1();
      unsub2();
    };
  }, [session]);

  const quickActions = [
    { to: "/fan/chat", label: "Ask Guardian", icon: MessageCircle, tint: "violet" as const },
    { to: "/fan/navigation", label: "Navigate", icon: Map, tint: "cyan" as const },
    { to: "/fan/food", label: "Food & Drink", icon: UtensilsCrossed, tint: "green" as const },
    { to: "/fan/emergency", label: "Emergency", icon: Siren, tint: "red" as const },
    { to: "/fan/fire-safety", label: "Fire Safety", icon: Flame, tint: "amber" as const },
    { to: "/fan/help", label: "Get Help", icon: LifeBuoy, tint: "violet" as const },
    { to: "/fan/alerts", label: "All Alerts", icon: Bell, tint: "amber" as const },
    { to: "/fan/ticket", label: "My Ticket", icon: Ticket, tint: "green" as const },
  ];

  const venueDensity =
    allZones.length > 0
      ? allZones.reduce((s, z) => s + z.current_count, 0) /
        allZones.reduce((s, z) => s + z.capacity, 0)
      : 0.5;
  const densityTone: "green" | "amber" | "red" =
    venueDensity < 0.5 ? "green" : venueDensity < 0.8 ? "amber" : "red";
  const densityLabel = densityTone === "green" ? "Comfortable" : densityTone === "amber" ? "Busy" : "Crowded";

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Live"
        title={session ? `Welcome to ${ZONE_LABELS[session.zone]}` : "Welcome to the Stadium"}
        action={
          session ? (
            <Link
              to="/fan/ticket"
              className="glass hidden items-center gap-2 rounded-full px-4 py-2 text-xs font-medium sm:inline-flex"
            >
              <Ticket className="size-3.5" /> View ticket
            </Link>
          ) : undefined
        }
      />

      {!session && (
        <GlassCard className="border-l-4 border-l-safety-cyan px-5 py-4">
          <p className="text-sm font-semibold">Explore mode</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You are browsing publicly available info.{" "}
            <Link to="/" className="text-safety-cyan underline underline-offset-2">
              Enter your seat number
            </Link>{" "}
            to see personalized content.
          </p>
        </GlassCard>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map((a) => (
            <AlertBanner key={a.id} alert={a} />
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="col-span-2 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {session ? "Your seat" : "Venue occupancy"}
          </p>
          {session ? (
            <>
              <div className="mt-2 flex items-baseline gap-4">
                <span className="font-mono text-4xl font-semibold">{session.section}</span>
                <span className="text-muted-foreground">
                  row {session.row} · seat {session.seat}
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <MiniStat label="Zone" value={session.zone} />
                <MiniStat label="Crowd" value={`${Math.round(venueDensity * 100)}%`} tone={densityTone} />
                <MiniStat label="Safety" value="Secure" tone="green" />
              </div>
            </>
          ) : (
            <>
              <div className="mt-2 flex items-baseline gap-4">
                <span className="font-mono text-4xl font-semibold">
                  {allZones.reduce((s, z) => s + z.current_count, 0)}
                </span>
                <span className="text-muted-foreground">fans inside</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <MiniStat label="Zones" value={`${allZones.length}`} />
                <MiniStat label="Occupancy" value={`${Math.round(venueDensity * 100)}%`} tone={densityTone} />
                <MiniStat label="Safety" value="Secure" tone="green" />
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {session ? "Zone density" : "Venue density"}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <StatusDot tone={densityTone} />
            <div>
              <p className="text-lg font-semibold">{densityLabel}</p>
              <p className="text-xs text-muted-foreground">
                {allZones.reduce((s, z) => s + z.current_count, 0)} of{" "}
                {allZones.reduce((s, z) => s + z.capacity, 0)} occupied
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-glass">
            <div
              className={`h-full rounded-full ${
                densityTone === "green"
                  ? "bg-safety-green"
                  : densityTone === "amber"
                    ? "bg-safety-amber"
                    : "bg-safety-red"
              }`}
              style={{ width: `${Math.min(100, venueDensity * 100)}%` }}
            />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Users className="size-3" /> updated live
          </p>
        </GlassCard>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to}>
              <GlassCard className="group p-4 transition hover:-translate-y-0.5 hover:border-safety-cyan/40">
                <div className="flex items-center justify-between">
                  <GlassIcon tint={a.tint} className="size-10 rounded-xl">
                    <a.icon className="size-5" />
                  </GlassIcon>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <p className="mt-3 text-sm font-semibold">{a.label}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "text-safety-green"
      : tone === "amber"
        ? "text-safety-amber"
        : tone === "red"
          ? "text-safety-red"
          : "text-foreground";
  return (
    <div className="glass rounded-2xl px-3 py-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function AlertBanner({ alert }: { alert: Alert }) {
  const tone =
    alert.severity === "critical" || alert.severity === "high"
      ? "red"
      : alert.severity === "medium"
        ? "amber"
        : "green";
  return (
    <Link to="/fan/alerts">
      <GlassCard
        className={`flex items-center gap-3 border-l-4 px-4 py-3 ${
          tone === "red"
            ? "border-l-safety-red bg-safety-red/10"
            : tone === "amber"
              ? "border-l-safety-amber bg-safety-amber/10"
              : "border-l-safety-green bg-safety-green/10"
        }`}
      >
        <StatusDot tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {alert.alert_type} · {alert.severity}
          </p>
          <p className="truncate text-sm font-medium">{alert.message}</p>
        </div>
        <ArrowRight className="size-4 text-muted-foreground" />
      </GlassCard>
    </Link>
  );
}

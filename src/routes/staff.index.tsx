import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ListChecks,
  Users,
  Radio,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";

import { GlassCard, GlassIcon, SectionHeader, StatusDot } from "@/stadium/shared/glass";
import { supabase } from "@/integrations/supabase/client";
import { ZONE_LABELS } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/")({
  component: StaffDashboard,
});

interface Counts {
  openIncidents: number;
  pendingHelp: number;
  activeAlerts: number;
  crowdOccupancy: number;
  pendingOrders: number;
}

interface RecentIncident {
  id: string;
  incident_type: string;
  severity: string;
  zone: string;
  description: string | null;
  created_at: string;
}

function StaffDashboard() {
  const [counts, setCounts] = useState<Counts>({
    openIncidents: 0,
    pendingHelp: 0,
    activeAlerts: 0,
    crowdOccupancy: 0,
    pendingOrders: 0,
  });
  const [recent, setRecent] = useState<RecentIncident[]>([]);

  useEffect(() => {
    async function load() {
      const [inc, help, al, zn, incidentList, ord] = await Promise.all([
        supabase
          .from("incidents")
          .select("id", { count: "exact", head: true })
          .neq("status", "resolved"),
        supabase
          .from("help_queue")
          .select("id", { count: "exact", head: true })
          .neq("status", "resolved"),
        supabase
          .from("alerts")
          .select("id", { count: "exact", head: true })
          .eq("active", true),
        supabase.from("crowd_zones").select("current_count, capacity"),
        supabase
          .from("incidents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("food_orders")
          .select("id", { count: "exact", head: true })
          .not("status", "in", "(delivered,cancelled)"),
      ]);
      const zoneRows = (zn.data ?? []) as { current_count: number; capacity: number }[];
      const totalCap = zoneRows.reduce((a, z) => a + z.capacity, 0) || 1;
      const totalNow = zoneRows.reduce((a, z) => a + z.current_count, 0);
      setCounts({
        openIncidents: inc.count ?? 0,
        pendingHelp: help.count ?? 0,
        activeAlerts: al.count ?? 0,
        crowdOccupancy: Math.round((totalNow / totalCap) * 100),
        pendingOrders: ord.count ?? 0,
      });
      setRecent((incidentList.data as RecentIncident[]) ?? []);
    }
    load();
    const ch = supabase
      .channel("staff-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "help_queue" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "crowd_zones" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "food_orders" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Command center" title="Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          label="Open incidents"
          value={counts.openIncidents}
          tint="red"
          icon={ListChecks}
          href="/staff/incidents"
        />
        <Stat
          label="Fans awaiting help"
          value={counts.pendingHelp}
          tint="violet"
          icon={Users}
          href="/staff/queue"
        />
        <Stat
          label="Orders in flight"
          value={counts.pendingOrders}
          tint="green"
          icon={UtensilsCrossed}
          href="/staff/orders"
        />
        <Stat
          label="Active alerts"
          value={counts.activeAlerts}
          tint="amber"
          icon={Radio}
          href="/staff/broadcast"
        />
        <Stat
          label="Venue occupancy"
          value={`${counts.crowdOccupancy}%`}
          tint="cyan"
          icon={Activity}
          href="/staff/heatmap"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent incidents</h2>
            <Link
              to="/staff/incidents"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          {recent.length === 0 && (
            <p className="text-xs text-muted-foreground">No incidents logged yet.</p>
          )}
          <div className="space-y-2">
            {recent.map((r) => (
              <div
                key={r.id}
                className="glass flex items-center gap-3 rounded-2xl px-3 py-2.5"
              >
                <StatusDot
                  tone={
                    r.severity === "critical" || r.severity === "high"
                      ? "red"
                      : r.severity === "medium"
                        ? "amber"
                        : "green"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {r.incident_type} · {ZONE_LABELS[r.zone] ?? r.zone}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {r.description ?? "No description"}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date(r.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-base font-semibold">Personnel on shift</h2>
          <div className="mt-4 space-y-2">
            {[
              { role: "Security", n: 12, tint: "amber" as const },
              { role: "Medical", n: 6, tint: "red" as const },
              { role: "Fire", n: 4, tint: "amber" as const },
              { role: "Volunteers", n: 22, tint: "cyan" as const },
            ].map((r) => (
              <div key={r.role} className="glass flex items-center justify-between rounded-2xl px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <GlassIcon tint={r.tint} className="size-9 rounded-xl">
                    <Users className="size-4" />
                  </GlassIcon>
                  <p className="text-sm font-medium">{r.role}</p>
                </div>
                <span className="font-mono text-lg font-semibold">{r.n}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tint,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  tint: "red" | "amber" | "violet" | "cyan" | "green";
  icon: typeof Activity;
  href: string;
}) {
  return (
    <Link to={href}>
      <GlassCard className="group p-5 transition hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <GlassIcon tint={tint} className="size-11 rounded-xl">
            <Icon className="size-5" />
          </GlassIcon>
          <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </div>
        <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold">{value}</p>
      </GlassCard>
    </Link>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { GlassCard, GlassIcon, SectionHeader, SeverityPill } from "@/stadium/shared/glass";
import { supabase } from "@/integrations/supabase/client";
import { loadSession, type FanSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/fan/alerts")({
  component: FanAlerts,
  head: () => ({ meta: [{ title: "Alerts — Fan Portal" }] }),
});

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  zones: string[];
  active: boolean;
  created_at: string;
}

function FanAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [session, setSession] = useState<FanSession | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      setAlerts((data as Alert[]) ?? []);
    }
    load();
    const ch = supabase
      .channel("fan-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const visible = session
    ? alerts.filter((a) => a.zones.length === 0 || a.zones.includes(session.zone))
    : alerts;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Live feed" title="Emergency alerts" />

      {visible.length === 0 && (
        <GlassCard className="flex flex-col items-center gap-3 p-12 text-center">
          <GlassIcon tint="green" className="size-14 rounded-2xl">
            <Bell className="size-6" />
          </GlassIcon>
          <p className="text-sm font-semibold">All clear</p>
          <p className="text-xs text-muted-foreground">
            No active alerts affecting your zone. We'll notify you the second something changes.
          </p>
        </GlassCard>
      )}

      <div className="space-y-3">
        {visible.map((a) => {
          const tone =
            a.severity === "critical" || a.severity === "high"
              ? "red"
              : a.severity === "medium"
                ? "amber"
                : "green";
          return (
            <GlassCard
              key={a.id}
              className={`border-l-4 p-5 ${
                tone === "red"
                  ? "border-l-safety-red bg-safety-red/5"
                  : tone === "amber"
                    ? "border-l-safety-amber bg-safety-amber/5"
                    : "border-l-safety-green bg-safety-green/5"
              } ${a.active ? "" : "opacity-60"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SeverityPill severity={a.severity} />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    {a.alert_type}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date(a.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-3 text-sm">{a.message}</p>
              {a.zones.length > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Zones: {a.zones.join(", ")}
                </p>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

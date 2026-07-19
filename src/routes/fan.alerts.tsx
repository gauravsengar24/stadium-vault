import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { GlassCard, GlassIcon, SectionHeader, SeverityPill } from "@/stadium/shared/glass";
import { listenCollection } from "@/lib/firestore";
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

const FALLBACK_ALERTS: Alert[] = [
  { id: "a-1", alert_type: "weather", severity: "medium", message: "Thunderstorm warning for the area until 9 PM. Seek shelter in concourse.", zones: [], active: true, created_at: new Date().toISOString() },
  { id: "a-2", alert_type: "crowding", severity: "low", message: "East Gate concourse is at 90% capacity. Consider alternate routes.", zones: ["E1", "E2"], active: true, created_at: new Date().toISOString() },
];

function FanAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(FALLBACK_ALERTS);
  const [usingFallback, setUsingFallback] = useState(true);
  const [session, setSession] = useState<FanSession | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  useEffect(() => {
    const unsub = listenCollection<Alert>("alerts", (data) => {
      if (data.length > 0) {
        setAlerts(data);
        setUsingFallback(false);
      }
    }, {
      orderBy: ["created_at", "desc"],
      limit: 30,
    });
    return () => unsub();
  }, []);

  const visible = session
    ? alerts.filter((a) => a.zones.length === 0 || a.zones.includes(session.zone))
    : alerts;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Live feed" title="Emergency alerts" />

      {usingFallback && (
        <div className="rounded-2xl border border-safety-amber/30 bg-safety-amber/10 px-4 py-2 text-center text-[11px] font-medium text-safety-amber">
          Live feed unavailable — showing sample alerts
        </div>
      )}

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

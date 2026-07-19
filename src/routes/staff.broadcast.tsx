import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radio, Power } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader, SeverityPill, StatusDot } from "@/stadium/shared/glass";
import { getCollection, addDocument, updateDocument, listenCollection } from "@/lib/firestore";
import { loadSession, type StaffSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/broadcast")({
  component: StaffBroadcast,
  head: () => ({ meta: [{ title: "Broadcast — Staff Console" }] }),
});

const TYPES = ["evacuation", "weather", "security", "medical", "info"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const ZONES = ["N1", "N2", "E1", "E2", "S1", "S2", "W1", "W2"];

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  zones: string[];
  active: boolean;
  created_at: string;
  created_by: string | null;
}

function StaffBroadcast() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [type, setType] = useState(TYPES[0]);
  const [sev, setSev] = useState(SEVERITIES[2]);
  const [message, setMessage] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "staff") setSession(s);
  }, []);

  useEffect(() => {
    async function load() {
      const data = await getCollection<Alert>("alerts", { orderBy: ["created_at", "desc"], limit: 20 });
      setAlerts(data);
    }
    load();
    const unsub = listenCollection("alerts", load);
    return () => { unsub(); }
  }, []);

  function toggleZone(z: string) {
    setSelectedZones((s) =>
      s.includes(z) ? s.filter((x) => x !== z) : [...s, z],
    );
  }

  async function broadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !message.trim()) return;
    setSending(true);
    try {
      await addDocument("alerts", {
        alert_type: type,
        severity: sev,
        message: message.trim(),
        zones: selectedZones,
        active: true,
        created_by: session.staffId,
      });
    } catch {
      toast.error("Broadcast failed.");
      setSending(false);
      return;
    }
    setSending(false);
    setMessage("");
    setSelectedZones([]);
    toast.success(
      `Alert broadcast to ${selectedZones.length === 0 ? "ALL zones" : selectedZones.join(", ")}`,
    );
  }

  async function deactivate(id: string) {
    await updateDocument("alerts", id, { active: false });
    toast.success("Alert deactivated.");
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Push to fans" title="Emergency broadcast" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <GlassIcon tint="amber" className="size-10 rounded-xl">
              <Radio className="size-5" />
            </GlassIcon>
            <h2 className="text-base font-semibold">Compose alert</h2>
          </div>
          <form onSubmit={broadcast} className="space-y-3">
            <Row>
              <Select label="Type" value={type} onChange={setType} options={TYPES} />
              <Select label="Severity" value={sev} onChange={setSev} options={SEVERITIES} />
            </Row>
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Message
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={280}
                placeholder="Clear, direct instruction to fans…"
                className="glass w-full rounded-2xl px-3 py-2.5 text-sm outline-none focus:border-safety-amber"
              />
            </div>
            <div>
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Zones ({selectedZones.length === 0 ? "all" : selectedZones.length})
              </span>
              <div className="grid grid-cols-4 gap-2">
                {ZONES.map((z) => {
                  const on = selectedZones.includes(z);
                  return (
                    <button
                      type="button"
                      key={z}
                      onClick={() => toggleZone(z)}
                      className={`rounded-xl py-2 text-xs font-mono font-semibold transition ${
                        on
                          ? "bg-safety-amber text-background"
                          : "glass text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {z}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Empty = send to all zones.
              </p>
            </div>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full rounded-2xl bg-safety-amber py-3 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-50"
            >
              {sending ? "Broadcasting…" : "Broadcast alert"}
            </button>
          </form>
        </GlassCard>

        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recent broadcasts
          </h2>
          {alerts.length === 0 && (
            <p className="text-xs text-muted-foreground">No broadcasts yet.</p>
          )}
          {alerts.map((a) => (
            <GlassCard key={a.id} className={`p-4 ${a.active ? "" : "opacity-60"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SeverityPill severity={a.severity} />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    {a.alert_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot tone={a.active ? "red" : "green"} />
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    {a.active ? "live" : "off"}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm">{a.message}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  zones: {a.zones.length === 0 ? "ALL" : a.zones.join(", ")}
                </span>
                <span>
                  by {a.created_by ?? "—"} ·{" "}
                  {new Date(a.created_at).toLocaleTimeString()}
                </span>
              </div>
              {a.active && (
                <button
                  onClick={() => deactivate(a.id)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-glass px-3 py-1 text-[11px] font-semibold"
                >
                  <Power className="size-3.5" /> Deactivate
                </button>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass w-full rounded-2xl px-3 py-2.5 text-sm outline-none focus:border-safety-amber"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-background">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

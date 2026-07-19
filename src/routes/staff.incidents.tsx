import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListChecks, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader, SeverityPill, StatusDot } from "@/stadium/shared/glass";
import { getCollection, addDocument, updateDocument, listenCollection } from "@/lib/firestore";
import { loadSession, ZONE_LABELS, type StaffSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/incidents")({
  component: StaffIncidents,
  head: () => ({ meta: [{ title: "Incidents — Staff Console" }] }),
});

const TYPES = ["medical", "security", "fire", "lost", "suspicious", "spill"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const ZONES = ["N1", "N2", "E1", "E2", "S1", "S2", "W1", "W2"];

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  zone: string;
  description: string | null;
  reported_by: string | null;
  status: string;
  created_at: string;
}

function StaffIncidents() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [type, setType] = useState(TYPES[0]);
  const [sev, setSev] = useState(SEVERITIES[1]);
  const [zone, setZone] = useState(ZONES[0]);
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "staff") {
      setSession(s);
      setZone(s.zone);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const data = await getCollection<Incident>("incidents", { orderBy: ["created_at", "desc"], limit: 40 });
      setIncidents(data);
    }
    load();
    const unsub = listenCollection("incidents", load);
    return () => { unsub(); }
  }, []);

  async function log(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    try {
      await addDocument("incidents", {
        incident_type: type,
        severity: sev,
        zone,
        description: desc || null,
        reported_by: session.staffId,
        status: "open",
      });
    } catch {
      toast.error("Failed to log — try again.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setDesc("");
    toast.success("Incident logged");
  }

  async function resolve(id: string) {
    await updateDocument("incidents", id, { status: "resolved" });
    toast.success("Incident marked resolved.");
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Audit trail" title="Incident log" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <GlassIcon tint="red" className="size-10 rounded-xl">
              <ListChecks className="size-5" />
            </GlassIcon>
            <h2 className="text-base font-semibold">Log new incident</h2>
          </div>
          <form onSubmit={log} className="space-y-3">
            <Select label="Type" value={type} onChange={setType} options={TYPES} />
            <Select label="Severity" value={sev} onChange={setSev} options={SEVERITIES} />
            <Select label="Zone" value={zone} onChange={setZone} options={ZONES} />
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Description
              </span>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="What happened?"
                className="glass w-full rounded-2xl px-3 py-2.5 text-sm outline-none focus:border-safety-red"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-safety-red py-3 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Logging…" : "Log incident"}
            </button>
          </form>
        </GlassCard>

        <div className="space-y-3">
          {incidents.length === 0 && (
            <p className="text-xs text-muted-foreground">No incidents logged yet.</p>
          )}
          {incidents.map((i) => (
            <GlassCard key={i.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SeverityPill severity={i.severity} />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    {i.incident_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {ZONE_LABELS[i.zone] ?? i.zone}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                  <StatusDot
                    tone={
                      i.status === "resolved"
                        ? "green"
                        : i.status === "assigned"
                          ? "amber"
                          : "red"
                    }
                  />
                  {i.status}
                </div>
              </div>
              {i.description && (
                <p className="mt-2 text-sm">{i.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>{new Date(i.created_at).toLocaleTimeString()}</span>
              </div>
              {i.status !== "resolved" && (
                <button
                  onClick={() => resolve(i.id)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-safety-green/15 px-3 py-1 text-[11px] font-semibold text-safety-green hover:bg-safety-green/25"
                >
                  <CheckCircle2 className="size-3.5" /> Mark resolved
                </button>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
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
        className="glass w-full rounded-2xl px-3 py-2.5 text-sm outline-none focus:border-safety-red"
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

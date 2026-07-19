import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, UserX, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader, SeverityPill } from "@/stadium/shared/glass";
import { supabase } from "@/integrations/supabase/client";
import { loadSession, type StaffSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/security")({
  component: StaffSecurity,
  head: () => ({ meta: [{ title: "Security — Staff Console" }] }),
});

interface Entry {
  id: string;
  incident_type: string;
  description: string | null;
  zone: string;
  severity: string;
  status: string;
  created_at: string;
}

function StaffSecurity() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [kind, setKind] = useState("suspicious");
  const [note, setNote] = useState("");
  const [zone, setZone] = useState("N1");
  const [sev, setSev] = useState("medium");
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
      const { data } = await supabase
        .from("incidents")
        .select("*")
        .in("incident_type", ["suspicious", "ejection", "watchlist", "security"])
        .order("created_at", { ascending: false })
        .limit(40);
      setEntries((data as Entry[]) ?? []);
    }
    load();
    const ch = supabase
      .channel("staff-security")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || !session) return;
    setSaving(true);
    const { error } = await supabase.from("incidents").insert({
      incident_type: kind,
      severity: sev,
      zone,
      description: note.trim(),
      reported_by: session.staffId,
      status: "open",
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to save — try again.");
      return;
    }
    setNote("");
    toast.success("Security entry logged.");
  }

  const kinds = [
    { key: "suspicious", label: "Suspicious", icon: Eye, tint: "amber" as const },
    { key: "ejection", label: "Ejection", icon: UserX, tint: "red" as const },
    { key: "watchlist", label: "Watchlist", icon: Shield, tint: "violet" as const },
  ] as const;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Field intelligence" title="Security console" />

      <div className="grid gap-4 md:grid-cols-3">
        {kinds.map((k) => (
          <GlassCard key={k.key} className="p-6">
            <GlassIcon tint={k.tint} className="size-12 rounded-2xl">
              <k.icon className="size-6" />
            </GlassIcon>
            <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
              {k.label}
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold">
              {entries.filter((e) => e.incident_type === k.key).length}
            </p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-base font-semibold">New security entry</h2>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr_auto]">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="glass rounded-2xl px-3 py-2.5 text-sm"
          >
            {kinds.map((k) => (
              <option key={k.key} value={k.key} className="bg-background">
                {k.label}
              </option>
            ))}
          </select>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="glass rounded-2xl px-3 py-2.5 text-sm"
          >
            {["N1", "N2", "E1", "E2", "S1", "S2", "W1", "W2"].map((z) => (
              <option key={z} value={z} className="bg-background">
                {z}
              </option>
            ))}
          </select>
          <select
            value={sev}
            onChange={(e) => setSev(e.target.value)}
            className="glass rounded-2xl px-3 py-2.5 text-sm"
          >
            {["low", "medium", "high", "critical"].map((s) => (
              <option key={s} value={s} className="bg-background">
                {s}
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe what you saw"
            className="glass rounded-2xl px-3 py-2.5 text-sm"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-safety-amber px-4 text-xs font-semibold text-background disabled:opacity-50"
          >
            <Plus className="size-4" /> {saving ? "Saving…" : "Log"}
          </button>
        </form>
      </GlassCard>

      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground">No security entries yet.</p>
        )}
        {entries.map((e) => (
          <GlassCard key={e.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SeverityPill severity={e.severity} />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  {e.incident_type}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  · Zone {e.zone}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {new Date(e.created_at).toLocaleTimeString()}
              </span>
            </div>
            {e.description && <p className="mt-2 text-sm">{e.description}</p>}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

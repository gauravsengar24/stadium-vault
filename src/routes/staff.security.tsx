import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, UserX, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader, SeverityPill } from "@/stadium/shared/glass";

export const Route = createFileRoute("/staff/security")({
  component: StaffSecurity,
  head: () => ({ meta: [{ title: "Security — Staff Console" }] }),
});

interface Entry {
  id: string;
  kind: "suspicious" | "ejection" | "watch";
  note: string;
  zone: string;
  when: string;
  severity: string;
}

const seed: Entry[] = [
  { id: "1", kind: "suspicious", note: "Unattended backpack near turnstile 3", zone: "E1", when: "4m", severity: "high" },
  { id: "2", kind: "ejection", note: "Party of two — repeat verbal warnings", zone: "S1", when: "18m", severity: "medium" },
  { id: "3", kind: "watch", note: "Individual matches missing-child alert #A-118", zone: "N2", when: "22m", severity: "low" },
];

function StaffSecurity() {
  const [entries, setEntries] = useState<Entry[]>(seed);
  const [kind, setKind] = useState<Entry["kind"]>("suspicious");
  const [note, setNote] = useState("");
  const [zone, setZone] = useState("N1");
  const [sev, setSev] = useState("medium");

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setEntries([
      { id: String(Date.now()), kind, note: note.trim(), zone, when: "now", severity: sev },
      ...entries,
    ]);
    setNote("");
    toast.success("Security entry logged.");
  }

  const kinds = [
    { key: "suspicious", label: "Suspicious", icon: Eye, tint: "amber" as const },
    { key: "ejection", label: "Ejection", icon: UserX, tint: "red" as const },
    { key: "watch", label: "Watchlist", icon: Shield, tint: "violet" as const },
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
              {entries.filter((e) => e.kind === k.key).length}
            </p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-base font-semibold">New security entry</h2>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_2fr_auto]">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Entry["kind"])}
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
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-safety-amber px-4 text-xs font-semibold text-background"
          >
            <Plus className="size-4" /> Log
          </button>
        </form>
      </GlassCard>

      <div className="space-y-2">
        {entries.map((e) => (
          <GlassCard key={e.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SeverityPill severity={e.severity} />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  {e.kind}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  · Zone {e.zone}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{e.when}</span>
            </div>
            <p className="mt-2 text-sm">{e.note}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

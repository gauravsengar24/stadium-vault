import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  HeartPulse,
  Shield,
  Flame,
  Search,
  PackageX,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader } from "@/stadium/shared/glass";
import { loadSession, type FanSession } from "@/stadium/shared/session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/fan/emergency")({
  component: FanEmergency,
  head: () => ({ meta: [{ title: "Emergency — Fan Portal" }] }),
});

const PANIC = [
  { key: "medical", label: "Medical", icon: HeartPulse, tint: "red" as const, sev: "high", desc: "Send medics to my seat" },
  { key: "security", label: "Security", icon: Shield, tint: "amber" as const, sev: "high", desc: "Report a threat or fight" },
  { key: "fire", label: "Fire", icon: Flame, tint: "red" as const, sev: "critical", desc: "Smoke or open flame" },
  { key: "lost", label: "Lost Person", icon: Search, tint: "violet" as const, sev: "medium", desc: "Missing child or friend" },
  { key: "suspicious", label: "Suspicious Package", icon: PackageX, tint: "amber" as const, sev: "high", desc: "Unattended bag or item" },
] as const;

function FanEmergency() {
  const [session, setSession] = useState<FanSession | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  async function trigger(kind: (typeof PANIC)[number]) {
    if (!session) return;
    setSending(kind.key);
    const description = `${kind.label} — Section ${session.section} Row ${session.row} Seat ${session.seat}. ${note || "No additional details."}`;
    const { error } = await supabase.from("incidents").insert({
      incident_type: kind.key,
      severity: kind.sev,
      zone: session.zone,
      description,
      reported_by: `seat:${session.section}-${session.row}-${session.seat}`,
      status: "open",
    });
    setSending(null);
    if (error) {
      toast.error("Couldn't reach the staff — please flag the nearest usher.");
      return;
    }
    setNote("");
    toast.success(`${kind.label} team dispatched`);
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="One-tap dispatch" title="Emergency" />

      <GlassCard className="flex items-start gap-3 border-l-4 border-l-safety-red bg-safety-red/10 p-4">
        <GlassIcon tint="red" className="size-10 rounded-xl">
          <AlertTriangle className="size-5" />
        </GlassIcon>
        <div>
          <p className="text-sm font-semibold">Only use these for real emergencies.</p>
          <p className="text-xs text-muted-foreground">
            Every tap is logged on-chain and dispatches trained staff to your seat.
          </p>
        </div>
      </GlassCard>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional: what's happening? (visible to responders)"
        maxLength={280}
        className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:border-safety-red"
        rows={3}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PANIC.map((p) => (
          <button key={p.key} onClick={() => trigger(p)} disabled={!!sending}>
            <GlassCard
              className={`h-full p-6 text-left transition hover:-translate-y-1 hover:border-safety-red/50 ${
                sending === p.key ? "opacity-50" : ""
              }`}
            >
              <GlassIcon tint={p.tint} className="size-14 rounded-2xl">
                <p.icon className="size-7" />
              </GlassIcon>
              <p className="mt-4 text-lg font-semibold">{p.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-safety-red">
                {sending === p.key ? "dispatching…" : `tap to dispatch · ${p.sev}`}
              </p>
            </GlassCard>
          </button>
        ))}
      </div>
    </div>
  );
}

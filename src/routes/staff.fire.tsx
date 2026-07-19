import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Siren, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader } from "@/stadium/shared/glass";
import { supabase } from "@/integrations/supabase/client";
import { loadSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/fire")({
  component: StaffFire,
  head: () => ({ meta: [{ title: "Fire Console — Staff Console" }] }),
});

const ZONES = ["N1", "N2", "E1", "E2", "S1", "S2", "W1", "W2"];

interface Extinguisher {
  id: string;
  zone: string;
  lastInspected: string;
  status: "ok" | "due" | "fault";
}

const seedExt: Extinguisher[] = ZONES.flatMap((z) =>
  Array.from({ length: 4 }).map((_, i) => ({
    id: `${z}-E${i + 1}`,
    zone: z,
    lastInspected: "3 days ago",
    status: (i === 2 && z === "E1" ? "due" : i === 1 && z === "S1" ? "fault" : "ok") as
      | "ok"
      | "due"
      | "fault",
  })),
);

function StaffFire() {
  const [ext, setExt] = useState<Extinguisher[]>(seedExt);
  const [evac, setEvac] = useState<Record<string, boolean>>({});

  function markInspected(id: string) {
    setExt((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "ok", lastInspected: "just now" } : e)),
    );
    toast.success(`${id} marked inspected.`);
  }

  async function toggleEvac(z: string) {
    setEvac((s) => ({ ...s, [z]: !s[z] }));
    const s = loadSession();
    if (!s || s.role !== "staff") return;
    if (!evac[z]) {
      await supabase.from("alerts").insert({
        alert_type: "evacuation",
        severity: "critical",
        message: `Immediate evacuation — Zone ${z}. Proceed to the nearest illuminated exit.`,
        zones: [z],
        active: true,
        created_by: s.staffId,
      });
      toast.success(`Evacuation broadcast for ${z}`);
    }
  }

  async function triggerAlarm() {
    const s = loadSession();
    if (!s || s.role !== "staff") return;
    await supabase.from("alerts").insert({
      alert_type: "evacuation",
      severity: "critical",
      message:
        "FIRE ALARM ACTIVATED — full venue evacuation. Follow illuminated exits, do not use elevators.",
      zones: [],
      active: true,
      created_by: s.staffId,
    });
    toast.error("Fire alarm broadcast to all zones.");
  }

  const faults = ext.filter((e) => e.status !== "ok").length;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Prevention"
        title="Fire safety console"
        action={
          <button
            onClick={triggerAlarm}
            className="glass inline-flex items-center gap-2 rounded-full bg-safety-red px-4 py-2 text-xs font-bold uppercase tracking-widest text-background"
          >
            <Siren className="size-4" /> Trigger alarm
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-6">
          <GlassIcon tint="amber" className="size-12 rounded-2xl">
            <Flame className="size-6" />
          </GlassIcon>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            Extinguishers deployed
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold">{ext.length}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <GlassIcon tint="red" className="size-12 rounded-2xl">
            <AlertTriangle className="size-6" />
          </GlassIcon>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            Needs attention
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold text-safety-red">
            {faults}
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <GlassIcon tint="cyan" className="size-12 rounded-2xl">
            <CheckCircle2 className="size-6" />
          </GlassIcon>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            Zones evacuating
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold">
            {Object.values(evac).filter(Boolean).length}
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-base font-semibold">Extinguisher checklist</h2>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {ext.map((e) => (
            <div
              key={e.id}
              className={`glass flex items-center justify-between rounded-2xl px-3 py-2.5 ${
                e.status === "fault"
                  ? "border-safety-red/40"
                  : e.status === "due"
                    ? "border-safety-amber/40"
                    : ""
              }`}
            >
              <div>
                <p className="font-mono text-xs font-semibold">{e.id}</p>
                <p className="text-[10px] text-muted-foreground">
                  {e.status === "ok"
                    ? `Inspected ${e.lastInspected}`
                    : e.status === "due"
                      ? "Inspection due"
                      : "FAULT — replace"}
                </p>
              </div>
              <button
                onClick={() => markInspected(e.id)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                  e.status === "ok"
                    ? "text-safety-green"
                    : e.status === "due"
                      ? "bg-safety-amber/20 text-safety-amber"
                      : "bg-safety-red/20 text-safety-red"
                }`}
              >
                {e.status === "ok" ? "OK" : "Mark"}
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-base font-semibold">
          Per-zone evacuation broadcast
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ZONES.map((z) => (
            <button
              key={z}
              onClick={() => toggleEvac(z)}
              className={`glass rounded-2xl p-4 text-left transition ${
                evac[z] ? "border-safety-red/60 bg-safety-red/10" : ""
              }`}
            >
              <p className="font-mono text-lg font-semibold">{z}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {evac[z] ? "EVACUATING" : "Nominal"}
              </p>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

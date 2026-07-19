import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, DoorOpen, Route as RouteIcon, Info } from "lucide-react";

import { GlassCard, GlassIcon, SectionHeader } from "@/stadium/shared/glass";
import { loadSession, ZONE_LABELS, type FanSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/fan/fire-safety")({
  component: FireSafety,
  head: () => ({ meta: [{ title: "Fire Safety — Fan Portal" }] }),
});

const EXTINGUISHERS_PER_ZONE = 4;
const STEPS = [
  "Stay calm — walk, do not run.",
  "Follow the illuminated green EXIT signs.",
  "Do NOT use elevators.",
  "Assist those nearby who need help.",
  "Assemble at the nearest muster point outside the venue.",
];

function FireSafety() {
  const [session, setSession] = useState<FanSession | null>(null);
  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  const zone = session?.zone ?? "N1";

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Prevention & response" title="Fire safety" />

      {!session && (
        <GlassCard className="border-l-4 border-l-safety-amber px-5 py-4">
          <p className="text-sm font-semibold">Explore mode</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing generic safety info.{" "}
            <Link to="/" className="text-safety-amber underline underline-offset-2">
              Enter your seat number
            </Link>{" "}
            for zone-specific details.
          </p>
        </GlassCard>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-6">
          <GlassIcon tint="amber" className="size-12 rounded-2xl">
            <Flame className="size-6" />
          </GlassIcon>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            Extinguishers nearby
          </p>
          <p className="mt-1 text-3xl font-semibold">{EXTINGUISHERS_PER_ZONE}</p>
          <p className="text-xs text-muted-foreground">
            {ZONE_LABELS[zone]} — inspected weekly
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <GlassIcon tint="green" className="size-12 rounded-2xl">
            <DoorOpen className="size-6" />
          </GlassIcon>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            Nearest exit
          </p>
          <p className="mt-1 text-lg font-semibold">{zone}-EXIT · 40m</p>
          <p className="text-xs text-muted-foreground">
            Level {zone.includes("2") ? "2" : "1"} · glass door east side
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <GlassIcon tint="cyan" className="size-12 rounded-2xl">
            <RouteIcon className="size-6" />
          </GlassIcon>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            Muster point
          </p>
          <p className="mt-1 text-lg font-semibold">Plaza North</p>
          <p className="text-xs text-muted-foreground">
            240m from your seat · outside gate 4
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-3">
          <GlassIcon tint="amber" className="size-10 rounded-xl">
            <Info className="size-5" />
          </GlassIcon>
          <h3 className="text-base font-semibold">If you hear the alarm</h3>
        </div>
        <ol className="mt-4 space-y-2">
          {STEPS.map((s, i) => (
            <li
              key={i}
              className="glass flex items-start gap-3 rounded-2xl px-3 py-2.5"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-safety-amber text-[10px] font-bold text-background">
                {i + 1}
              </span>
              <span className="text-sm">{s}</span>
            </li>
          ))}
        </ol>
      </GlassCard>
    </div>
  );
}

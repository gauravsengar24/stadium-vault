import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Toilet,
  Cross,
  UtensilsCrossed,
  DoorOpen,
  ParkingCircle,
  Baby,
  ArrowRight,
} from "lucide-react";

import { GlassCard, GlassIcon, SectionHeader } from "@/stadium/shared/glass";
import { loadSession, ZONE_LABELS, type FanSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/fan/navigation")({
  component: FanNavigation,
  head: () => ({ meta: [{ title: "Navigate — Fan Portal" }] }),
});

const AMENITIES = [
  { key: "restroom", label: "Restroom", icon: Toilet, tint: "cyan" as const, distance: 45 },
  { key: "firstaid", label: "First Aid", icon: Cross, tint: "red" as const, distance: 90 },
  { key: "concession", label: "Concession", icon: UtensilsCrossed, tint: "green" as const, distance: 30 },
  { key: "exit", label: "Nearest Exit", icon: DoorOpen, tint: "amber" as const, distance: 60 },
  { key: "parking", label: "Parking", icon: ParkingCircle, tint: "violet" as const, distance: 220 },
  { key: "family", label: "Family Room", icon: Baby, tint: "cyan" as const, distance: 110 },
];

function FanNavigation() {
  const [session, setSession] = useState<FanSession | null>(null);
  const [selected, setSelected] = useState<string>("restroom");

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  const zone = session?.zone ?? "N1";
  const active = AMENITIES.find((a) => a.key === selected)!;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={session ? ZONE_LABELS[zone] : "Arena"}
        title="Find your way"
      />

      {!session && (
        <GlassCard className="border-l-4 border-l-safety-cyan px-5 py-4">
          <p className="text-sm font-semibold">Explore mode</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing generic directions.{" "}
            <Link to="/" className="text-safety-cyan underline underline-offset-2">
              Enter your seat number
            </Link>{" "}
            for route guidance tailored to your location.
          </p>
        </GlassCard>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-2">
          {AMENITIES.map((a) => {
            const isActive = a.key === selected;
            return (
              <button
                key={a.key}
                onClick={() => setSelected(a.key)}
                className="w-full"
              >
                <GlassCard
                  className={`flex items-center gap-3 p-4 transition ${
                    isActive ? "border-safety-cyan/60 ring-1 ring-safety-cyan/30" : ""
                  }`}
                >
                  <GlassIcon tint={a.tint} className="size-11 rounded-xl">
                    <a.icon className="size-5" />
                  </GlassIcon>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.distance}m · ~{Math.max(1, Math.round(a.distance / 60))} min walk
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </GlassCard>
              </button>
            );
          })}
        </div>

        <GlassCard className="overflow-hidden p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Route
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                To {active.label}
              </h3>
            </div>
            <span className="glass rounded-full px-3 py-1 text-xs font-mono">
              {active.distance}m
            </span>
          </div>

          <StadiumMap zone={zone} target={selected} />

          <ol className="mt-5 space-y-2">
            {directionsFor(zone, active.label).map((step, i) => (
              <li key={i} className="glass flex items-start gap-3 rounded-2xl px-3 py-2.5">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-safety-cyan text-[10px] font-bold text-background">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </GlassCard>
      </div>
    </div>
  );
}

function directionsFor(zone: string, target: string): string[] {
  return [
    `Leave your seat via the ${zone.startsWith("N") ? "north" : zone.startsWith("S") ? "south" : zone.startsWith("E") ? "east" : "west"} aisle.`,
    `Take the concourse stairs up one level.`,
    `Follow the illuminated ${target.toLowerCase()} signage on your right.`,
    `Look for the glass panel with the ${target.toLowerCase()} icon overhead.`,
  ];
}

function StadiumMap({ zone, target }: { zone: string; target: string }) {
  const zones = [
    { id: "N1", x: 100, y: 20, w: 60, h: 30 },
    { id: "N2", x: 160, y: 20, w: 60, h: 30 },
    { id: "E1", x: 230, y: 60, w: 30, h: 60 },
    { id: "E2", x: 230, y: 120, w: 30, h: 60 },
    { id: "S1", x: 160, y: 190, w: 60, h: 30 },
    { id: "S2", x: 100, y: 190, w: 60, h: 30 },
    { id: "W1", x: 60, y: 120, w: 30, h: 60 },
    { id: "W2", x: 60, y: 60, w: 30, h: 60 },
  ];
  return (
    <div className="glass rounded-2xl p-4">
      <svg viewBox="0 0 320 240" className="h-56 w-full">
        <defs>
          <radialGradient id="field" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.4 0.16 155 / 0.8)" />
            <stop offset="100%" stopColor="oklch(0.3 0.12 155 / 0.6)" />
          </radialGradient>
        </defs>
        <ellipse cx="160" cy="120" rx="90" ry="55" fill="url(#field)" stroke="oklch(1 0 0 / 0.2)" />
        {zones.map((z) => (
          <rect
            key={z.id}
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            rx="6"
            fill={z.id === zone ? "var(--safety-cyan)" : "oklch(1 0 0 / 0.08)"}
            fillOpacity={z.id === zone ? 0.4 : 1}
            stroke="oklch(1 0 0 / 0.2)"
          />
        ))}
        {zones.map((z) => (
          <text
            key={z.id + "t"}
            x={z.x + z.w / 2}
            y={z.y + z.h / 2 + 4}
            textAnchor="middle"
            className="fill-foreground font-mono text-[10px]"
          >
            {z.id}
          </text>
        ))}
        <circle
          cx={zones.find((z) => z.id === zone)!.x + zones.find((z) => z.id === zone)!.w / 2}
          cy={zones.find((z) => z.id === zone)!.y + zones.find((z) => z.id === zone)!.h / 2}
          r="4"
          fill="var(--safety-cyan)"
        >
          <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Your seat pulses in cyan. Target: {target}
      </p>
    </div>
  );
}

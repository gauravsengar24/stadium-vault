import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { GlassCard, SectionHeader } from "@/stadium/shared/glass";
import { supabase } from "@/integrations/supabase/client";
import { ZONE_LABELS } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/heatmap")({
  component: StaffHeatmap,
  head: () => ({ meta: [{ title: "Crowd Heatmap — Staff Console" }] }),
});

interface Zone {
  zone: string;
  name: string;
  capacity: number;
  current_count: number;
  density: number;
}

function StaffHeatmap() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("crowd_zones").select("*").order("zone");
      setZones((data as Zone[]) ?? []);
    }
    load();
    const ch = supabase
      .channel("staff-heatmap")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crowd_zones" },
        load,
      )
      .subscribe();
    // Simulate live density drift every 6s
    const timer = setInterval(async () => {
      const { data } = await supabase.from("crowd_zones").select("*");
      const rows = (data ?? []) as Zone[];
      const target = rows[Math.floor(Math.random() * rows.length)];
      if (!target) return;
      const delta = Math.round((Math.random() - 0.5) * 80);
      const nextCount = Math.max(0, Math.min(target.capacity, target.current_count + delta));
      await supabase
        .from("crowd_zones")
        .update({
          current_count: nextCount,
          density: nextCount / target.capacity,
          updated_at: new Date().toISOString(),
        })
        .eq("zone", target.zone);
    }, 6000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(timer);
    };
  }, []);

  const focused = zones.find((z) => z.zone === selected) ?? zones[0];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Live telemetry" title="Crowd heatmap" />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GlassCard className="p-6">
          <HeatmapSvg zones={zones} onSelect={setSelected} selected={focused?.zone} />
          <Legend />
        </GlassCard>

        <div className="space-y-3">
          {zones.map((z) => {
            const pct = Math.round(z.density * 100);
            const tone =
              z.density < 0.5 ? "green" : z.density < 0.8 ? "amber" : "red";
            return (
              <button
                key={z.zone}
                onClick={() => setSelected(z.zone)}
                className="block w-full text-left"
              >
                <GlassCard
                  className={`p-4 transition ${
                    z.zone === focused?.zone ? "border-safety-cyan/60 ring-1 ring-safety-cyan/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {ZONE_LABELS[z.zone] ?? z.name}{" "}
                        <span className="text-muted-foreground">· {z.zone}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {z.current_count} / {z.capacity}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-2xl font-semibold ${
                        tone === "red"
                          ? "text-safety-red"
                          : tone === "amber"
                            ? "text-safety-amber"
                            : "text-safety-green"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-glass">
                    <div
                      className={`h-full ${
                        tone === "red"
                          ? "bg-safety-red"
                          : tone === "amber"
                            ? "bg-safety-amber"
                            : "bg-safety-green"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </GlassCard>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeatmapSvg({
  zones,
  onSelect,
  selected,
}: {
  zones: Zone[];
  onSelect: (z: string) => void;
  selected?: string;
}) {
  const geo: Record<string, { x: number; y: number; w: number; h: number }> = {
    N1: { x: 140, y: 30, w: 100, h: 50 },
    N2: { x: 260, y: 30, w: 100, h: 50 },
    E1: { x: 380, y: 100, w: 50, h: 90 },
    E2: { x: 380, y: 210, w: 50, h: 90 },
    S1: { x: 260, y: 320, w: 100, h: 50 },
    S2: { x: 140, y: 320, w: 100, h: 50 },
    W1: { x: 70, y: 210, w: 50, h: 90 },
    W2: { x: 70, y: 100, w: 50, h: 90 },
  };
  return (
    <svg viewBox="0 0 500 400" className="h-96 w-full">
      <defs>
        <radialGradient id="field2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.45 0.16 155 / 0.9)" />
          <stop offset="100%" stopColor="oklch(0.28 0.12 155 / 0.5)" />
        </radialGradient>
      </defs>
      <ellipse cx="250" cy="200" rx="150" ry="90" fill="url(#field2)" stroke="oklch(1 0 0 / 0.15)" />
      <text x="250" y="205" textAnchor="middle" className="fill-foreground/60 text-[10px]">
        PITCH
      </text>
      {zones.map((z) => {
        const g = geo[z.zone];
        if (!g) return null;
        const color =
          z.density < 0.5
            ? "var(--safety-green)"
            : z.density < 0.8
              ? "var(--safety-amber)"
              : "var(--safety-red)";
        return (
          <g
            key={z.zone}
            onClick={() => onSelect(z.zone)}
            className="cursor-pointer"
          >
            <rect
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              rx="10"
              fill={color}
              fillOpacity={Math.max(0.15, z.density)}
              stroke={z.zone === selected ? "var(--safety-cyan)" : "oklch(1 0 0 / 0.2)"}
              strokeWidth={z.zone === selected ? 2 : 1}
            />
            <text
              x={g.x + g.w / 2}
              y={g.y + g.h / 2 - 2}
              textAnchor="middle"
              className="fill-foreground font-mono text-xs font-bold"
            >
              {z.zone}
            </text>
            <text
              x={g.x + g.w / 2}
              y={g.y + g.h / 2 + 12}
              textAnchor="middle"
              className="fill-foreground/80 text-[10px]"
            >
              {Math.round(z.density * 100)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded bg-safety-green" /> &lt;50%
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded bg-safety-amber" /> 50–80%
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded bg-safety-red" /> &gt;80%
      </span>
    </div>
  );
}

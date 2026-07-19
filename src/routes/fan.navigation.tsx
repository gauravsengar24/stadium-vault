import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Toilet,
  Cross,
  UtensilsCrossed,
  DoorOpen,
  ParkingCircle,
  Baby,
  ArrowRight,
  Search,
  MapPin,
  Footprints,
} from "lucide-react";

import { GlassCard, GlassIcon, SectionHeader } from "@/stadium/shared/glass";
import { loadSession, ZONE_LABELS, type FanSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/fan/navigation")({
  component: FanNavigation,
  head: () => ({ meta: [{ title: "Navigate — Fan Portal" }] }),
});

const ZONES = ["N1", "N2", "E1", "E2", "S1", "S2", "W1", "W2"] as const;
type Zone = (typeof ZONES)[number];

const ZONE_COORDS: Record<Zone, { x: number; y: number }> = {
  N1: { x: 130, y: 35 },
  N2: { x: 190, y: 35 },
  E1: { x: 245, y: 90 },
  E2: { x: 245, y: 150 },
  S1: { x: 190, y: 205 },
  S2: { x: 130, y: 205 },
  W1: { x: 75, y: 150 },
  W2: { x: 75, y: 90 },
};

const ZONE_ADJACENCY: Record<Zone, Zone[]> = {
  N1: ["N2", "W2"],
  N2: ["N1", "E1"],
  E1: ["N2", "E2"],
  E2: ["E1", "S1"],
  S1: ["E2", "S2"],
  S2: ["S1", "W1"],
  W1: ["S2", "W2"],
  W2: ["W1", "N1"],
};

interface Amenity {
  key: string;
  label: string;
  icon: typeof Toilet;
  tint: "cyan" | "red" | "green" | "amber" | "violet";
  zone: Zone;
  description: string;
}

const AMENITIES: Amenity[] = [
  { key: "restroom", label: "Restroom", icon: Toilet, tint: "cyan", zone: "N1", description: "Men's & Women's restrooms with accessible stalls" },
  { key: "firstaid", label: "First Aid", icon: Cross, tint: "red", zone: "E1", description: "Medical staff on-site. Emergency equipment available." },
  { key: "concession", label: "Concession", icon: UtensilsCrossed, tint: "green", zone: "S1", description: "Hot dogs, pizza, drinks, and snacks" },
  { key: "exit", label: "Nearest Exit", icon: DoorOpen, tint: "amber", zone: "W1", description: "Gate C — leads to East Parking Lot" },
  { key: "parking", label: "Parking", icon: ParkingCircle, tint: "violet", zone: "W2", description: "Structure B — $15 cashless entry" },
  { key: "family", label: "Family Room", icon: Baby, tint: "cyan", zone: "N2", description: "Quiet space for parents with infants. Changing tables." },
];

const AMENITY_ZONE_MAP: Record<string, Zone> = {};
for (const a of AMENITIES) {
  AMENITY_ZONE_MAP[a.key] = a.zone;
}

function bfsShortestPath(from: Zone, to: Zone): Zone[] {
  if (from === to) return [from];
  const queue: Zone[][] = [[from]];
  const visited = new Set<Zone>([from]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    for (const next of ZONE_ADJACENCY[current]) {
      if (next === to) return [...path, next];
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return [from];
}

function pathToDirections(path: Zone[], targetLabel: string, fromZone: Zone): string[] {
  if (path.length === 0) return ["No route available."];
  const steps: string[] = [];
  const dirLabel = (z: Zone) => {
    return `${ZONE_LABELS[z] ?? z}`;
  };
  steps.push(`Start from your seat in ${dirLabel(fromZone)}.`);
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const prevPos = ZONE_COORDS[prev];
    const currPos = ZONE_COORDS[curr];
    const dx = currPos.x - prevPos.x;
    const dy = currPos.y - prevPos.y;
    let dir: string;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? "east" : "west";
    } else {
      dir = dy > 0 ? "south" : "north";
    }
    const distance = Math.round(Math.sqrt(dx * dx + dy * dy) * 1.2);
    steps.push(`Walk ${dir} through the concourse toward ${dirLabel(curr)} (${distance}m).`);
  }
  if (path.length === 1) {
    steps.push(`${targetLabel} is in your zone — ${dirLabel(fromZone)}. Follow the signs overhead.`);
  } else {
    steps.push(`Arrive at ${targetLabel} in ${dirLabel(path[path.length - 1])}. It's on your ${path.length > 2 ? "left" : "right"}.`);
  }
  return steps;
}

function estimateDistance(path: Zone[]): number {
  if (path.length <= 1) return 30;
  let d = 0;
  for (let i = 1; i < path.length; i++) {
    const a = ZONE_COORDS[path[i - 1]];
    const b = ZONE_COORDS[path[i]];
    d += Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  }
  return Math.round(d * 1.2);
}

function searchAmenities(query: string): Amenity[] {
  const q = query.toLowerCase().trim();
  if (!q) return AMENITIES;
  return AMENITIES.filter(
    (a) =>
      a.label.toLowerCase().includes(q) ||
      a.key.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.zone.toLowerCase().includes(q),
  );
}

function FanNavigation() {
  const [session, setSession] = useState<FanSession | null>(null);
  const [selected, setSelected] = useState<string>("restroom");
  const [search, setSearch] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  const userZone = (session?.zone ?? "N1") as Zone;
  const active = AMENITIES.find((a) => a.key === selected)!;
  const targetZone = AMENITY_ZONE_MAP[selected] ?? userZone;

  const path = useMemo(() => bfsShortestPath(userZone, targetZone), [userZone, targetZone]);
  const distance = useMemo(() => estimateDistance(path), [path]);
  const walkMinutes = Math.max(1, Math.round(distance / 80));
  const directions = useMemo(() => pathToDirections(path, active.label, userZone), [path, active.label, userZone]);

  const results = useMemo(() => searchAmenities(search), [search]);

  const amenityDistances = useMemo(() => {
    const d: Record<string, { distance: number; walkMinutes: number }> = {};
    for (const a of AMENITIES) {
      const p = bfsShortestPath(userZone, a.zone);
      const dist = estimateDistance(p);
      d[a.key] = { distance: dist, walkMinutes: Math.max(1, Math.round(dist / 80)) };
    }
    return d;
  }, [userZone]);

  function select(key: string) {
    setSelected(key);
    setSearch("");
    setTimeout(() => {
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={session ? `${ZONE_LABELS[userZone]} · Gate ${userZone}` : "Arena"}
        title="Find your way"
        action={
          <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono">
            <Footprints className="size-3" /> {walkMinutes} min
          </span>
        }
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

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restroom, first aid, parking…"
          className="glass w-full rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-safety-cyan"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.45fr]">
        <div className="space-y-2">
          {results.map((a) => {
            const isActive = a.key === selected;
            const isInZone = a.zone === userZone;
            const ad = amenityDistances[a.key];
            return (
              <button key={a.key} onClick={() => select(a.key)} className="group w-full">
                <GlassCard
                  className={`flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 ${
                    isActive ? "border-safety-cyan/60 ring-1 ring-safety-cyan/30" : ""
                  }`}
                >
                  <GlassIcon tint={a.tint} className="size-11 shrink-0 rounded-xl">
                    <a.icon className="size-5" />
                  </GlassIcon>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{a.label}</p>
                      {isInZone && (
                        <span className="rounded-full bg-safety-green/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-safety-green">
                          Same zone
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{a.description}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <MapPin className="size-3" /> {ZONE_LABELS[a.zone]} · Gate {a.zone}
                      {ad && (
                        <>
                          <span className="text-muted-foreground/40">|</span>
                          <span className="text-safety-cyan">{ad.distance}m</span>
                          <span className="text-muted-foreground">· ~{ad.walkMinutes} min walk</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Footprints className="size-4 text-muted-foreground/40 transition group-hover:text-safety-cyan" />
                    <ArrowRight className={`size-4 transition ${isActive ? "text-safety-cyan translate-x-0.5" : "text-muted-foreground group-hover:translate-x-0.5 group-hover:text-safety-cyan"}`} />
                  </div>
                </GlassCard>
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No amenities match "{search}"
            </p>
          )}
        </div>

        <div ref={mapRef}>
          <GlassCard className="overflow-hidden p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Route · via {path.length > 1 ? `${path.length - 1} zone${path.length > 2 ? "s" : ""}` : "same zone"}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{active.label}</h3>
              </div>
              <span className="glass rounded-full px-3 py-1 text-xs font-mono">{distance}m</span>
            </div>

            <StadiumMap userZone={userZone} targetZone={targetZone} targetLabel={active.label} path={path} />

            <ol className="mt-5 space-y-2">
              {directions.map((step, i) => (
                <li key={i} className="glass flex items-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-glass-strong">
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
    </div>
  );
}

function StadiumMap({
  userZone,
  targetZone,
  targetLabel,
  path,
}: {
  userZone: Zone;
  targetZone: Zone;
  targetLabel: string;
  path: Zone[];
}) {
  const zoneGeo: Record<Zone, { x: number; y: number; w: number; h: number }> = {
    N1: { x: 100, y: 20, w: 60, h: 30 },
    N2: { x: 160, y: 20, w: 60, h: 30 },
    E1: { x: 230, y: 60, w: 30, h: 60 },
    E2: { x: 230, y: 120, w: 30, h: 60 },
    S1: { x: 160, y: 190, w: 60, h: 30 },
    S2: { x: 100, y: 190, w: 60, h: 30 },
    W1: { x: 60, y: 120, w: 30, h: 60 },
    W2: { x: 60, y: 60, w: 30, h: 60 },
  };

  const pathPoints = path.map((z) => ZONE_COORDS[z]);
  const targetPos = ZONE_COORDS[targetZone];
  const originPos = ZONE_COORDS[userZone];

  const pathD = pathPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="glass rounded-2xl p-4">
      <svg viewBox="0 0 320 240" className="h-56 w-full">
        <defs>
          <radialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.4 0.16 155 / 0.8)" />
            <stop offset="100%" stopColor="oklch(0.3 0.12 155 / 0.6)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="160" cy="120" rx="90" ry="55" fill="url(#fieldGlow)" stroke="oklch(1 0 0 / 0.2)" strokeWidth="0.5" />

        <text x="160" y="123" textAnchor="middle" className="fill-foreground/30 text-[9px]" fontFamily="monospace">
          FIELD
        </text>

        {ZONES.map((z) => {
          const g = zoneGeo[z];
          const isUser = z === userZone;
          const isTarget = z === targetZone;
          const inPath = path.includes(z);
          let fill = "oklch(1 0 0 / 0.06)";
          if (isUser) fill = "var(--safety-cyan)";
          else if (isTarget) fill = "var(--safety-amber)";
          else if (inPath) fill = "var(--safety-cyan)";
          return (
            <rect
              key={z}
              x={g.x}
              y={g.y}
              width={g.w}
              height={g.h}
              rx="6"
              fill={fill}
              fillOpacity={isUser || isTarget ? 0.35 : inPath ? 0.2 : 1}
              stroke={
                isUser ? "var(--safety-cyan)" : isTarget ? "var(--safety-amber)" : inPath ? "var(--safety-cyan)" : "oklch(1 0 0 / 0.15)"
              }
              strokeWidth={isUser || isTarget ? 2 : inPath ? 1.5 : 0.5}
              strokeDasharray={inPath && !isUser && !isTarget ? "3,3" : "none"}
            />
          );
        })}

        {ZONES.map((z) => {
          const g = zoneGeo[z];
          return (
            <text
              key={z + "t"}
              x={g.x + g.w / 2}
              y={g.y + g.h / 2 + 4}
              textAnchor="middle"
              className="fill-foreground font-mono text-[10px]"
              opacity={path.includes(z) ? 1 : 0.5}
            >
              {z}
            </text>
          );
        })}

        {path.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--safety-cyan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6,4"
            filter="url(#glow)"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="20" dur="1s" repeatCount="indefinite" />
          </path>
        )}

        {path.length > 1 && pathPoints.slice(1, -1).map((p, i) => (
          <circle key={`wp${i}`} cx={p.x} cy={p.y} r="2.5" fill="var(--safety-cyan)" opacity="0.6" />
        ))}

        <circle cx={originPos.x} cy={originPos.y} r="5" fill="var(--safety-cyan)" filter="url(#glow)">
          <animate attributeName="r" values="5;9;5" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {userZone !== targetZone && (
          <g>
            <rect x={targetPos.x - 8} y={targetPos.y - 10} width="16" height="20" rx="4" fill="var(--safety-amber)" opacity="0.9" />
            <text x={targetPos.x} y={targetPos.y + 5} textAnchor="middle" className="fill-background text-[9px] font-bold" fontFamily="monospace">
              ●
            </text>
          </g>
        )}

        <text x={originPos.x} y={originPos.y + 16} textAnchor="middle" className="fill-safety-cyan text-[8px] font-bold">
          YOU
        </text>
      </svg>

      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-safety-cyan" /> You
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-safety-amber" /> {targetLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-safety-cyan" style={{ background: "repeating-linear-gradient(90deg, var(--safety-cyan) 0, var(--safety-cyan) 4px, transparent 4px, transparent 6px)" }} /> Route
        </span>
      </div>
    </div>
  );
}



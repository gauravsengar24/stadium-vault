import { describe, it, expect } from "vitest";

// Inline the core logic from fan.navigation.tsx for isolated testing
type Zone = "N1" | "N2" | "E1" | "E2" | "S1" | "S2" | "W1" | "W2";

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

function pathToDirections(path: Zone[], targetLabel: string, fromZone: Zone): string[] {
  if (path.length === 0) return ["No route available."];
  const steps: string[] = [];
  const dirLabel = (z: Zone) => z;
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

describe("navigation pathfinding", () => {
  it("returns single zone when source equals destination", () => {
    expect(bfsShortestPath("N1", "N1")).toEqual(["N1"]);
  });

  it("finds direct adjacent path N1 -> N2", () => {
    expect(bfsShortestPath("N1", "N2")).toEqual(["N1", "N2"]);
  });

  it("finds direct adjacent path N1 -> W2", () => {
    expect(bfsShortestPath("N1", "W2")).toEqual(["N1", "W2"]);
  });

  it("finds multi-zone path N1 -> S1", () => {
    const path = bfsShortestPath("N1", "S1");
    expect(path[0]).toBe("N1");
    expect(path[path.length - 1]).toBe("S1");
    expect(path.length).toBeGreaterThanOrEqual(3);
  });

  it("finds path across entire stadium N1 -> S2", () => {
    const path = bfsShortestPath("N1", "S2");
    expect(path[0]).toBe("N1");
    expect(path[path.length - 1]).toBe("S2");
  });

  it("finds path N2 -> W1", () => {
    const path = bfsShortestPath("N2", "W1");
    expect(path[0]).toBe("N2");
    expect(path[path.length - 1]).toBe("W1");
  });

  it("finds path E1 -> W2", () => {
    const path = bfsShortestPath("E1", "W2");
    expect(path[0]).toBe("E1");
    expect(path[path.length - 1]).toBe("W2");
  });

  it("every zone is reachable from every other zone", () => {
    const zones: Zone[] = ["N1", "N2", "E1", "E2", "S1", "S2", "W1", "W2"];
    for (const from of zones) {
      for (const to of zones) {
        const path = bfsShortestPath(from, to);
        expect(path[0]).toBe(from);
        expect(path[path.length - 1]).toBe(to);
      }
    }
  });
});

describe("distance estimation", () => {
  it("returns 30m for same-zone destination", () => {
    expect(estimateDistance(["N1"])).toBe(30);
  });

  it("calculates positive distance for adjacent zones", () => {
    const d = estimateDistance(["N1", "N2"]);
    expect(d).toBeGreaterThan(0);
  });

  it("longer paths give larger distances", () => {
    const close = estimateDistance(["N1", "N2"]);
    const far = estimateDistance(["N1", "N2", "E1", "E2", "S1"]);
    expect(far).toBeGreaterThan(close);
  });
});

describe("direction generation", () => {
  it("generates start step for same-zone", () => {
    const steps = pathToDirections(["N1"], "Restroom", "N1");
    expect(steps[0]).toContain("Start");
    expect(steps.some((s) => s.includes("Restroom"))).toBe(true);
  });

  it("generates walk steps for adjacent zones", () => {
    const steps = pathToDirections(["N1", "N2"], "Concession", "N1");
    expect(steps.length).toBeGreaterThanOrEqual(2);
    expect(steps[0]).toContain("Start");
    expect(steps[1]).toContain("Walk");
  });

  it("generates arrival step at end", () => {
    const steps = pathToDirections(["N1", "N2"], "Concession", "N1");
    const last = steps[steps.length - 1];
    expect(last).toContain("Arrive");
    expect(last).toContain("Concession");
  });

  it("returns fallback for empty path", () => {
    const steps = pathToDirections([], "X", "N1");
    expect(steps[0]).toBe("No route available.");
  });
});

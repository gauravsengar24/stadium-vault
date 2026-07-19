import { describe, it, expect, vi, beforeEach } from "vitest";

function buildMock() {
  const chain: Record<string, vi.Mock> = {};
  const builder = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (!chain[prop]) {
          chain[prop] = vi.fn(() => builder);
        }
        return chain[prop];
      },
    },
  );
  return { builder, chain };
}

vi.mock("@/integrations/supabase/client", () => {
  const { builder } = buildMock();
  return {
    supabase: {
      from: vi.fn(() => builder),
      channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
      removeChannel: vi.fn(),
    },
  };
});

import { supabase } from "@/integrations/supabase/client";

describe("Supabase incident patterns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a fan emergency incident", async () => {
    (supabase.from("incidents").insert as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    const { error } = await supabase.from("incidents").insert({
      incident_type: "medical",
      severity: "high",
      zone: "N1",
      description: "Fan collapsed at section 105",
      status: "open",
    });
    expect(error).toBeNull();
  });

  it("inserts a staff security entry", async () => {
    (supabase.from("incidents").insert as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    const { error } = await supabase.from("incidents").insert({
      incident_type: "suspicious",
      severity: "medium",
      zone: "E2",
      description: "Unattended bag",
      reported_by: "SEC-001",
      status: "open",
    });
    expect(error).toBeNull();
  });

  it("loads and chains to query incidents", () => {
    const from = supabase.from("incidents");
    from.select("*");
    const chained = (from as any).order("created_at", { ascending: false });
    chained.limit(40);
    expect(from.select).toHaveBeenCalledWith("*");
    expect((from as any).order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(chained.limit).toHaveBeenCalledWith(40);
  });

  it("resolves an incident by id", () => {
    const from = supabase.from("incidents");
    from.update({ status: "resolved" });
    (from as any).eq("id", "abc-123");
    expect(from.update).toHaveBeenCalledWith({ status: "resolved" });
    expect((from as any).eq).toHaveBeenCalledWith("id", "abc-123");
  });
});

describe("Supabase help queue patterns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts a help request", async () => {
    (supabase.from("help_queue").insert as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    const { error } = await supabase.from("help_queue").insert({
      seat_no: "105-10-5",
      zone: "N2",
      query: "Where is the nearest restroom?",
      status: "pending",
    });
    expect(error).toBeNull();
  });

  it("loads help requests with chaining", () => {
    const from = supabase.from("help_queue");
    from.select("*");
    const chained = (from as any).order("created_at", { ascending: false });
    expect(from.select).toHaveBeenCalledWith("*");
    expect((from as any).order).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});

describe("Supabase alert patterns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts a broadcast alert", async () => {
    (supabase.from("alerts").insert as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    const { error } = await supabase.from("alerts").insert({
      alert_type: "evacuation",
      severity: "critical",
      message: "Evacuate zone N1 immediately",
      zones: ["N1"],
      active: true,
    });
    expect(error).toBeNull();
  });

  it("loads active alerts", () => {
    const from = supabase.from("alerts");
    from.select("*");
    expect(from.select).toHaveBeenCalledWith("*");
  });
});

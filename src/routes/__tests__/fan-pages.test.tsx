import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FC } from "react";

vi.mock("@/stadium/shared/session", () => ({
  loadSession: vi.fn(() => null),
  saveSession: vi.fn(),
  clearSession: vi.fn(),
  seatToZone: vi.fn(() => "N1"),
  ZONE_LABELS: {
    N1: "North Stand 1",
    N2: "North Stand 2",
    E1: "East Stand 1",
    E2: "East Stand 2",
    S1: "South Stand 1",
    S2: "South Stand 2",
    W1: "West Stand 1",
    W2: "West Stand 2",
  },
  LANGUAGES: [{ code: "en", label: "English" }],
}));

vi.mock("@/lib/firestore", () => ({
  getCollection: vi.fn().mockResolvedValue([]),
  listenCollection: vi.fn(() => vi.fn()),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: { component: React.FC }) => ({
    options: opts,
    component: opts.component,
  }),
  Link: ({ children, to, className }: { children?: React.ReactNode; to?: string; className?: string }) =>
    <a href={to} className={className}>{children}</a>,
  Outlet: () => <div data-testid="outlet" />,
  useRouter: () => ({ invalidate: vi.fn() }),
}));

import { loadSession } from "@/stadium/shared/session";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FanDashboard", () => {
  it("shows explore mode when no session", async () => {
    vi.mocked(loadSession).mockReturnValue(null);
    const mod = await import("@/routes/fan.index");
    const FanDashboard = mod.Route.options.component as FC;

    render(<FanDashboard />);
    expect(screen.getByText("Explore mode")).toBeInTheDocument();
    expect(screen.getByText(/Enter your seat number/)).toBeInTheDocument();
  });

  it("shows quick actions", async () => {
    vi.mocked(loadSession).mockReturnValue(null);
    const mod = await import("@/routes/fan.index");
    const FanDashboard = mod.Route.options.component as FC;

    render(<FanDashboard />);
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    expect(screen.getByText("Ask Guardian")).toBeInTheDocument();
    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
  });
});

describe("FanAlerts", () => {
  it("shows all clear when no alerts", async () => {
    const mod = await import("@/routes/fan.alerts");
    const FanAlerts = mod.Route.options.component as FC;

    render(<FanAlerts />);
    expect(screen.getByText("All clear")).toBeInTheDocument();
  });
});

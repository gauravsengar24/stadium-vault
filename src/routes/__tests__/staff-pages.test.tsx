import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FC } from "react";

vi.mock("@/stadium/shared/session", () => ({
  loadSession: vi.fn(() => ({
    role: "staff",
    staffId: "SEC-001",
    name: "Alex Guard",
    staffRole: "security",
    zone: "N1",
  })),
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
}));

vi.mock("@/lib/firestore", () => ({
  getCollection: vi.fn().mockResolvedValue([]),
  listenCollection: vi.fn(() => vi.fn()),
  addDocument: vi.fn().mockResolvedValue("new-id"),
  updateDocument: vi.fn().mockResolvedValue(undefined),
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StaffDashboard", () => {
  it("renders dashboard with stat cards", async () => {
    const mod = await import("@/routes/staff.index");
    const StaffDashboard = mod.Route.options.component as FC;

    render(<StaffDashboard />);
    expect(screen.getByText("Command center")).toBeInTheDocument();
    expect(screen.getByText("Open incidents")).toBeInTheDocument();
    expect(screen.getByText("Fans awaiting help")).toBeInTheDocument();
    expect(screen.getByText("Orders in flight")).toBeInTheDocument();
    expect(screen.getByText("Active alerts")).toBeInTheDocument();
    expect(screen.getByText("Venue occupancy")).toBeInTheDocument();
  });
});

describe("StaffBroadcast", () => {
  it("renders compose alert form", async () => {
    const mod = await import("@/routes/staff.broadcast");
    const StaffBroadcast = mod.Route.options.component as FC;

    render(<StaffBroadcast />);
    expect(screen.getByText("Emergency broadcast")).toBeInTheDocument();
    expect(screen.getByText("Compose alert")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Clear, direct instruction/)).toBeInTheDocument();
  });
});

describe("StaffFire", () => {
  it("renders fire console with stats", async () => {
    const mod = await import("@/routes/staff.fire");
    const StaffFire = mod.Route.options.component as FC;

    render(<StaffFire />);
    expect(screen.getByText("Fire safety console")).toBeInTheDocument();
    expect(screen.getByText("Extinguishers deployed")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("Zones evacuating")).toBeInTheDocument();
  });
});

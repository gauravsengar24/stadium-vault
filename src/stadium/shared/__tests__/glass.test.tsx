import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassCard, GlassIcon, SectionHeader, SeverityPill, StatusDot } from "../glass";

describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard>Hello</GlassCard>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<GlassCard className="custom-class">Test</GlassCard>);
    expect(screen.getByText("Test").className).toContain("custom-class");
  });
});

describe("GlassIcon", () => {
  it("renders children", () => {
    render(<GlassIcon tint="cyan">🔔</GlassIcon>);
    expect(screen.getByText("🔔")).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<GlassIcon tint="amber" className="extra">Icon</GlassIcon>);
    const el = screen.getByText("Icon");
    expect(el.className).toContain("extra");
  });

  it("renders with cyan tint", () => {
    const { container } = render(<GlassIcon tint="cyan">C</GlassIcon>);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with all tint variants", () => {
    for (const tint of ["cyan", "amber", "red", "green", "violet"] as const) {
      const { unmount } = render(<GlassIcon tint={tint}>{tint}</GlassIcon>);
      expect(screen.getByText(tint)).toBeInTheDocument();
      unmount();
    }
  });
});

describe("SectionHeader", () => {
  it("renders eyebrow and title", () => {
    render(<SectionHeader eyebrow="Live" title="Dashboard" />);
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    render(<SectionHeader eyebrow="Test" title="Test" action={<button>Action</button>} />);
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});

describe("SeverityPill", () => {
  it("renders severity text", () => {
    render(<SeverityPill severity="high" />);
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("renders critical severity", () => {
    render(<SeverityPill severity="critical" />);
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("renders low severity", () => {
    render(<SeverityPill severity="low" />);
    expect(screen.getByText("low")).toBeInTheDocument();
  });
});

describe("StatusDot", () => {
  it("renders green dot", () => {
    const { container } = render(<StatusDot tone="green" />);
    const dot = container.querySelector("span");
    expect(dot).toBeTruthy();
  });

  it("renders amber dot", () => {
    const { container } = render(<StatusDot tone="amber" />);
    expect(container.querySelector("span")).toBeTruthy();
  });

  it("renders red dot", () => {
    const { container } = render(<StatusDot tone="red" />);
    expect(container.querySelector("span")).toBeTruthy();
  });
});

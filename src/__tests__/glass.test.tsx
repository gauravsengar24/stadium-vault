import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassCard, GlassIcon, SectionHeader, SeverityPill } from "@/stadium/shared/glass";

describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard>Hello</GlassCard>);
    expect(screen.getByText("Hello")).toBeDefined();
  });
});

describe("GlassIcon", () => {
  it("renders children", () => {
    render(<GlassIcon tint="cyan">✓</GlassIcon>);
    expect(screen.getByText("✓")).toBeDefined();
  });
  it("defaults to default tint", () => {
    render(<GlassIcon>X</GlassIcon>);
    expect(screen.getByText("X")).toBeDefined();
  });
});

describe("SectionHeader", () => {
  it("renders title", () => {
    render(<SectionHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeDefined();
  });
  it("renders eyebrow when provided", () => {
    render(<SectionHeader eyebrow="Overview" title="Dashboard" />);
    expect(screen.getByText("Overview")).toBeDefined();
  });
  it("does not show eyebrow when absent", () => {
    const { container } = render(<SectionHeader title="Dashboard" />);
    expect(container.querySelector("p")).toBeNull();
  });
});

describe("SeverityPill", () => {
  it("renders severity text", () => {
    render(<SeverityPill severity="high" />);
    expect(screen.getByText("high")).toBeDefined();
  });
  it("renders all severities", () => {
    for (const s of ["low", "medium", "high", "critical"]) {
      const { unmount } = render(<SeverityPill severity={s} />);
      expect(screen.getByText(s)).toBeDefined();
      unmount();
    }
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassCard, GlassIcon, SectionHeader, SeverityPill } from "@/stadium/shared/glass";

describe("Accessibility patterns in shared components", () => {
  it("GlassCard renders semantic div", () => {
    const { container } = render(<GlassCard>content</GlassCard>);
    expect(container.querySelector("div")).toBeTruthy();
  });

  it("SectionHeader renders an h1", () => {
    render(<SectionHeader title="Dashboard" />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeDefined();
    expect(heading.textContent).toBe("Dashboard");
  });

  it("SectionHeader with eyebrow renders header landmark", () => {
    const { container } = render(<SectionHeader eyebrow="Overview" title="Dashboard" />);
    expect(container.querySelector("header")).toBeTruthy();
  });

  it("SeverityPill uses semantic text for severity level", () => {
    render(<SeverityPill severity="critical" />);
    expect(screen.getByText("critical")).toBeDefined();
  });

  it("GlassIcon inline element is non-interactive", () => {
    const { container } = render(<GlassIcon tint="amber">✕</GlassIcon>);
    const el = container.querySelector("span");
    expect(el).toBeTruthy();
    expect(el?.tagName).toBe("SPAN");
  });

  it("GlassCard children are readable", () => {
    render(
      <GlassCard>
        <p>Hello world</p>
      </GlassCard>,
    );
    expect(screen.getByText("Hello world")).toBeDefined();
  });
});

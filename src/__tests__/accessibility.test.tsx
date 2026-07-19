import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { GlassCard, GlassIcon, SectionHeader, SeverityPill, StatusDot } from "@/stadium/shared/glass";

expect.extend(toHaveNoViolations);

describe("GlassCard accessibility", () => {
  it("renders without a11y violations", async () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("GlassIcon accessibility", () => {
  it("renders without a11y violations", async () => {
    const { container } = render(<GlassIcon tint="cyan">✓</GlassIcon>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("SectionHeader accessibility", () => {
  it("renders heading without a11y violations", async () => {
    const { container } = render(<SectionHeader title="Dashboard" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("SeverityPill accessibility", () => {
  it("renders without a11y violations", async () => {
    const { container } = render(<SeverityPill severity="high" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("StatusDot accessibility", () => {
  it("renders without a11y violations", async () => {
    const { container } = render(<StatusDot tone="green" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

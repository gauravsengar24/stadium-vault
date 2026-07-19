import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
  it("handles conditional classes", () => {
    expect(cn("text-red-500", undefined)).toBe("text-red-500");
  });
  it("handles multiple args", () => {
    expect(cn("p-4", "m-2", "rounded-lg")).toBe("p-4 m-2 rounded-lg");
  });
});

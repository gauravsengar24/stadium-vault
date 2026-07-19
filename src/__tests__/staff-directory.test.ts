import { describe, it, expect } from "vitest";
import {
  isValidStaffId,
  lookupInFallback,
  getStaffDirectory,
  toStaffSession,
} from "@/stadium/shared/staff-directory";

describe("isValidStaffId", () => {
  it("accepts SEC-001", () => {
    expect(isValidStaffId("SEC-001")).toBe(true);
  });

  it("accepts MED-001", () => {
    expect(isValidStaffId("MED-001")).toBe(true);
  });

  it("accepts FIRE-001", () => {
    expect(isValidStaffId("FIRE-001")).toBe(true);
  });

  it("accepts VOL-999", () => {
    expect(isValidStaffId("VOL-999")).toBe(true);
  });

  it("accepts lowercase input", () => {
    expect(isValidStaffId("sec-001")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidStaffId("")).toBe(false);
  });

  it("rejects missing prefix", () => {
    expect(isValidStaffId("001")).toBe(false);
  });

  it("rejects wrong prefix", () => {
    expect(isValidStaffId("ABC-001")).toBe(false);
  });

  it("rejects missing dash", () => {
    expect(isValidStaffId("SEC001")).toBe(false);
  });

  it("rejects short number", () => {
    expect(isValidStaffId("SEC-01")).toBe(false);
  });
});

describe("lookupInFallback", () => {
  it("finds SEC-001", () => {
    const r = lookupInFallback("SEC-001");
    expect(r).toBeDefined();
    expect(r!.name).toBe("Alex Rivera");
  });

  it("finds MED-001", () => {
    const r = lookupInFallback("MED-001");
    expect(r).toBeDefined();
    expect(r!.role).toBe("medical");
  });

  it("finds FIRE-001", () => {
    const r = lookupInFallback("FIRE-001");
    expect(r).toBeDefined();
    expect(r!.zone).toBe("E2");
  });

  it("returns undefined for unknown ID", () => {
    expect(lookupInFallback("XXX-000")).toBeUndefined();
  });

  it("is case insensitive", () => {
    expect(lookupInFallback("sec-001")).toBeDefined();
    expect(lookupInFallback("Sec-001")).toBeDefined();
  });
});

describe("getStaffDirectory", () => {
  it("returns all 7 staff members", () => {
    const dir = getStaffDirectory();
    expect(dir).toHaveLength(7);
  });

  it("contains required roles", () => {
    const dir = getStaffDirectory();
    expect(dir.some((s) => s.role === "security")).toBe(true);
    expect(dir.some((s) => s.role === "medical")).toBe(true);
    expect(dir.some((s) => s.role === "fire")).toBe(true);
    expect(dir.some((s) => s.role === "volunteer")).toBe(true);
  });
});

describe("toStaffSession", () => {
  it("converts record to StaffSession", () => {
    const session = toStaffSession({
      staff_id: "SEC-001",
      name: "Test",
      role: "security",
      zone: "N1",
    });
    expect(session.role).toBe("staff");
    expect(session.staffId).toBe("SEC-001");
    expect(session.staffRole).toBe("security");
    expect(session.name).toBe("Test");
    expect(session.zone).toBe("N1");
  });
});

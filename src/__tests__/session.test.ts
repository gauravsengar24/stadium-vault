import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSession,
  loadSession,
  clearSession,
  seatToZone,
  ZONE_LABELS,
  LANGUAGES,
  type Session,
} from "@/stadium/shared/session";

describe("seatToZone", () => {
  it("returns N1 for sections 1-109", () => {
    expect(seatToZone("1")).toBe("N1");
    expect(seatToZone("109")).toBe("N1");
  });
  it("returns N2 for sections 110-119", () => {
    expect(seatToZone("110")).toBe("N2");
    expect(seatToZone("119")).toBe("N2");
  });
  it("returns E1 for sections 120-209", () => {
    expect(seatToZone("120")).toBe("E1");
    expect(seatToZone("209")).toBe("E1");
  });
  it("returns E2 for sections 210-219", () => {
    expect(seatToZone("210")).toBe("E2");
    expect(seatToZone("219")).toBe("E2");
  });
  it("returns S1 for sections 220-309", () => {
    expect(seatToZone("220")).toBe("S1");
    expect(seatToZone("309")).toBe("S1");
  });
  it("returns S2 for sections 310-319", () => {
    expect(seatToZone("310")).toBe("S2");
    expect(seatToZone("319")).toBe("S2");
  });
  it("returns W1 for sections 320-409", () => {
    expect(seatToZone("320")).toBe("W1");
    expect(seatToZone("409")).toBe("W1");
  });
  it("returns W2 for sections 410+", () => {
    expect(seatToZone("410")).toBe("W2");
    expect(seatToZone("999")).toBe("W2");
  });
  it("returns N1 for NaN section", () => {
    expect(seatToZone("ABC")).toBe("N1");
    expect(seatToZone("")).toBe("N1");
  });
});

describe("ZONE_LABELS", () => {
  it("has all 8 zones", () => {
    expect(Object.keys(ZONE_LABELS)).toHaveLength(8);
  });
  it("maps N1 to North Concourse", () => {
    expect(ZONE_LABELS.N1).toBe("North Concourse");
  });
});

describe("LANGUAGES", () => {
  it("has 9 languages", () => {
    expect(LANGUAGES).toHaveLength(9);
  });
  it("includes English and Hindi", () => {
    expect(LANGUAGES.find((l) => l.code === "en")).toBeDefined();
    expect(LANGUAGES.find((l) => l.code === "hi")).toBeDefined();
  });
});

describe("session persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const fanSession: Session = {
    role: "fan",
    section: "115",
    row: "10",
    seat: "5",
    zone: "N2",
    language: "en",
  };

  const staffSession: Session = {
    role: "staff",
    staffId: "S-001",
    name: "John",
    staffRole: "security",
    zone: "N1",
  };

  it("saves and loads a fan session", () => {
    saveSession(fanSession);
    expect(loadSession()).toEqual(fanSession);
  });

  it("saves and loads a staff session", () => {
    saveSession(staffSession);
    expect(loadSession()).toEqual(staffSession);
  });

  it("clears session", () => {
    saveSession(fanSession);
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it("returns null when no session", () => {
    expect(loadSession()).toBeNull();
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSession,
  loadSession,
  clearSession,
  seatToZone,
  ZONE_LABELS,
  LANGUAGES,
} from "../session";

const STORAGE_KEY = "stadium-guardian-session";

beforeEach(() => {
  localStorage.clear();
});

describe("seatToZone", () => {
  it("maps sections < 110 to N1", () => {
    expect(seatToZone("101")).toBe("N1");
    expect(seatToZone("109")).toBe("N1");
  });

  it("maps sections 110-119 to N2", () => {
    expect(seatToZone("110")).toBe("N2");
    expect(seatToZone("116")).toBe("N2");
    expect(seatToZone("119")).toBe("N2");
  });

  it("maps sections 120-209 to E1", () => {
    expect(seatToZone("120")).toBe("E1");
    expect(seatToZone("201")).toBe("E1");
    expect(seatToZone("209")).toBe("E1");
  });

  it("maps sections 210-219 to E2", () => {
    expect(seatToZone("210")).toBe("E2");
    expect(seatToZone("211")).toBe("E2");
    expect(seatToZone("219")).toBe("E2");
  });

  it("maps sections 220-309 to S1", () => {
    expect(seatToZone("220")).toBe("S1");
    expect(seatToZone("301")).toBe("S1");
    expect(seatToZone("309")).toBe("S1");
  });

  it("maps sections 310-319 to S2", () => {
    expect(seatToZone("310")).toBe("S2");
    expect(seatToZone("311")).toBe("S2");
    expect(seatToZone("319")).toBe("S2");
  });

  it("maps sections 320-409 to W1", () => {
    expect(seatToZone("320")).toBe("W1");
    expect(seatToZone("401")).toBe("W1");
    expect(seatToZone("409")).toBe("W1");
  });

  it("maps sections >= 410 to W2", () => {
    expect(seatToZone("410")).toBe("W2");
    expect(seatToZone("416")).toBe("W2");
    expect(seatToZone("999")).toBe("W2");
  });

  it("returns N1 for non-numeric section (NaN)", () => {
    expect(seatToZone("abc")).toBe("N1");
  });
});

describe("saveSession / loadSession", () => {
  it("saves and loads a fan session", () => {
    const fan = {
      role: "fan" as const,
      section: "104",
      row: "12",
      seat: "5",
      zone: "N1",
      language: "en",
    };
    saveSession(fan);
    expect(loadSession()).toEqual(fan);
  });

  it("saves and loads a staff session", () => {
    const staff = {
      role: "staff" as const,
      staffId: "SEC-001",
      name: "Alex Guard",
      staffRole: "security" as const,
      zone: "N1",
    };
    saveSession(staff);
    expect(loadSession()).toEqual(staff);
  });

  it("overwrites existing session", () => {
    saveSession({ role: "fan", section: "101", row: "1", seat: "1", zone: "N1", language: "en" });
    saveSession({ role: "staff", staffId: "MED-001", name: "Jane", staffRole: "medical", zone: "E1" });
    const loaded = loadSession();
    expect(loaded?.role).toBe("staff");
    if (loaded?.role === "staff") {
      expect(loaded.staffId).toBe("MED-001");
    }
  });
});

describe("clearSession", () => {
  it("removes session from localStorage", () => {
    saveSession({ role: "fan", section: "104", row: "12", seat: "5", zone: "N1", language: "en" });
    clearSession();
    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("ZONE_LABELS", () => {
  it("has labels for all 8 zones", () => {
    expect(ZONE_LABELS["N1"]).toBe("North Concourse");
    expect(ZONE_LABELS["N2"]).toBe("North Upper");
    expect(ZONE_LABELS["E1"]).toBe("East Gate");
    expect(ZONE_LABELS["E2"]).toBe("East Concourse");
    expect(ZONE_LABELS["S1"]).toBe("South Field");
    expect(ZONE_LABELS["S2"]).toBe("South Upper");
    expect(ZONE_LABELS["W1"]).toBe("West Concourse");
    expect(ZONE_LABELS["W2"]).toBe("West Gate");
  });
});

describe("LANGUAGES", () => {
  it("includes English as first language", () => {
    expect(LANGUAGES[0].code).toBe("en");
    expect(LANGUAGES[0].label).toBe("English");
  });

  it("includes 9 languages", () => {
    expect(LANGUAGES).toHaveLength(9);
  });

  it("all languages have code and label", () => {
    for (const lang of LANGUAGES) {
      expect(lang.code).toBeDefined();
      expect(typeof lang.code).toBe("string");
      expect(lang.label).toBeDefined();
      expect(typeof lang.label).toBe("string");
    }
  });
});

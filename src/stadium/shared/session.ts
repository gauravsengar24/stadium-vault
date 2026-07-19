// Lightweight client-side session — no login, just role + identifier
export type Role = "fan" | "staff";

export interface FanSession {
  role: "fan";
  section: string;
  row: string;
  seat: string;
  zone: string;
  language: string;
}

export interface StaffSession {
  role: "staff";
  staffId: string;
  name: string;
  staffRole: "security" | "medical" | "fire" | "volunteer";
  zone: string;
}

export type Session = FanSession | StaffSession;

const KEY = "stadium-guardian-session";

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

// Zone map — first digit of section number determines side
export function seatToZone(section: string): string {
  const n = parseInt(section, 10);
  if (Number.isNaN(n)) return "N1";
  if (n < 110) return "N1";
  if (n < 120) return "N2";
  if (n < 210) return "E1";
  if (n < 220) return "E2";
  if (n < 310) return "S1";
  if (n < 320) return "S2";
  if (n < 410) return "W1";
  return "W2";
}

export const ZONE_LABELS: Record<string, string> = {
  N1: "North Concourse",
  N2: "North Upper",
  E1: "East Gate",
  E2: "East Concourse",
  S1: "South Field",
  S2: "South Upper",
  W1: "West Concourse",
  W2: "West Gate",
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "pt", label: "Português" },
];

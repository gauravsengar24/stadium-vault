import { getMaybeSingle } from "@/lib/firestore";
import type { StaffSession } from "./session";

interface StaffRecord {
  staff_id: string;
  name: string;
  role: StaffSession["staffRole"];
  zone: string;
}

const FALLBACK_DIRECTORY: StaffRecord[] = [
  { staff_id: "SEC-001", name: "Alex Rivera", role: "security", zone: "N1" },
  { staff_id: "SEC-002", name: "Jamie Chen", role: "security", zone: "E1" },
  { staff_id: "MED-001", name: "Dr. Priya Patel", role: "medical", zone: "S1" },
  { staff_id: "MED-002", name: "Marcus Doe", role: "medical", zone: "W1" },
  { staff_id: "FIRE-001", name: "Sam Torres", role: "fire", zone: "E2" },
  { staff_id: "VOL-001", name: "Kai Nguyen", role: "volunteer", zone: "N2" },
  { staff_id: "VOL-002", name: "Jordan Lee", role: "volunteer", zone: "S2" },
];

const STAFF_ID_PATTERN = /^(SEC|MED|FIRE|VOL)-\d{3}$/;

export function isValidStaffId(id: string): boolean {
  return STAFF_ID_PATTERN.test(id.trim().toUpperCase());
}

export function lookupInFallback(id: string): StaffRecord | undefined {
  const normalized = id.trim().toUpperCase();
  return FALLBACK_DIRECTORY.find((s) => s.staff_id === normalized);
}

export function getStaffDirectory(): StaffRecord[] {
  return FALLBACK_DIRECTORY;
}

export async function resolveStaffIdentity(id: string): Promise<{
  record: StaffRecord | null;
  source: "firestore" | "fallback" | null;
}> {
  const normalized = id.trim().toUpperCase();

  if (!isValidStaffId(normalized)) {
    return { record: null, source: null };
  }

  try {
    const data = await Promise.race([
      getMaybeSingle<StaffRecord>("staff_directory", "staff_id", normalized),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    if (data) {
      return {
        record: {
          staff_id: data.staff_id,
          name: data.name,
          role: data.role,
          zone: data.zone,
        },
        source: "firestore",
      };
    }
  } catch {
    // Firestore unavailable — fall through to fallback
  }

  const fallback = lookupInFallback(normalized);
  return fallback
    ? { record: fallback, source: "fallback" }
    : { record: null, source: null };
}

export function toStaffSession(record: StaffRecord): StaffSession {
  return {
    role: "staff",
    staffId: record.staff_id,
    name: record.name,
    staffRole: record.role,
    zone: record.zone,
  };
}

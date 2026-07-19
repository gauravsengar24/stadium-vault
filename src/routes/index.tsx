import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ShieldCheck,
  Ticket,
  ArrowRight,
  Users,
  Radio,
  Flame,
  Activity,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, StatusDot } from "@/stadium/shared/glass";
import {
  saveSession,
  seatToZone,
  ZONE_LABELS,
  LANGUAGES,
} from "@/stadium/shared/session";
import {
  isValidStaffId,
  resolveStaffIdentity,
  toStaffSession,
} from "@/stadium/shared/staff-directory";

export const Route = createFileRoute("/")({
  component: PortalSelect,
  head: () => ({
    meta: [
      { title: "Stadium Guardian AI — Choose your portal" },
      {
        name: "description",
        content:
          "Real-time stadium safety platform for fans and staff. AI concierge, live alerts, food ordering, incident management, and venue monitoring — no login required.",
      },
    ],
  }),
});

function PortalSelect() {
  const [tab, setTab] = useState<"fan" | "staff">("fan");
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <BackgroundOrbs />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <StatusDot tone="green" />
            Metropolis Stadium · Live
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Stadium Guardian <span className="text-safety-cyan">AI</span>
          </h1>
          <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
            AI-powered venue intelligence for 80,000 seats. Real-time alerts,
            food ordering, incident response, and crowd monitoring.
          </p>
        </div>

        <div className="glass-strong mb-8 inline-flex rounded-full p-1">
          <TabPill active={tab === "fan"} onClick={() => setTab("fan")}>
            <Ticket className="size-4" /> Fan portal
          </TabPill>
          <TabPill active={tab === "staff"} onClick={() => setTab("staff")}>
            <ShieldCheck className="size-4" /> Staff console
          </TabPill>
        </div>

        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {tab === "fan" ? <FanEntry /> : <StaffEntry />}
          <FeatureShowcase tab={tab} />
        </div>

        <FooterStats />
      </main>
    </div>
  );
}

function TabPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_var(--primary)]"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function FanEntry() {
  const navigate = useNavigate();
  const [section, setSection] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault();
    if (!section.trim() || !row.trim() || !seat.trim()) {
      toast.error("Enter section, row and seat.");
      return;
    }
    setLoading(true);
    const zone = seatToZone(section);
    saveSession({
      role: "fan",
      section: section.trim(),
      row: row.trim(),
      seat: seat.trim(),
      zone,
      language,
    });
    toast.success(`Welcome — you're in ${ZONE_LABELS[zone]}`);
    await navigate({ to: "/fan" });
    setLoading(false);
  }

  return (
    <GlassCard className="p-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Fan access
          </p>
          <h2 className="mt-1 text-lg font-semibold">Enter your seat</h2>
        </div>
        <GlassIcon tint="cyan">
          <Ticket className="size-5" />
        </GlassIcon>
      </div>
      <form onSubmit={handleEnter} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <SeatInput label="Section" value={section} onChange={setSection} placeholder="104" />
          <SeatInput label="Row" value={row} onChange={setRow} placeholder="12" />
          <SeatInput label="Seat" value={seat} onChange={setSeat} placeholder="5" />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Preferred language
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="glass w-full rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-safety-cyan"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-background">
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-safety-cyan px-5 py-3 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-50"
        >
          Enter fan portal
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </button>
      </form>
    </GlassCard>
  );
}

function SeatInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={6}
        className="glass w-full rounded-2xl px-3.5 py-2.5 text-center text-lg font-semibold outline-none focus:border-safety-cyan"
      />
    </label>
  );
}

function StaffEntry() {
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const attemptsRef = useRef(0);
  const cooldownRef = useRef(false);

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const id = staffId.trim().toUpperCase();
    if (!id) {
      setError("Enter your staff ID.");
      toast.error("Enter your staff ID.");
      inputRef.current?.focus();
      return;
    }

    if (!isValidStaffId(id)) {
      const msg = "Invalid format. Use e.g. SEC-001";
      setError(msg);
      toast.error(msg);
      inputRef.current?.focus();
      return;
    }

    if (cooldownRef.current) {
      toast.error("Too many attempts. Wait a moment.");
      return;
    }

    attemptsRef.current += 1;
    if (attemptsRef.current > 5) {
      cooldownRef.current = true;
      toast.error("Too many attempts. Try again in 30 seconds.");
      setTimeout(() => {
        cooldownRef.current = false;
        attemptsRef.current = 0;
      }, 30000);
      return;
    }

    setLoading(true);
    try {
      const { record, source } = await resolveStaffIdentity(id);
      if (!record) {
        const msg = "Staff ID not recognised. Try SEC-001, MED-001, or FIRE-001.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        inputRef.current?.focus();
        return;
      }

      const session = toStaffSession(record);
      saveSession(session);
      attemptsRef.current = 0;
      toast.success(`Welcome, ${record.name}${source === "fallback" ? " (offline mode)" : ""}`);
      await navigate({ to: "/staff" });
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="p-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Response command
          </p>
          <h2 className="mt-1 text-lg font-semibold">Enter your staff ID</h2>
        </div>
        <GlassIcon tint="amber">
          <ShieldCheck className="size-5" />
        </GlassIcon>
      </div>
      <form onSubmit={handleEnter} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Staff ID
          </span>
          <input
            ref={inputRef}
            value={staffId}
            onChange={(e) => { setStaffId(e.target.value.slice(0, 10)); setError(""); }}
            placeholder="SEC-001"
            maxLength={10}
            autoComplete="off"
            aria-label="Staff ID"
            aria-invalid={!!error}
            aria-describedby={error ? "staff-id-error" : undefined}
            className={`glass w-full rounded-2xl px-3.5 py-2.5 text-lg font-semibold uppercase tracking-widest outline-none transition ${
              error
                ? "border-safety-red/60 focus:border-safety-red"
                : "focus:border-safety-amber"
            }`}
          />
          {error && (
            <p id="staff-id-error" role="alert" className="mt-1.5 text-[11px] text-safety-red">
              {error}
            </p>
          )}
        </label>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Try{" "}
          <code className="rounded bg-glass-strong px-1.5 py-0.5 font-mono">
            SEC-001
          </code>
          , <code className="rounded bg-glass-strong px-1.5 py-0.5 font-mono">MED-001</code>,
          or <code className="rounded bg-glass-strong px-1.5 py-0.5 font-mono">FIRE-001</code>.
        </p>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-safety-amber px-5 py-3 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Verifying…
            </>
          ) : (
            <>
              Enter staff console
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </GlassCard>
  );
}

function FeatureShowcase({ tab }: { tab: "fan" | "staff" }) {
  const fan = [
    { icon: Radio, tint: "cyan" as const, label: "Live alerts", copy: "Zone-targeted safety broadcasts" },
    { icon: Users, tint: "violet" as const, label: "AI concierge", copy: "Multilingual chat & directions" },
    { icon: Flame, tint: "red" as const, label: "Emergency", copy: "One-tap medical, fire, security" },
    { icon: Activity, tint: "green" as const, label: "Food & queues", copy: "Filter by dietary needs" },
  ];
  const staff = [
    { icon: Activity, tint: "red" as const, label: "Incident log", copy: "Real-time incident tracking" },
    { icon: Users, tint: "cyan" as const, label: "Fan queue", copy: "Realtime assistance requests" },
    { icon: Flame, tint: "amber" as const, label: "Fire console", copy: "Extinguisher & evac status" },
    { icon: Radio, tint: "violet" as const, label: "Broadcast", copy: "Push alerts by zone" },
  ];
  const items = tab === "fan" ? fan : staff;
  return (
    <GlassCard className="p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        What's inside
      </p>
      <h3 className="mt-1 text-lg font-semibold">
        {tab === "fan" ? "For every fan" : "For every responder"}
      </h3>
      <ul className="mt-5 grid grid-cols-2 gap-3">
        {items.map((it) => (
          <li key={it.label} className="glass rounded-2xl p-3">
            <GlassIcon tint={it.tint} className="size-9 rounded-xl">
              <it.icon className="size-4" />
            </GlassIcon>
            <p className="mt-2.5 text-sm font-semibold">{it.label}</p>
            <p className="text-[11px] text-muted-foreground">{it.copy}</p>
          </li>
        ))}
      </ul>
      <Link
        to={tab === "fan" ? "/fan" : "/staff"}
        className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Skip to portal <ArrowRight className="size-3" />
      </Link>
    </GlassCard>
  );
}

function FooterStats() {
  return (
    <div className="mt-10 grid w-full max-w-4xl grid-cols-3 gap-4 text-center">
      {[
        { k: "< 500ms", v: "Fan → staff sync" },
        { k: "8", v: "Zones monitored" },
        { k: "99.4%", v: "Uptime last 30d" },
      ].map((s) => (
        <div key={s.v} className="glass rounded-2xl px-4 py-3">
          <p className="font-mono text-lg font-semibold text-safety-cyan">
            {s.k}
          </p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {s.v}
          </p>
        </div>
      ))}
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 top-20 size-96 rounded-full bg-safety-violet/25 blur-[140px]" />
      <div className="absolute right-0 top-0 size-[28rem] rounded-full bg-safety-cyan/20 blur-[160px]" />
      <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-safety-red/15 blur-[140px]" />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";

import { GlassCard, SectionHeader } from "@/stadium/shared/glass";
import { loadSession, ZONE_LABELS, type FanSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/fan/ticket")({
  component: FanTicket,
  head: () => ({ meta: [{ title: "My Ticket — Fan Portal" }] }),
});

function FanTicket() {
  const [session, setSession] = useState<FanSession | null>(null);
  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Digital pass" title="My ticket" />

      {!session && (
        <GlassCard className="border-l-4 border-l-safety-green px-5 py-4">
          <p className="text-sm font-semibold">No ticket loaded</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link to="/" className="text-safety-green underline underline-offset-2">
              Enter your seat number
            </Link>{" "}
            to view your digital ticket.
          </p>
        </GlassCard>
      )}

      {session && (
        <div className="mx-auto max-w-lg">
          <GlassCard className="relative overflow-hidden p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-safety-cyan/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-safety-violet/20 blur-3xl" />

            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Metropolis Stadium
              </p>
              <span className="glass rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-widest">
                NFT
              </span>
            </div>

            <h2 className="mt-2 font-display text-2xl font-semibold">
              Season Match · 21:00
            </h2>

            <div className="mt-8 flex items-center justify-between gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Section</p>
                <p className="font-mono text-4xl font-semibold">{session.section}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Row</p>
                <p className="font-mono text-4xl font-semibold">{session.row}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Seat</p>
                <p className="font-mono text-4xl font-semibold">{session.seat}</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="glass grid size-24 place-items-center rounded-2xl">
                <QrCode className="size-16 text-safety-cyan" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Gate</p>
                <p className="text-lg font-semibold">{ZONE_LABELS[session.zone]}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  #{session.section}{session.row}{session.seat}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-dashed border-border pt-4 text-center text-[10px] text-muted-foreground">
              Present this screen at any entry gate.
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

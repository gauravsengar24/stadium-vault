import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader, StatusDot } from "@/stadium/shared/glass";
import { getCollection, addDocument, listenCollection } from "@/lib/firestore";
import { loadSession, type FanSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/fan/help")({
  component: FanHelp,
  head: () => ({ meta: [{ title: "Help — Fan Portal" }] }),
});

interface Ticket {
  id: string;
  seat_no: string;
  query: string;
  status: string;
  response: string | null;
  assigned_to: string | null;
  created_at: string;
}

function FanHelp() {
  const [session, setSession] = useState<FanSession | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  useEffect(() => {
    if (!session) return;
    const seatNo = `${session.section}-${session.row}-${session.seat}`;
    const unsub = listenCollection<Ticket>("help_queue", setTickets, {
      where: ["seat_no", "==", seatNo],
      orderBy: ["created_at", "desc"],
      limit: 10,
    });
    return () => unsub();
  }, [session]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !query.trim()) return;
    setSending(true);
    const seatNo = `${session.section}-${session.row}-${session.seat}`;
    try {
      await addDocument("help_queue", {
        seat_no: seatNo,
        zone: session.zone,
        language: session.language,
        query: query.trim(),
        status: "pending",
      });
      setQuery("");
      toast.success("Request sent — a staff member will respond shortly.");
    } catch {
      toast.error("Couldn't send — try again.");
    }
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Assistance" title="Request staff help" />

      <GlassCard className="p-6">
        <div className="flex items-start gap-3">
          <GlassIcon tint="violet" className="size-12 rounded-2xl">
            <LifeBuoy className="size-6" />
          </GlassIcon>
          <div className="flex-1">
            <p className="text-sm font-semibold">Describe what you need</p>
            <p className="text-xs text-muted-foreground">
              Wheelchair assistance, seat swap, language help, lost item — anything.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="I need help with…"
            maxLength={280}
            className="glass flex-1 rounded-2xl px-4 py-3 text-sm outline-none focus:border-safety-violet"
          />
          <button
            type="submit"
            disabled={sending || !query.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-safety-violet px-5 py-3 text-sm font-semibold text-background disabled:opacity-40"
          >
            <Send className="size-4" /> Send
          </button>
        </form>
      </GlassCard>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Your requests
        </h2>
        {tickets.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No requests yet. Your open tickets will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <GlassCard key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                    <StatusDot
                      tone={
                        t.status === "resolved"
                          ? "green"
                          : t.status === "assigned"
                            ? "amber"
                            : "red"
                      }
                    />
                    {t.status}
                    {t.assigned_to && (
                      <span className="text-muted-foreground">
                        · {t.assigned_to}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(t.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-2 text-sm">{t.query}</p>
                {t.response && (
                  <div className="mt-3 rounded-2xl bg-safety-violet/10 p-3 text-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-safety-violet">
                      Staff replied
                    </span>
                    <p className="mt-1">{t.response}</p>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Send, UserCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, SectionHeader, StatusDot } from "@/stadium/shared/glass";
import { getCollection, updateDocument, listenCollection } from "@/lib/firestore";
import { loadSession, type StaffSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/queue")({
  component: StaffQueue,
  head: () => ({ meta: [{ title: "Fan Queue — Staff Console" }] }),
});

interface Ticket {
  id: string;
  seat_no: string;
  zone: string | null;
  language: string;
  query: string;
  status: string;
  assigned_to: string | null;
  response: string | null;
  created_at: string;
}

function StaffQueue() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "staff") setSession(s);
  }, []);

  useEffect(() => {
    async function load() {
      const data = await getCollection<Ticket>("help_queue", { orderBy: ["created_at", "desc"], limit: 50 });
      setTickets(data);
    }
    load();
    const unsub = listenCollection("help_queue", load);
    return () => { unsub(); }
  }, []);

  async function claim(id: string) {
    if (!session) return;
    await updateDocument("help_queue", id, { status: "assigned", assigned_to: session.staffId });
    toast.success("Ticket claimed.");
  }

  async function reply(id: string) {
    const text = replies[id]?.trim();
    if (!text || !session) return;
    await updateDocument("help_queue", id, {
      response: text,
      status: "resolved",
      assigned_to: session.staffId,
    });
    setReplies((r) => ({ ...r, [id]: "" }));
    toast.success("Replied and resolved.");
  }

  const pending = tickets.filter((t) => t.status !== "resolved");
  const resolved = tickets.filter((t) => t.status === "resolved");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`${pending.length} pending`}
        title="Fan assistance queue"
      />

      <div className="space-y-3">
        {pending.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No open requests. Good work.
          </p>
        )}
        {pending.map((t) => (
          <GlassCard key={t.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot tone={t.status === "assigned" ? "amber" : "red"} />
                <span className="text-[10px] font-semibold uppercase tracking-widest">
                  {t.status}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  seat {t.seat_no} · {t.language.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {new Date(t.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium">{t.query}</p>
            <div className="mt-4 flex gap-2">
              <input
                value={replies[t.id] ?? ""}
                onChange={(e) =>
                  setReplies((r) => ({ ...r, [t.id]: e.target.value }))
                }
                placeholder="Type reply…"
                className="glass flex-1 rounded-2xl px-3 py-2 text-sm outline-none focus:border-safety-violet"
              />
              {t.status !== "assigned" && (
                <button
                  onClick={() => claim(t.id)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-safety-amber/20 px-3 py-2 text-xs font-semibold text-safety-amber"
                >
                  <UserCheck className="size-3.5" /> Claim
                </button>
              )}
              <button
                onClick={() => reply(t.id)}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-safety-violet px-4 py-2 text-xs font-semibold text-background"
              >
                <Send className="size-3.5" /> Reply
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resolved
          </h2>
          <div className="space-y-2">
            {resolved.slice(0, 5).map((t) => (
              <GlassCard key={t.id} className="p-3 opacity-70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-safety-green" />
                  <span className="text-xs">{t.query}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    by {t.assigned_to ?? "—"}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

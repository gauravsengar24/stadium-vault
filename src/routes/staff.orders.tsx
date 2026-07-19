import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ChefHat, Package, Truck, X } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, SectionHeader, StatusDot } from "@/stadium/shared/glass";
import { listenCollection, updateDocument } from "@/lib/firestore";
import { loadSession, type StaffSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/orders")({
  component: StaffOrders,
  head: () => ({ meta: [{ title: "Orders — Staff Console" }] }),
});

interface Order {
  id: string;
  seat_no: string;
  zone: string;
  vendor: string;
  item_name: string;
  emoji: string | null;
  price: number;
  quantity: number;
  status: string;
  eta_minutes: number | null;
  fulfilled_by: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_TONE: Record<string, "amber" | "green" | "red"> = {
  pending: "red",
  preparing: "amber",
  ready: "green",
  delivered: "green",
  cancelled: "red",
};

const NEXT: Record<string, { label: string; next: string; icon: typeof ChefHat }> = {
  pending: { label: "Start preparing", next: "preparing", icon: ChefHat },
  preparing: { label: "Mark ready", next: "ready", icon: Package },
  ready: { label: "Mark delivered", next: "delivered", icon: Truck },
};

function StaffOrders() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "staff") setSession(s);
  }, []);

  useEffect(() => {
    let prevCount = 0;
    const unsub = listenCollection<Order>("food_orders", (data) => {
      if (data.length > prevCount && prevCount > 0) {
        const added = data.slice(0, data.length - prevCount).reverse();
        for (const o of added) {
          toast.info(`New order · ${o.item_name} · seat ${o.seat_no}`);
        }
      }
      prevCount = data.length;
      setOrders(data);
    }, { orderBy: ["created_at", "desc"], limit: 80 });
    return () => unsub();
  }, []);

  async function advance(o: Order) {
    const step = NEXT[o.status];
    if (!step) return;
    await updateDocument("food_orders", o.id, { status: step.next, fulfilled_by: session?.staffId ?? o.fulfilled_by });
  }

  async function cancel(o: Order) {
    await updateDocument("food_orders", o.id, { status: "cancelled", fulfilled_by: session?.staffId ?? null });
  }

  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const done = orders.filter((o) => o.status === "delivered" || o.status === "cancelled");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`${active.length} in flight`}
        title="Concession orders"
      />

      <div className="space-y-3">
        {active.length === 0 && (
          <p className="text-xs text-muted-foreground">No open orders.</p>
        )}
        {active.map((o) => {
          const step = NEXT[o.status];
          return (
            <GlassCard key={o.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{o.emoji ?? "🍿"}</span>
                  <div>
                    <p className="text-sm font-semibold">
                      {o.item_name} × {o.quantity}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {o.vendor} · Zone {o.zone} · seat {o.seat_no}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot tone={STATUS_TONE[o.status] ?? "amber"} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">
                    {o.status}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ${Number(o.price).toFixed(2)}
                    {o.eta_minutes != null ? ` · ~${o.eta_minutes}m` : ""}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {step && (
                  <button
                    onClick={() => advance(o)}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-safety-amber px-4 py-2 text-xs font-semibold text-background"
                  >
                    <step.icon className="size-3.5" /> {step.label}
                  </button>
                )}
                <button
                  onClick={() => cancel(o)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-safety-red/40 px-3 py-2 text-xs font-semibold text-safety-red"
                >
                  <X className="size-3.5" /> Cancel
                </button>
                {o.fulfilled_by && (
                  <span className="ml-auto self-center text-[10px] font-mono text-muted-foreground">
                    handled by {o.fulfilled_by}
                  </span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {done.length > 0 && (
        <div>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recently closed
          </h2>
          <div className="space-y-2">
            {done.slice(0, 8).map((o) => (
              <GlassCard key={o.id} className="flex items-center gap-2 p-3 opacity-70">
                <CheckCircle2
                  className={`size-3.5 ${
                    o.status === "delivered" ? "text-safety-green" : "text-safety-red"
                  }`}
                />
                <span className="text-xs">
                  {o.emoji ?? "🍿"} {o.item_name} · seat {o.seat_no}
                </span>
                <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
                  {o.status}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

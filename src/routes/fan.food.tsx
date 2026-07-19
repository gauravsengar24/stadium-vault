import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Loader2, CheckCircle2, ChefHat, Package } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader, StatusDot } from "@/stadium/shared/glass";
import { supabase } from "@/integrations/supabase/client";
import { loadSession, type FanSession } from "@/stadium/shared/session";

export const Route = createFileRoute("/fan/food")({
  component: FanFood,
  head: () => ({ meta: [{ title: "Food & Drink — Fan Portal" }] }),
});

interface FoodItem {
  id: string;
  name: string;
  category: string;
  price: number;
  vendor: string;
  zone: string;
  wait_minutes: number;
  dietary: string[];
  emoji: string;
}

interface Order {
  id: string;
  item_name: string;
  emoji: string | null;
  vendor: string;
  quantity: number;
  status: string;
  eta_minutes: number | null;
  fulfilled_by: string | null;
  created_at: string;
}

const FILTERS = ["all", "vegetarian", "vegan", "gluten-free", "halal", "kosher"];

const STATUS_TONE: Record<string, "amber" | "green" | "red"> = {
  pending: "amber",
  preparing: "amber",
  ready: "green",
  delivered: "green",
  cancelled: "red",
};

function FanFood() {
  const [session, setSession] = useState<FanSession | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [placing, setPlacing] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  useEffect(() => {
    supabase
      .from("food_items")
      .select("*")
      .order("wait_minutes")
      .then(({ data }) => setItems((data as FoodItem[]) ?? []));
  }, []);

  useEffect(() => {
    if (!session) return;
    const seatNo = `${session.section}-${session.row}-${session.seat}`;
    async function load() {
      const { data } = await supabase
        .from("food_orders")
        .select("id, item_name, emoji, vendor, quantity, status, eta_minutes, fulfilled_by, created_at")
        .eq("seat_no", seatNo)
        .order("created_at", { ascending: false })
        .limit(10);
      setOrders((data as Order[]) ?? []);
    }
    load();
    const ch = supabase
      .channel(`fan-orders-${seatNo}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "food_orders", filter: `seat_no=eq.${seatNo}` },
        (payload) => {
          load();
          if (payload.eventType === "UPDATE") {
            const next = payload.new as { status: string; item_name: string };
            if (next.status === "ready") toast.success(`${next.item_name} is ready to pick up!`);
            if (next.status === "delivered") toast.success(`${next.item_name} delivered — enjoy!`);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.dietary.includes(filter));
  }, [items, filter]);

  async function order(item: FoodItem) {
    if (!session) {
      toast.error("Seat session missing.");
      return;
    }
    setPlacing(item.id);
    const seatNo = `${session.section}-${session.row}-${session.seat}`;
    const { error } = await supabase.from("food_orders").insert({
      seat_no: seatNo,
      zone: session.zone,
      vendor: item.vendor,
      item_id: item.id,
      item_name: item.name,
      emoji: item.emoji,
      price: item.price,
      quantity: 1,
      status: "pending",
      eta_minutes: item.wait_minutes,
    });
    setPlacing(null);
    if (error) {
      toast.error("Order failed — try again.");
      return;
    }
    toast.success(`${item.name} sent to ${item.vendor}`);
  }

  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Concession" title="Food & Drink" />

      {activeOrders.length > 0 && (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Your active orders</p>
            <span className="text-[10px] font-mono uppercase tracking-widest text-safety-green">
              live
            </span>
          </div>
          <div className="space-y-2">
            {activeOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded-2xl border border-glass-border bg-glass/40 p-3"
              >
                <span className="text-2xl">{o.emoji ?? "🍿"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {o.item_name} × {o.quantity}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.vendor}
                    {o.fulfilled_by ? ` · ${o.fulfilled_by}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot tone={STATUS_TONE[o.status] ?? "amber"} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest">
                    {o.status}
                  </span>
                  {o.eta_minutes != null && o.status !== "ready" && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ~{o.eta_minutes}m
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
              filter === f
                ? "bg-safety-green text-background"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <GlassCard key={item.id} className="p-5 transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <GlassIcon tint="green" className="size-11 rounded-xl text-xl">
                  <span>{item.emoji}</span>
                </GlassIcon>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">{item.vendor}</p>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-safety-green">
                ${item.price.toFixed(2)}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3" /> Zone {item.zone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3" /> {item.wait_minutes} min
              </span>
            </div>

            {item.dietary.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {item.dietary.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-safety-green/30 bg-safety-green/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-safety-green"
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => order(item)}
              disabled={placing === item.id || !session}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-safety-green/20 py-2 text-xs font-semibold text-safety-green transition hover:bg-safety-green/30 disabled:opacity-50"
            >
              {placing === item.id ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Package className="size-3.5" /> Order to seat
                </>
              )}
            </button>
          </GlassCard>
        ))}
      </div>

      {orders.length > activeOrders.length && (
        <div>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Past orders
          </h2>
          <div className="space-y-2">
            {orders
              .filter((o) => o.status === "delivered" || o.status === "cancelled")
              .slice(0, 5)
              .map((o) => (
                <GlassCard key={o.id} className="flex items-center gap-2 p-3 opacity-70">
                  {o.status === "delivered" ? (
                    <CheckCircle2 className="size-3.5 text-safety-green" />
                  ) : (
                    <ChefHat className="size-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs">
                    {o.emoji ?? "🍿"} {o.item_name} · {o.vendor}
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

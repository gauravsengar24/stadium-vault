import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Loader2, CheckCircle2, ChefHat, Package } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader, StatusDot } from "@/stadium/shared/glass";
import { getCollection, addDocument, listenCollection } from "@/lib/firestore";
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

const FALLBACK_ITEMS: FoodItem[] = [
  { id: "fi-1", name: "Classic Hot Dog", category: "Snacks", price: 7.50, vendor: "Titan Grill", zone: "N1", wait_minutes: 4, dietary: ["halal"], emoji: "🌭" },
  { id: "fi-2", name: "Loaded Nachos", category: "Snacks", price: 9.00, vendor: "Nacho Republic", zone: "E2", wait_minutes: 6, dietary: ["vegetarian", "gluten-free"], emoji: "🧀" },
  { id: "fi-3", name: "Veggie Burger", category: "Mains", price: 11.00, vendor: "Green Field", zone: "S1", wait_minutes: 8, dietary: ["vegetarian", "vegan"], emoji: "🍔" },
  { id: "fi-4", name: "Chicken Wings", category: "Mains", price: 12.50, vendor: "Wing Zone", zone: "W1", wait_minutes: 10, dietary: ["halal", "gluten-free"], emoji: "🍗" },
  { id: "fi-5", name: "Buttered Popcorn", category: "Snacks", price: 5.50, vendor: "Kernel Co.", zone: "N2", wait_minutes: 2, dietary: ["vegetarian", "gluten-free"], emoji: "🍿" },
  { id: "fi-6", name: "Kosher Deli Sandwich", category: "Mains", price: 13.00, vendor: "Deli Kart", zone: "S2", wait_minutes: 7, dietary: ["kosher"], emoji: "🥪" },
  { id: "fi-7", name: "Fresh Fruit Cup", category: "Healthy", price: 6.00, vendor: "Fresh Stand", zone: "E1", wait_minutes: 3, dietary: ["vegan", "gluten-free", "halal", "kosher"], emoji: "🍓" },
  { id: "fi-8", name: "Craft Lemonade", category: "Drinks", price: 4.50, vendor: "Citrus Bar", zone: "W2", wait_minutes: 3, dietary: ["vegan", "gluten-free"], emoji: "🍋" },
  { id: "fi-9", name: "Draft Beer", category: "Drinks", price: 9.00, vendor: "Stadium Taps", zone: "N1", wait_minutes: 4, dietary: ["vegan"], emoji: "🍺" },
  { id: "fi-10", name: "Gluten-Free Pretzel", category: "Snacks", price: 6.50, vendor: "Twist & Salt", zone: "E2", wait_minutes: 5, dietary: ["vegetarian", "gluten-free"], emoji: "🥨" },
  { id: "fi-11", name: "Bottled Water", category: "Drinks", price: 3.00, vendor: "Citrus Bar", zone: "W1", wait_minutes: 1, dietary: ["vegan", "gluten-free", "halal", "kosher"], emoji: "💧" },
];

const STATUS_TONE: Record<string, "amber" | "green" | "red"> = {
  pending: "amber",
  preparing: "amber",
  ready: "green",
  delivered: "green",
  cancelled: "red",
};

function FanFood() {
  const [session, setSession] = useState<FanSession | null>(null);
  const [items, setItems] = useState<FoodItem[]>(FALLBACK_ITEMS);
  const [usingFallback, setUsingFallback] = useState(true);
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [placing, setPlacing] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCollection<FoodItem>("food_items", { orderBy: ["wait_minutes", "asc"] })
      .then((data) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setItems(data);
          setUsingFallback(false);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!session) return;
    const seatNo = `${session.section}-${session.row}-${session.seat}`;
    const prevRef: { current: Order[] } = { current: [] };
    const unsub = listenCollection<Order>("food_orders", (data) => {
      const prev = prevRef.current;
      prevRef.current = data;
      setOrders(data);
      for (const o of data) {
        const prevO = prev.find((p) => p.id === o.id);
        if (prevO && prevO.status !== o.status) {
          if (o.status === "ready") toast.success(`${o.item_name} is ready to pick up!`);
          if (o.status === "delivered") toast.success(`${o.item_name} delivered — enjoy!`);
        }
      }
    }, { where: ["seat_no", "==", seatNo], orderBy: ["created_at", "desc"], limit: 10 });
    return () => unsub();
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
    try {
      await addDocument("food_orders", {
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
      toast.success(`${item.name} sent to ${item.vendor}`);
    } catch {
      toast.error("Order failed — try again.");
    }
    setPlacing(null);
  }

  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Concession" title="Food & Drink" />

      {usingFallback && (
        <div className="rounded-2xl border border-safety-amber/30 bg-safety-amber/10 px-4 py-2 text-center text-[11px] font-medium text-safety-amber">
          Menu data unavailable — showing sample items
        </div>
      )}

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

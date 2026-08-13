import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ordersQuery, parseLines, STATUS_LABEL, type Order, type OrderStatus } from "@/lib/menu";
import { money } from "@/lib/store";
import { cn } from "@/lib/utils";

const FILTERS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "received", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "served", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  received: { to: "confirmed", label: "Confirm" },
  confirmed: { to: "preparing", label: "Start preparing" },
  preparing: { to: "ready", label: "Mark ready" },
  ready: { to: "served", label: "Mark served" },
};

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* audio unavailable */
  }
}

export function OrdersBoard() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery(ordersQuery);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const channel = supabase
      .channel("staff-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        if (payload.eventType === "INSERT" && mounted.current) {
          const row = payload.new as Order;
          beep();
          toast.success(`New order #${row.order_number} · Table ${row.table_number}`);
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const update = async (order: Order, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (error) toast.error("Could not update order");
    else {
      toast.success(`#${order.order_number} → ${STATUS_LABEL[status]}`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <section className="space-y-4">
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((f) => {
          const count = f.id === "all" ? orders.length : orders.filter((o) => o.status === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold",
                filter === f.id
                  ? "gradient-ember border-transparent text-primary-foreground"
                  : "bg-card text-muted-foreground",
              )}
            >
              {f.label} · {count}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-12 text-center">
          <p className="font-display text-xl">No orders here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">New orders arrive instantly.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((order) => {
              const next = NEXT[order.status];
              return (
                <motion.article
                  layout
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="rounded-3xl border bg-card p-4 shadow-soft"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-xl">#{order.order_number}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {order.customer_name} · Table {order.table_number}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold",
                        order.status === "cancelled"
                          ? "bg-destructive text-destructive-foreground"
                          : order.status === "served"
                            ? "bg-success text-success-foreground"
                            : "bg-accent text-accent-foreground",
                      )}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm">
                    {parseLines(order.items).map((line, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="min-w-0">
                          <span className="font-semibold">
                            {line.qty}× {line.name}
                          </span>
                          {line.options?.length ? (
                            <span className="block text-xs text-muted-foreground">
                              {line.options.join(" · ")}
                            </span>
                          ) : null}
                          {line.note ? (
                            <span className="block text-xs italic text-muted-foreground">
                              “{line.note}”
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0">{money(line.qty * line.price)}</span>
                      </li>
                    ))}
                  </ul>

                  {order.special_instructions && (
                    <p className="mt-2 rounded-2xl bg-muted p-2 text-xs italic">
                      “{order.special_instructions}”
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="font-display text-lg">{money(Number(order.total))}</span>
                  </div>

                  {order.status !== "served" && order.status !== "cancelled" && (
                    <div className="mt-3 flex gap-2">
                      {next && (
                        <button
                          onClick={() => void update(order, next.to)}
                          className="gradient-ember flex-1 rounded-full py-2.5 text-xs font-bold text-primary-foreground"
                        >
                          {next.label}
                        </button>
                      )}
                      <button
                        onClick={() => void update(order, "cancelled")}
                        className="rounded-full border px-4 py-2.5 text-xs font-semibold text-destructive"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

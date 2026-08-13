import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Check, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { orderQuery, parseLines, STATUS_FLOW, STATUS_LABEL } from "@/lib/menu";
import { money } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "Order status — Saffron & Ember" },
      { name: "description", content: "Follow your order live from the kitchen to your table." },
      { property: "og:title", content: "Order status — Saffron & Ember" },
      { property: "og:description", content: "Live order tracking at Saffron & Ember." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery(orderQuery(id));

  useEffect(() => {
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => {
          const next = payload.new as { status: keyof typeof STATUS_LABEL };
          queryClient.invalidateQueries({ queryKey: ["order", id] });
          toast.success(STATUS_LABEL[next.status]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="grid min-h-dvh place-items-center px-5 text-center">
        <div>
          <h1 className="font-display text-3xl">Order not found</h1>
          <Link to="/menu" className="mt-4 inline-block font-semibold text-primary">
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  const cancelled = order.status === "cancelled";
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const lines = parseLines(order.items);

  return (
    <main className="min-h-dvh px-5 pb-32 pt-8">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Order #{order.order_number}
        </p>
        <h1 className="font-display text-4xl">
          {cancelled ? "Order cancelled" : STATUS_LABEL[order.status]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.customer_name} · Table {order.table_number}
        </p>

        {!cancelled && order.status !== "served" && (
          <div className="glass-panel mt-5 flex items-center gap-3 rounded-3xl p-4">
            <Clock className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm">
              Estimated wait <span className="font-bold">{order.eta_minutes} minutes</span>
            </p>
          </div>
        )}

        {!cancelled && (
          <ol className="mt-6 space-y-1">
            {STATUS_FLOW.map((status, index) => {
              const done = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <li key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <motion.span
                      animate={{ scale: isCurrent ? [1, 1.12, 1] : 1 }}
                      transition={{ repeat: isCurrent ? Infinity : 0, duration: 1.8 }}
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2",
                        done ? "gradient-ember border-transparent" : "border-border",
                      )}
                    >
                      {done ? <Check className="h-4 w-4 text-primary-foreground" /> : null}
                    </motion.span>
                    {index < STATUS_FLOW.length - 1 && (
                      <span className={cn("h-10 w-0.5", done ? "bg-primary" : "bg-border")} />
                    )}
                  </div>
                  <div className="pt-1.5">
                    <p className={cn("font-semibold", !done && "text-muted-foreground")}>
                      {STATUS_LABEL[status]}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <section className="mt-6 rounded-3xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lines.map((line, i) => (
              <li key={i} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-semibold">
                    {line.qty}× {line.name}
                  </span>
                  {line.options?.length ? (
                    <span className="block text-xs text-muted-foreground">
                      {line.options.join(" · ")}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0">{money(line.qty * line.price)}</span>
              </li>
            ))}
          </ul>
          {order.special_instructions && (
            <p className="mt-3 rounded-2xl bg-muted p-3 text-xs italic">
              “{order.special_instructions}”
            </p>
          )}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="font-bold">Total paid at table</span>
            <span className="font-display text-2xl">{money(Number(order.total))}</span>
          </div>
        </section>

        <Link
          to="/menu"
          className="mt-5 block rounded-full border py-3 text-center text-sm font-semibold"
        >
          Order something else
        </Link>
      </div>
      <BottomNav />
    </main>
  );
}

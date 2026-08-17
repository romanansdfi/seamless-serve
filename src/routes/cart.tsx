import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { money, useCart, useGuest, useLastOrder } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Saffron & Ember" },
      { name: "description", content: "Review your items, add instructions and place your order." },
      { property: "og:title", content: "Your cart — Saffron & Ember" },
      { property: "og:description", content: "Review your items and place your order." },
    ],
  }),
  component: CartPage,
});

const orderSchema = z.object({
  customer_name: z.string().trim().min(2).max(60),
  table_number: z.string().trim().min(1).max(10),
  special_instructions: z.string().trim().max(300),
});

function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const { guest } = useGuest();
  const { setOrderId } = useLastOrder();
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    if (!guest) {
      toast.error("Tell us your name and table first");
      navigate({ to: "/" });
      return;
    }
    const parsed = orderSchema.safeParse({
      customer_name: guest.name,
      table_number: guest.table,
      special_instructions: note,
    });
    if (!parsed.success) {
      toast.error("Please check your details");
      return;
    }
    setPlacing(true);
    const eta = Math.max(10, cart.items.length * 6);
    const newId = crypto.randomUUID();
    const { error } = await supabase.from("orders").insert({
      id: newId,
      ...parsed.data,
      items: cart.items.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        options: i.options,
        note: i.note,
      })),
      subtotal: Number(cart.subtotal.toFixed(2)),
      tax: Number((cart.tax + cart.service).toFixed(2)),
      total: Number(cart.total.toFixed(2)),
      eta_minutes: eta,
    });
    setPlacing(false);
    setConfirm(false);
    if (error) {
      toast.error("Could not place the order. Please try again.");
      return;
    }
    cart.clear();
    setOrderId(newId);
    toast.success("Order sent to the kitchen");
    navigate({ to: "/order/$id", params: { id: newId } });
  };

  return (
    <main className="min-h-dvh pb-40">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-5 pb-2 pt-6">
        <Link to="/menu" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="truncate font-display text-3xl">Your cart</h1>
      </header>

      <div className="px-5">
        <div className="glass-panel flex items-center justify-between rounded-2xl p-4 text-sm">
          <span className="min-w-0 truncate font-semibold">{guest?.name ?? "Guest"}</span>
          <span className="shrink-0 text-muted-foreground">Table {guest?.table ?? "—"}</span>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <div className="mx-5 mt-6 rounded-3xl border border-dashed p-10 text-center">
          <p className="font-display text-xl">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Add something delicious from the menu.</p>
          <Link
            to="/menu"
            className="gradient-ember mt-5 inline-block rounded-full px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow"
          >
            Browse menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3 px-5">
            {cart.items.map((item) => (
              <motion.li
                layout
                key={item.id}
                className="flex gap-3 rounded-3xl border bg-card p-3 shadow-soft"
              >
                <img
                  src={item.image ?? "/images/hero.jpg"}
                  alt={item.name}
                  loading="lazy"
                  width={200}
                  height={200}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <p className="truncate font-bold">{item.name}</p>
                    <button onClick={() => cart.remove(item.id)} aria-label="Remove item">
                      <Trash2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </div>
                  {item.options.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">{item.options.join(" · ")}</p>
                  )}
                  {item.note && <p className="truncate text-xs italic text-muted-foreground">“{item.note}”</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-full border px-3 py-1.5">
                      <button onClick={() => cart.setQty(item.id, item.qty - 1)} aria-label="Decrease">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => cart.setQty(item.id, item.qty + 1)} aria-label="Increase">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-display text-lg">{money(item.qty * item.price)}</span>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>

          <div className="px-5 pt-5">
            <textarea
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Special instructions for the whole order"
              className="min-h-20 w-full rounded-2xl border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mx-5 mt-5 space-y-2 rounded-3xl border bg-card p-5 text-sm shadow-soft">
            <Row label="Subtotal" value={money(cart.subtotal)} />
            <Row label="GST (5%)" value={money(cart.tax)} />
            <Row label="Service charge (3%)" value={money(cart.service)} />
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="font-bold">Grand total</span>
              <span className="font-display text-2xl">{money(cart.total)}</span>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-20 z-30 px-5">
            <button
              onClick={() => setConfirm(true)}
              className="gradient-ember mx-auto block w-full max-w-md rounded-full py-4 text-base font-bold text-primary-foreground shadow-glow"
            >
              Place order · {money(cart.total)}
            </button>
          </div>
        </>
      )}

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Send to kitchen?</AlertDialogTitle>
            <AlertDialogDescription>
              {cart.count} item{cart.count > 1 ? "s" : ""} for table {guest?.table} totalling{" "}
              {money(cart.total)}. Orders can't be edited once sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep browsing</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void placeOrder();
              }}
              disabled={placing}
              className="gradient-ember rounded-full text-primary-foreground"
            >
              {placing ? "Sending…" : "Confirm order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

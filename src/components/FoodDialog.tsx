import { useEffect, useState } from "react";
import { Clock, Flame, Minus, Plus, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VegBadge } from "@/components/FoodCard";
import type { Food } from "@/lib/menu";
import { money, useCart } from "@/lib/store";
import { toast } from "sonner";

const CUSTOMIZATIONS = ["Extra cheese", "Extra sauce", "Less spicy", "No onion"];

export function FoodDialog({ food, onClose }: { food: Food | null; onClose: () => void }) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [options, setOptions] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    setQty(1);
    setOptions([]);
    setNote("");
  }, [food?.id]);

  if (!food) return null;

  const toggle = (opt: string) =>
    setOptions((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));

  return (
    <Dialog open={!!food} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="depth-card max-h-[92dvh] gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-lg">
        <div className="perspective-deep relative overflow-hidden">
          <img
            src={food.image_url ?? "/images/hero.jpg"}
            alt={food.name}
            loading="lazy"
            width={800}
            height={600}
            className="h-56 w-full object-cover [transform:scale(1.05)_rotateX(4deg)]"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent" />
        </div>

        <div className="space-y-4 p-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="flex min-w-0 items-center gap-2 font-display text-2xl">
                <VegBadge isVeg={food.is_veg} />
                <span className="truncate">{food.name}</span>
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">{food.description}</p>
            </div>
            <span className="shrink-0 font-display text-2xl">{money(Number(food.price))}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-2xl bg-muted p-3">
              <Clock className="mx-auto mb-1 h-4 w-4 text-primary" />
              {food.prep_time} min
            </div>
            <div className="rounded-2xl bg-muted p-3">
              <Star className="mx-auto mb-1 h-4 w-4 fill-primary text-primary" />
              {Number(food.rating).toFixed(1)} rating
            </div>
            <div className="rounded-2xl bg-muted p-3">
              <Flame className="mx-auto mb-1 h-4 w-4 text-nonveg" />
              {food.calories} kcal
            </div>
          </div>

          {food.ingredients && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Ingredients
              </h4>
              <p className="mt-1 text-sm">{food.ingredients}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Customise
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {CUSTOMIZATIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  className={
                    options.includes(opt)
                      ? "rounded-full border border-primary bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
                      : "rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Special instructions for the kitchen"
            className="min-h-20 w-full rounded-2xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border px-3 py-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(Math.min(20, qty + 1))} aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              disabled={!food.is_available}
              onClick={() => {
                cart.add({
                  foodId: food.id,
                  name: food.name,
                  price: Number(food.price),
                  image: food.image_url,
                  qty,
                  options,
                  note: note.trim(),
                });
                toast.success(`${food.name} added to cart`);
                onClose();
              }}
              className="gradient-ember flex-1 rounded-full py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-40"
            >
              Add {qty} · {money(qty * Number(food.price))}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

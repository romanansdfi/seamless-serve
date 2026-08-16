import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CallWaiter } from "@/components/CallWaiter";
import { BottomNav } from "@/components/BottomNav";
import { FoodCard } from "@/components/FoodCard";
import { FoodDialog } from "@/components/FoodDialog";
import { categoriesQuery, foodsQuery, type Food } from "@/lib/menu";
import { money, useCart, useFavorites, useGuest } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Saffron & Ember" },
      {
        name: "description",
        content:
          "Browse the full Saffron & Ember menu: veg, non-veg, fast food, snacks, drinks and desserts.",
      },
      { property: "og:title", content: "Menu — Saffron & Ember" },
      { property: "og:description", content: "Browse the full menu and order from your table." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const navigate = useNavigate();
  const { guest } = useGuest();
  const cart = useCart();
  const { favorites, toggle } = useFavorites();
  const { data: categories = [], isLoading: catLoading } = useQuery(categoriesQuery);
  const { data: foods = [], isLoading } = useQuery(foodsQuery);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string>("all");
  const [selected, setSelected] = useState<Food | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return foods.filter((f) => {
      const inCategory =
        active === "all" ||
        (active === "special" && f.is_special) ||
        f.category_id === active;
      const matches = !q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
      return inCategory && matches;
    });
  }, [foods, search, active]);

  const popular = foods.filter((f) => f.is_popular).slice(0, 6);

  const quickAdd = (food: Food) => {
    cart.add({
      foodId: food.id,
      name: food.name,
      price: Number(food.price),
      image: food.image_url,
      qty: 1,
      options: [],
      note: "",
    });
    toast.success(`${food.name} added`);
  };

  return (
    <main className="min-h-dvh pb-32">
      <header className="relative h-52 overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Saffron & Ember dining room"
          width={1600}
          height={1000}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {guest ? `Hi ${guest.name}` : "Welcome"}
            </p>
            <h1 className="truncate font-display text-3xl">Saffron & Ember</h1>
          </div>
          <span className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold">
            Table {guest?.table ?? "—"}
          </span>
        </div>
      </header>

      <div className="sticky top-0 z-30 glass-panel px-5 py-3">
        <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={60}
            placeholder="Search dishes…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {[
            { id: "all", name: "All", emoji: "✨" },
            { id: "special", name: "Today's Special", emoji: "🔥" },
            ...categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji })),
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                active === c.id
                  ? "gradient-ember border-transparent text-primary-foreground"
                  : "bg-card text-muted-foreground",
              )}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {popular.length > 0 && active === "all" && !search && (
        <section className="px-5 pt-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
            <Sparkles className="h-4 w-4 text-primary" /> Popular right now
          </h2>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {popular.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="w-40 shrink-0 overflow-hidden rounded-3xl border bg-card text-left shadow-soft"
              >
                <img
                  src={f.image_url ?? "/images/hero.jpg"}
                  alt={f.name}
                  loading="lazy"
                  width={400}
                  height={300}
                  className="h-24 w-full object-cover"
                />
                <div className="p-3">
                  <p className="truncate text-sm font-bold">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{money(Number(f.price))}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="px-5 pt-6">
        <h2 className="mb-3 font-display text-xl">
          {active === "special" ? "Today's special" : "The menu"}
        </h2>

        {isLoading || catLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-10 text-center">
            <p className="font-display text-xl">Nothing on the pass</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another category or search term.
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  favorite={favorites.includes(food.id)}
                  onToggleFavorite={() => toggle(food.id)}
                  onOpen={() => setSelected(food)}
                  onAdd={() => quickAdd(food)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {cart.count > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            onClick={() => navigate({ to: "/cart" })}
            className="gradient-ember fixed bottom-24 left-1/2 z-40 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center justify-between rounded-full px-5 py-3.5 text-primary-foreground shadow-glow"
          >
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <ShoppingBag className="h-4 w-4" /> {cart.count} item{cart.count > 1 ? "s" : ""}
            </span>
            <span className="text-sm font-bold">View cart · {money(cart.subtotal)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <FoodDialog food={selected} onClose={() => setSelected(null)} />
      <CallWaiter />
      <BottomNav />
      <p className="px-5 pt-8 text-center text-xs text-muted-foreground">
        Restaurant staff? <Link to="/auth" className="font-semibold text-primary">Sign in</Link>
      </p>
    </main>
  );
}

import { motion } from "motion/react";
import { Clock, Flame, Heart, Plus, Star } from "lucide-react";
import type { Food } from "@/lib/menu";
import { money } from "@/lib/store";
import { cn } from "@/lib/utils";

export function VegBadge({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border",
        isVeg ? "border-veg" : "border-nonveg",
      )}
      aria-label={isVeg ? "Vegetarian" : "Non vegetarian"}
    >
      <span className={cn("h-2 w-2 rounded-full", isVeg ? "bg-veg" : "bg-nonveg")} />
    </span>
  );
}

export function FoodCard({
  food,
  onOpen,
  onAdd,
  favorite,
  onToggleFavorite,
}: {
  food: Food;
  onOpen: () => void;
  onAdd: () => void;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="group overflow-hidden rounded-3xl border bg-card shadow-soft"
    >
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-4/3 overflow-hidden">
          <img
            src={food.image_url ?? "/images/hero.jpg"}
            alt={food.name}
            loading="lazy"
            width={800}
            height={600}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
              !food.is_available && "grayscale",
            )}
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <div className="flex flex-wrap gap-1.5">
              {food.is_special && (
                <span className="gradient-ember rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  Today's special
                </span>
              )}
              {!food.is_available && (
                <span className="rounded-full bg-destructive px-2 py-1 text-[10px] font-bold uppercase text-destructive-foreground">
                  Out of stock
                </span>
              )}
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              onKeyDown={(e) => e.key === "Enter" && onToggleFavorite()}
              className="glass-panel grid h-8 w-8 shrink-0 place-items-center rounded-full"
            >
              <Heart className={cn("h-4 w-4", favorite ? "fill-primary text-primary" : "text-foreground")} />
            </span>
          </div>
        </div>
      </button>

      <div className="space-y-2 p-4">
        <div className="flex min-w-0 items-center gap-2">
          <VegBadge isVeg={food.is_veg} />
          <h3 className="truncate text-base font-bold">{food.name}</h3>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{food.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {Number(food.rating).toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {food.prep_time} min
          </span>
          {food.spice_level > 0 && (
            <span className="inline-flex items-center gap-0.5">
              {Array.from({ length: food.spice_level }).map((_, i) => (
                <Flame key={i} className="h-3 w-3 text-nonveg" />
              ))}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="font-display text-xl">{money(Number(food.price))}</span>
          <button
            disabled={!food.is_available}
            onClick={onAdd}
            className="gradient-ember inline-flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow transition-transform active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </motion.article>
  );
}

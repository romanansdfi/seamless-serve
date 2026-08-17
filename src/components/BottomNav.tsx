import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ReceiptText, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";
import { useCart, useLastOrder } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { count } = useCart();
  const { orderId } = useLastOrder();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/menu", label: "Menu", icon: UtensilsCrossed },
    { to: "/cart", label: "Cart", icon: ShoppingBag, badge: count },
    orderId
      ? { to: `/order/${orderId}`, label: "Order", icon: ReceiptText }
      : { to: "/menu", label: "Order", icon: ReceiptText },
  ];

  return (
    <nav className="perspective-deep fixed inset-x-0 bottom-0 z-40 px-3 pb-[env(safe-area-inset-bottom)]">
      <div className="glass-panel depth-card mx-auto mb-3 flex max-w-md items-center justify-between gap-1 rounded-3xl p-2 [transform:rotateX(6deg)] [transform-origin:bottom]">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                <Icon className="h-5 w-5" />
                {"badge" in item && item.badge ? (
                  <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span className="relative truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

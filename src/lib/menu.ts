import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Food = Database["public"]["Tables"]["foods"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type OrderLine = {
  name: string;
  qty: number;
  price: number;
  options: string[];
  note: string;
};

export const STATUS_FLOW: OrderStatus[] = ["received", "confirmed", "preparing", "ready", "served"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Order received",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready to serve",
  served: "Served",
  cancelled: "Cancelled",
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const foodsQuery = queryOptions({
  queryKey: ["foods"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  },
});

export function orderQuery(id: string) {
  return queryOptions({
    queryKey: ["order", id],
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_order", { _id: id })
        .maybeSingle();
      if (error) throw error;
      return data as Order | null;
    },
  });
}


export function parseLines(items: Order["items"]): OrderLine[] {
  if (!Array.isArray(items)) return [];
  return items as unknown as OrderLine[];
}

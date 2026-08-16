import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];
export type ServiceRequestType = Database["public"]["Enums"]["service_request_type"];

export const REQUEST_TYPES: { id: ServiceRequestType; label: string; emoji: string }[] = [
  { id: "waiter", label: "Call waiter", emoji: "🙋" },
  { id: "water", label: "Water refill", emoji: "💧" },
  { id: "bill", label: "Bring the bill", emoji: "🧾" },
  { id: "cleaning", label: "Clean table", emoji: "🧽" },
];

export const REQUEST_LABEL: Record<ServiceRequestType, string> = {
  waiter: "Waiter",
  water: "Water",
  bill: "Bill",
  cleaning: "Cleaning",
};

export const serviceRequestsQuery = queryOptions({
  queryKey: ["service_requests"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data;
  },
});

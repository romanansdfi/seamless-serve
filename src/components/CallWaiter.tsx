import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BellRing, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { REQUEST_TYPES, type ServiceRequestType } from "@/lib/service";
import { useGuest } from "@/lib/store";

export function CallWaiter() {
  const { guest } = useGuest();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ServiceRequestType | null>(null);
  const [note, setNote] = useState("");

  const send = async (type: ServiceRequestType) => {
    if (!guest?.table) {
      toast.error("Scan your table QR code first");
      return;
    }
    setBusy(type);
    const { error } = await supabase.from("service_requests").insert({
      table_number: guest.table,
      customer_name: guest.name ?? "",
      type,
      note: note.trim(),
    });
    setBusy(null);
    if (error) {
      toast.error("Could not reach the staff — try again");
      return;
    }
    toast.success("Staff notified — someone is on the way");
    setNote("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Call a waiter"
        className="glass-panel fixed bottom-40 right-4 z-40 grid h-12 w-12 place-items-center rounded-full shadow-soft"
      >
        <BellRing className="h-5 w-5 text-primary" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-5"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl border bg-card p-5 pb-8 sm:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">Need something?</h2>
                  <p className="text-sm text-muted-foreground">
                    {guest?.table ? `Table ${guest.table}` : "No table detected yet"}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full border p-2">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {REQUEST_TYPES.map((r) => (
                  <button
                    key={r.id}
                    disabled={busy !== null}
                    onClick={() => void send(r.id)}
                    className="rounded-2xl border bg-background p-4 text-left text-sm font-semibold disabled:opacity-60"
                  >
                    <span className="block text-2xl">{r.emoji}</span>
                    {r.label}
                  </button>
                ))}
              </div>

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={140}
                placeholder="Anything else? (optional)"
                className="mt-3 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

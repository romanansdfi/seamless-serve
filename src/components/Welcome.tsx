import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChefHat, ScanLine } from "lucide-react";
import { useGuest } from "@/lib/store";

export function Welcome({ presetTable }: { presetTable?: string }) {
  const navigate = useNavigate();
  const { guest, setGuest } = useGuest();
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [table, setTable] = useState(presetTable ?? "");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanTable = (presetTable ?? table).trim();
    if (cleanName.length < 2 || cleanName.length > 60) return setError("Enter your full name");
    if (!cleanTable) return setError("Enter your table number");
    setGuest({ name: cleanName, table: cleanTable });
    navigate({ to: "/menu" });
  };

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <img
        src="/images/hero.jpg"
        alt="Candlelit table at Saffron & Ember"
        width={1600}
        height={1000}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-background to-transparent" />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-end px-5 pb-10 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <span className="gradient-ember inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
            <ChefHat className="h-7 w-7 text-primary-foreground" />
          </span>
          <h1 className="font-display text-5xl leading-tight">
            Saffron <span className="text-ember">&</span> Ember
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome to your table. Browse the kitchen's finest, order straight from your phone and
            follow every step in real time.
          </p>
          {presetTable && (
            <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
              <ScanLine className="h-4 w-4 text-primary" /> Table {presetTable} detected
            </p>
          )}
        </motion.div>

        {!started && !guest ? (
          <button
            onClick={() => setStarted(true)}
            className="gradient-ember mt-8 rounded-full py-4 text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
          >
            Start your order
          </button>
        ) : null}

        {guest && !started ? (
          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate({ to: "/menu" })}
              className="gradient-ember w-full rounded-full py-4 text-base font-bold text-primary-foreground shadow-glow"
            >
              Continue as {guest.name} · Table {guest.table}
            </button>
            <button
              onClick={() => setStarted(true)}
              className="w-full rounded-full border py-3 text-sm font-semibold"
            >
              Not you? Start fresh
            </button>
          </div>
        ) : null}

        {started && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            className="glass-panel mt-8 space-y-3 rounded-3xl p-5 shadow-soft"
          >
            <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Full name
              <input
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="mt-1 w-full rounded-2xl border bg-background px-4 py-3 text-sm font-medium tracking-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            {!presetTable && (
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Table number
                <input
                  value={table}
                  maxLength={10}
                  onChange={(e) => setTable(e.target.value)}
                  placeholder="e.g. 12"
                  className="mt-1 w-full rounded-2xl border bg-background px-4 py-3 text-sm font-medium tracking-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            )}
            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
            <button
              type="submit"
              className="gradient-ember w-full rounded-full py-4 text-base font-bold text-primary-foreground shadow-glow"
            >
              Continue
            </button>
          </motion.form>
        )}
      </div>
    </main>
  );
}

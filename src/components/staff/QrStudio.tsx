import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export function QrStudio() {
  const [tables, setTables] = useState(8);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border bg-card p-4 shadow-soft">
        <h3 className="font-display text-xl">QR code generator</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Print one code per table. Scanning opens the menu with the table number already filled in.
        </p>
        <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Number of tables: {tables}
          <input
            type="range"
            min={1}
            max={40}
            value={tables}
            onChange={(e) => setTables(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: tables }).map((_, i) => {
          const number = i + 1;
          const url = `${origin}/table/${number}`;
          return (
            <div key={number} className="rounded-3xl border bg-card p-4 text-center shadow-soft">
              <div className="mx-auto grid place-items-center rounded-2xl bg-white p-2">
                {origin && <QRCodeCanvas value={url} size={112} />}
              </div>
              <p className="mt-2 font-display text-lg">Table {number}</p>
              <p className="truncate text-[10px] text-muted-foreground">/table/{number}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

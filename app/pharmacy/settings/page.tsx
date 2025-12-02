"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [defaultMethod, setDefaultMethod] = useState<"Pickup" | "Delivery">(
    "Pickup"
  );
  const [autoMarkPaid, setAutoMarkPaid] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-slate-100">Settings</h2>
      <p className="text-xs text-slate-400">
        Configure how this pharmacy console behaves by default. Later these
        values can be stored in a backend.
      </p>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-4 text-sm">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-300">
            Default fulfillment method
          </p>
          <div className="inline-flex rounded-full bg-slate-950 border border-slate-700 p-1 text-xs">
            <button
              type="button"
              onClick={() => setDefaultMethod("Pickup")}
              className={`px-3 py-1.5 rounded-full transition-all ${
                defaultMethod === "Pickup"
                  ? "bg-slate-100 text-slate-950 font-medium shadow-sm"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Pickup
            </button>
            <button
              type="button"
              onClick={() => setDefaultMethod("Delivery")}
              className={`px-3 py-1.5 rounded-full transition-all ${
                defaultMethod === "Delivery"
                  ? "bg-slate-100 text-slate-950 font-medium shadow-sm"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Delivery
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={autoMarkPaid}
            onChange={(e) => setAutoMarkPaid(e.target.checked)}
            className="h-3 w-3 rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-500"
          />
          <span className="text-slate-300">
            Automatically mark as paid when a matching on-chain payment is
            detected (future).
          </span>
        </label>
      </div>
    </div>
  );
}

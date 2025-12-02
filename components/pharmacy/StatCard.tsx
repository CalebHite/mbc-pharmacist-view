// components/pharmacy/StatCard.tsx
"use client";

type Props = {
  label: string;
  value: number | string;
  accent?: string; // e.g. "from-emerald-400 to-sky-500"
};

export default function StatCard({ label, value, accent }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 flex flex-col gap-1">
      {accent && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${accent} opacity-15`}
        />
      )}
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

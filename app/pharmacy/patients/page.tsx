"use client";

const mockPatients = [
  { id: "P-001", name: "John Doe", wallet: "0xabc…1234" },
  { id: "P-002", name: "Jane Smith", wallet: "0xdef…5678" },
];

export default function PatientsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-slate-100">Patients</h2>
      <p className="text-xs text-slate-400">
        Look up basic patient information and see which wallet is linked to
        their medical passport.
      </p>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden">
        <div className="border-b border-slate-800 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Patient directory
        </div>
        <div className="divide-y divide-slate-800">
          {mockPatients.map((p) => (
            <div
              key={p.id}
              className="px-3 py-2 flex items-center justify-between hover:bg-slate-900/80 transition-colors"
            >
              <div className="space-y-0.5">
                <p className="text-xs text-slate-100">
                  {p.name} · {p.id}
                </p>
                <p className="text-[11px] text-slate-500">{p.wallet}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

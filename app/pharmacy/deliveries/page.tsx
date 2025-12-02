"use client";

const mockDeliveries = [
  {
    id: "DEL-001",
    patient: "John Doe",
    address: "123 Main St, City",
    status: "Out for delivery",
  },
  {
    id: "DEL-002",
    patient: "Jane Smith",
    address: "42 Oak Ave, Town",
    status: "Delivered",
  },
];

export default function DeliveriesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-slate-100">
        Delivery operations
      </h2>
      <p className="text-xs text-slate-400">
        Monitor active deliveries and confirm when medications reach patients.
      </p>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden">
        <div className="border-b border-slate-800 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Active deliveries
        </div>
        <div className="divide-y divide-slate-800">
          {mockDeliveries.map((d) => (
            <div
              key={d.id}
              className="px-3 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:bg-slate-900/80 transition-colors"
            >
              <div>
                <p className="text-xs font-medium text-slate-100">
                  {d.patient}
                </p>
                <p className="text-[11px] text-slate-400">{d.address}</p>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 border ${
                    d.status === "Out for delivery"
                      ? "border-sky-400/70 text-sky-200"
                      : "border-emerald-400/70 text-emerald-200"
                  }`}
                >
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

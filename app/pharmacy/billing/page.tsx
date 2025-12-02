"use client";

import StatCard from "@/components/pharmacy/StatCard";

const mockBills = [
  {
    id: "BILL-001",
    patient: "0xabc…1234",
    amount: 42.5,
    status: "Pending",
    tokenId: 1,
  },
  {
    id: "BILL-002",
    patient: "0xdef…5678",
    amount: 79.0,
    status: "Paid",
    tokenId: 2,
  },
];

export default function BillingPage() {
  const total = mockBills.length;
  const pending = mockBills.filter((b) => b.status === "Pending").length;

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Bills created" value={total} />
        <StatCard label="Pending payment" value={pending} />
        <StatCard label="Paid" value={total - pending} />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden">
        <div className="border-b border-slate-800 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Billing overview
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
              <tr>
                <th className="text-left px-3 py-2 font-normal">Bill ID</th>
                <th className="text-left px-3 py-2 font-normal">Patient</th>
                <th className="text-left px-3 py-2 font-normal">Amount</th>
                <th className="text-left px-3 py-2 font-normal">Status</th>
                <th className="text-left px-3 py-2 font-normal">Token</th>
              </tr>
            </thead>
            <tbody>
              {mockBills.map((bill, idx) => (
                <tr
                  key={bill.id}
                  className={`border-b border-slate-800/80 ${
                    idx % 2 === 0 ? "bg-slate-950/80" : "bg-slate-950/60"
                  }`}
                >
                  <td className="px-3 py-2 text-xs text-slate-100">
                    {bill.id}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {bill.patient}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-300">
                    {bill.amount} USDC
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] border ${
                        bill.status === "Pending"
                          ? "border-amber-400/70 text-amber-200"
                          : "border-emerald-400/70 text-emerald-200"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    #{bill.tokenId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

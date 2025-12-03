"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/pharmacy/StatCard";

type Bill = {
  id: string;
  tokenId: number;
  patientAddress: string;
  pharmacistAddress: string;
  amount: number;
  amountInSubunits: string;
  status: "Pending" | "Paid";
  createdAt: string;
  medication?: string;
  dosage?: string;
};

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load bills from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('pharmacyBills');
        const billsData = stored ? JSON.parse(stored) : [];
        setBills(billsData);
      } catch (error) {
        console.error("Failed to load bills:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const total = bills.length;
  const pending = bills.filter((b) => b.status === "Pending").length;
  const paid = bills.filter((b) => b.status === "Paid").length;

  const formatAddress = (address: string) => {
    if (!address) return "—";
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Bills created" value={loading ? "…" : total} />
        <StatCard label="Pending payment" value={loading ? "…" : pending} />
        <StatCard label="Paid" value={loading ? "…" : paid} />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden">
        <div className="border-b border-slate-800 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Billing overview
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-slate-800/70 animate-pulse"
              />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="p-4 text-xs text-slate-500">
            No bills created yet. Create bills from the prescription workspace.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th className="text-left px-3 py-2 font-normal">Bill ID</th>
                  <th className="text-left px-3 py-2 font-normal">Patient</th>
                  <th className="text-left px-3 py-2 font-normal">Medication</th>
                  <th className="text-left px-3 py-2 font-normal">Amount</th>
                  <th className="text-left px-3 py-2 font-normal">Status</th>
                  <th className="text-left px-3 py-2 font-normal">Token</th>
                  <th className="text-left px-3 py-2 font-normal">Created</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, idx) => (
                  <tr
                    key={bill.id}
                    className={`border-b border-slate-800/80 hover:bg-slate-900/80 transition-colors ${
                      idx % 2 === 0 ? "bg-slate-950/80" : "bg-slate-950/60"
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-slate-100">
                      {bill.id}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {formatAddress(bill.patientAddress)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-300">
                      {bill.medication || "—"}
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
                      <a
                        href={`/pharmacy/prescriptions/${bill.tokenId}`}
                        className="hover:text-emerald-300 transition-colors"
                      >
                        #{bill.tokenId}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {formatDate(bill.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

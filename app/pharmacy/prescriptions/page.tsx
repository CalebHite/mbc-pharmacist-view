// app/pharmacy/prescriptions/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readAllPrescriptionNFTs } from "@/lib/prescriptions";
import { PrescriptionNFT } from "@/lib/pharmacy/types";

export default function PrescriptionsPage() {
  const contractAddress = "0x51fCc50146E3920f0ce2a91b59B631235Aa52dd3";
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<PrescriptionNFT[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await readAllPrescriptionNFTs(contractAddress);
        setNfts(data);
      } catch (err) {
        console.error("Failed to fetch prescription NFTs:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-slate-100">
            Prescriptions queue
          </h2>
          <p className="text-xs text-slate-400">
            Filter and open prescriptions to work them end-to-end.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden">
        <div className="border-b border-slate-800 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
          All prescriptions
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-slate-800/70 animate-pulse"
              />
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <div className="p-4 text-xs text-slate-500">
            No prescriptions found for this contract.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th className="text-left px-3 py-2 font-normal">Patient</th>
                  <th className="text-left px-3 py-2 font-normal">
                    Medication
                  </th>
                  <th className="text-left px-3 py-2 font-normal">Dosage</th>
                  <th className="text-left px-3 py-2 font-normal">Token</th>
                  <th className="text-right px-3 py-2 font-normal">
                    Workspace
                  </th>
                </tr>
              </thead>
              <tbody>
                {nfts.map((nft, idx) => (
                  <tr
                    key={nft.tokenId}
                    className={`border-b border-slate-800/80 hover:bg-slate-900/80 transition-colors ${
                      idx % 2 === 0 ? "bg-slate-950/80" : "bg-slate-950/60"
                    }`}
                  >
                    <td className="px-3 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-300">
                          {nft.owner.slice(0, 6)}…
                          {nft.owner.slice(-4)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-sm text-slate-100">
                        {nft.medication || "Medication"}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-xs text-slate-400">
                        {nft.dosage || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-xs text-slate-400">
                        #{nft.tokenId}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      <Link
                        href={`/pharmacy/prescriptions/${nft.tokenId}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-100 hover:border-emerald-400/70 hover:text-emerald-200 transition-all"
                      >
                        Open
                        <span className="text-[10px]">↗</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

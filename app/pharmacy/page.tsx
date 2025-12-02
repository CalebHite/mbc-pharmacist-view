// app/pharmacy/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readAllPrescriptionNFTs } from "@/lib/prescriptions";
import { PrescriptionNFT, PrescriptionStatus } from "@/lib/pharmacy/types";
import StatCard from "@/components/pharmacy/StatCard";

export default function PharmacyOverviewPage() {
  const contractAddress = "0x51fCc50146E3920f0ce2a91b59B631235Aa52dd3";
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<PrescriptionNFT[]>([]);

  // For now, everything is "New"; later you'll hydrate statuses from backend/on-chain
  const statuses: Record<number, PrescriptionStatus> = useMemo(() => {
    const map: Record<number, PrescriptionStatus> = {};
    for (const nft of nfts) {
      map[nft.tokenId] = "New";
    }
    return map;
  }, [nfts]);

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

  const stats = useMemo(() => {
    const total = nfts.length;
    let newCount = 0;

    for (const nft of nfts) {
      const s = statuses[nft.tokenId] || "New";
      if (s === "New") newCount += 1;
    }

    return { total, newCount };
  }, [nfts, statuses]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Prescriptions in system"
          value={loading ? "…" : stats.total}
          accent="from-emerald-400 to-sky-500"
        />
        <StatCard
          label="New / unprocessed"
          value={loading ? "…" : stats.newCount}
          accent="from-sky-500 to-indigo-500"
        />
        <StatCard label="Deliveries today" value="—" />
      </section>

      {/* Main content */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,2.3fr)] gap-6">
        {/* Left: focus tasks */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-4">
          <h2 className="text-sm font-medium text-slate-100">
            Start where you left off
          </h2>
          <p className="text-xs text-slate-400">
            Use the workflow shortcuts below to jump into the area you work in
            most frequently.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <LinkCard
              href="/pharmacy/prescriptions"
              title="Work prescriptions"
              description="Review new prescriptions, verify details, and progress them through the workflow."
            />
            <LinkCard
              href="/pharmacy/billing"
              title="Review billing"
              description="See bills you’ve created, check payment status, and reconcile issues."
            />
            <LinkCard
              href="/pharmacy/deliveries"
              title="Deliveries"
              description="Monitor out-for-delivery orders and confirm completed deliveries."
            />
            <LinkCard
              href="/pharmacy/patients"
              title="Patients"
              description="Look up patient history and past prescriptions."
            />
          </div>
        </div>

        {/* Right: mini recent list */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-100">
              Recent prescriptions
            </h2>
            <Link
              href="/pharmacy/prescriptions"
              className="text-xs text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-slate-800/70 animate-pulse"
                />
              ))}
            </div>
          ) : nfts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No prescriptions found yet for this contract.
            </p>
          ) : (
            <div className="space-y-2">
              {nfts.slice(0, 5).map((nft) => (
                <Link
                  key={nft.tokenId}
                  href={`/pharmacy/prescriptions/${nft.tokenId}`}
                  className="block rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 hover:border-emerald-400/60 hover:bg-slate-900 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm text-slate-100">
                        {nft.medication || "Medication"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Patient: {nft.owner.slice(0, 6)}…
                        {nft.owner.slice(-4)}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Token #{nft.tokenId}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col gap-1.5 hover:border-emerald-400/60 hover:bg-slate-900 transition-all"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-100">{title}</p>
        <span className="text-xs text-slate-500 group-hover:text-emerald-300 transition-colors">
          Open →
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-snug">{description}</p>
    </Link>
  );
}

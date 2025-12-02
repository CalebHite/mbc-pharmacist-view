// app/pharmacy/prescriptions/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readAllPrescriptionNFTs } from "@/lib/prescriptions";
import { readAllMedicalPassportNFTs } from "@/lib/passports";
import { PrescriptionNFT } from "@/lib/pharmacy/types";

type MedicalPassportNFT = {
  tokenId: number;
  owner: string;
  name: string;
  contactInfo: string;
  dateOfBirth: string;
  socialSecurityNumber: string;
  medicalHistory: string;
  pastDiagnoses: string;
  familyHistory: string;
  allergies: string;
  currentMedications: string;
  treatmentRegimens: string;
  vitalSigns: string;
  metadata: any;
};

type PrescriptionWithPassport = PrescriptionNFT & {
  passport: MedicalPassportNFT | null;
};

// Helper function to check if a name is valid
function isValidName(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return normalized !== "" && 
         normalized !== "n/a" && 
         normalized !== "na" &&
         normalized !== "unknown" &&
         normalized !== "unknown patient";
}

export default function PrescriptionsPage() {
  const prescriptionContractAddress = "0x51fCc50146E3920f0ce2a91b59B631235Aa52dd3";
  const passportContractAddress = "0xb8Df87631dBB64D28a4c015b23540F1ce02445e2";
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<PrescriptionWithPassport[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prescriptionData, passportData] = await Promise.all([
          readAllPrescriptionNFTs(prescriptionContractAddress),
          readAllMedicalPassportNFTs(passportContractAddress)
        ]);

        // Create a map of passport owner addresses to passports (only with valid names)
        const passportMapByOwner = new Map<string, MedicalPassportNFT>();
        (passportData as MedicalPassportNFT[]).forEach((p) => {
          const ownerKey = p.owner?.toLowerCase();
          if (ownerKey && isValidName(p.name)) {
            // Prefer passports with valid names
            if (!passportMapByOwner.has(ownerKey) || isValidName(p.name)) {
              passportMapByOwner.set(ownerKey, p);
            }
          }
        });

        // Pair prescriptions with passports and filter out those without valid names
        const prescriptionsWithPassports: PrescriptionWithPassport[] = prescriptionData
          .map((prescription: PrescriptionNFT) => {
            const ownerKey = prescription.owner?.toLowerCase();
            const matchingPassport = ownerKey ? passportMapByOwner.get(ownerKey) || null : null;
            return {
              ...prescription,
              passport: matchingPassport
            };
          })
          .filter((prescription) => 
            prescription.passport !== null && isValidName(prescription.passport.name)
          );

        setNfts(prescriptionsWithPassports);
        console.log("Loaded prescriptions with passports:", prescriptionsWithPassports);
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
                        <span className="text-xs text-slate-100">
                          {nft.passport?.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {nft.owner.slice(0, 6)}…{nft.owner.slice(-4)}
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

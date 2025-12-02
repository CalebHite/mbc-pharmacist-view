"use client";

import { useEffect, useState } from "react";
import { readAllMedicalPassportNFTs } from "@/lib/passports";

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

export default function PatientsPage() {
  const passportContractAddress = "0xb8Df87631dBB64D28a4c015b23540F1ce02445e2";
  const [loading, setLoading] = useState(true);
  const [passports, setPassports] = useState<MedicalPassportNFT[]>([]);

  useEffect(() => {
    const loadPassports = async () => {
      setLoading(true);
      try {
        const data = await readAllMedicalPassportNFTs(passportContractAddress);
        // Filter out passports with invalid names
        const validPassports = (data as MedicalPassportNFT[]).filter(
          (p) => isValidName(p.name)
        );
        setPassports(validPassports);
        console.log("Loaded passports:", data);
        console.log("Filtered passports with valid names:", validPassports.length);
      } catch (err) {
        console.error("Failed to fetch passport NFTs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPassports();
  }, []);

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
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-slate-800/70 animate-pulse"
              />
            ))}
          </div>
        ) : passports.length === 0 ? (
          <div className="p-4 text-xs text-slate-500">
            No patient passports found.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {passports.map((passport) => (
              <div
                key={passport.tokenId}
                className="px-3 py-2 flex items-center justify-between hover:bg-slate-900/80 transition-colors"
              >
                <div className="space-y-0.5 flex-1">
                  <p className="text-xs text-slate-100">
                    {passport.name} · Token #{passport.tokenId}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {passport.owner}
                  </p>
                  {passport.contactInfo && (
                    <p className="text-[11px] text-slate-400">
                      {passport.contactInfo}
                    </p>
                  )}
                  {passport.dateOfBirth && (
                    <p className="text-[11px] text-slate-400">
                      DOB: {passport.dateOfBirth}
                    </p>
                  )}
                </div>
                {passport.allergies && passport.allergies.trim() !== "" && (
                  <div className="ml-2 px-2 py-1 rounded bg-red-900/20 border border-red-800/50">
                    <span className="text-[10px] text-red-300">⚠️ Allergies</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { readAllPrescriptionNFTs } from "@/lib/prescriptions";

type PrescriptionNFT = {
  tokenId: number;
  owner: string;
  medication: string;
  dosage: string;
  instructions: string;
  metadata: any;
};

export default function Home() {
  const contractAddress = "0x51fCc50146E3920f0ce2a91b59B631235Aa52dd3";
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<PrescriptionNFT[]>([]);
  const [expandedTokenId, setExpandedTokenId] = useState<number | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionNFT | null>(null);
  const [patientStatuses, setPatientStatuses] = useState<Record<number, string>>({});
  const [pharmacistInstructions, setPharmacistInstructions] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadNFTs = async () => {
      setLoading(true);
      try {
        const data = await readAllPrescriptionNFTs(contractAddress);
        setNfts(data);
      } catch (err: any) {
        console.error("Failed to fetch prescription NFTs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNFTs();
  }, []);

  const toggleExpand = (tokenId: number) => {
    if (expandedTokenId === tokenId) {
      setExpandedTokenId(null);
    } else {
      setExpandedTokenId(tokenId);
    }
  };

  const openPrescriptionModal = (nft: PrescriptionNFT) => {
    setSelectedPrescription(nft);
  };

  const closePrescriptionModal = () => {
    setSelectedPrescription(null);
  };

  const handleFillPrescription = (tokenId: number) => {
    setPatientStatuses((prev) => ({
      ...prev,
      [tokenId]: "Pending"
    }));
    
    const prescription = nfts.find(nft => nft.tokenId === tokenId);
    if (prescription) {
      const instructions = `Fill prescription for ${prescription.medication} (${prescription.dosage}). Patient instructions: ${prescription.instructions}. Please verify medication availability and prepare for dispensing.`;
      setPharmacistInstructions((prev) => ({
        ...prev,
        [tokenId]: instructions
      }));
    }
    
    closePrescriptionModal();
  };

  const handleFinishPrescription = (tokenId: number) => {
    setPatientStatuses((prev) => ({
      ...prev,
      [tokenId]: "Completed"
    }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="w-full max-w-2xl bg-white dark:bg-black rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-semibold mb-6 text-black dark:text-zinc-50">
          Dashboard
        </h1>

        {loading ? (
          <div className="text-center text-zinc-600 dark:text-zinc-400">
            Loading...
          </div>
        ) : (
          <div className="space-y-2">
            {[...nfts].sort((a, b) => {
              const statusA = patientStatuses[a.tokenId] || "";
              const statusB = patientStatuses[b.tokenId] || "";
              
              // Priority: Pending (1) > No status (2) > Completed (3)
              const getPriority = (status: string) => {
                if (status === "Pending") return 1;
                if (status === "Completed") return 3;
                return 2;
              };
              
              return getPriority(statusA) - getPriority(statusB);
            }).map((nft) => {
              const status = patientStatuses[nft.tokenId];
              const getCardStyles = () => {
                if (status === "Pending") {
                  return "border-2 border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-950/30 shadow-md";
                } else if (status === "Completed") {
                  return "border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-60";
                }
                return "border-2 border-blue-400 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm";
              };

              const getButtonStyles = () => {
                if (status === "Pending") {
                  return "hover:bg-orange-100 dark:hover:bg-orange-900/30 font-semibold";
                } else if (status === "Completed") {
                  return "hover:bg-zinc-100 dark:hover:bg-zinc-800/30 opacity-70";
                }
                return "hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium";
              };

              const getTextStyles = () => {
                if (status === "Completed") {
                  return "text-zinc-500 dark:text-zinc-500";
                }
                return "text-black dark:text-zinc-50";
              };

              return (
              <div key={nft.tokenId} className={`${getCardStyles()} rounded-md transition-colors`}>
                <button
                  onClick={() => toggleExpand(nft.tokenId)}
                  className={`w-full px-4 py-3 text-left ${getButtonStyles()} transition-colors flex items-center justify-between`}
                >
                  <span className="font-mono text-sm text-black dark:text-zinc-50">
                    Patient ID: {nft.owner}
                  </span>
                  <span className="text-zinc-400">
                    {expandedTokenId === nft.tokenId ? "−" : "+"}
                  </span>
                </button>
                {expandedTokenId === nft.tokenId && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-300 dark:border-zinc-700">
                    <div className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <h3 className="font-semibold text-black dark:text-zinc-50 mb-3">Patient Information</h3>
                        <div>
                          <span className="font-medium text-black dark:text-zinc-50">Name: </span>
                          <span className="text-zinc-600 dark:text-zinc-400">John Doe</span>
                        </div>
                        <div>
                          <span className="font-medium text-black dark:text-zinc-50">Age: </span>
                          <span className="text-zinc-600 dark:text-zinc-400">45</span>
                        </div>
                        <div>
                          <span className="font-medium text-black dark:text-zinc-50">Date of Birth: </span>
                          <span className="text-zinc-600 dark:text-zinc-400">01/15/1979</span>
                        </div>
                        <div>
                          <span className="font-medium text-black dark:text-zinc-50">Address: </span>
                          <span className="text-zinc-600 dark:text-zinc-400">123 Main St, City, State 12345</span>
                        </div>
                        <div>
                          <span className="font-medium text-black dark:text-zinc-50">Phone: </span>
                          <span className="text-zinc-600 dark:text-zinc-400">(555) 123-4567</span>
                        </div>
                        {patientStatuses[nft.tokenId] && (
                          <div>
                            <span className="font-medium text-black dark:text-zinc-50">Status: </span>
                            <span className={`font-semibold ${
                              patientStatuses[nft.tokenId] === "Pending" 
                                ? "text-orange-600 dark:text-orange-400" 
                                : patientStatuses[nft.tokenId] === "Completed"
                                ? "text-green-600 dark:text-green-400"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}>
                              {patientStatuses[nft.tokenId]}
                            </span>
                          </div>
                        )}
                      </div>
                      {pharmacistInstructions[nft.tokenId] && patientStatuses[nft.tokenId] !== "Completed" && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 text-sm">Pharmacist Instructions:</h4>
                          <p className="text-sm text-blue-800 dark:text-blue-300">{pharmacistInstructions[nft.tokenId]}</p>
                        </div>
                      )}
                      {patientStatuses[nft.tokenId] === "Pending" && (
                        <button
                          onClick={() => handleFinishPrescription(nft.tokenId)}
                          className="w-full px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                        >
                          Finish Prescription
                        </button>
                      )}
                      {patientStatuses[nft.tokenId] !== "Pending" && patientStatuses[nft.tokenId] !== "Completed" && (
                        <button
                          onClick={() => openPrescriptionModal(nft)}
                          className="w-full px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                          Review Prescription
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* Prescription Modal */}
        {selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                  Prescription Details
                </h2>
                <button
                  onClick={closePrescriptionModal}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-black dark:text-zinc-50">Token ID: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{selectedPrescription.tokenId}</span>
                </div>
                <div>
                  <span className="font-medium text-black dark:text-zinc-50">Medication: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{selectedPrescription.medication}</span>
                </div>
                <div>
                  <span className="font-medium text-black dark:text-zinc-50">Dosage: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{selectedPrescription.dosage}</span>
                </div>
                <div>
                  <span className="font-medium text-black dark:text-zinc-50">Instructions: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{selectedPrescription.instructions}</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => handleFillPrescription(selectedPrescription.tokenId)}
                  className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Fill Prescription
                </button>
                <button
                  onClick={closePrescriptionModal}
                  className="w-full px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

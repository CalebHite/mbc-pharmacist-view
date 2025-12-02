"use client";

import { useState } from "react";
import { readPrescriptionNFT } from "@/lib/prescriptions";

export default function Home() {
  const [rpcUrl, setRpcUrl] = useState("https://mainnet.base.org");
  const [contractAddress, setContractAddress] = useState("0xYourContractAddress");
  const [tokenId, setTokenId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
        const data = await readPrescriptionNFT(
        contractAddress,
        parseInt(tokenId)
      );
      setResult(data as any);
    } catch (err: any) {
      setError(err.message || "Failed to fetch prescription NFT");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="w-full max-w-2xl bg-white dark:bg-black rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-semibold mb-6 text-black dark:text-zinc-50">
          Prescription NFT Viewer
        </h1>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-zinc-50">
              RPC URL
            </label>
            <input
              type="text"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-zinc-50">
              Contract Address
            </label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-zinc-50">
              Token ID
            </label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
            />
          </div>

          <button
            onClick={handleFetch}
            disabled={loading}
            className="w-full px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-md font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Fetch Prescription NFT"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-md">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
              Prescription Data
            </h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-black dark:text-zinc-50">Medication: </span>
                <span className="text-zinc-600 dark:text-zinc-400">{result.medication}</span>
              </div>
              <div>
                <span className="font-medium text-black dark:text-zinc-50">Dosage: </span>
                <span className="text-zinc-600 dark:text-zinc-400">{result.dosage}</span>
              </div>
              <div>
                <span className="font-medium text-black dark:text-zinc-50">Instructions: </span>
                <span className="text-zinc-600 dark:text-zinc-400">{result.instructions}</span>
              </div>
              <div className="mt-4">
                <span className="font-medium text-black dark:text-zinc-50">Metadata: </span>
                <pre className="mt-2 p-3 bg-white dark:bg-zinc-800 rounded text-sm text-zinc-600 dark:text-zinc-400 overflow-auto">
                  {JSON.stringify(result.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

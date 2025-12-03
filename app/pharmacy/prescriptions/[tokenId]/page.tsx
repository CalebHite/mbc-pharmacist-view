// app/pharmacy/prescriptions/[tokenId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { readAllPrescriptionNFTs } from "@/lib/prescriptions";
import { readAllMedicalPassportNFTs } from "@/lib/passports";
import { createUSDCTransferRequest, usdcToBigInt, createPaymentInstruction, createPaymentRequest, type PaymentInstruction } from "@/lib/payments";
import {
  DeliveryFormState,
  EMPTY_DELIVERY_FORM,
  FulfillmentMethod,
  PrescriptionNFT,
  PrescriptionStatus,
} from "@/lib/pharmacy/types";

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

type TimelineEvent = {
  id: string;
  label: string;
  timestamp: string;
};

const tabs = ["Review", "Billing", "Fulfillment", "Timeline"] as const;
type Tab = (typeof tabs)[number];

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

export default function PrescriptionWorkspacePage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const numericId = useMemo(() => Number(tokenId), [tokenId]);

  const prescriptionContractAddress = "0x51fCc50146E3920f0ce2a91b59B631235Aa52dd3";
  const passportContractAddress = "0xb8Df87631dBB64D28a4c015b23540F1ce02445e2";

  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<PrescriptionNFT | null>(
    null
  );
  const [passport, setPassport] = useState<MedicalPassportNFT | null>(null);
  const [status, setStatus] = useState<PrescriptionStatus>("New");
  const [activeTab, setActiveTab] = useState<Tab>("Review");

  const [billAmount, setBillAmount] = useState<number | null>(null);
  const [billingInput, setBillingInput] = useState<string>("");
  const [billCreating, setBillCreating] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("Pickup");
  const [deliveryForm, setDeliveryForm] =
    useState<DeliveryFormState>(EMPTY_DELIVERY_FORM);

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Load the single prescription and matching passport
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prescriptionData, passportData] = await Promise.all([
          readAllPrescriptionNFTs(prescriptionContractAddress),
          readAllMedicalPassportNFTs(passportContractAddress)
        ]);

        const found = prescriptionData.find((p) => p.tokenId === numericId) || null;
        setPrescription(found);

        if (found) {
          // Find matching passport by owner address (only if it has a valid name)
          const ownerKey = found.owner?.toLowerCase();
          const matchingPassport = ownerKey
            ? (passportData as MedicalPassportNFT[]).find(
                (p) => p.owner?.toLowerCase() === ownerKey && isValidName(p.name)
              ) || null
            : null;
          setPassport(matchingPassport);

          addEvent("Prescription loaded");
          if (matchingPassport) {
            addEvent("Patient passport loaded");
          }
        }
      } catch (err) {
        console.error("Failed to fetch prescription NFTs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(numericId)) {
      load();
    }
  }, [prescriptionContractAddress, passportContractAddress, numericId]);

  const addEvent = (label: string) => {
    setTimeline((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        label,
        timestamp: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  const handleApprove = () => {
    setStatus("New"); // still "New" but conceptually approved
    addEvent("Prescription reviewed and approved");
    setMessage("Marked as reviewed. You can proceed to billing.");
    setActiveTab("Billing");
  };

  const handleNeedsInfo = () => {
    addEvent("Flagged as needing clarification");
    setMessage("Flagged for clarification. Add details in your internal system.");
  };

  const handleCreateBill = async () => {
    if (!prescription) return;

    const num = parseFloat(billingInput);
    if (Number.isNaN(num) || num <= 0) {
      setMessage("Please enter a valid bill amount.");
      setBillError("Please enter a valid bill amount.");
      return;
    }

    // Get pharmacist's private key from environment
    const pharmacistPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    if (!pharmacistPrivateKey) {
      const errorMsg = "Private key not configured. Please set NEXT_PUBLIC_PRIVATE_KEY in your environment.";
      setMessage(errorMsg);
      setBillError(errorMsg);
      return;
    }

    setBillCreating(true);
    setBillError(null);
    setMessage("Creating payment request with Circle...");

    try {
      const amountInSubunits = usdcToBigInt(num);
      
      // Get pharmacist's address from private key
      const { privateKeyToAccount } = await import("viem/accounts");
      const pharmacistAccount = privateKeyToAccount(
        (pharmacistPrivateKey.startsWith("0x") ? pharmacistPrivateKey : `0x${pharmacistPrivateKey}`) as `0x${string}`
      );
      const pharmacistAddress = pharmacistAccount.address;

      // Validate patient address (this is where payment will be initiated FROM)
      const patientAddress = prescription.owner;
      if (!patientAddress || !/^0x[a-fA-F0-9]{40}$/.test(patientAddress)) {
        throw new Error("Invalid patient address. Cannot create payment request.");
      }

      // Validate pharmacist address (this is where payment will be sent TO)
      if (!pharmacistAddress || !/^0x[a-fA-F0-9]{40}$/.test(pharmacistAddress)) {
        throw new Error("Invalid pharmacist address. Cannot create payment request.");
      }

      // Create payment instruction for Circle
      // This will transfer FROM patient TO pharmacist
      const billId = `BILL-${Date.now()}-${prescription.tokenId}`;
      const paymentInstruction = createPaymentInstruction(
        billId,
        pharmacistAddress, // Destination: pharmacist receives payment
        patientAddress,    // Source: patient initiates payment
        num
      );

      // Try to get patient's private key to initiate payment
      // In a real scenario, the patient would approve this from their side
      // For now, we'll check if there's a patient private key available
      const patientPrivateKey = process.env.NEXT_PUBLIC_PATIENT_PRIVATE_KEY;
      
      let paymentResult = null;
      if (patientPrivateKey) {
        // If we have the patient's private key, actually initiate the Circle payment
        // This will transfer USDC FROM patient (Ethereum Sepolia) TO pharmacist (Avalanche Fuji)
        setMessage("Initiating Circle payment transfer from patient to pharmacist...");
        paymentResult = await createPaymentRequest({
          patientPrivateKey,      // Patient's key to initiate transfer
          pharmacistAddress,       // Pharmacist's address to receive payment
          amount: amountInSubunits,
          billId,
        });

        if (paymentResult.success) {
          // Update payment instruction with transfer details
          paymentInstruction.status = "completed";
          paymentInstruction.transferDetails = {
            approvalTx: paymentResult.approvalTx,
            burnTx: paymentResult.burnTx,
            mintTx: paymentResult.mintTx,
          };
          setMessage(`Circle payment initiated successfully! Transfer details saved.`);
        } else {
          setMessage(`Payment instruction created, but transfer failed: ${paymentResult.error}. Patient can fulfill payment manually.`);
        }
      } else {
        // Create payment instruction that patient can fulfill
        // The instruction contains all details needed for the patient to initiate payment
        setMessage("Payment instruction created. Patient can fulfill payment from their side.");
      }

      // Create bill record with payment instruction
      // Convert BigInt values to strings for JSON serialization
      const serializablePaymentInstruction = {
        ...paymentInstruction,
        amount: paymentInstruction.amount.toString(), // Convert BigInt to string
      };

      const bill = {
        id: billId,
        tokenId: prescription.tokenId,
        patientAddress,
        pharmacistAddress,
        amount: num,
        amountInSubunits: amountInSubunits.toString(),
        status: paymentResult?.success ? "Paid" as const : "Pending" as const,
        createdAt: new Date().toISOString(),
        medication: prescription.medication,
        dosage: prescription.dosage,
        paymentInstruction: serializablePaymentInstruction,
        transferDetails: paymentResult?.success ? paymentInstruction.transferDetails : undefined,
      };

      // Store bill in localStorage
      // Bills are stored with patientAddress, so patient view can query by address
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = localStorage.getItem('pharmacyBills');
          const bills = stored ? JSON.parse(stored) : [];
          bills.push(bill);
          localStorage.setItem('pharmacyBills', JSON.stringify(bills));
        } catch (error) {
          console.error("Failed to store bill:", error);
          throw new Error("Failed to store bill in localStorage");
        }
      }

      setBillAmount(num);
      setStatus(paymentResult?.success ? "Preparing" : "Pending Payment");
      addEvent(`Bill created for ${num} USDC (Bill ID: ${billId})${paymentResult?.success ? ' - Circle payment initiated' : ' - Payment instruction created'}`);
      
      if (paymentResult?.success) {
        setMessage(`Bill created and Circle payment initiated successfully! Bill ID: ${billId}. Amount: ${num} USDC. Payment transferred FROM patient (${patientAddress.slice(0, 6)}...${patientAddress.slice(-4)}) TO pharmacist (${pharmacistAddress.slice(0, 6)}...${pharmacistAddress.slice(-4)}).`);
      } else {
        setMessage(`Bill created successfully! Bill ID: ${billId}. Amount: ${num} USDC. Payment instruction created for patient (${patientAddress.slice(0, 6)}...${patientAddress.slice(-4)}) to pay pharmacist (${pharmacistAddress.slice(0, 6)}...${pharmacistAddress.slice(-4)}). Patient can fulfill payment from their side.`);
      }
      
      // Clear billing input
      setBillingInput("");
    } catch (error: any) {
      const errorMsg = error.message || "An error occurred creating the bill";
      setMessage(errorMsg);
      setBillError(errorMsg);
      addEvent(`Failed to create bill: ${errorMsg}`);
    } finally {
      setBillCreating(false);
    }
  };

  const handleMarkPaid = () => {
    if (!billAmount) {
      setMessage("Create a bill before marking as paid.");
      return;
    }
    setStatus("Preparing");
    addEvent("Payment recorded; prescription marked as preparing");
    setMessage("Payment recorded. Move to fulfillment when medication is ready.");
    setActiveTab("Fulfillment");
  };

  const handleDeliveryFormChange = (
    field: keyof DeliveryFormState,
    value: string
  ) => {
    setDeliveryForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateFulfillment = () => {
    if (!prescription) return;

    if (fulfillmentMethod === "Delivery") {
      if (!deliveryForm.addressLine1 || !deliveryForm.city) {
        setMessage("Please add at least address line 1 and city.");
        return;
      }
    }

    const payload = {
      tokenId: prescription.tokenId,
      patientWallet: prescription.owner,
      medication: prescription.medication,
      dosage: prescription.dosage,
      instructions: prescription.instructions,
      billAmount,
      fulfillmentMethod,
      deliveryDetails:
        fulfillmentMethod === "Delivery" ? { ...deliveryForm } : null,
      createdAt: new Date().toISOString(),
    };

    // 🔥 This is where you will later mint / call Circle / etc.
    console.log("Fulfillment payload:", payload);

    if (fulfillmentMethod === "Delivery") {
      setStatus("Out for Delivery");
      addEvent("Delivery order created (payload logged to console)");
      setMessage(
        "Delivery order created. Payload logged to console for future minting."
      );
    } else {
      setStatus("Completed");
      addEvent("Prescription completed via pickup");
      setMessage("Marked as completed via pickup.");
    }
  };

  if (Number.isNaN(numericId)) {
    return (
      <div className="text-sm text-rose-300">
        Invalid token ID in the URL. Please go back to the prescriptions list.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 rounded-full bg-slate-800/70 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 rounded-2xl bg-slate-800/70 animate-pulse" />
          <div className="h-40 rounded-2xl bg-slate-800/70 animate-pulse" />
        </div>
        <div className="h-56 rounded-2xl bg-slate-800/70 animate-pulse" />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-sm text-slate-300">
        No prescription found with token ID {numericId}. It may have been
        removed or minted on a different contract.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-100">
            Prescription workspace
          </h2>
          <p className="text-xs text-slate-400">
            Token #{prescription.tokenId} · {prescription.medication}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Status: {status}
        </span>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prescription */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-2">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
            Prescription
          </h3>
          <p className="text-base font-medium text-slate-50">
            {prescription.medication}
          </p>
          <p className="text-sm text-slate-400">{prescription.dosage}</p>
          <p className="text-xs text-slate-500 mt-2">
            Instructions:{" "}
            <span className="text-slate-300">
              {prescription.instructions || "—"}
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-3">
            Token ID: {prescription.tokenId}
          </p>
        </div>

        {/* Patient */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-2">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
            Patient (medical passport)
          </h3>
          {passport ? (
            <>
              <p className="text-sm font-medium text-slate-50">
                {passport.name}
              </p>
              {passport.dateOfBirth && (
                <p className="text-xs text-slate-400">
                  DOB: {passport.dateOfBirth}
                </p>
              )}
              {passport.contactInfo && (
                <p className="text-xs text-slate-400">
                  Contact: {passport.contactInfo}
                </p>
              )}
              {passport.allergies && passport.allergies.trim() !== "" && (
                <div className="mt-2 p-2 rounded-lg bg-red-900/20 border border-red-800/50">
                  <p className="text-[10px] font-semibold text-red-300 mb-1">
                    ⚠️ Allergies
                  </p>
                  <p className="text-[10px] text-red-200">
                    {passport.allergies}
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Wallet: {prescription.owner}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-50">
                No passport found
              </p>
              <p className="text-xs text-slate-400">
                Wallet: {prescription.owner}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90">
        <div className="border-b border-slate-800 px-3 py-2 flex gap-1 text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative rounded-full px-3 py-1.5 transition-all ${
                  isActive
                    ? "bg-slate-100 text-slate-950 font-medium shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="p-4 md:p-5 space-y-3">
          {activeTab === "Review" && (
            <ReviewTab
              onApprove={handleApprove}
              onNeedsInfo={handleNeedsInfo}
            />
          )}

          {activeTab === "Billing" && (
            <BillingTab
              billAmount={billAmount}
              billingInput={billingInput}
              onBillingInputChange={setBillingInput}
              onCreateBill={handleCreateBill}
              onMarkPaid={handleMarkPaid}
              creating={billCreating}
              error={billError}
            />
          )}

          {activeTab === "Fulfillment" && (
            <FulfillmentTab
              fulfillmentMethod={fulfillmentMethod}
              onChangeMethod={setFulfillmentMethod}
              deliveryForm={deliveryForm}
              onChangeField={handleDeliveryFormChange}
              onCreateFulfillment={handleCreateFulfillment}
            />
          )}

          {activeTab === "Timeline" && (
            <TimelineTab events={timeline} status={status} />
          )}

          {message && (
            <p className="text-xs text-slate-400 border-t border-slate-800 pt-3">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Tab components ---------- */

function ReviewTab({
  onApprove,
  onNeedsInfo,
}: {
  onApprove: () => void;
  onNeedsInfo: () => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-slate-300">
        Review the prescription details and patient information. If everything
        looks correct, approve it to proceed to billing. If something needs
        clarification, flag it.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onApprove}
          className="inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-950 px-4 py-1.5 text-xs font-medium hover:bg-slate-200 transition-colors"
        >
          Approve &amp; go to billing
        </button>
        <button
          onClick={onNeedsInfo}
          className="inline-flex items-center justify-center rounded-full border border-amber-400/60 text-amber-200 px-4 py-1.5 text-xs hover:bg-amber-500/10 transition-colors"
        >
          Flag as needs clarification
        </button>
      </div>
    </div>
  );
}

function BillingTab({
  billAmount,
  billingInput,
  onBillingInputChange,
  onCreateBill,
  onMarkPaid,
  creating,
  error,
}: {
  billAmount: number | null;
  billingInput: string;
  onBillingInputChange: (value: string) => void;
  onCreateBill: () => void;
  onMarkPaid: () => void;
  creating?: boolean;
  error?: string | null;
}) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-slate-300">
        Set the bill amount for this prescription. This will create a payment request
        that the patient can pay using USDC.
      </p>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative md:flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            $
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={billingInput}
            onChange={(e) => onBillingInputChange(e.target.value)}
            disabled={creating}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-7 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Amount in USDC"
          />
        </div>
        <button
          onClick={onCreateBill}
          disabled={creating}
          className="inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-950 px-4 py-2.5 text-xs font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? "Creating..." : billAmount ? "Update bill" : "Create bill"}
        </button>
        <button
          onClick={onMarkPaid}
          disabled={!billAmount || creating}
          className="inline-flex items-center justify-center rounded-xl border border-emerald-400/70 text-emerald-200 px-4 py-2.5 text-xs font-medium hover:bg-emerald-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark as paid
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}

      {billAmount && (
        <p className="text-xs text-slate-400">
          Current bill:{" "}
          <span className="text-emerald-300 font-medium">
            {billAmount} USDC
          </span>
        </p>
      )}
    </div>
  );
}

function FulfillmentTab({
  fulfillmentMethod,
  onChangeMethod,
  deliveryForm,
  onChangeField,
  onCreateFulfillment,
}: {
  fulfillmentMethod: FulfillmentMethod;
  onChangeMethod: (m: FulfillmentMethod) => void;
  deliveryForm: DeliveryFormState;
  onChangeField: (field: keyof DeliveryFormState, value: string) => void;
  onCreateFulfillment: () => void;
}) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-300">
        Choose pickup or delivery. When you confirm, a fulfillment JSON payload
        is built and logged to the console so you can later mint that data on
        chain.
      </p>

      <div className="inline-flex rounded-full bg-slate-950 border border-slate-700 p-1 text-xs">
        <button
          type="button"
          onClick={() => onChangeMethod("Pickup")}
          className={`px-3 py-1.5 rounded-full transition-all ${
            fulfillmentMethod === "Pickup"
              ? "bg-slate-100 text-slate-950 font-medium shadow-sm"
              : "text-slate-400 hover:text-slate-100"
          }`}
        >
          Pickup
        </button>
        <button
          type="button"
          onClick={() => onChangeMethod("Delivery")}
          className={`px-3 py-1.5 rounded-full transition-all ${
            fulfillmentMethod === "Delivery"
              ? "bg-slate-100 text-slate-950 font-medium shadow-sm"
              : "text-slate-400 hover:text-slate-100"
          }`}
        >
          Delivery
        </button>
      </div>

      {fulfillmentMethod === "Delivery" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-2">
            <LabeledInput
              label="Contact name"
              value={deliveryForm.contactName}
              onChange={(v) => onChangeField("contactName", v)}
            />
            <LabeledInput
              label="Phone"
              value={deliveryForm.contactPhone}
              onChange={(v) => onChangeField("contactPhone", v)}
            />
            <LabeledInput
              label="Address line 1"
              value={deliveryForm.addressLine1}
              onChange={(v) => onChangeField("addressLine1", v)}
            />
            <LabeledInput
              label="Address line 2"
              value={deliveryForm.addressLine2}
              onChange={(v) => onChangeField("addressLine2", v)}
            />
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput
                label="City"
                value={deliveryForm.city}
                onChange={(v) => onChangeField("city", v)}
              />
              <LabeledInput
                label="State"
                value={deliveryForm.state}
                onChange={(v) => onChangeField("state", v)}
              />
            </div>
            <LabeledInput
              label="Postal code"
              value={deliveryForm.postalCode}
              onChange={(v) => onChangeField("postalCode", v)}
            />
            <LabeledTextarea
              label="Notes"
              value={deliveryForm.notes}
              onChange={(v) => onChangeField("notes", v)}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Pickup selected. Use your existing in-store flow; this app will simply
          mark the prescription as completed.
        </p>
      )}

      <button
        onClick={onCreateFulfillment}
        className="inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-950 px-5 py-2.5 text-xs font-semibold hover:bg-slate-200 transition-all"
      >
        {fulfillmentMethod === "Delivery"
          ? "Create delivery order (log JSON)"
          : "Complete via pickup"}
      </button>
    </div>
  );
}

function TimelineTab({
  events,
  status,
}: {
  events: TimelineEvent[];
  status: PrescriptionStatus;
}) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-slate-300">
        Activity history for this prescription. Later this can be backed by
        on-chain events or a backend audit log.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-xs text-slate-500">
            No events recorded yet. As you work this prescription, updates will
            appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-xs">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-slate-200">{e.label}</p>
                  <p className="text-[11px] text-slate-500">{e.timestamp}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        Current status: {status}. This will eventually be synced with
        blockchain/DB state.
      </p>
    </div>
  );
}

/* Small helper inputs */

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-slate-300">{label}</span>
      <input
        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-slate-300">{label}</span>
      <textarea
        rows={3}
        className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 transition-all resize-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

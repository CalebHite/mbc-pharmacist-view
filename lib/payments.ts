import { createWalletClient, createPublicClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, avalancheFuji } from "viem/chains";
import axios from "axios";

// ============ Configuration Constants ============

// Contract Addresses (Testnet)
const ETHEREUM_SEPOLIA_USDC = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";
const ETHEREUM_SEPOLIA_TOKEN_MESSENGER =
  "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa";
const AVALANCHE_FUJI_MESSAGE_TRANSMITTER =
  "0xe737e5cebeeba77efe34d4aa090756590b1ce275";

// Chain-specific Parameters
const ETHEREUM_SEPOLIA_DOMAIN = 0; // Source domain ID for Ethereum Sepolia testnet
const AVALANCHE_FUJI_DOMAIN = 1; // Destination domain ID for Avalanche Fuji testnet

// CCTP API endpoint
const CCTP_API_URL = "https://iris-api-sandbox.circle.com/v2/messages";

// ============ Types ============

export interface USDCTransferParams {
  privateKey: string;
  destinationAddress: string;
  amount: bigint; // Amount in 10^6 subunits (e.g., 1_000_000n = 1 USDC)
  maxFee?: bigint; // Max fee in 10^6 subunits (default: 500n = 0.0005 USDC)
  sourceChain?: "ethereum-sepolia";
  destinationChain?: "avalanche-fuji";
  minFinalityThreshold?: number; // Default: 1000 for Fast Transfer
}

export interface TransferResult {
  approvalTx?: string;
  burnTx: string;
  attestation?: any;
  mintTx?: string;
  success: boolean;
  error?: string;
}

// ============ Helper Functions ============

function formatAddressToBytes32(address: string): string {
  // Remove '0x' prefix if present and pad to 32 bytes
  const addressWithoutPrefix = address.startsWith("0x") ? address.slice(2) : address;
  return `0x000000000000000000000000${addressWithoutPrefix}`;
}

// ============ Core Transfer Functions ============

/**
 * Approves USDC spending for the TokenMessenger contract
 */
async function approveUSDC(
  client: ReturnType<typeof createWalletClient>,
  amount: bigint
): Promise<`0x${string}`> {
  console.log("Approving USDC transfer...");
  // @ts-ignore - Wallet client account is guaranteed to exist when created with account parameter
  const approveTx = await client.sendTransaction({
    to: ETHEREUM_SEPOLIA_USDC as `0x${string}`,
    data: encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "approve",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
      ],
      functionName: "approve",
      args: [ETHEREUM_SEPOLIA_TOKEN_MESSENGER as `0x${string}`, amount],
    }),
  });
  console.log(`USDC Approval Tx: ${approveTx}`);
  return approveTx;
}

/**
 * Burns USDC on the source chain (Ethereum Sepolia)
 */
async function burnUSDC(
  client: ReturnType<typeof createWalletClient>,
  params: USDCTransferParams
): Promise<`0x${string}`> {
  console.log("Burning USDC on Ethereum Sepolia...");
  
  const destinationAddressBytes32 = formatAddressToBytes32(params.destinationAddress) as `0x${string}`;
  const destinationCallerBytes32 =
    "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`; // Empty bytes32 allows any address to call receiveMessage()
  const maxFee = params.maxFee || 500n;
  const minFinalityThreshold = params.minFinalityThreshold || 1000;

  // @ts-ignore - Wallet client account is guaranteed to exist when created with account parameter
  const burnTx = await client.sendTransaction({
    to: ETHEREUM_SEPOLIA_TOKEN_MESSENGER as `0x${string}`,
    data: encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "depositForBurn",
          stateMutability: "nonpayable",
          inputs: [
            { name: "amount", type: "uint256" },
            { name: "destinationDomain", type: "uint32" },
            { name: "mintRecipient", type: "bytes32" },
            { name: "burnToken", type: "address" },
            { name: "destinationCaller", type: "bytes32" },
            { name: "maxFee", type: "uint256" },
            { name: "minFinalityThreshold", type: "uint32" },
          ],
          outputs: [],
        },
      ],
      functionName: "depositForBurn",
      args: [
        params.amount,
        AVALANCHE_FUJI_DOMAIN,
        destinationAddressBytes32,
        ETHEREUM_SEPOLIA_USDC as `0x${string}`,
        destinationCallerBytes32,
        maxFee,
        minFinalityThreshold,
      ],
    }),
  });
  console.log(`Burn Tx: ${burnTx}`);
  return burnTx;
}

/**
 * Retrieves the attestation from Circle's API
 */
async function retrieveAttestation(transactionHash: `0x${string}`): Promise<any> {
  console.log("Retrieving attestation...");
  const url = `${CCTP_API_URL}/${ETHEREUM_SEPOLIA_DOMAIN}?transactionHash=${transactionHash}`;
  
  while (true) {
    try {
      const response = await axios.get(url);
      if (response.status === 404) {
        console.log("Waiting for attestation...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      if (response.data?.messages?.[0]?.status === "complete") {
        console.log("Attestation retrieved successfully!");
        return response.data.messages[0];
      }
      console.log("Waiting for attestation...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error("Rate limit exceeded. Waiting 5 minutes...");
        await new Promise((resolve) => setTimeout(resolve, 300000)); // Wait 5 minutes
        continue;
      }
      if (error.response?.status === 404) {
        console.log("Waiting for attestation...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      console.error("Error fetching attestation:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Mints USDC on the destination chain (Avalanche Fuji)
 */
async function mintUSDC(
  client: ReturnType<typeof createWalletClient>,
  attestation: any
): Promise<`0x${string}`> {
  console.log("Minting USDC on Avalanche Fuji...");
  // @ts-ignore - Wallet client account is guaranteed to exist when created with account parameter
  const mintTx = await client.sendTransaction({
    to: AVALANCHE_FUJI_MESSAGE_TRANSMITTER as `0x${string}`,
    data: encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "receiveMessage",
          stateMutability: "nonpayable",
          inputs: [
            { name: "message", type: "bytes" },
            { name: "attestation", type: "bytes" },
          ],
          outputs: [],
        },
      ],
      functionName: "receiveMessage",
      args: [attestation.message as `0x${string}`, attestation.attestation as `0x${string}`],
    }),
  });
  console.log(`Mint Tx: ${mintTx}`);
  return mintTx;
}

/**
 * Creates a USDC transfer request from Ethereum Sepolia to Avalanche Fuji using CCTP
 * 
 * @param params - Transfer parameters including private key, destination address, and amount
 * @returns Promise with transfer result including transaction hashes
 * 
 * @example
 * ```typescript
 * const result = await createUSDCTransferRequest({
 *   privateKey: process.env.PRIVATE_KEY!,
 *   destinationAddress: "0x...",
 *   amount: 1_000_000n, // 1 USDC
 * });
 * ```
 */
export async function createUSDCTransferRequest(
  params: USDCTransferParams
): Promise<TransferResult> {
  try {
    // Validate inputs
    if (!params.privateKey) {
      throw new Error("Private key is required");
    }
    if (!params.destinationAddress) {
      throw new Error("Destination address is required");
    }
    if (!params.amount || params.amount <= 0n) {
      throw new Error("Amount must be greater than 0");
    }

    // Setup account and clients
    const privateKey = params.privateKey.startsWith("0x")
      ? params.privateKey
      : `0x${params.privateKey}`;
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const sepoliaWalletClient = createWalletClient({
      chain: sepolia,
      transport: http(),
      account,
    });

    const avalancheWalletClient = createWalletClient({
      chain: avalancheFuji,
      transport: http(),
      account,
    });

    // Create public clients for waiting for transaction receipts
    const sepoliaPublicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    const avalanchePublicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(),
    });

    // Step 1: Approve USDC (set max allowance for efficiency)
    const approvalAmount = 10_000_000_000n; // 10,000 USDC max allowance
    const approvalTx = await approveUSDC(sepoliaWalletClient, approvalAmount);

    // Wait for approval transaction to be mined
    await sepoliaPublicClient.waitForTransactionReceipt({
      hash: approvalTx,
    });

    // Step 2: Burn USDC on source chain
    const burnTx = await burnUSDC(sepoliaWalletClient, params);

    // Wait for burn transaction to be mined
    await sepoliaPublicClient.waitForTransactionReceipt({
      hash: burnTx,
    });

    // Step 3: Retrieve attestation
    const attestation = await retrieveAttestation(burnTx);

    // Step 4: Mint USDC on destination chain
    const mintTx = await mintUSDC(avalancheWalletClient, attestation);

    // Wait for mint transaction to be mined
    await avalanchePublicClient.waitForTransactionReceipt({
      hash: mintTx,
    });

    return {
      approvalTx,
      burnTx,
      attestation,
      mintTx,
      success: true,
    };
  } catch (error: any) {
    console.error("USDC transfer error:", error);
    return {
      burnTx: "",
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Helper function to convert USDC amount to bigint (6 decimals)
 * 
 * @param usdcAmount - Amount in USDC (e.g., 1.5 for 1.5 USDC)
 * @returns BigInt representation in 10^6 subunits
 * 
 * @example
 * ```typescript
 * const amount = usdcToBigInt(1.5); // Returns 1_500_000n
 * ```
 */
export function usdcToBigInt(usdcAmount: number): bigint {
  return BigInt(Math.floor(usdcAmount * 1_000_000));
}

/**
 * Helper function to convert bigint amount to USDC (6 decimals)
 * 
 * @param amount - Amount in 10^6 subunits
 * @returns USDC amount as number
 * 
 * @example
 * ```typescript
 * const usdc = bigIntToUSDC(1_500_000n); // Returns 1.5
 * ```
 */
export function bigIntToUSDC(amount: bigint): number {
  return Number(amount) / 1_000_000;
}

/**
 * Creates a payment request for billing
 * This initiates a USDC transfer FROM the patient TO the pharmacist
 * 
 * @param params - Payment request parameters
 * @returns Promise with payment request result
 */
export interface PaymentRequestParams {
  patientPrivateKey: string; // Patient's private key to initiate payment
  pharmacistAddress: string; // Pharmacist's address (destination)
  amount: bigint; // Amount in 10^6 subunits
  billId?: string; // Optional bill ID for tracking
}

export interface PaymentRequestResult {
  success: boolean;
  approvalTx?: string;
  burnTx?: string;
  mintTx?: string;
  error?: string;
  message?: string;
}

/**
 * Creates a payment request that transfers USDC from patient to pharmacist
 * Note: This requires the patient's private key to initiate the transfer
 */
export async function createPaymentRequest(
  params: PaymentRequestParams
): Promise<PaymentRequestResult> {
  try {
    // Validate inputs
    if (!params.patientPrivateKey) {
      throw new Error("Patient private key is required");
    }
    if (!params.pharmacistAddress) {
      throw new Error("Pharmacist address is required");
    }
    if (!params.amount || params.amount <= 0n) {
      throw new Error("Amount must be greater than 0");
    }

    // Validate pharmacist address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(params.pharmacistAddress)) {
      throw new Error("Invalid pharmacist address format");
    }

    // Create transfer request FROM patient TO pharmacist
    // The patient's address will be derived from their private key
    const transferResult = await createUSDCTransferRequest({
      privateKey: params.patientPrivateKey,
      destinationAddress: params.pharmacistAddress,
      amount: params.amount,
    });

    if (!transferResult.success) {
      return {
        success: false,
        error: transferResult.error || "Failed to create payment request",
      };
    }

    return {
      success: true,
      approvalTx: transferResult.approvalTx,
      burnTx: transferResult.burnTx,
      mintTx: transferResult.mintTx,
      message: `Payment request created successfully. Bill ID: ${params.billId || 'N/A'}`,
    };
  } catch (error: any) {
    console.error("Payment request creation error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * Creates a payment request instruction (without initiating transfer)
 * This is used when we don't have the patient's private key
 * The instruction can be fulfilled by the patient later
 */
export interface PaymentInstruction {
  billId: string;
  pharmacistAddress: string;
  patientAddress: string;
  amount: bigint;
  amountInUSDC: number;
  createdAt: string;
  status: "pending" | "completed";
  transferDetails?: {
    approvalTx?: string;
    burnTx?: string;
    mintTx?: string;
  };
}

export function createPaymentInstruction(
  billId: string,
  pharmacistAddress: string,
  patientAddress: string,
  amountInUSDC: number
): PaymentInstruction {
  return {
    billId,
    pharmacistAddress,
    patientAddress,
    amount: usdcToBigInt(amountInUSDC),
    amountInUSDC,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
}


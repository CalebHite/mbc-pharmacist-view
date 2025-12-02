// readPrescriptionNFT.ts
import { ethers } from "ethers";

export async function readPrescriptionNFT(
  contractAddress: string,
  tokenId: number
) {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");

  // Minimal ABI for your NFT
  const abi = [
    "function prescriptions(uint256) view returns (string medication,string dosage,string instructions)",
    "function tokenURI(uint256) view returns (string)",
    "function ownerOf(uint256) view returns (address)"
  ];

  const nft = new ethers.Contract(contractAddress, abi, provider);

  console.log(`\nReading NFT ${tokenId} from contract ${contractAddress}...\n`);

  // Check existence
  try {
    const owner = await nft.ownerOf(tokenId);
    console.log("Owner:", owner);
  } catch (err) {
    console.error("❌ Token does not exist or ownerOf reverted.");
    return;
  }

  // Read struct
  try {
    const p = await nft.prescriptions(tokenId);
    console.log("\nPrescription struct:");
    console.log("Medication:", p.medication);
    console.log("Dosage:", p.dosage);
    console.log("Instructions:", p.instructions);
  } catch (err) {
    console.error("❌ prescriptions() call failed:", err);
  }

  // Read tokenURI
  try {
    const uri = await nft.tokenURI(tokenId);
    console.log("\ntokenURI:", uri);

    // Decode data:application/json
    if (uri.startsWith("data:application/json,")) {
      const json = JSON.parse(uri.replace("data:application/json,", ""));
      console.log("\nDecoded JSON Metadata:", json);
    }
  } catch (err) {
    console.error("❌ tokenURI() call failed:", err);
  }
}

// Example call:
readPrescriptionNFT(
  "0x51fCc50146E3920f0ce2a91b59B631235Aa52dd3", // your contract
  1                                              // tokenId
);

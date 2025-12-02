import { ethers } from "ethers";

export async function readMedicalPassportNFT(
  contractAddress: string,
  tokenId: number
) {
  // Connect to Sepolia via RPC
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");

  // Minimal ABI for MedicalPassportOnChain
  const abi = [
    // The mapping accessor
    "function passports(uint256) view returns (string name,string contactInfo,string dateOfBirth,string socialSecurityNumber,string medicalHistory,string pastDiagnoses,string familyHistory,string allergies,string currentMedications,string treatmentRegimens,string vitalSigns)",
    "function tokenURI(uint256) view returns (string)",
    "function ownerOf(uint256) view returns (address)"
  ];

  const nft = new ethers.Contract(contractAddress, abi, provider);

  // Check if token exists
  try {
    const owner = await nft.ownerOf(tokenId);
    
    // Read the MedicalPassport struct
    const p = await nft.passports(tokenId);
    
    // Read tokenURI and decode JSON
    const uri = await nft.tokenURI(tokenId);
    let metadata = null;
    
    if (uri.startsWith("data:application/json,")) {
      metadata = JSON.parse(uri.replace("data:application/json,", ""));
    }

    return {
      tokenId,
      owner,
      name: p.name,
      contactInfo: p.contactInfo,
      dateOfBirth: p.dateOfBirth,
      socialSecurityNumber: p.socialSecurityNumber,
      medicalHistory: p.medicalHistory,
      pastDiagnoses: p.pastDiagnoses,
      familyHistory: p.familyHistory,
      allergies: p.allergies,
      currentMedications: p.currentMedications,
      treatmentRegimens: p.treatmentRegimens,
      vitalSigns: p.vitalSigns,
      metadata
    };
  } catch (err) {
    return null;
  }
}

export async function readAllMedicalPassportNFTs(contractAddress: string) {
  const results = [];
  
  for (let tokenId = 1; tokenId <= 10; tokenId++) {
    const data = await readMedicalPassportNFT(contractAddress, tokenId);
    if (data) {
      results.push(data);
    }
  }
  
  return results;
}

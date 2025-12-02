// lib/pharmacy/types.ts
export type PrescriptionNFT = {
  tokenId: number;
  owner: string;
  medication: string;
  dosage: string;
  instructions: string;
  metadata: any;
};

export type PrescriptionStatus =
  | "New"
  | "Pending Payment"
  | "Preparing"
  | "Out for Delivery"
  | "Completed";

export type FulfillmentMethod = "Pickup" | "Delivery";

export type DeliveryFormState = {
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

export const EMPTY_DELIVERY_FORM: DeliveryFormState = {
  contactName: "",
  contactPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  notes: "",
};

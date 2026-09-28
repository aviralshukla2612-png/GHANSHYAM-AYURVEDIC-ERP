// GST Configuration and Statutory Compliance Rules
// Ghanshyam Ayurvedic ERP - GST Engine Config

export interface GSTRulesConfig {
  companyState: string;
  companyStateCode: string;
  companyGstin: string;
  // B2C Large Threshold: Changed to ₹1,00,000 from August 2024 return period onwards (earlier ₹2,50,000)
  b2cLargeThreshold: number;
  table12SplitRequired: boolean; // Table 12 split into B2B & B2C HSN from May 2025 return period
  table13Mandatory: boolean;     // Table 13 mandatory document series from May 2025
  defaultHsnCode: string;
  defaultGstRate: number;
}

export const CURRENT_GST_CONFIG: GSTRulesConfig = {
  companyState: 'Gujarat',
  companyStateCode: '24',
  companyGstin: '24AAAAG1234H1Z5',
  b2cLargeThreshold: 100000, // ₹1,00,000 as per Aug 2024 GST Council notification
  table12SplitRequired: true, // Split B2B and B2C HSN summary as per May 2025 update
  table13Mandatory: true,
  defaultHsnCode: '30049011', // Ayurvedic Churna / Medicines
  defaultGstRate: 12.0,
};

// Helper for exact currency rounding (avoids JS float arithmetic errors)
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

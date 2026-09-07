export interface DepreciationScheduleItem {
  period: string; // e.g. "2026-01"
  year: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  bookValue: number;
  isPosted: boolean;
}

export interface FixedAsset {
  id: string;
  assetCode: string;
  name: string;
  category: "equipment" | "vehicle" | "real_estate" | "furniture" | "it_hardware";
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: "straight_line" | "declining_balance";
  accumulatedDepreciation: number;
  currentBookValue: number;
  status: "active" | "fully_depreciated" | "disposed";
  schedule: DepreciationScheduleItem[];
}

export interface CreateFixedAssetDTO {
  assetCode: string;
  name: string;
  category: "equipment" | "vehicle" | "real_estate" | "furniture" | "it_hardware";
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: "straight_line" | "declining_balance";
}

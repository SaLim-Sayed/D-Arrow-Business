import { useState, useMemo } from "react";
import type { FixedAsset, CreateFixedAssetDTO, DepreciationScheduleItem } from "../schemas/fixed-asset";

const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  {
    id: "FA-001",
    assetCode: "AST-V101",
    name: "سيارة نقل توصيل - تويوتا هايس",
    category: "vehicle",
    purchaseDate: "2024-01-15",
    purchaseCost: 120000,
    salvageValue: 20000,
    usefulLifeYears: 5,
    depreciationMethod: "straight_line",
    accumulatedDepreciation: 40000,
    currentBookValue: 80000,
    status: "active",
    schedule: [
      { period: "2024", year: 2024, depreciationAmount: 20000, accumulatedDepreciation: 20000, bookValue: 100000, isPosted: true },
      { period: "2025", year: 2025, depreciationAmount: 20000, accumulatedDepreciation: 40000, bookValue: 80000, isPosted: true },
      { period: "2026", year: 2026, depreciationAmount: 20000, accumulatedDepreciation: 60000, bookValue: 60000, isPosted: false },
      { period: "2027", year: 2027, depreciationAmount: 20000, accumulatedDepreciation: 80000, bookValue: 40000, isPosted: false },
      { period: "2028", year: 2028, depreciationAmount: 20000, accumulatedDepreciation: 100000, bookValue: 20000, isPosted: false },
    ],
  },
  {
    id: "FA-002",
    assetCode: "AST-IT202",
    name: "خوادم وحواسيب مركزية للمكتب الرئيسي",
    category: "it_hardware",
    purchaseDate: "2025-06-01",
    purchaseCost: 45000,
    salvageValue: 5000,
    usefulLifeYears: 4,
    depreciationMethod: "straight_line",
    accumulatedDepreciation: 10000,
    currentBookValue: 35000,
    status: "active",
    schedule: [
      { period: "2025", year: 2025, depreciationAmount: 10000, accumulatedDepreciation: 10000, bookValue: 35000, isPosted: true },
      { period: "2026", year: 2026, depreciationAmount: 10000, accumulatedDepreciation: 20000, bookValue: 25000, isPosted: false },
      { period: "2027", year: 2027, depreciationAmount: 10000, accumulatedDepreciation: 30000, bookValue: 15000, isPosted: false },
      { period: "2028", year: 2028, depreciationAmount: 10000, accumulatedDepreciation: 40000, bookValue: 5000, isPosted: false },
    ],
  },
];

export function useFixedAssets() {
  const [assets, setAssets] = useState<FixedAsset[]>(INITIAL_FIXED_ASSETS);

  const stats = useMemo(() => {
    const totalCost = assets.reduce((acc, curr) => acc + curr.purchaseCost, 0);
    const totalAccumulated = assets.reduce((acc, curr) => acc + curr.accumulatedDepreciation, 0);
    const totalBookValue = assets.reduce((acc, curr) => acc + curr.currentBookValue, 0);
    return {
      totalCost,
      totalAccumulated,
      totalBookValue,
      count: assets.length,
    };
  }, [assets]);

  const addAsset = (dto: CreateFixedAssetDTO) => {
    const annualDep = (dto.purchaseCost - dto.salvageValue) / dto.usefulLifeYears;
    const startYear = new Date(dto.purchaseDate).getFullYear();
    const schedule: DepreciationScheduleItem[] = [];

    let acc = 0;
    for (let i = 0; i < dto.usefulLifeYears; i++) {
      const year = startYear + i;
      acc += annualDep;
      schedule.push({
        period: `${year}`,
        year,
        depreciationAmount: annualDep,
        accumulatedDepreciation: acc,
        bookValue: dto.purchaseCost - acc,
        isPosted: false,
      });
    }

    const newAsset: FixedAsset = {
      ...dto,
      id: `FA-${Date.now()}`,
      accumulatedDepreciation: 0,
      currentBookValue: dto.purchaseCost,
      status: "active",
      schedule,
    };

    setAssets((prev) => [newAsset, ...prev]);
  };

  const postDepreciation = (assetId: string, year: number) => {
    setAssets((prev) =>
      prev.map((asset) => {
        if (asset.id !== assetId) return asset;

        let addedDep = 0;
        const updatedSchedule = asset.schedule.map((item) => {
          if (item.year === year && !item.isPosted) {
            addedDep = item.depreciationAmount;
            return { ...item, isPosted: true };
          }
          return item;
        });

        const newAccumulated = asset.accumulatedDepreciation + addedDep;
        const newBookValue = Math.max(asset.salvageValue, asset.currentBookValue - addedDep);

        return {
          ...asset,
          accumulatedDepreciation: newAccumulated,
          currentBookValue: newBookValue,
          status: newBookValue <= asset.salvageValue ? "fully_depreciated" : "active",
          schedule: updatedSchedule,
        };
      })
    );
  };

  return {
    assets,
    stats,
    addAsset,
    postDepreciation,
  };
}

import { useState } from "react";
import type { FiscalYear, LockDateSettings } from "../schemas/fiscal-closing";

const MOCK_FISCAL_YEARS: FiscalYear[] = [
  {
    year: 2024,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "closed",
    totalRevenue: 850000,
    totalExpense: 620000,
    netProfitLoss: 230000,
    closingJournalId: "JNL-CLOSING-2024",
    closedAt: "2025-01-10",
  },
  {
    year: 2025,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    status: "closed",
    totalRevenue: 1200000,
    totalExpense: 890000,
    netProfitLoss: 310000,
    closingJournalId: "JNL-CLOSING-2025",
    closedAt: "2026-01-15",
  },
  {
    year: 2026,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "open",
    totalRevenue: 450000,
    totalExpense: 280000,
    netProfitLoss: 170000,
  },
];

export function useFiscalClosing() {
  const [years, setYears] = useState<FiscalYear[]>(MOCK_FISCAL_YEARS);
  const [lockSettings, setLockSettings] = useState<LockDateSettings>({
    lockDate: "2025-12-31",
    lockReason: "تم اعتماد القوائم المالية للسنة المالية 2025 والإقرار الضريبي الرابع",
    isLocked: true,
  });

  const updateLockDate = (date: string, reason: string) => {
    setLockSettings({
      lockDate: date,
      lockReason: reason,
      isLocked: true,
    });
  };

  const removeLockDate = () => {
    setLockSettings({
      lockDate: undefined,
      lockReason: undefined,
      isLocked: false,
    });
  };

  const closeFiscalYear = (yearNum: number) => {
    setYears((prev) =>
      prev.map((fy) => {
        if (fy.year !== yearNum) return fy;
        return {
          ...fy,
          status: "closed",
          closingJournalId: `JNL-CLOSING-${yearNum}`,
          closedAt: new Date().toISOString().slice(0, 10),
        };
      })
    );
  };

  return {
    years,
    lockSettings,
    updateLockDate,
    removeLockDate,
    closeFiscalYear,
  };
}

import type { Account, AccountSubType } from "../schemas/account";
import { ZAKAT_RATE } from "../schemas/zakat";

// Fixed assets are excluded from the zakat base — zakat applies to assets held
// for trade/liquidity, not long-term productive assets.
const NON_ELIGIBLE_ASSET_SUB_TYPES: AccountSubType[] = ["fixed_asset"];

// Only obligations due within the zakat period reduce the base; long-term
// liabilities are excluded per standard zakat treatment.
const CURRENT_LIABILITY_SUB_TYPES: AccountSubType[] = [
  "current_liability",
  "accounts_payable",
  "credit_card",
  "tax_payable",
  "accrued_expenses",
  "other_current_liability",
  "zakat_payable",
];

export function sumEligibleZakatAssets(accounts: Account[]): number {
  return accounts
    .filter(
      (a) =>
        a.type === "asset" &&
        !NON_ELIGIBLE_ASSET_SUB_TYPES.includes(a.subType)
    )
    .reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
}

export function sumCurrentLiabilities(accounts: Account[]): number {
  return accounts
    .filter(
      (a) => a.type === "liability" && CURRENT_LIABILITY_SUB_TYPES.includes(a.subType)
    )
    .reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
}

export interface ZakatCalculation {
  eligibleAssets: number;
  currentLiabilities: number;
  zakatBase: number;
  rate: number;
  zakatDue: number;
}

export function computeZakatBase(
  accounts: Account[],
  rate: number = ZAKAT_RATE
): ZakatCalculation {
  const eligibleAssets = sumEligibleZakatAssets(accounts);
  const currentLiabilities = sumCurrentLiabilities(accounts);
  const zakatBase = Math.max(0, eligibleAssets - currentLiabilities);
  const zakatDue = zakatBase * rate;

  return { eligibleAssets, currentLiabilities, zakatBase, rate, zakatDue };
}

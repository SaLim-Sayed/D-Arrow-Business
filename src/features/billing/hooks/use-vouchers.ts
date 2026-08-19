import { useQuery } from "@tanstack/react-query";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import type { Voucher, VoucherType } from "../schemas/voucher";
import { convertTimestampsToDates } from "../utils/timestamp";

export function useVouchers(type?: VoucherType) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "vouchers", companyId, type ?? "all"],
    queryFn: async () => {
      const res = await BillingService.vouchers.getAll(companyId!);
      const data = (convertTimestampsToDates(res.data) as Voucher[]).map(
        (voucher) => ({
          ...voucher,
          date:
            voucher.date instanceof Date
              ? voucher.date
              : new Date(voucher.date as unknown as string),
        })
      );
      const filtered = type
        ? data.filter((v) => v.voucherType === type)
        : data;
      return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    enabled: !!companyId,
  });
}

export function useVoucher(id?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "vouchers", companyId, id],
    queryFn: async () => {
      const res = await BillingService.vouchers.getById(companyId!, id!);
      const voucher = convertTimestampsToDates(res.data) as Voucher;
      return {
        ...voucher,
        date:
          voucher.date instanceof Date
            ? voucher.date
            : new Date(voucher.date as unknown as string),
      };
    },
    enabled: !!id && !!companyId,
  });
}

import { useQuery } from "@tanstack/react-query";
import type { BillingSettings } from "../schemas/settings";

const mockSettings: BillingSettings = {
  companyProfile: {
    name: "Acme Corp",
    address: "123 Main St",
    email: "billing@acme.com",
  },
  invoiceSequence: {
    prefix: "INV-",
    nextNumber: 1001,
    padding: 4,
  },
  currencies: [
    { code: "USD", symbol: "$", name: "US Dollar", isDefault: true },
    { code: "EUR", symbol: "€", name: "Euro", isDefault: false },
  ],
  taxes: [
    { id: "tax1", name: "VAT", rate: 15, isDefault: true },
    { id: "tax2", name: "Zero Tax", rate: 0, isDefault: false },
  ],
  paymentMethods: [
    { id: "pm1", name: "Bank Transfer", isActive: true },
    { id: "pm2", name: "Cash", isActive: true },
  ],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useBillingSettings() {
  return useQuery({
    queryKey: ["billing", "settings"],
    queryFn: async () => {
      await delay(300);
      return mockSettings;
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { toast } from "sonner";

export function useSeedBillingDataMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company selected");
      
      const { create: createProduct } = BillingService.products;
      const { create: createInvoice } = BillingService.invoices;
      const { create: createBill } = BillingService.bills;

      // 1. Seed Products
      const p1 = await createProduct(companyId, {
        name: "MacBook Pro M3",
        type: "goods",
        price: 1999,
        sku: "MBP-M3-14",
        isActive: true,
      });
      
      const p2 = await createProduct(companyId, {
        name: "Consulting Hour",
        type: "service",
        price: 150,
        sku: "CONS-HR",
        isActive: true,
      });

      // 2. Seed Invoices
      await createInvoice(companyId, {
        invoiceNumber: "INV-1001",
        customerId: "cust_1", // Needs a real customer ideally, but dummy is fine
        status: "draft",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        currency: "USD",
        items: [
          { description: "Website Redesign", quantity: 1, unitPrice: 1500, total: 1500, discount: 0, taxRate: 0 }
        ],
        subTotal: 1500,
        totalTax: 0,
        totalDiscount: 0,
        grandTotal: 1500,
      });

      await createInvoice(companyId, {
        invoiceNumber: "INV-1002",
        customerId: "cust_2",
        status: "sent",
        issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        currency: "USD",
        items: [
          { productId: p1.data.id, description: "MacBook Pro M3", quantity: 2, unitPrice: 1999, total: 3998, discount: 0, taxRate: 0 },
          { productId: p2.data.id, description: "Setup & Config", quantity: 5, unitPrice: 150, total: 750, discount: 0, taxRate: 0 }
        ],
        subTotal: 4748,
        totalTax: 0,
        totalDiscount: 0,
        grandTotal: 4748,
      });

      // 3. Seed Bills
      await createBill(companyId, {
        billNumber: "BILL-2026-001",
        vendorId: "vendor_1",
        status: "open",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currency: "USD",
        items: [
          { description: "Office Rent", accountId: "acc_6000", quantity: 1, unitPrice: 2000, total: 2000, taxRate: 0 }
        ],
        subTotal: 2000,
        totalTax: 0,
        grandTotal: 2000,
      });
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      toast.success("Sample billing data loaded successfully!");
    },
    onError: (error) => {
      console.error("Failed to seed data", error);
      toast.error("Failed to load sample data");
    }
  });
}

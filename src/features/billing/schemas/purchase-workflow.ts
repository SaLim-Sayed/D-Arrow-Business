import { z } from "zod";

/**
 * Purchase Workflow Stages - Odoo-style
 * Purchase Order → Receive Products → Vendor Bill → Journal Entry → Vendor Payment → Bank Reconciliation
 */

export const PURCHASE_WORKFLOW_STAGES = [
  "purchase_order",
  "receipt",
  "vendor_bill",
  "journal_entry",
  "vendor_payment",
  "reconciliation",
  "completed",
] as const;

export const purchaseOrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().min(1, "Order number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  status: z.enum(["draft", "confirmed", "received", "billed", "cancelled"]).default("draft"),
  
  // Dates
  orderDate: z.date(),
  receiptDate: z.date().optional(),
  billDate: z.date().optional(),
  
  // Items
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).default(0),
    discount: z.number().min(0).default(0),
    total: z.number().min(0),
    receivedQuantity: z.number().min(0).default(0),
    billedQuantity: z.number().min(0).default(0),
    accountId: z.string().optional(), // Expense account for this item
  })).min(1, "At least one item is required"),
  
  // Financials
  subTotal: z.number().min(0),
  totalTax: z.number().min(0),
  totalDiscount: z.number().min(0),
  grandTotal: z.number().min(0),
  amountBilled: z.number().min(0).default(0),
  
  // Currency
  currency: z.string().default("USD"),
  
  // References
  receiptId: z.string().optional(),
  billId: z.string().optional(),
  journalEntryId: z.string().optional(),
  
  // Notes
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  
  // Metadata
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
});

export const receiptSchema = z.object({
  id: z.string().optional(),
  receiptNumber: z.string().min(1, "Receipt number is required"),
  purchaseOrderId: z.string().min(1, "Purchase order is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  status: z.enum(["draft", "confirmed", "done", "cancelled"]).default("draft"),
  
  // Dates
  receiptDate: z.date(),
  scheduledDate: z.date().optional(),
  
  // Items
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    orderedQuantity: z.number().min(1),
    receivedQuantity: z.number().min(0),
    remainingQuantity: z.number().min(0),
    locationId: z.string().optional(), // Warehouse/location
  })).min(1, "At least one item is required"),
  
  // References
  billId: z.string().optional(),
  
  // Notes
  notes: z.string().optional(),
  
  // Metadata
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
});

export type PurchaseWorkflowStage = typeof PURCHASE_WORKFLOW_STAGES[number];
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
export type CreatePurchaseOrderDTO = Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt">;
export type UpdatePurchaseOrderDTO = Partial<CreatePurchaseOrderDTO>;
export type CreateReceiptDTO = Omit<Receipt, "id" | "createdAt" | "updatedAt">;
export type UpdateReceiptDTO = Partial<CreateReceiptDTO>;

/**
 * Workflow transition rules
 */
export const PURCHASE_WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  purchase_order: ["receipt", "cancelled"],
  receipt: ["vendor_bill", "cancelled"],
  vendor_bill: ["journal_entry", "cancelled"],
  journal_entry: ["vendor_payment", "cancelled"],
  vendor_payment: ["reconciliation", "cancelled"],
  reconciliation: ["completed"],
  completed: [],
  cancelled: [],
};

/**
 * Check if a transition is valid
 */
export function isValidPurchaseTransition(from: string, to: string): boolean {
  const allowed = PURCHASE_WORKFLOW_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

/**
 * Get next possible stages
 */
export function getNextPurchaseStages(current: string): string[] {
  return PURCHASE_WORKFLOW_TRANSITIONS[current] || [];
}

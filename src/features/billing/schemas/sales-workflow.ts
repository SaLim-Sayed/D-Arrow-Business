import { z } from "zod";

/**
 * Sales Workflow Stages - Odoo-style
 * Quotation → Sales Order → Delivery → Invoice → Journal Entry → Payment → Bank Reconciliation
 */

export const SALES_WORKFLOW_STAGES = [
  "quotation",
  "sales_order",
  "delivery",
  "invoice",
  "journal_entry",
  "payment",
  "reconciliation",
  "completed",
] as const;

export const salesOrderSchema = z.object({
  id: z.string().optional(),
  orderNumber: z.string().min(1, "Order number is required"),
  quotationId: z.string().optional(), // If created from quotation
  customerId: z.string().min(1, "Customer is required"),
  status: z.enum(["draft", "confirmed", "delivered", "invoiced", "cancelled"]).default("draft"),
  
  // Dates
  orderDate: z.date(),
  deliveryDate: z.date().optional(),
  invoiceDate: z.date().optional(),
  
  // Items
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).default(0),
    discount: z.number().min(0).default(0),
    total: z.number().min(0),
    deliveredQuantity: z.number().min(0).default(0),
    invoicedQuantity: z.number().min(0).default(0),
  })).min(1, "At least one item is required"),
  
  // Financials
  subTotal: z.number().min(0),
  totalTax: z.number().min(0),
  totalDiscount: z.number().min(0),
  grandTotal: z.number().min(0),
  amountInvoiced: z.number().min(0).default(0),
  
  // Currency
  currency: z.string().default("USD"),
  
  // References
  invoiceId: z.string().optional(),
  deliveryId: z.string().optional(),
  journalEntryId: z.string().optional(),
  
  // Notes
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  
  // Metadata
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
});

export const deliverySchema = z.object({
  id: z.string().optional(),
  deliveryNumber: z.string().min(1, "Delivery number is required"),
  salesOrderId: z.string().min(1, "Sales order is required"),
  customerId: z.string().min(1, "Customer is required"),
  status: z.enum(["draft", "confirmed", "done", "cancelled"]).default("draft"),
  
  // Dates
  deliveryDate: z.date(),
  scheduledDate: z.date().optional(),
  
  // Items
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    orderedQuantity: z.number().min(1),
    deliveredQuantity: z.number().min(0),
    remainingQuantity: z.number().min(0),
    locationId: z.string().optional(), // Warehouse/location
  })).min(1, "At least one item is required"),
  
  // References
  invoiceId: z.string().optional(),
  
  // Notes
  notes: z.string().optional(),
  
  // Metadata
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
});

export type SalesWorkflowStage = typeof SALES_WORKFLOW_STAGES[number];
export type SalesOrder = z.infer<typeof salesOrderSchema>;
export type Delivery = z.infer<typeof deliverySchema>;
export type CreateSalesOrderDTO = Omit<SalesOrder, "id" | "createdAt" | "updatedAt">;
export type UpdateSalesOrderDTO = Partial<CreateSalesOrderDTO>;
export type CreateDeliveryDTO = Omit<Delivery, "id" | "createdAt" | "updatedAt">;
export type UpdateDeliveryDTO = Partial<CreateDeliveryDTO>;

/**
 * Workflow transition rules
 */
export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  quotation: ["sales_order", "cancelled"],
  sales_order: ["delivery", "invoice", "cancelled"],
  delivery: ["invoice", "cancelled"],
  invoice: ["journal_entry", "cancelled"],
  journal_entry: ["payment", "cancelled"],
  payment: ["reconciliation", "cancelled"],
  reconciliation: ["completed"],
  completed: [],
  cancelled: [],
};

/**
 * Check if a transition is valid
 */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = WORKFLOW_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

/**
 * Get next possible stages
 */
export function getNextStages(current: string): string[] {
  return WORKFLOW_TRANSITIONS[current] || [];
}

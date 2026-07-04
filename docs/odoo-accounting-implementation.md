# Odoo-Style Accounting Implementation

## Overview

This implementation provides a comprehensive Odoo-style accounting system that follows double-entry accounting principles and automates financial processes across the organization. The system is designed to automatically generate accounting entries from business operations such as sales, purchases, inventory, and more.

## Core Components Implemented

### 1. Chart of Accounts (`src/features/billing/schemas/account.ts`)

**Enhanced Account Schema:**
- **Account Types**: Asset, Liability, Equity, Income, Expense
- **Account SubTypes**: Detailed classifications including:
  - Assets: Cash, Bank, Accounts Receivable, Inventory, Fixed Assets, Prepaid Expenses
  - Liabilities: Accounts Payable, Tax Payable, Credit Card, Accrued Expenses, Long-term Liabilities
  - Equity: Share Capital, Retained Earnings
  - Income: Sales Revenue, Service Revenue, Other Income
  - Expenses: Cost of Goods Sold, Salary, Rent, Utilities, Operating Expenses
- **New Fields**:
  - `reconcile`: Whether account can be reconciled (bank accounts)
  - `allowManualEntries`: Whether manual journal entries are allowed
  - `deprecated`: Mark deprecated accounts

**Default Chart of Accounts:**
- Pre-configured standard accounts following accounting best practices
- System accounts protected from deletion
- Proper account code ranges (1000-5999)

### 2. Journal Types (`src/features/billing/schemas/journal-type.ts`)

**Journal Types:**
- **Sale**: Customer invoices and sales transactions
- **Purchase**: Vendor bills and purchase transactions
- **Bank**: Bank transactions and payments
- **Cash**: Cash transactions
- **General**: Miscellaneous and adjustment entries
- **Situation**: Opening and closing entries

**Journal Type Features:**
- Default account assignment per journal
- Currency support
- Date variance control
- Account and partner restrictions
- Sequence numbering

### 3. Enhanced Journal Entries (`src/features/billing/schemas/journal.ts`)

**Enhanced Journal Line Schema:**
- `partnerId`: Customer/Vendor ID for tracking
- `taxId`: Tax reference
- `taxAmount`: Tax amount for the line
- `analyticAccountId`: Cost center/department tracking
- `maturityDate`: Due date for payable/receivable lines

**Enhanced Journal Entry Schema:**
- `journalTypeId`: Reference to journal type
- `status`: draft, posted, cancelled (changed from published)
- `sourceType`: Extended to include inventory, payroll, opening, closing
- `partnerId`: Main partner for the entry
- `companyId`: Multi-company support
- `reversalOfId`: Entry reversal tracking
- `postedAt`/`postedBy`: Audit trail

### 4. Sales Workflow (`src/features/billing/schemas/sales-workflow.ts`)

**Sales Workflow Stages:**
```
Quotation → Sales Order → Delivery → Invoice → Journal Entry → Payment → Bank Reconciliation → Completed
```

**Sales Order Schema:**
- Order management with customer reference
- Item tracking (ordered, delivered, invoiced quantities)
- Financial tracking (subTotal, totalTax, amountInvoiced)
- Status management (draft, confirmed, delivered, invoiced, cancelled)
- Links to quotation, delivery, invoice, and journal entry

**Delivery Schema:**
- Delivery management with warehouse/location
- Quantity tracking (ordered, delivered, remaining)
- Status management (draft, confirmed, done, cancelled)
- Link to invoice

**Workflow Transition Rules:**
- Valid transition paths between stages
- Helper functions for validation and next stage calculation

### 5. Purchase Workflow (`src/features/billing/schemas/purchase-workflow.ts`)

**Purchase Workflow Stages:**
```
Purchase Order → Receipt → Vendor Bill → Journal Entry → Vendor Payment → Bank Reconciliation → Completed
```

**Purchase Order Schema:**
- Order management with vendor reference
- Item tracking with expense account assignment
- Financial tracking (subTotal, totalTax, amountBilled)
- Status management (draft, confirmed, received, billed, cancelled)
- Links to receipt, bill, and journal entry

**Receipt Schema:**
- Receipt management with warehouse/location
- Quantity tracking (ordered, received, remaining)
- Status management (draft, confirmed, done, cancelled)
- Link to bill

**Workflow Transition Rules:**
- Valid transition paths between stages
- Helper functions for validation and next stage calculation

### 6. Enhanced Accounting Engine (`src/features/billing/utils/accounting-engine.ts`)

**Updated Functions:**
- `buildInvoiceJournalEntry`: Enhanced with partner tracking and tax amounts
- `buildBillJournalEntry`: Enhanced with partner tracking and tax amounts
- `buildPaymentJournalEntry`: Enhanced with partner tracking

**New Functions:**
- `buildSalesOrderJournalEntry`: Create journal entries for sales orders (for advance payments/deposits)
- `buildPurchaseOrderJournalEntry`: Create journal entries for purchase orders (for advance payments)

**Key Features:**
- All journal entries now include partner tracking
- Tax amounts properly recorded on journal lines
- Status changed from "published" to "posted" to match Odoo terminology
- Double-entry accounting maintained throughout

## Accounting Workflows

### Sales Workflow

```
1. Create Quotation
   ↓
2. Confirm Sales Order
   ↓
3. Create Delivery (optional for services)
   ↓
4. Generate Invoice
   ↓
5. Auto-generate Journal Entry
   - Debit: Accounts Receivable
   - Credit: Sales Revenue
   - Credit: Tax Payable (if applicable)
   ↓
6. Receive Payment
   ↓
7. Auto-generate Payment Journal Entry
   - Debit: Bank
   - Credit: Accounts Receivable
   ↓
8. Bank Reconciliation
```

### Purchase Workflow

```
1. Create Purchase Order
   ↓
2. Receive Products (Receipt)
   ↓
3. Generate Vendor Bill
   ↓
4. Auto-generate Journal Entry
   - Debit: Expense Accounts
   - Debit: Tax Asset (if applicable)
   - Credit: Accounts Payable
   ↓
5. Make Vendor Payment
   ↓
6. Auto-generate Payment Journal Entry
   - Debit: Accounts Payable
   - Credit: Bank
   ↓
7. Bank Reconciliation
```

## Key Features

### 1. Double-Entry Accounting
- Every transaction affects at least two accounts
- Automatic balance verification (debit must equal credit)
- Proper account type handling (asset/expense vs liability/equity/income)

### 2. Automatic Journal Entry Generation
- Invoice posting automatically creates journal entries
- Bill posting automatically creates journal entries
- Payment recording automatically creates journal entries
- Sales and purchase orders can generate entries for advance payments

### 3. Partner Tracking
- All journal entries track the associated customer/vendor
- Enables aged receivables and payables reporting
- Facilitates partner-specific financial analysis

### 4. Tax Management
- Tax amounts tracked on journal lines
- Tax payable/receivable accounts properly credited/debited
- Support for multiple tax rates
- Tax ID references for reporting

### 5. Multi-Currency Support
- Currency specified on journal entries
- Exchange rate tracking
- Per-account currency support

### 6. Workflow Automation
- Sales workflow from quotation to completion
- Purchase workflow from order to completion
- Status transitions with validation
- Automatic document linking

### 7. Audit Trail
- Created/updated timestamps
- Posted date and user tracking
- Entry reversal tracking
- Source document references

## Integration Points

### With Generic Document System
- Sales orders and purchase orders can be created as generic documents
- Invoices and bills use the generic document infrastructure
- Unified document numbering across types

### With Existing Invoice System
- Backward compatible with existing invoice hooks
- Optional generic system integration
- Gradual migration path

### With Future Enhancements
- Inventory integration (pending)
- Bank reconciliation system (pending)
- Financial reporting (pending)
- Aged receivables/payables (pending)

## Usage Examples

### Creating a Sales Order with Journal Entry

```typescript
import { buildSalesOrderJournalEntry } from '@/features/billing/utils/accounting-engine';
import { BillingService } from '@/features/billing/api/billing.service';

// Create sales order
const salesOrder = await BillingService.salesOrders.create(companyId, salesOrderData);

// Generate journal entry (for advance payment)
const accounts = await BillingService.accounts.getAll(companyId);
const journalEntry = buildSalesOrderJournalEntry(salesOrder.data, accounts.data);

// Post the journal entry
await BillingService.journals.create(companyId, journalEntry);
```

### Creating an Invoice with Auto Journal Entry

```typescript
import { useCreateInvoiceMutation } from '@/features/billing/hooks/use-invoices';

const createInvoice = useCreateInvoiceMutation();

// When invoice is posted (status: "sent" or "paid"), journal entry is auto-generated
await createInvoice.mutateAsync({
  ...invoiceData,
  status: "sent", // This triggers journal entry creation
});
```

### Processing a Payment

```typescript
import { buildPaymentJournalEntry } from '@/features/billing/utils/accounting-engine';

// Payment journal entry is automatically generated
const journalEntry = buildPaymentJournalEntry(payment, invoice, accounts);
await BillingService.journals.create(companyId, journalEntry);
```

## Benefits

1. **Automation**: No manual journal entries required for most business operations
2. **Accuracy**: Double-entry accounting ensures balanced books
3. **Traceability**: Complete audit trail from source document to journal entry
4. **Flexibility**: Support for various business workflows
5. **Scalability**: Easy to extend with new document types and workflows
6. **Integration**: Works seamlessly with existing systems
7. **Standards**: Follows Odoo's proven accounting practices

## Future Enhancements

The following features are planned for future implementation:

1. **Inventory Integration**
   - Automatic inventory valuation entries
   - Cost of goods sold calculation
   - Stock movement accounting

2. **Bank Reconciliation**
   - Import bank statements
   - Automatic transaction matching
   - Reconciliation status tracking

3. **Financial Reports**
   - Balance Sheet
   - Profit & Loss Statement
   - Cash Flow Statement
   - Trial Balance
   - General Ledger

4. **Aged Reports**
   - Aged Receivables
   - Aged Payables
   - Payment terms analysis

5. **Advanced Tax Management**
   - Tax reporting
   - Multi-tax support
   - Tax jurisdiction handling

6. **Automation Hooks**
   - Workflow event triggers
   - Custom journal entry rules
   - Integration with other modules

## Conclusion

This Odoo-style accounting implementation provides a solid foundation for comprehensive financial management. It follows industry best practices, automates routine accounting tasks, and provides the flexibility to handle complex business scenarios. The system is designed to grow with your business needs while maintaining data integrity and financial accuracy.

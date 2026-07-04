# Generic Document System

## Overview

The Generic Document System is a unified framework for handling various types of business documents including invoices, quotations, estimates, proposals, purchase orders, receipts, credit notes, and debit notes. This system replaces the previous invoice-specific implementation with a more flexible, service-agnostic approach.

## Key Features

### 1. **Multi-Document Type Support**
- **Invoices**: Standard billing documents for customers
- **Quotations**: Price quotes for potential customers
- **Estimates**: Project cost estimates
- **Proposals**: Formal business proposals
- **Purchase Orders**: Orders to vendors
- **Receipts**: Payment acknowledgments
- **Credit Notes**: Refund documents
- **Debit Notes**: Additional charge documents

### 2. **Generic Entity References**
Documents can reference different types of entities:
- **Contacts**: Customers, vendors, individuals
- **Companies**: Business entities
- **Projects**: Project-specific documents
- **Leads**: Potential customers
- **Deals**: Sales opportunities
- **Vendors**: Supplier documents
- **Employees**: Internal documents

### 3. **Flexible Status System**
Each document type can have appropriate statuses:
- `draft`, `pending`, `sent`, `accepted`, `rejected`
- `paid`, `partial`, `overdue`, `cancelled`, `completed`

### 4. **Multi-Currency Support**
- Base currency with exchange rate support
- Per-document currency selection
- Automatic currency conversion

## Architecture

### Schema Structure

```typescript
// Generic Document Schema
interface GenericDocument {
  // Identification
  documentType: DocumentType;
  documentNumber: string;
  status: DocumentStatus;
  
  // Entity References
  fromEntity?: EntityReference;    // Who is sending
  toEntity: EntityReference;      // Who is receiving
  relatedEntity?: EntityReference; // Related entity (project, deal, etc.)
  
  // Dates
  issueDate: Date;
  validUntil?: Date;
  dueDate?: Date;
  postedAt?: Date;
  
  // Line Items
  items: GenericLineItem[];
  
  // Financials
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  amountPaid?: number;
  amountDue?: number;
  
  // Currency
  currency: string;
  exchangeRate: number;
  
  // Terms
  paymentTermDays?: number;
  paymentTerms?: string;
  
  // Document References
  quotationId?: string;
  invoiceId?: string;
  purchaseOrderId?: string;
  parentDocumentId?: string;
  
  // Notes
  notes?: string;
  notesAr?: string;
  notesEn?: string;
  termsAndConditions?: string;
  termsAndConditionsAr?: string;
  termsAndConditionsEn?: string;
  
  // Metadata
  metadata?: Record<string, unknown>;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

### Entity Reference Structure

```typescript
interface EntityReference {
  id: string;
  type: EntityType;  // contact, company, project, lead, deal, vendor, employee
  name?: string;
}
```

### Line Item Structure

```typescript
interface GenericLineItem {
  id?: string;
  productId?: string;
  serviceId?: string;
  projectId?: string;
  description: string;
  descriptionAr?: string;
  descriptionEn?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxRateId?: string;
  discount: number;
  discountType: "percentage" | "fixed";
  total: number;
  optional?: boolean;
  metadata?: Record<string, unknown>;
}
```

## Usage Examples

### Creating an Invoice

```typescript
import { useCreateGenericDocumentMutation } from '@/features/billing/hooks/use-generic-documents';
import { createGenericDocumentFromInvoiceData } from '@/features/billing/utils/migrate-to-generic';

const createInvoice = useCreateGenericDocumentMutation();

const invoiceData = {
  invoiceNumber: "INV-0001",
  status: "draft",
  customerId: "contact_123",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  items: [
    {
      description: "Web Development Services",
      quantity: 1,
      unitPrice: 5000,
      taxRate: 15,
      discount: 0,
      total: 5750,
    }
  ],
  subTotal: 5000,
  totalTax: 750,
  totalDiscount: 0,
  grandTotal: 5750,
  currency: "USD",
};

const genericDoc = createGenericDocumentFromInvoiceData(invoiceData, "invoice");
await createInvoice.mutateAsync(genericDoc);
```

### Creating a Project-Based Invoice

```typescript
const projectInvoice = {
  documentType: "invoice",
  documentNumber: "INV-0002",
  status: "sent",
  toEntity: {
    id: "contact_456",
    type: "contact",
    name: "Acme Corporation",
  },
  relatedEntity: {
    id: "project_789",
    type: "project",
    name: "Website Redesign",
  },
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  items: [
    {
      description: "Phase 1: Design",
      quantity: 1,
      unitPrice: 3000,
      taxRate: 15,
      discount: 0,
      discountType: "fixed",
      total: 3450,
      optional: false,
    }
  ],
  subTotal: 3000,
  totalTax: 450,
  totalDiscount: 0,
  grandTotal: 3450,
  currency: "USD",
  exchangeRate: 1,
};

await createInvoice.mutateAsync(projectInvoice);
```

### Querying Documents by Entity

```typescript
import { useGenericDocumentsByEntity } from '@/features/billing/hooks/use-generic-documents';

// Get all invoices for a specific contact
const { data: contactInvoices } = useGenericDocumentsByEntity(
  "contact",
  "contact_123",
  "invoice"
);

// Get all documents (invoices, quotations, etc.) for a project
const { data: projectDocuments } = useGenericDocumentsByRelatedEntity(
  "project",
  "project_789"
);
```

### Filtering Documents

```typescript
import { useGenericDocuments } from '@/features/billing/hooks/use-generic-documents';

// Get all sent invoices
const { data: sentInvoices } = useGenericDocuments({
  documentType: "invoice",
  status: "sent",
});

// Get all quotations for a specific company
const { data: companyQuotations } = useGenericDocuments({
  documentType: "quotation",
  entityType: "company",
  entityId: "company_abc",
});
```

## Migration from Invoice-Only System

### Automatic Migration

The system includes migration utilities to transition existing invoices to the new generic system:

```typescript
import { migrateAllInvoicesToGeneric } from '@/features/billing/utils/migrate-to-generic';

// Migrate all invoices for a company
const result = await migrateAllInvoicesToGeneric("company_123", {
  dryRun: false,  // Set to true to test without actually migrating
  batchSize: 50,
  onProgress: (current, total) => {
    console.log(`Migrated ${current} of ${total} invoices`);
  },
});

console.log(`Migrated: ${result.migrated}, Failed: ${result.failed}`);
```

### Backward Compatibility

The system provides backward-compatible hooks for existing invoice code:

```typescript
import { useInvoicesFromGeneric } from '@/features/billing/hooks/use-generic-documents';

// Works exactly like the old useInvoices hook
const { data: invoices } = useInvoicesFromGeneric();
```

## Document Number Sequences

Each document type can have its own numbering sequence configured in billing settings:

```typescript
interface BillingSettings {
  invoiceSequence: {
    prefix: "INV-";
    nextNumber: 1;
    padding: 4;
  };
  quotationSequence: {
    prefix: "QUO-";
    nextNumber: 1;
    padding: 4;
  };
  estimateSequence: {
    prefix: "EST-";
    nextNumber: 1;
    padding: 4;
  };
  proposalSequence: {
    prefix: "PRP-";
    nextNumber: 1;
    padding: 4;
  };
}
```

### Reserving Document Numbers

```typescript
import { GenericDocumentService } from '@/features/billing/api/generic-document.service';

// Reserve the next invoice number
const invoiceNumber = await GenericDocumentService.reserveDocumentNumber(
  companyId,
  "invoice",
  BillingService.settings
);
// Returns: "INV-0001"
```

## Benefits

### 1. **Service Agnostic**
- Works with any service type (CRM, Projects, People, etc.)
- No tight coupling to specific entity types
- Easy to extend with new document types

### 2. **Unified Data Model**
- Single collection for all document types
- Consistent querying and filtering
- Simplified reporting and analytics

### 3. **Flexibility**
- Support for custom metadata
- Multi-language support (Arabic/English)
- Extensible status workflows

### 4. **Backward Compatible**
- Existing invoice code continues to work
- Gradual migration path
- No breaking changes

## Future Enhancements

Potential future additions:
- Document templates and themes
- Automated document generation from workflows
- Electronic signature integration
- Advanced reporting and analytics
- Document approval workflows
- Integration with external accounting systems

## API Reference

### Services

- `GenericDocumentService`: Core service for document operations
- `BillingService.settings`: Settings service with document sequences

### Hooks

- `useGenericDocuments`: Query documents with filters
- `useGenericDocument`: Query single document by ID
- `useGenericDocumentsByEntity`: Query documents by entity
- `useGenericDocumentsByRelatedEntity`: Query documents by related entity
- `useCreateGenericDocumentMutation`: Create new documents
- `useUpdateGenericDocumentMutation`: Update existing documents
- `useDeleteGenericDocumentMutation`: Delete documents

### Utilities

- `invoiceToGenericDocument`: Convert invoice to generic format
- `genericDocumentToInvoice`: Convert generic to invoice format
- `createGenericDocumentFromInvoiceData`: Create generic from invoice data
- `convertGenericToInvoiceFormat`: Convert generic to invoice format
- `migrateInvoiceToGeneric`: Migrate single invoice
- `migrateAllInvoicesToGeneric`: Migrate all invoices
- `validateGenericDocumentAsInvoice`: Validate document as invoice

## Best Practices

1. **Always use entity references**: Instead of hardcoding `customerId`, use `toEntity` with proper type
2. **Use relatedEntity for associations**: Link documents to projects, deals, etc. using `relatedEntity`
3. **Leverage metadata**: Store custom data in the `metadata` field instead of adding new fields
4. **Use appropriate document types**: Choose the right document type for your use case
5. **Handle currency properly**: Always specify currency and exchange rate for multi-currency scenarios
6. **Use status workflows**: Follow the appropriate status transitions for each document type

## Troubleshooting

### Common Issues

**Issue**: Documents not appearing in queries
- **Solution**: Ensure `documentType` and entity references are set correctly

**Issue**: Migration fails
- **Solution**: Check that all required fields are present in existing invoices

**Issue**: Document number conflicts
- **Solution**: Ensure sequence numbers are properly configured in settings

## Support

For issues or questions about the Generic Document System, please refer to the main documentation or contact the development team.

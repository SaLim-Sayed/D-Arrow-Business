import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Divider,
} from "@heroui/react";
import { Printer, Download, ArrowLeft, Mail, CreditCard } from "lucide-react";
import { useInvoices } from "../hooks/use-invoices";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { formatCurrency } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("billing");

  const { data: invoices = [] } = useInvoices();
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data || [];

  const invoice = invoices.find(inv => inv.id === id);
  const customer = contacts.find(c => c.id === invoice?.customerId);

  if (!invoice) {
    return (
      <div className="flex justify-center p-10">
        <p className="text-default-500">Invoice not found or loading...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "default";
      case "sent": return "primary";
      case "paid": return "success";
      case "overdue": return "danger";
      case "cancelled": return "warning";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 py-4 border-b border-default-100">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {invoice.invoiceNumber}
              <Chip color={getStatusColor(invoice.status)} variant="flat" size="sm" className="uppercase font-bold tracking-wider text-[10px]">
                {invoice.status}
              </Chip>
            </h1>
            <p className="text-default-500 text-sm">
               Issue Date: {invoice.issueDate.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status !== "paid" && (
            <Button
              color="success"
              variant="flat"
              startContent={<CreditCard className="w-4 h-4" />}
            >
              Record Payment
            </Button>
          )}
          <Button
             variant="flat"
             startContent={<Mail className="w-4 h-4" />}
          >
             Send Email
          </Button>
          <Button
             variant="flat"
             isIconOnly
             aria-label="Download PDF"
          >
             <Download className="w-4 h-4" />
          </Button>
          <Button
             variant="flat"
             isIconOnly
             aria-label="Print"
             onPress={() => window.print()}
          >
             <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none shadow-sm border border-default-100 rounded-none sm:rounded-2xl bg-white dark:bg-content1 overflow-hidden min-h-[800px]">
         <CardBody className="p-0">
           {/* Invoice Header Ribbon */}
           <div className={`h-2 w-full bg-${getStatusColor(invoice.status)}`} />
           
           <div className="p-8 md:p-12 space-y-12">
             {/* Header Section */}
             <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-3xl font-black tracking-tight text-default-900 uppercase">Invoice</h2>
                  <p className="text-default-500 font-medium mt-1"># {invoice.invoiceNumber}</p>
               </div>
               <div className="text-right">
                  <h3 className="font-bold text-xl tracking-tight text-primary">D-Arrow Business</h3>
                  <p className="text-default-500 text-sm mt-1">
                    123 Business Avenue<br />
                    Suite 100<br />
                    City, Country
                  </p>
               </div>
             </div>

             {/* Bill To & Info */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
               <div className="md:col-span-2">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-default-400 mb-2">Bill To</h4>
                 <h5 className="font-bold text-lg text-default-900">{customer?.name || "Unknown Customer"}</h5>
                 <p className="text-default-500 text-sm mt-1">
                   {customer?.email}<br/>
                   {customer?.phone}
                 </p>
               </div>
               <div className="space-y-4">
                 <div>
                   <h4 className="text-xs font-bold uppercase tracking-widest text-default-400">Issue Date</h4>
                   <p className="font-medium text-default-900">{invoice.issueDate.toLocaleDateString()}</p>
                 </div>
                 <div>
                   <h4 className="text-xs font-bold uppercase tracking-widest text-default-400">Due Date</h4>
                   <p className="font-medium text-default-900">{invoice.dueDate.toLocaleDateString()}</p>
                 </div>
                 <div className="bg-default-100/50 p-3 rounded-lg border border-default-100">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-default-500">Amount Due</h4>
                   <p className="font-black text-xl text-primary">{formatCurrency(invoice.grandTotal - (invoice.amountPaid || 0), invoice.currency)}</p>
                 </div>
               </div>
             </div>

             {/* Line Items */}
             <div className="mt-8">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b-2 border-default-200">
                     <th className="py-3 text-xs font-bold uppercase tracking-widest text-default-500 w-[50%]">Item Description</th>
                     <th className="py-3 text-xs font-bold uppercase tracking-widest text-default-500 text-right">Qty</th>
                     <th className="py-3 text-xs font-bold uppercase tracking-widest text-default-500 text-right">Rate</th>
                     <th className="py-3 text-xs font-bold uppercase tracking-widest text-default-500 text-right">Amount</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-default-100">
                   {invoice.items.map((item, idx) => (
                     <tr key={idx} className="group hover:bg-default-50/50 transition-colors">
                       <td className="py-4">
                         <p className="font-medium text-default-900">{item.description}</p>
                         {item.discount > 0 && <span className="text-xs text-danger">Discount: {formatCurrency(item.discount, invoice.currency)}</span>}
                       </td>
                       <td className="py-4 text-right text-default-600">{item.quantity}</td>
                       <td className="py-4 text-right text-default-600">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                       <td className="py-4 text-right font-medium text-default-900">{formatCurrency(item.total, invoice.currency)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>

             {/* Totals */}
             <div className="flex justify-end mt-8">
               <div className="w-full md:w-1/2 space-y-3">
                 <div className="flex justify-between text-default-600">
                   <span>Subtotal</span>
                   <span className="font-medium">{formatCurrency(invoice.subTotal, invoice.currency)}</span>
                 </div>
                 {invoice.totalDiscount > 0 && (
                   <div className="flex justify-between text-danger">
                     <span>Total Discount</span>
                     <span>-{formatCurrency(invoice.totalDiscount, invoice.currency)}</span>
                   </div>
                 )}
                 {invoice.totalTax > 0 && (
                   <div className="flex justify-between text-default-600">
                     <span>Total Tax</span>
                     <span className="font-medium">{formatCurrency(invoice.totalTax, invoice.currency)}</span>
                   </div>
                 )}
                 <Divider className="my-2" />
                 <div className="flex justify-between items-center text-xl font-black text-default-900">
                   <span>Total</span>
                   <span>{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
                 </div>
                 {invoice.amountPaid > 0 && (
                   <div className="flex justify-between items-center text-success font-medium">
                     <span>Amount Paid</span>
                     <span>-{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                   </div>
                 )}
                 {invoice.amountPaid > 0 && (
                   <div className="flex justify-between items-center text-lg font-bold text-default-900 bg-default-100/50 p-2 rounded-md mt-2">
                     <span>Balance Due</span>
                     <span>{formatCurrency(invoice.grandTotal - invoice.amountPaid, invoice.currency)}</span>
                   </div>
                 )}
               </div>
             </div>

             {/* Footer / Notes */}
             <div className="pt-12 mt-12 border-t border-default-100 space-y-6">
                {invoice.notes && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-default-400 mb-1">Notes</h4>
                    <p className="text-sm text-default-600 whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                {invoice.termsAndConditions && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-default-400 mb-1">Terms & Conditions</h4>
                    <p className="text-xs text-default-500 whitespace-pre-line">{invoice.termsAndConditions}</p>
                  </div>
                )}
             </div>

           </div>
         </CardBody>
      </Card>
    </div>
  );
}

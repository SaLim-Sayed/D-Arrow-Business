import React from "react";
import { formatCurrency } from "@/lib/utils";
import type { JournalEntry } from "../schemas/journal";

interface JournalPrintViewProps {
  journal: JournalEntry;
}

export const JournalPrintView = React.forwardRef<HTMLDivElement, JournalPrintViewProps>(
  ({ journal }, ref) => {
    return (
      <div
        ref={ref}
        className="fixed top-0 left-0 -z-50 bg-white text-black p-8 w-[210mm] min-h-[297mm] text-sm"
        style={{ pointerEvents: "none" }}
      >
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-800">
              Journal Voucher
            </h1>
            <p className="text-gray-500 mt-1">Number: {journal.journalNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Date: {journal.date.toLocaleDateString()}</p>
            {journal.reference && <p>Ref: {journal.reference}</p>}
          </div>
        </div>

        {journal.notes && (
          <div className="mb-6 p-4 bg-gray-50 rounded text-gray-700">
            <strong>Notes: </strong>
            {journal.notes}
          </div>
        )}

        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-2 px-4 font-semibold">Account</th>
              <th className="py-2 px-4 font-semibold">Description</th>
              <th className="py-2 px-4 font-semibold text-right">Debit</th>
              <th className="py-2 px-4 font-semibold text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {journal.lines.map((line, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 px-4">{line.accountId}</td>
                <td className="py-3 px-4 text-gray-600">{line.description || "—"}</td>
                <td className="py-3 px-4 text-right">
                  {line.debit > 0 ? formatCurrency(line.debit, journal.currency) : ""}
                </td>
                <td className="py-3 px-4 text-right">
                  {line.credit > 0 ? formatCurrency(line.credit, journal.currency) : ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-bold bg-gray-50">
              <td colSpan={2} className="py-3 px-4 text-right">
                TOTAL
              </td>
              <td className="py-3 px-4 text-right text-green-700">
                {formatCurrency(journal.totalDebit, journal.currency)}
              </td>
              <td className="py-3 px-4 text-right text-blue-700">
                {formatCurrency(journal.totalCredit, journal.currency)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-16 grid grid-cols-2 gap-8 text-center pt-8 border-t">
          <div>
            <p className="font-semibold text-gray-600 mb-8">Prepared By</p>
            <div className="border-b border-gray-300 mx-8"></div>
          </div>
          <div>
            <p className="font-semibold text-gray-600 mb-8">Approved By</p>
            <div className="border-b border-gray-300 mx-8"></div>
          </div>
        </div>
      </div>
    );
  }
);

JournalPrintView.displayName = "JournalPrintView";

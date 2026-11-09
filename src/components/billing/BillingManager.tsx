/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Invoice, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Receipt, 
  CreditCard, 
  IndianRupee, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Download, 
  Filter, 
  Search,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { PrintableInvoiceModal } from '../export';

interface BillingManagerProps {
  theme: ThemeMode;
}

export const BillingManager: React.FC<BillingManagerProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [invoices, setInvoices] = useState<Invoice[]>(db.getInvoices());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setInvoices([...db.getInvoices()]);
    });
    return unsub;
  }, []);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [printInvoiceModalOpen, setPrintInvoiceModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Medical Insurance (Aetna Health)');

  const totalRevenue = 4240500;
  const pendingTotal = invoices
    .filter(i => i.status === 'Pending')
    .reduce((acc, curr) => acc + curr.grandTotal, 0);

  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    sound.playClick();
    db.payInvoice(selectedInvoice.id, paymentMethod);
    const updated = db.getInvoices();
    setInvoices([...updated]);
    setSelectedInvoice(updated.find(i => i.id === selectedInvoice.id) || null);
    setPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER & FINANCIAL METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Hospital Financial Operations & Patient Accounts</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated clinical billing, insurance claim adjudication, and revenue cycle management
          </p>
        </div>

        {/* Revenue KPI pills */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0E2035] border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className="text-[10px] text-slate-400 font-semibold block">Total Hospital Revenue</span>
            <span className="text-lg font-black text-emerald-500">₹{(totalRevenue / 1000000).toFixed(2)}M</span>
          </div>
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0E2035] border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className="text-[10px] text-slate-400 font-semibold block">Pending Receivables</span>
            <span className="text-lg font-black text-amber-500">₹{pendingTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* SPLIT VIEW: INVOICE LIST + SELECTED INVOICE ITEMIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Invoices */}
        <div className="lg:col-span-5 space-y-3">
          {invoices.map(inv => {
            const isSelected = selectedInvoice?.id === inv.id;
            return (
              <div
                key={inv.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedInvoice(inv);
                }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDark ? 'bg-blue-950/70 border-teal-500/50 shadow-md ring-1 ring-teal-500/30' : 'bg-teal-50/80 border-teal-300 shadow-md ring-1 ring-teal-400/30'
                    : isDark ? 'bg-[#0E2035]/60 border-slate-800 hover:bg-slate-800/40' : 'bg-white border-slate-200/80 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold block">
                      {inv.invoiceNumber}
                    </span>
                    <h4 className="font-bold text-sm mt-0.5">{inv.patientName}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    inv.status === 'Paid'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {inv.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{inv.date}</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    ₹{inv.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column (7 cols): Full Itemized Invoice Dossier */}
        <div className="lg:col-span-7">
          {selectedInvoice && (
            <div className={`p-6 rounded-3xl border space-y-6 ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-md'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">
                    Official MediCore Health Invoice
                  </span>
                  <h3 className="font-mono text-xl font-black mt-0.5">{selectedInvoice.invoiceNumber}</h3>
                  <span className="text-xs text-slate-400">Patient: {selectedInvoice.patientName}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Due</span>
                  <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    ₹{selectedInvoice.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Itemized breakdown table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Itemized Clinical & Pharmacy Charges
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="pb-2 font-semibold">Service Description</th>
                        <th className="pb-2 font-semibold text-center">Qty</th>
                        <th className="pb-2 font-semibold text-right">Unit Price</th>
                        <th className="pb-2 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-medium">{item.description}</td>
                          <td className="py-2.5 text-center text-slate-400">{item.quantity}</td>
                          <td className="py-2.5 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-mono font-bold">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-right">
                  <div className="text-slate-400">Subtotal: <strong className="text-slate-700 dark:text-slate-200 font-mono">₹{selectedInvoice.subtotal.toFixed(2)}</strong></div>
                  <div className="text-slate-400">Sales Tax / Facility Surcharge: <strong className="text-slate-700 dark:text-slate-200 font-mono">₹{selectedInvoice.tax.toFixed(2)}</strong></div>
                  {selectedInvoice.discount > 0 && (
                    <div className="text-emerald-500 font-semibold">Insurance Coverage Discount: -₹{selectedInvoice.discount.toFixed(2)}</div>
                  )}
                  <div className="text-base font-extrabold text-teal-600 dark:text-teal-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Grand Total: ₹{selectedInvoice.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Actions & Payment Status */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {selectedInvoice.status === 'Paid' ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Paid via {selectedInvoice.paymentMethod || 'Insurance'}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-500 font-semibold">
                      Payment Pending (Due: {selectedInvoice.dueDate})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setPrintInvoiceModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-400 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Export PDF</span>
                  </button>

                  {selectedInvoice.status === 'Pending' && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        setPaymentModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md"
                    >
                      Process Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT PROCESSOR MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <h3 className="font-extrabold text-base mb-1">Process Inpatient/Outpatient Payment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Authorize remittance of ₹{selectedInvoice?.grandTotal.toFixed(2)} for {selectedInvoice?.patientName}
            </p>

            <form onSubmit={handlePayInvoice} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                >
                  <option value="Medical Insurance (Aetna Health)">Medical Insurance (Aetna Health)</option>
                  <option value="Medical Insurance (Blue Cross Blue Shield)">Medical Insurance (Blue Cross Blue Shield)</option>
                  <option value="Corporate Health Plan">Corporate Health Plan</option>
                  <option value="Direct Credit/Debit Card">Direct Credit/Debit Card</option>
                  <option value="Hospital Wire Transfer">Hospital Wire Transfer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-md"
                >
                  Confirm & Settle Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL TAX INVOICE MODAL */}
      <PrintableInvoiceModal
        isOpen={printInvoiceModalOpen}
        onClose={() => setPrintInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        theme={theme}
      />
    </div>
  );
};

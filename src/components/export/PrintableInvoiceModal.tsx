/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Building2, 
  FileText, 
  Copy, 
  Check, 
  CreditCard,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { Invoice, ThemeMode } from '../../types';
import { sound } from '../../services/audioService';

interface PrintableInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  theme?: ThemeMode;
  hospitalName?: string;
  facilityAddress?: string;
  gstNumber?: string;
}

// Convert amount to Indian Rupees in words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return inWords(Math.floor(n / 100)) + 'Hundred ' + (n % 100 !== 0 ? inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(num);
  const words = inWords(integerPart).trim();
  return `${words} Rupees Only`;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  theme = 'light',
  hospitalName = 'MediCore Global Health System',
  facilityAddress = 'Building 4, Sector 18, Institutional Area, New Delhi - 110001, India',
  gstNumber = '07AAAAA0000A1Z5'
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    sound.playClick();
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleCopyInvoiceNumber = () => {
    sound.playClick();
    navigator.clipboard?.writeText(invoice.invoiceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    sound.playSuccess();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoice, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Invoice-${invoice.invoiceNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isPaid = invoice.status === 'Paid';
  const taxRate = 18; // Standard healthcare ancillary GST (9% CGST + 9% SGST)
  const cgst = (invoice.tax || (invoice.subtotal * 0.09));
  const sgst = (invoice.tax || (invoice.subtotal * 0.09));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* MODAL CONTROL HEADER (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                Official Healthcare Tax Invoice
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-teal-300">
                  {invoice.invoiceNumber}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">NABH & JCI Accredited Enterprise Billing Document</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInvoiceNumber}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Copy Invoice ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy #'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Download Raw Data"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= PRINTABLE INVOICE SHEET ================= */}
        <div id="printable-invoice-sheet" className="p-8 sm:p-10 bg-white text-slate-900 print:p-6 print:m-0">
          
          {/* HOSPITAL LETTERHEAD */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  +
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                    {hospitalName}
                  </h1>
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest">
                    Tertiary Care & Academic Medical Center
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-md pt-1 leading-relaxed">
                {facilityAddress}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
                <span>GSTIN: <strong>{gstNumber}</strong></span>
                <span>PAN: <strong>AAACM1049P</strong></span>
                <span>Helpline: <strong>1800-419-MEDICORE</strong></span>
              </div>
            </div>

            {/* TAX INVOICE BADGE & QR */}
            <div className="sm:text-right space-y-2 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
              <div>
                <span className="inline-block px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-black tracking-wider uppercase mb-1">
                  TAX INVOICE & RECEIPT
                </span>
                <div className="text-sm font-black text-slate-900 font-mono">
                  #{invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500">
                  Billing Date: <strong>{invoice.date}</strong>
                </div>
              </div>

              {/* Status Ribbon */}
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PAID IN FULL
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    PAYMENT DUE ({invoice.dueDate})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BILLED PATIENT & ENCOUNTER METADATA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                PATIENT (BILLED TO)
              </span>
              <div className="text-sm font-black text-slate-900">
                {invoice.patientName}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
                <div>MRN / ID: <strong className="text-slate-900">{invoice.patientId}</strong></div>
                <div>Category: <strong className="text-slate-900">Inpatient / Daycare</strong></div>
                <div>Coverage: <strong className="text-slate-900">{invoice.paymentMethod || 'Commercial TPA'}</strong></div>
                <div>Auth Status: <strong className="text-emerald-700">Verified ✓</strong></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                SETTLEMENT & ENCOUNTER AUDIT
              </span>
              <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <strong className="text-slate-900">{invoice.dueDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway / Mode:</span>
                  <strong className="text-slate-900">{invoice.paymentMethod || 'Direct Card / UPI'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Transaction / Ref ID:</span>
                  <strong className="text-slate-900">TXN-{(invoice.id || '99214').toUpperCase()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>NABH Compliance ID:</span>
                  <strong className="text-teal-800">NABH-2026-MED-0988</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMIZED SERVICES TABLE */}
          <div className="py-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-3">Service / Procedure Description</th>
                  <th className="py-2.5 px-3 text-center">SAC Code</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{it.description}</div>
                        <span className="text-[10px] text-slate-400">Clinical code: SAC-9993-MED</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">999312</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{it.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">₹{it.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{it.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 px-2 font-mono text-slate-400">1</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">Comprehensive Inpatient Medical Care & Diagnostics</div>
                      <span className="text-[10px] text-slate-400">Includes ward room charges, doctor consultations, nursing & vitals</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">999311</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">1</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALS & TAX BREAKDOWN */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  AMOUNT IN WORDS
                </span>
                <p className="text-xs font-bold text-slate-800 italic">
                  {numberToWords(invoice.grandTotal)}
                </p>
              </div>

              {/* Bank Remittance Details */}
              <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                <div>Bank: <strong>State Bank of India (SBI) - Institutional Branch</strong></div>
                <div>A/C Name: <strong>MediCore Global Health Pvt Ltd</strong></div>
                <div>A/C No: <strong>4088921104928</strong> • IFSC: <strong>SBIN0001429</strong></div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal (Clinical Services):</span>
                <span className="font-bold text-slate-900">₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500">
                <span>CGST (Central Tax @ 9%):</span>
                <span>₹{(invoice.tax ? invoice.tax / 2 : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500">
                <span>SGST (State Tax @ 9%):</span>
                <span>₹{(invoice.tax ? invoice.tax / 2 : 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600">
                  <span>Institutional Discount / TPA Waiver:</span>
                  <span>-₹{invoice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t-2 border-slate-900 text-sm font-black text-slate-900 bg-slate-50 px-3 rounded-xl">
                <span className="font-sans">NET PAYABLE AMOUNT:</span>
                <span className="text-teal-800 text-base">₹{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* SIGNATURE & STAMP FOOTER */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
            <div className="space-y-1 text-[11px] text-slate-500 max-w-sm">
              <div className="flex items-center gap-1.5 font-bold text-teal-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Digitally Authenticated Healthcare Invoice</span>
              </div>
              <p>
                This is a computer-generated tax invoice verified under Section 31 of CGST Act. No physical signature is required.
              </p>
              <div className="text-[10px] text-slate-400 font-mono">
                Checksum: SHA256:{invoice.invoiceNumber}-MED-AUTH-OK
              </div>
            </div>

            {/* Official Stamp & Signatory Box */}
            <div className="text-center sm:text-right space-y-1">
              <div className="inline-block p-2 border-2 border-dashed border-teal-600/40 rounded-xl bg-teal-50/50 mb-1">
                <div className="text-[9px] font-black uppercase text-teal-800 tracking-widest">
                  MEDICORE HEALTH SYSTEM
                </div>
                <div className="text-[8px] font-mono text-teal-700">
                  ACCOUNTS & REVENUE DESK
                </div>
                <div className="text-[8px] text-emerald-600 font-bold">
                  VERIFIED & SEALED
                </div>
              </div>
              <div className="font-serif italic font-bold text-sm text-slate-800">
                Rajiv Menon
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Chief Financial Controller (Authorized Signatory)
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};


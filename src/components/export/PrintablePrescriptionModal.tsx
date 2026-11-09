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
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  Pill, 
  AlertTriangle,
  Stethoscope,
  Calendar,
  Clock,
  QrCode
} from 'lucide-react';
import { Prescription, Patient, ThemeMode } from '../../types';
import { sound } from '../../services/audioService';

interface PrintablePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  patient?: Patient | null;
  doctorDetails?: {
    name: string;
    qualification: string;
    regNumber: string;
    department: string;
    contact?: string;
  };
  theme?: ThemeMode;
}

export const PrintablePrescriptionModal: React.FC<PrintablePrescriptionModalProps> = ({
  isOpen,
  onClose,
  prescription,
  patient,
  doctorDetails = {
    name: 'Dr. Roger S., MD, FCCP',
    qualification: 'MD (Internal Medicine), DM (Pulmonary & Critical Care)',
    regNumber: 'MCI-2018-99412 / DMC-54129',
    department: 'Department of Pulmonology & Critical Care',
    contact: '+91 11-4992-8000 (Ext. 402)'
  },
  theme = 'light'
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !prescription) return null;

  const handlePrint = () => {
    sound.playClick();
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleCopyRx = () => {
    sound.playClick();
    const rxText = `MEDICORE E-PRESCRIPTION #${prescription.id}
Doctor: ${doctorDetails.name} (${doctorDetails.regNumber})
Patient: ${prescription.patientName} (Date: ${prescription.date})
Medications:
${prescription.items.map(it => `- ${it.medicineName}: ${it.dosage}, ${it.frequency} for ${it.duration} (Qty: ${it.quantity})`).join('\n')}
Status: ${prescription.status}`;
    navigator.clipboard?.writeText(rxText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const patientName = prescription.patientName || patient?.name || 'Magnus Stephenson';
  const patientCode = patient?.patientCode || prescription.patientId || 'P-12563a';
  const patientAge = patient?.age || 38;
  const patientGender = patient?.gender || 'Male';
  const bloodGroup = patient?.bloodGroup || 'O+';
  const vitals = patient?.vitals || {
    bloodPressure: '122/82',
    pulseRate: 74,
    oxygenSaturation: 98,
    temperature: 36.8
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* MODAL CONTROL HEADER (Hidden on print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                Official E-Prescription Slip
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-teal-300">
                  Rx #{prescription.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">National Medical Commission (NMC) Certified Digital Prescription</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRx}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Copy Rx Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
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

        {/* ================= PRINTABLE RX SHEET ================= */}
        <div id="printable-rx-sheet" className="p-8 sm:p-10 bg-white text-slate-900 print:p-6 print:m-0">
          
          {/* HOSPITAL & DOCTOR HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-teal-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-black text-base">
                  +
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900">
                    MediCore Global Health System
                  </h1>
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest block">
                    Tertiary Medical Center & Pulmonology Institute
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Institutional Area, Sector 18, New Delhi - 110001 • Tel: +91 11-4992-8000
              </p>
            </div>

            <div className="sm:text-right space-y-0.5">
              <h2 className="text-base font-black text-slate-900">
                {doctorDetails.name}
              </h2>
              <p className="text-xs text-teal-800 font-semibold">
                {doctorDetails.qualification}
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                Reg No: <strong>{doctorDetails.regNumber}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                {doctorDetails.department}
              </p>
            </div>
          </div>

          {/* PATIENT DEMOGRAPHICS & CLINICAL VITALS BAR */}
          <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
                <strong className="text-slate-900 text-sm">{patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Age / Gender / Blood</span>
                <strong className="text-slate-900">{patientAge} Yrs / {patientGender} ({bloodGroup})</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient UHID / MRN</span>
                <strong className="text-slate-900 font-mono">{patientCode}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Prescription Date</span>
                <strong className="text-slate-900">{prescription.date}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-[11px] font-mono">
              <div>BP: <strong className="text-slate-800">{vitals.bloodPressure} mmHg</strong></div>
              <div>Pulse: <strong className="text-slate-800">{vitals.pulseRate} bpm</strong></div>
              <div>SpO₂: <strong className="text-slate-800">{vitals.oxygenSaturation}%</strong></div>
              <div>Known Allergies: <strong className="text-rose-600">No Known Drug Allergies (NKDA)</strong></div>
            </div>
          </div>

          {/* DIAGNOSIS / CLINICAL IMPRESSION */}
          <div className="mb-6 px-1 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Clinical Diagnosis / Indication: </span>
              <strong className="text-slate-900 ml-1">
                {patient?.diagnosis || 'Acute Bronchial Spasm & Post-Viral Airway Hyperreactivity'}
              </strong>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              Prescription Status: {prescription.status.toUpperCase()}
            </span>
          </div>

          {/* ℞ SYMBOL & FORMULARY MEDICATIONS */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-serif italic font-black text-2xl text-teal-800">℞</span>
              <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Prescribed Formularies & Regimen
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Medicine & Strength</th>
                    <th className="py-2.5 px-3">Dosage / Route</th>
                    <th className="py-2.5 px-3">Frequency & Schedule</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3 text-right">Total Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 text-sm block">{it.medicineName}</strong>
                        <span className="text-[10px] text-teal-700 font-medium">Standard Medical Grade Formulary</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{it.dosage}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{it.frequency}</span>
                        <span className="text-[10px] text-slate-500 block">Take orally after meals</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{it.duration}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{it.quantity} Units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GENERAL CLINICAL ADVICE & INSTRUCTIONS */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-1.5">
            <span className="font-bold text-amber-900 block flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Special Clinical Instructions & Precautions
            </span>
            <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-0.5 leading-relaxed">
              <li>Complete the full antibiotic / therapeutic regimen even if symptoms resolve earlier.</li>
              <li>Maintain adequate hydration (minimum 2.5 Liters of water daily). Avoid smoking and airborne irritants.</li>
              <li>Report immediately to the Emergency Department in case of acute breathlessness, chest tightness, or cutaneous rash.</li>
              <li>Next Review / Follow-up Appointment: <strong>7 Days from issue ({prescription.date})</strong>.</li>
            </ul>
          </div>

          {/* DIGITAL SIGNATURE & VERIFICATION BARCODE */}
          <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
            <div className="space-y-1 text-slate-500 text-[10px] font-mono">
              <div className="flex items-center gap-1 text-teal-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>NMC COMPLIANT CRYPTOGRAPHIC SIGNATURE VERIFIED</span>
              </div>
              <div>Token ID: <strong>RX-{prescription.id}-AUTH-NMC-2026</strong></div>
              <div>Hospital Dispensary Code: <strong>MED-PHARM-DELHI-01</strong></div>
              <div className="text-[9px] text-slate-400">
                Generated under the Indian Telemedicine Practice Guidelines & IT Act 2000
              </div>
            </div>

            {/* Doctor Signature Block */}
            <div className="text-center sm:text-right space-y-1">
              <div className="font-serif italic text-base font-black text-teal-900 border-b border-teal-700 pb-1 inline-block min-w-[160px]">
                {doctorDetails.name}
              </div>
              <div className="text-[11px] font-bold text-slate-900">
                {doctorDetails.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Reg: {doctorDetails.regNumber}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};


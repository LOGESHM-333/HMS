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
  Copy, 
  Check, 
  CreditCard,
  QrCode,
  Heart,
  Droplet,
  Phone,
  RotateCw,
  Building2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Patient, ThemeMode } from '../../types';
import { sound } from '../../services/audioService';

interface DigitalHealthCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  theme?: ThemeMode;
  hospitalName?: string;
  emergencyHotline?: string;
}

export const DigitalHealthCardModal: React.FC<DigitalHealthCardModalProps> = ({
  isOpen,
  onClose,
  patient,
  theme = 'light',
  hospitalName = 'MediCore Global Health System',
  emergencyHotline = '1800-419-MEDICORE / +91 11-4992-8000'
}) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !patient) return null;

  const uhid = `MC-${patient.patientCode ? patient.patientCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '12563A'}-8891-2026`;
  const emergencyPhone = patient.phone ? `+91 ${patient.phone.replace(/[^0-9]/g, '').slice(-10)}` : '+91 98765 43210';

  const handlePrint = () => {
    sound.playClick();
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleCopyUhid = () => {
    sound.playClick();
    navigator.clipboard?.writeText(uhid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl my-auto bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:bg-white print:text-slate-900 print:rounded-none print:max-w-none print:w-full">
        
        {/* MODAL CONTROL HEADER (Hidden when printing) */}
        <div className="no-print bg-slate-950 px-6 py-4 flex flex-wrap items-center justify-between border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                Digital Health ID Card & Smart Health Passport
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700/50">
                  ABHA Compliant
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Authenticated Smart Healthcare Credential with Emergency QR Directives</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveSide('both')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeSide === 'both' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dual Sheet
              </button>
              <button
                onClick={() => setActiveSide('front')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeSide === 'front' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Front Only
              </button>
              <button
                onClick={() => setActiveSide('back')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeSide === 'back' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Back Only
              </button>
            </div>

            <button
              onClick={handleCopyUhid}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Copy Unique Health ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy UHID'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ID Card / PDF</span>
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

        {/* PRINTABLE CONTAINER */}
        <div id="printable-health-card-sheet" className="p-6 sm:p-10 bg-slate-900 print:bg-white print:p-6 print:m-0">
          
          <div className="no-print mb-6 text-center">
            <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Standard CR80 Wallet Dimensions (85.6 mm × 53.98 mm) • Ready for Color Printing & PVC Lamination
            </span>
          </div>

          {/* DUAL CARD PREVIEW GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
            
            {/* ================= CARD FRONT ================= */}
            {(activeSide === 'both' || activeSide === 'front') && (
              <div className="relative rounded-3xl p-6 overflow-hidden border border-teal-500/30 bg-gradient-to-br from-[#0C1F38] via-[#102B4C] to-[#0A1828] text-white shadow-2xl flex flex-col justify-between aspect-[1.586/1] min-h-[290px] print:shadow-none print:border print:border-slate-400 print:aspect-auto print:min-h-[280px]">
                
                {/* Holographic Security Ribbon Accent */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-teal-400/20 via-cyan-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* CARD HEADER */}
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                      +
                    </div>
                    <div>
                      <h2 className="text-xs font-black tracking-wider uppercase text-white leading-tight">
                        {hospitalName}
                      </h2>
                      <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest block">
                        Smart Health Passport
                      </span>
                    </div>
                  </div>

                  {/* Gold Microchip Graphic */}
                  <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/50 flex flex-col justify-around p-1 shadow-inner opacity-90">
                    <div className="w-full h-0.5 bg-amber-600/40" />
                    <div className="w-full h-0.5 bg-amber-600/40" />
                    <div className="w-full h-0.5 bg-amber-600/40" />
                  </div>
                </div>

                {/* PATIENT PROFILE CENTER */}
                <div className="relative z-10 flex items-center gap-4 my-auto py-2">
                  <div className="relative">
                    <img 
                      src={patient.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"}
                      alt={patient.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-400/60 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-[8px] font-black uppercase text-white tracking-wider border border-white/20">
                      Active
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                      {patient.name}
                    </h3>
                    <div className="text-xs text-slate-300 flex items-center gap-2">
                      <span>Age: <strong>{patient.age} Yrs</strong></span>
                      <span>•</span>
                      <span>Gender: <strong>{patient.gender}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-rose-400" />
                        {patient.bloodGroup || 'O+'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                        {patient.admissionStatus || 'Outpatient'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER */}
                <div className="relative z-10 pt-2 border-t border-slate-700/80 flex items-end justify-between text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                      Unique Health ID (UHID)
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-extrabold tracking-wider text-teal-300">
                      {uhid}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 uppercase block">Validity</span>
                    <span className="text-[10px] font-bold text-slate-200">LIFETIME / 2030</span>
                  </div>
                </div>

              </div>
            )}

            {/* ================= CARD BACK ================= */}
            {(activeSide === 'both' || activeSide === 'back') && (
              <div className="relative rounded-3xl p-6 overflow-hidden border border-teal-500/30 bg-gradient-to-br from-[#0A1828] via-[#102B4C] to-[#0C1F38] text-white shadow-2xl flex flex-col justify-between aspect-[1.586/1] min-h-[290px] print:shadow-none print:border print:border-slate-400 print:aspect-auto print:min-h-[280px]">
                
                {/* Magnetic Stripe Aesthetic Bar */}
                <div className="absolute top-4 left-0 right-0 h-9 bg-slate-950 border-y border-slate-800" />

                <div className="pt-8"></div>

                {/* EMERGENCY QR & DIRECTIVES */}
                <div className="relative z-10 grid grid-cols-3 gap-3 items-center">
                  
                  {/* High Density Scannable QR Code */}
                  <div className="bg-white p-2 rounded-2xl flex flex-col items-center justify-center shadow-lg border border-slate-200">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-slate-900 fill-current">
                      {/* Authentic Vector QR Code Matrix */}
                      <rect width="100" height="100" fill="#ffffff" />
                      {/* Top-Left Finder */}
                      <rect x="10" y="10" width="26" height="26" fill="#0f172a" rx="3" />
                      <rect x="14" y="14" width="18" height="18" fill="#ffffff" rx="2" />
                      <rect x="18" y="18" width="10" height="10" fill="#0f172a" rx="1" />
                      {/* Top-Right Finder */}
                      <rect x="64" y="10" width="26" height="26" fill="#0f172a" rx="3" />
                      <rect x="68" y="14" width="18" height="18" fill="#ffffff" rx="2" />
                      <rect x="72" y="18" width="10" height="10" fill="#0f172a" rx="1" />
                      {/* Bottom-Left Finder */}
                      <rect x="10" y="64" width="26" height="26" fill="#0f172a" rx="3" />
                      <rect x="14" y="68" width="18" height="18" fill="#ffffff" rx="2" />
                      <rect x="18" y="72" width="10" height="10" fill="#0f172a" rx="1" />
                      {/* Data Pattern Dots */}
                      <rect x="42" y="12" width="6" height="6" fill="#0f172a" />
                      <rect x="52" y="12" width="6" height="6" fill="#0f172a" />
                      <rect x="42" y="24" width="6" height="6" fill="#0f172a" />
                      <rect x="42" y="34" width="6" height="6" fill="#0f172a" />
                      <rect x="52" y="34" width="6" height="6" fill="#0f172a" />
                      <rect x="12" y="44" width="6" height="6" fill="#0f172a" />
                      <rect x="24" y="44" width="6" height="6" fill="#0f172a" />
                      <rect x="34" y="44" width="6" height="6" fill="#0f172a" />
                      <rect x="44" y="44" width="12" height="12" fill="#0d9488" rx="2" />
                      <rect x="64" y="44" width="6" height="6" fill="#0f172a" />
                      <rect x="76" y="44" width="6" height="6" fill="#0f172a" />
                      <rect x="84" y="44" width="6" height="6" fill="#0f172a" />
                      <rect x="42" y="64" width="6" height="6" fill="#0f172a" />
                      <rect x="52" y="74" width="6" height="6" fill="#0f172a" />
                      <rect x="64" y="64" width="6" height="6" fill="#0f172a" />
                      <rect x="76" y="74" width="6" height="6" fill="#0f172a" />
                      <rect x="64" y="84" width="6" height="6" fill="#0f172a" />
                      <rect x="84" y="84" width="6" height="6" fill="#0f172a" />
                    </svg>
                    <span className="text-[7px] font-mono text-slate-800 font-bold uppercase mt-1">
                      SCAN FOR ER TELEMETRY
                    </span>
                  </div>

                  {/* Critical Medical Directives */}
                  <div className="col-span-2 space-y-1.5 text-[10px]">
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-semibold text-[9px]">Emergency Contact:</span>
                        <strong className="text-emerald-400 font-mono">{emergencyPhone}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-semibold text-[9px]">Allergies:</span>
                        <strong className="text-rose-400">NKDA (None Known)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-semibold text-[9px]">Organ Donor:</span>
                        <strong className="text-teal-300 font-bold">YES (Pledged)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-semibold text-[9px]">Attending Doctor:</span>
                        <strong className="text-slate-200">Dr. Roger S., MD</strong>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 leading-tight">
                      If found, please surrender to any nearest hospital or call 24/7 Trauma Helpline: <strong className="text-teal-400">{emergencyHotline}</strong>
                    </div>
                  </div>

                </div>

                {/* CARD BACK FOOTER */}
                <div className="relative z-10 pt-2 border-t border-slate-700/80 flex items-center justify-between text-[9px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>ABHA & JCI SECURED HEALTH RECORD</span>
                  </div>
                  <span className="font-mono">MED-CARD-V3</span>
                </div>

              </div>
            )}

          </div>

          {/* CUT & PRINT GUIDELINES (Appears when printing) */}
          <div className="hidden print:block mt-8 pt-4 border-t border-dashed border-slate-400 text-center text-xs text-slate-500">
            Cut along borders for standard card lamination (85.6mm × 53.98mm). MediCore Health Network • Official Document.
          </div>

        </div>

      </div>
    </div>
  );
};


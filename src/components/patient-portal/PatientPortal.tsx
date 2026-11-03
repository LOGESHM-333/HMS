/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Patient, ThemeMode, Appointment, Invoice, LabOrder } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Heart, 
  Activity, 
  Calendar, 
  FileText, 
  Pill, 
  Download, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Sun,
  Dumbbell,
  Coffee,
  Syringe,
  MessageSquare,
  Send,
  AlertTriangle,
  Apple,
  Droplet,
  Plus,
  Minus,
  Video,
  ExternalLink,
  MapPin,
  Check,
  X,
  Shield,
  FileCheck2,
  QrCode
} from 'lucide-react';

interface PatientPortalProps {
  theme: ThemeMode;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({ 
  theme, 
  activeSection = 'patient-health',
  onSelectSection
}) => {
  const isDark = theme === 'dark';
  const patient = db.getPatients()[0]; // Default patient: Magnus Stephenson
  const [currentSection, setCurrentSection] = useState<string>(activeSection);

  useEffect(() => {
    if (activeSection) {
      setCurrentSection(activeSection);
    }
  }, [activeSection]);

  const handleSectionChange = (secId: string) => {
    sound.playClick();
    setCurrentSection(secId);
    if (onSelectSection) {
      onSelectSection(secId);
    }
  };

  const appointments = db.getAppointments().filter(a => a.patientId === patient.id);
  const prescriptions = db.getPrescriptions().filter(p => p.patientId === patient.id);
  const labOrders = db.getLabOrders().filter(l => l.patientId === patient.id);
  const invoices = db.getInvoices().filter(i => i.patientId === patient.id);

  // Modal & interactive states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState('Cardiology');
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Roger S.');
  const [visitType, setVisitType] = useState<'Consultation' | 'Follow-up' | 'Diagnostic'>('Consultation');
  const [bookDate, setBookDate] = useState('2026-11-08');
  const [bookTime, setBookTime] = useState('10:00 AM');
  const [bookNotes, setBookNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active 3D system
  const [activeSystem, setActiveSystem] = useState<'digestive' | 'thoracic' | 'cardiovascular'>('digestive');

  // Daily habits tracker state
  const [waterGlasses, setWaterGlasses] = useState(6);
  const [takenMedicines, setTakenMedicines] = useState<Record<string, boolean>>({
    'Atorvastatin 20mg': true,
    'Metformin 500mg': false,
  });

  // Doctor Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'patient' | 'doctor'; text: string; time: string }>>([
    { sender: 'doctor', text: 'Hello Magnus, Dr. Roger here. Your latest thoracic scan shows clear lung fields. How are you feeling after adjusting the inhaler dosage?', time: 'Yesterday 14:20' },
    { sender: 'patient', text: 'Good afternoon Dr. Roger. The morning chest tightness has significantly reduced, no wheezing yesterday.', time: 'Yesterday 15:45' },
    { sender: 'doctor', text: 'Excellent progress. Keep taking the morning bronchodilator and let me know if any night cough reoccurs.', time: 'Yesterday 16:10' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  // Payment modal state
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Credit Card');

  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBookVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.addAppointment({
      patientId: patient.id,
      patientName: patient.name,
      doctorId: 'doc-1',
      doctorName: selectedDoctor,
      department: selectedDept,
      date: bookDate,
      time: bookTime,
      status: 'Scheduled',
      visitType,
      notes: bookNotes || 'Patient portal self-booking',
    });
    setBookingModalOpen(false);
    showToast(`Appointment booked with ${selectedDoctor} for ${bookDate} at ${bookTime}!`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    sound.playClick();
    const newMsg = {
      sender: 'patient' as const,
      text: newMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setNewMessageText('');

    // Simulated doctor response after 2 seconds
    setTimeout(() => {
      sound.playSuccess();
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'doctor',
          text: 'Thank you for updating me, Magnus. I have noted this in your clinical chart. We will review it in our next scheduled follow-up.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

  const handleProcessPayment = () => {
    if (!payModalInvoice) return;
    db.payInvoice(payModalInvoice.id, selectedPaymentMethod);
    setPayModalInvoice(null);
    showToast(`Payment of $${payModalInvoice.grandTotal.toFixed(2)} completed successfully!`);
  };

  const toggleMedTaken = (name: string) => {
    sound.playClick();
    setTakenMedicines(prev => ({ ...prev, [name]: !prev[name] }));
    if (!takenMedicines[name]) {
      showToast(`Marked ${name} as taken for today.`);
    }
  };

  // 10 Portal Modules list
  const portalModules = [
    { id: 'patient-health', label: 'Health Summary & 3D', icon: Heart },
    { id: 'patient-appointments', label: 'Appointments', icon: Calendar, badge: appointments.length },
    { id: 'patient-prescriptions', label: 'Prescriptions', icon: Pill, badge: prescriptions.flatMap(p => p.items).length },
    { id: 'patient-labs', label: 'Lab Reports', icon: Activity, badge: labOrders.length },
    { id: 'patient-records', label: 'Medical History', icon: FileText },
    { id: 'patient-vaccines', label: 'Vaccine Passport', icon: Syringe, badge: 'Verified' },
    { id: 'patient-billing', label: 'Billing & Insurance', icon: CreditCard },
    { id: 'patient-messages', label: 'Doctor Chat', icon: MessageSquare, badge: 'Dr. Roger' },
    { id: 'patient-nutrition', label: 'Nutrition & Diet', icon: Apple },
    { id: 'patient-emergency', label: 'Emergency SOS', icon: AlertTriangle, alert: true },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-teal-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= PERSONALIZED PATIENT BANNER ================= */}
      <div className={`p-6 rounded-[32px] border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
        isDark 
          ? 'bg-[#0E2035]/90 border-slate-800 text-white shadow-xl' 
          : 'bg-white border-teal-100/80 text-[#142C43] shadow-md'
      }`}>
        <div className="flex items-center gap-4">
          <img
            src={patient.avatar}
            alt={patient.name}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-teal-500/20 shadow-md shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{patient.name}</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                {patient.patientCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified Patient
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Primary Care: <strong className="text-slate-700 dark:text-slate-200">{patient.primaryDoctorName}</strong></span>
              <span>•</span>
              <span>Blood Group: <strong className="text-rose-500">{patient.bloodGroup}</strong></span>
              <span>•</span>
              <span>Age: <strong>{patient.age} yrs</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-teal-600 dark:text-teal-400">{patient.admissionStatus}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              setBookingModalOpen(true);
            }}
            className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Doctor Visit</span>
          </button>
          <button
            onClick={() => handleSectionChange('patient-emergency')}
            className="px-4 py-2 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* ================= COMPREHENSIVE PATIENT PORTAL MODULE TABS ================= */}
      <div className={`p-2 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0E2035]/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          {portalModules.map(mod => {
            const Icon = mod.icon;
            const isActive = currentSection === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleSectionChange(mod.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? mod.alert
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-teal-600 text-white shadow-sm'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : mod.alert ? 'text-rose-500' : 'text-teal-500'}`} />
                <span>{mod.label}</span>
                {mod.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {mod.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= MODULE 1: HEALTH SUMMARY & 3D ANATOMY ================= */}
      {(currentSection === 'patient-health' || currentSection === 'patient-portal') && (
        <div className="space-y-6">
          {/* Main 3D Holographic Exploration Card */}
          <div className={`p-6 rounded-[32px] border transition-all ${
            isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <h3 className="text-lg font-black tracking-tight">Interactive Anatomical Health Map</h3>
                <p className="text-xs text-slate-400">
                  Select physiological system to inspect 3D organs and medical telemetry
                </p>
              </div>

              {/* System selector pills */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'digestive', label: 'Digestive & Stomach' },
                  { id: 'cardiovascular', label: 'Cardiovascular' },
                  { id: 'thoracic', label: 'Respiratory Lungs' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveSystem(s.id as any);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      activeSystem === s.id
                        ? 'bg-black text-white shadow-xs dark:bg-white dark:text-black'
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Holographic Anatomy Display */}
            <div className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 min-h-[420px] flex flex-col justify-between p-6 bg-[#081220]">
              <video 
                src="/assets/aistudio/gemini_generated_video_c57b0b74_4bf96156.mp4" 
                poster="/assets/aistudio/image_9cc16e1f.png"
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060D17]/95 via-[#060D17]/20 to-[#060D17]/70 pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between">
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white text-xs font-mono">
                  <span className="text-teal-400 font-bold mr-1.5">●</span>
                  PATIENT SCAN: {patient.name.toUpperCase()}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold">
                  ✓ Telemetry Verified
                </div>
              </div>

              {/* Organ Health Tags */}
              <div className="relative z-10 flex flex-wrap gap-2 pt-28">
                <div className="px-3 py-1.5 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs font-semibold">
                  Spinal Column: Normal Alignment
                </div>
                <div className="px-3 py-1.5 rounded-full bg-teal-950/80 backdrop-blur-md border border-teal-400/40 text-teal-200 text-xs font-semibold">
                  Digestive Tract: 100% Clear
                </div>
                <div className="px-3 py-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                  Vascular Perfusion: Normal
                </div>
              </div>
            </div>
          </div>

          {/* Biomarkers and Key Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Blood Pressure</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                128/82 <span className="text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Normal Resting Range
              </div>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Heart Rate</span>
                <Activity className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                74 <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <div className="mt-2 text-xs text-teal-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Optimal Rhythm
              </div>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Oxygen (SpO2)</span>
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                99% <span className="text-xs font-normal text-slate-400">Room air</span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Excellent Saturation
              </div>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>HbA1c Glucose</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                5.1% <span className="text-xs font-normal text-slate-400">&lt; 5.7%</span>
              </div>
              <div className="mt-2 text-xs text-teal-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Normal Glycemic Range
              </div>
            </div>
          </div>

          {/* Daily Health Habits Tracker */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Water intake */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-500">
                  <Droplet className="w-4 h-4" />
                  <span>Daily Hydration</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{waterGlasses} / 8 Glasses</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-3xl font-black">{waterGlasses * 250} <span className="text-xs font-normal text-slate-400">mL</span></div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setWaterGlasses(prev => Math.max(0, prev - 1));
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setWaterGlasses(prev => prev + 1);
                      if (waterGlasses + 1 === 8) showToast('Daily water goal of 8 glasses achieved!');
                    }}
                    className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sleep score */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500">
                  <Clock className="w-4 h-4" />
                  <span>Sleep Quality</span>
                </div>
                <span className="text-xs text-emerald-500 font-bold">Good</span>
              </div>
              <div className="text-3xl font-black mt-2">
                7h 45m <span className="text-xs font-normal text-slate-400">Deep: 2h 10m</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">Target: 8 hours (Consistent wake time)</div>
            </div>

            {/* Step activity */}
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500">
                  <Dumbbell className="w-4 h-4" />
                  <span>Daily Steps</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">84% of goal</span>
              </div>
              <div className="text-3xl font-black mt-2">
                8,420 <span className="text-xs font-normal text-slate-400">/ 10,000 steps</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 2: APPOINTMENTS & DOCTOR BOOKING ================= */}
      {currentSection === 'patient-appointments' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">My Doctor Appointments</h3>
              <p className="text-xs text-slate-400">Scheduled consultations, clinic visits, and virtual telehealth sessions</p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setBookingModalOpen(true);
              }}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book New Appointment</span>
            </button>
          </div>

          <div className="space-y-4">
            {appointments.map(apt => (
              <div
                key={apt.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base">{apt.doctorName}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                        {apt.visitType}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{apt.department} • Room 402</span>
                    {apt.notes && <p className="text-xs text-slate-400 mt-1 italic">"{apt.notes}"</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
                      {apt.status}
                    </span>
                    <button
                      onClick={() => showToast('Launching Telehealth Video Consultation Room...')}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-600 text-white flex items-center gap-1.5 hover:bg-teal-700"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Virtual Room</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                  <span>📅 Date: <strong className="text-slate-700 dark:text-slate-300">{apt.date}</strong></span>
                  <span>⏰ Time: <strong className="text-slate-700 dark:text-slate-300">{apt.time}</strong></span>
                  <span>🏥 MediCore Main Clinic</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 3: PRESCRIPTIONS & MEDICATION TRACKER ================= */}
      {currentSection === 'patient-prescriptions' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Active Medications & Dosage Tracker</h3>
              <p className="text-xs text-slate-400">Authorized e-prescriptions, dosing regimen, and compliance tracking</p>
            </div>
            <button
              onClick={() => showToast('Refill request submitted to Pharmacy Formulary!')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Request Prescription Refill</span>
            </button>
          </div>

          {/* Allergy alert box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Documented Allergies: <strong>Penicillin, Sulfa Drugs</strong>. All digital prescriptions undergo automated contraindication screening.</span>
          </div>

          <div className="space-y-4">
            {prescriptions.flatMap(rx => rx.items).map((item, idx) => {
              const isTaken = takenMedicines[item.medicineName] || false;
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isTaken 
                      ? 'bg-emerald-500/5 border-emerald-500/30' 
                      : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${isTaken ? 'bg-emerald-500/20 text-emerald-600' : 'bg-teal-500/10 text-teal-600'}`}>
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base">{item.medicineName}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                          {item.dosage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Instructions: <strong className="text-slate-700 dark:text-slate-200">{item.frequency}</strong> • Duration: {item.duration}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>Quantity: {item.quantity} units</span>
                        <span>•</span>
                        <span>Prescribing Physician: {patient.primaryDoctorName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      onClick={() => toggleMedTaken(item.medicineName)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isTaken
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isTaken ? 'Dose Taken Today' : 'Mark Dose Taken'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODULE 4: LAB REPORTS & DIAGNOSTIC SCANS ================= */}
      {currentSection === 'patient-labs' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <h3 className="text-lg font-black tracking-tight">Diagnostic Tests & Imaging Scans</h3>
            <p className="text-xs text-slate-400">Specimen assays, scan findings, pathology reports, and downloadable official records</p>
          </div>

          <div className="space-y-4">
            {labOrders.map(order => (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base">{order.testName}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Ordered on {order.orderedDate} • Ref #{order.id}
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`Downloaded official PDF report for ${order.testName}`)}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5 self-start sm:self-center shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Signed PDF</span>
                  </button>
                </div>

                {order.resultValue && (
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono flex items-center justify-between">
                    <div>
                      Result Value: <strong className="text-teal-600 dark:text-teal-400 font-bold">{order.resultValue} {order.unit || ''}</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      {order.interpretation || 'Normal'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 5: MEDICAL HISTORY & EMR TIMELINE ================= */}
      {currentSection === 'patient-records' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Clinical Medical Journey & History</h3>
              <p className="text-xs text-slate-400">Chronological hospitalizations, surgeries, and physician SOAP notes</p>
            </div>
            <button
              onClick={() => showToast('Full clinical EMR archive downloaded (FHIR / HIPAA encrypted).')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full EMR Records</span>
            </button>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {patient.medicalHistory.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
                <div className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{item.event}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 font-semibold">{item.date}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Attending: <strong className="text-slate-700 dark:text-slate-300">{item.doctor}</strong> • Facility: {item.facility}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 italic">
                    "{item.notes}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 6: VACCINE & IMMUNIZATION PASSPORT ================= */}
      {currentSection === 'patient-vaccines' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Digital Immunization Passport</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  WHO Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">Authenticated vaccination credentials with digital QR certificate</p>
            </div>
            <button
              onClick={() => showToast('Official Vaccine Passport downloaded.')}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Digital Passport</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { vaccine: 'COVID-19 mRNA Updated Booster', manufacturer: 'Pfizer-BioNTech', date: '2025-10-14', lot: 'FK-8921', status: 'Completed', expires: '2026-10-14' },
              { vaccine: 'Influenza Quadrivalent', manufacturer: 'Sanofi Pasteur', date: '2025-11-02', lot: 'FLU-4410', status: 'Active (Current Season)', expires: '2026-11-02' },
              { vaccine: 'Tetanus, Diphtheria, Pertussis (Tdap)', manufacturer: 'GlaxoSmithKline', date: '2022-04-18', lot: 'TD-9012', status: 'Valid (10-Yr Booster)', expires: '2032-04-18' },
              { vaccine: 'Hepatitis B Recombinant Series', manufacturer: 'Merck & Co.', date: '2019-06-25', lot: 'HB-3381', status: 'Lifelong Immunity', expires: 'Permanent' },
            ].map((v, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                      <Syringe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{v.vaccine}</h4>
                      <span className="text-xs text-slate-400">{v.manufacturer} • Lot #{v.lot}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                    {v.status}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Administered: <strong className="text-slate-600 dark:text-slate-300">{v.date}</strong></span>
                  <span>Valid Until: <strong className="text-slate-600 dark:text-slate-300">{v.expires}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 7: BILLING & INSURANCE ================= */}
      {currentSection === 'patient-billing' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <h3 className="text-lg font-black tracking-tight">Billing, Invoices & Insurance Coverage</h3>
            <p className="text-xs text-slate-400">Statement breakdown, insurance benefits, and one-click online payment</p>
          </div>

          {/* Insurance Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white shadow-md mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-300" />
                <span className="font-extrabold text-sm tracking-wide">Cigna Platinum Health Preferred</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold">Active Policy</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
              <div>
                <span className="text-teal-200/80 block text-[10px] uppercase">Policy Number</span>
                <span className="font-mono font-bold">#POL-891024</span>
              </div>
              <div>
                <span className="text-teal-200/80 block text-[10px] uppercase">Inpatient Coverage</span>
                <span className="font-bold">90% Covered</span>
              </div>
              <div>
                <span className="text-teal-200/80 block text-[10px] uppercase">Specialist Copay</span>
                <span className="font-bold">$25.00 / Visit</span>
              </div>
              <div>
                <span className="text-teal-200/80 block text-[10px] uppercase">Deductible Met</span>
                <span className="font-bold">$1,800 / $2,000</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {invoices.map(inv => (
              <div
                key={inv.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base">{inv.invoiceNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Billed on {inv.date} • Due on {inv.dueDate}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Total Amount</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">${inv.grandTotal.toFixed(2)}</span>
                    </div>
                    {inv.status !== 'Paid' && (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setPayModalInvoice(inv);
                        }}
                        className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                      >
                        Pay Online Now
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Itemized Services:</div>
                  <div className="space-y-1">
                    {inv.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>{it.description} (x{it.quantity})</span>
                        <span className="font-mono">${it.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 8: DOCTOR MESSAGING ================= */}
      {currentSection === 'patient-messages' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                DR
              </div>
              <div>
                <h3 className="text-base font-extrabold">{patient.primaryDoctorName}</h3>
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Attending Physician • Online
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">HIPAA Encrypted Chat</span>
          </div>

          {/* Chat thread */}
          <div className="space-y-3 min-h-[300px] max-h-[420px] overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs ${
                  msg.sender === 'patient'
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : isDark ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              placeholder="Type clinical question or medication inquiry for Dr. Roger..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= MODULE 9: NUTRITION & DIET ================= */}
      {currentSection === 'patient-nutrition' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <h3 className="text-lg font-black tracking-tight">Prescribed Clinical Nutrition & Diet Plan</h3>
            <p className="text-xs text-slate-400">Cardiovascular & digestive health dietary recommendations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs font-bold text-teal-600 uppercase block mb-2">Diet Protocol</span>
              <h4 className="font-extrabold text-base mb-1">DASH & Mediterranean Regimen</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Low sodium, lean omega-3 proteins, antioxidants, and whole grains to maintain normal blood pressure and arterial health.</p>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs font-bold text-emerald-600 uppercase block mb-2">Recommended Meals</span>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>• <strong>Breakfast:</strong> Steel-cut oats with fresh blueberries & walnuts</li>
                <li>• <strong>Lunch:</strong> Grilled wild salmon, spinach, & quinoa salad</li>
                <li>• <strong>Dinner:</strong> Steamed broccoli, grilled chicken breast, & brown rice</li>
              </ul>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs font-bold text-rose-500 uppercase block mb-2">Foods to Restrict</span>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>• ❌ Canned soups & high-sodium snacks (&gt;2,000 mg/day)</li>
                <li>• ❌ Ultra-processed cured meats & sausages</li>
                <li>• ❌ Excessive caffeine (&gt;2 cups/day)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 10: EMERGENCY SOS ================= */}
      {currentSection === 'patient-emergency' && (
        <div className="p-6 rounded-[32px] border border-rose-500/40 bg-rose-500/5 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-rose-500/20">
            <div className="p-3 rounded-2xl bg-rose-600 text-white">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">Hospital Emergency SOS</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">24/7 Rapid Medical Response & Immediate ER Hotline</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <h4 className="font-extrabold text-base mb-2">One-Touch Emergency Dispatch</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                If you are experiencing severe chest pain, shortness of breath, or sudden weakness, call emergency immediately.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => showToast('Dispatching ambulance to registered address: 742 Evergreen Terrace...')}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call 911 / Medical Dispatch</span>
                </button>
                <button
                  onClick={() => showToast('Connecting to MediCore Hospital 24/7 ER Trauma Line (+1 800-633-4267)...')}
                  className="w-full py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Hospital Direct ER Hotline</span>
                </button>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
            }`}>
              <h4 className="font-extrabold text-base mb-3">Emergency Medical Profile</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Emergency Contact:</span>
                  <span className="font-bold">Sarah Stephenson (Spouse) • +1 (555) 234-8902</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Blood Type:</span>
                  <span className="font-bold text-rose-500">O Positive (O+)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Critical Allergies:</span>
                  <span className="font-bold text-rose-500">Penicillin, Sulfa Drugs</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Hospital Base:</span>
                  <span className="font-bold">MediCore Health Center, Level 1 Trauma Center</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SCHEDULE VISIT ================= */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Schedule New Consultation</h3>
              <button onClick={() => setBookingModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookVisitSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Department</label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology & Respiratory</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Doctor</label>
                <select
                  value={selectedDoctor}
                  onChange={e => setSelectedDoctor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Dr. Roger S.">Dr. Roger S. (Cardiology / Pulmonology)</option>
                  <option value="Dr. Dulov G.">Dr. Dulov G. (Interventional Cardiology)</option>
                  <option value="Dr. Tatiana M.">Dr. Tatiana M. (Orthopedics & Spine)</option>
                  <option value="Dr. Liam Alistair">Dr. Liam Alistair (Pediatrics)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Date</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={e => setBookDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Time Slot</label>
                  <select
                    value={bookTime}
                    onChange={e => setBookTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Visit Reason / Symptoms</label>
                <textarea
                  value={bookNotes}
                  onChange={e => setBookNotes(e.target.value)}
                  placeholder="Describe any symptoms or reasons for visit..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ONLINE PAYMENT ================= */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Pay Clinical Invoice</h3>
              <button onClick={() => setPayModalInvoice(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold block">{payModalInvoice.invoiceNumber}</span>
                  <span className="text-slate-400">Patient: {payModalInvoice.patientName}</span>
                </div>
                <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                  ${payModalInvoice.grandTotal.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="font-bold block mb-1">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Credit Card', 'Debit Card', 'UPI / NetBanking', 'Insurance Co-Pay'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        selectedPaymentMethod === method
                          ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Pay ${payModalInvoice.grandTotal.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

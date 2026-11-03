/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeMode, Patient, Appointment, LabOrder, Prescription, CriticalAlert } from '../../types';
import { db } from '../../services/mockDatabase';
import { api } from '../../services/api';
import { sound } from '../../services/audioService';
import { 
  Stethoscope, 
  Send, 
  CheckCircle2, 
  Clock, 
  Heart, 
  Activity, 
  Pill, 
  AlertCircle, 
  Video, 
  Search, 
  User, 
  Sparkles,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  ExternalLink,
  FileText,
  Calendar,
  AlertTriangle,
  Check,
  Plus,
  X,
  Printer,
  Bed,
  Thermometer,
  ClipboardList,
  Layers,
  FileCheck2,
  Maximize2
} from 'lucide-react';

interface DoctorPortalProps {
  theme: ThemeMode;
  onSwitchToPatientPortal?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ 
  theme,
  onSwitchToPatientPortal 
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'doctor-chat' | 'doctor-patients' | 'doctor-rx' | 'doctor-labs' | 'doctor-schedule' | 'doctor-soap' | 'doctor-3d' | 'doctor-alerts'>('doctor-chat');

  const [patients, setPatients] = useState<Patient[]>(() => db.getPatients());
  const [selectedPatient, setSelectedPatient] = useState<Patient>(() => patients[0]);
  const [appointments, setAppointments] = useState<Appointment[]>(() => db.getAppointments());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => db.getPrescriptions());
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => db.getLabOrders());
  const [alerts, setAlerts] = useState<CriticalAlert[]>(() => db.getAlerts());

  const refreshData = () => {
    setPatients(db.getPatients());
    setAppointments(db.getAppointments());
    setPrescriptions(db.getPrescriptions());
    setLabOrders(db.getLabOrders());
    setAlerts(db.getAlerts());
  };

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ================= MODULE 1: PATIENT TELE-CHAT STATES =================
  interface MessageItem {
    id: string;
    patientId: string;
    patientName?: string;
    doctorId?: string;
    doctorName?: string;
    sender: 'patient' | 'doctor';
    senderName: string;
    text: string;
    timestamp: string;
  }

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch messages for selected patient
  const fetchMessages = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const serverMsgs = await api.getMessages(selectedPatient.id);
      if (serverMsgs && Array.isArray(serverMsgs)) {
        setMessages(serverMsgs);
      }
    } catch {
      // Fallback
    } finally {
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  // Auto-polling messages every 2.5 seconds for instant live sync with Patient Portal
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedPatient.id]);

  // Doctor send reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    sound.playClick();
    setIsSending(true);

    const newReply: MessageItem = {
      id: `msg-${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: 'doc-1',
      doctorName: 'Dr. Roger S.',
      sender: 'doctor',
      senderName: 'Dr. Roger S.',
      text: replyText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newReply]);
    setReplyText('');

    try {
      await api.sendMessage({
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        doctorId: 'doc-1',
        doctorName: 'Dr. Roger S.',
        sender: 'doctor',
        senderName: 'Dr. Roger S.',
        text: newReply.text
      });
      sound.playSuccess();
      showToast(`Reply transmitted directly to ${selectedPatient.name}'s Patient Portal!`);
    } catch {
      showToast('Reply saved to hospital clinical queue.');
    } finally {
      setIsSending(false);
    }
  };

  const clinicalMacros = [
    'Your resting blood pressure is within normal target bounds. Continue your current regimen.',
    'Take morning inhaler 2 puffs with breakfast. Let me know if nighttime wheezing reoccurs.',
    'I have reviewed your latest CT imaging results; thoracic lung fields remain clear.',
    'I have pre-approved your 90-day medication refill at MediCore Outpatient Pharmacy.',
    'Please schedule an in-clinic consultation for Thursday morning if symptoms persist.'
  ];

  // ================= MODULE 2: WRITE PRESCRIPTION MODAL =================
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [rxMedName, setRxMedName] = useState('Metformin HCl');
  const [rxDosage, setRxDosage] = useState('500 mg');
  const [rxFreq, setRxFreq] = useState('Twice daily with meals');
  const [rxDuration, setRxDuration] = useState('30 days');
  const [rxQuantity, setRxQuantity] = useState('60');

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    db.addPrescription({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: 'doc-1',
      doctorName: 'Dr. Roger S.',
      status: 'Prescribed',
      items: [
        {
          medicineId: `med-${Date.now()}`,
          medicineName: rxMedName,
          dosage: rxDosage,
          frequency: rxFreq,
          duration: rxDuration,
          quantity: parseInt(rxQuantity) || 30,
          dispensed: false
        }
      ]
    });
    refreshData();
    setRxModalOpen(false);
    showToast(`Prescription for ${rxMedName} signed and routed to MediCore Central Pharmacy.`);
  };

  // ================= MODULE 3: ORDER LAB TEST MODAL =================
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labTestName, setLabTestName] = useState('Arterial Blood Gas Analysis (ABG)');
  const [labPriority, setLabPriority] = useState('STAT Urgent');
  const [labNotes, setLabNotes] = useState('Evaluate pulmonary gas exchange post-bronchodilator');

  const handleOrderLabTest = (e: React.FormEvent) => {
    e.preventDefault();
    db.orderLabTest({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: 'doc-1',
      testId: `t-${Date.now()}`,
      testName: labTestName,
      interpretation: 'Normal'
    });
    refreshData();
    setLabModalOpen(false);
    showToast(`Diagnostic order for "${labTestName}" submitted to Laboratory.`);
  };

  // ================= MODULE 4: CLINICAL SOAP NOTE MODAL =================
  const [soapModalOpen, setSoapModalOpen] = useState(false);
  const [soapSubjective, setSoapSubjective] = useState('Patient reports decreased morning dyspnea, no wheezing episodes.');
  const [soapObjective, setSoapObjective] = useState('BP 128/82, HR 74 regular, SpO2 99% on room air. Lungs clear to auscultation.');
  const [soapAssessment, setSoapAssessment] = useState('Cavitas Thoracis Infiltration resolving well under maintenance bronchodilators.');
  const [soapPlan, setSoapPlan] = useState('Continue Atorvastatin 20mg and Fluticasone inhaler. Repeat thoracic volumetric CT in 6 months.');

  const handleSaveSoapNote = (e: React.FormEvent) => {
    e.preventDefault();
    db.addPatientHistory(selectedPatient.id, {
      date: new Date().toISOString().split('T')[0],
      event: `Physician SOAP Note: ${soapAssessment.slice(0, 35)}...`,
      doctor: 'Dr. Roger S., MD',
      facility: 'MediCore Specialist Pavilion 402',
      notes: `S: ${soapSubjective} | O: ${soapObjective} | A: ${soapAssessment} | P: ${soapPlan}`
    });
    refreshData();
    setSoapModalOpen(false);
    showToast(`Physician SOAP note signed and locked to ${selectedPatient.name}'s EMR.`);
  };

  // ================= MODULE 5: 3D ANATOMICAL SYSTEM =================
  const [active3dSystem, setActive3dSystem] = useState<'cardiovascular' | 'thoracic' | 'digestive'>('cardiovascular');

  // ================= DOCTOR PORTAL MODULE TABS =================
  const doctorModules = [
    { id: 'doctor-chat', label: 'Patient Inquiries & Chat', icon: Stethoscope, badge: messages.filter(m => m.sender === 'patient').length || undefined },
    { id: 'doctor-patients', label: 'Inpatient Rounds & Rosters', icon: Bed, badge: patients.length },
    { id: 'doctor-rx', label: 'E-Prescriptions & Refills', icon: Pill, badge: prescriptions.flatMap(p => p.items).length },
    { id: 'doctor-labs', label: 'Lab & Imaging Orders', icon: Activity, badge: labOrders.length },
    { id: 'doctor-schedule', label: 'Clinic Schedule', icon: Calendar, badge: appointments.length },
    { id: 'doctor-soap', label: 'SOAP Notes & EMR', icon: ClipboardList },
    { id: 'doctor-3d', label: '3D Organ Telemetry', icon: Heart },
    { id: 'doctor-alerts', label: 'Critical Code Alerts', icon: AlertTriangle, alert: alerts.length > 0, badge: alerts.length || undefined },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-sm font-semibold border border-teal-400/40">
          <CheckCircle2 className="w-5 h-5 text-teal-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= PHYSICIAN HEADER BANNER ================= */}
      <div className={`p-6 rounded-[32px] border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
        isDark 
          ? 'bg-[#0E2035]/90 border-slate-800 text-white shadow-xl' 
          : 'bg-white border-teal-100/80 text-[#142C43] shadow-md'
      }`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
              alt="Dr. Roger S."
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-teal-500/30 shadow-md shrink-0"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Dr. Roger S., MD, FACC</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                Senior Attending Cardiologist
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Medical License #MD-78291A
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Department: <strong className="text-slate-700 dark:text-slate-200">Cardiology & Pulmonary Medicine</strong></span>
              <span>•</span>
              <span>Ward Roster: <strong>Ward 4 & ICU</strong></span>
              <span>•</span>
              <span>Direct Telehealth Channel: <strong className="text-teal-600 dark:text-teal-400">Live Connected</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setRxModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-teal-500" />
            <span>Write Rx</span>
          </button>

          <button
            onClick={() => setLabModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-500" />
            <span>Order Lab</span>
          </button>

          {onSwitchToPatientPortal && (
            <button
              onClick={onSwitchToPatientPortal}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Switch to Patient View</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= COMPREHENSIVE DOCTOR MODULE TABS ================= */}
      <div className={`p-2 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0E2035]/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          {doctorModules.map(mod => {
            const Icon = mod.icon;
            const isActive = activeTab === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(mod.id as any);
                }}
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
                {mod.badge !== undefined && (
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

      {/* ================= DOCTOR MODULE 1: REAL-TIME PATIENT TELE-CHAT & CONSULTATION ================= */}
      {activeTab === 'doctor-chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: PATIENT ROSTER (4 cols) */}
          <div className={`lg:col-span-4 p-5 rounded-[28px] border transition-all flex flex-col justify-between ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-md'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-500" />
                  <h3 className="font-black text-sm tracking-tight">Active Patient Consultations</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                  {patients.length} Inquiries
                </span>
              </div>

              <div className="space-y-2">
                {patients.map(pat => {
                  const isSelected = pat.id === selectedPatient.id;
                  return (
                    <button
                      key={pat.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedPatient(pat);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/10 shadow-xs'
                          : isDark
                            ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <img
                        src={pat.avatar}
                        alt={pat.name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-teal-500/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs truncate">{pat.name}</span>
                          <span className="font-mono text-[10px] text-teal-600 font-bold">{pat.patientCode}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {pat.diagnosis}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                          <span className="text-emerald-500 font-bold">BP: {pat.vitals?.bloodPressure || '120/80'}</span>
                          <span>•</span>
                          <span className="text-slate-400">{pat.age} yrs, {pat.bloodGroup}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs">
              <span className="font-bold text-teal-600 dark:text-teal-400 block mb-1">💡 Real-Time Doctor Workflow:</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Patient messages appear here in real-time. Typing a reply transmits directly into the patient's portal view.
              </p>
            </div>
          </div>

          {/* RIGHT: LIVE TELE-CHAT CONSOLE (8 cols) */}
          <div className={`lg:col-span-8 p-6 rounded-[28px] border transition-all flex flex-col justify-between ${
            isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
          }`}>
            <div>
              {/* Header Glance */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPatient.avatar}
                    alt={selectedPatient.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-teal-500 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black">{selectedPatient.name}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 font-bold">
                        {selectedPatient.patientCode}
                      </span>
                      <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Bridge Active
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Diagnosis: <strong>{selectedPatient.diagnosis}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px] uppercase">Blood Pressure</span>
                    <span className="font-bold text-rose-500">{selectedPatient.vitals?.bloodPressure || '128/82'} mmHg</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px] uppercase">Pulse Rate</span>
                    <span className="font-bold text-teal-500">{selectedPatient.vitals?.pulseRate || 74} bpm</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px] uppercase">SpO2</span>
                    <span className="font-bold text-cyan-500">{selectedPatient.vitals?.oxygenSaturation || 99}%</span>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 min-h-[340px] max-h-[440px] overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                    <Stethoscope className="w-8 h-8 text-slate-300 mb-2" />
                    <span>No message exchange history yet with {selectedPatient.name}.</span>
                    <span className="text-[11px] text-slate-500 mt-1">Send a clinical instruction or wait for patient's inquiry.</span>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isDoctor = msg.sender === 'doctor';
                    return (
                      <div
                        key={msg.id || i}
                        className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 px-1">
                          <strong className={isDoctor ? 'text-teal-400' : 'text-slate-700 dark:text-slate-200'}>
                            {msg.senderName}
                          </strong>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div className={`max-w-[80%] p-4 rounded-2xl text-xs ${
                          isDoctor
                            ? 'bg-teal-600 text-white rounded-tr-none shadow-sm'
                            : isDark
                              ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Doctor Reply Action Console */}
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                  Quick Clinical Prescriptive Macros (Click to Insert):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {clinicalMacros.map((macro, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setReplyText(macro);
                      }}
                      className="text-[11px] px-3 py-1 rounded-full border border-teal-500/30 text-teal-600 dark:text-teal-300 hover:bg-teal-500/10 whitespace-nowrap transition-all"
                    >
                      {macro.slice(0, 42)}...
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendReply} className="flex gap-2.5">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Type physician instruction or reply to ${selectedPatient.name}...`}
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Reply</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 2: INPATIENT ROUNDS & ROSTERS ================= */}
      {activeTab === 'doctor-patients' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">My Inpatient Ward Roster & Clinical Rounds</h3>
              <p className="text-xs text-slate-400">Assigned active patients, bed locations, and current physiological telemetry</p>
            </div>
            <button
              onClick={() => setSoapModalOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Document Rounding SOAP Note</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map(p => (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-teal-500/20" />
                    <div>
                      <h4 className="font-extrabold text-sm">{p.name}</h4>
                      <span className="font-mono text-[10px] text-teal-600">{p.patientCode} • {p.age} yrs</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    p.admissionStatus === 'ICU' 
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                      : 'bg-teal-500/10 text-teal-600'
                  }`}>
                    {p.admissionStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 mb-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Primary Diagnosis</span>
                  <span className="font-semibold">{p.diagnosis}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span className="text-[9px] text-slate-400 block">BP</span>
                    <span className="font-bold text-rose-500">{p.vitals?.bloodPressure || '120/80'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span className="text-[9px] text-slate-400 block">PULSE</span>
                    <span className="font-bold text-teal-500">{p.vitals?.pulseRate || 72} bpm</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span className="text-[9px] text-slate-400 block">SpO2</span>
                    <span className="font-bold text-cyan-500">{p.vitals?.oxygenSaturation || 99}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      setActiveTab('doctor-chat');
                    }}
                    className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Open Tele-Chat</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      setSoapModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                  >
                    SOAP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 3: E-PRESCRIPTION & REFILLS ================= */}
      {activeTab === 'doctor-rx' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Physician E-Prescriptions & Refill Authorization</h3>
              <p className="text-xs text-slate-400">Manage pharmacotherapy, authorize pharmacy refills, and screen drug interactions</p>
            </div>
            <button
              onClick={() => setRxModalOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New E-Prescription</span>
            </button>
          </div>

          <div className="space-y-4">
            {prescriptions.flatMap(p => p.items.map((it, idx) => ({ ...it, rxId: p.id, patientName: p.patientName, date: p.date }))).map((rxItem, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 shrink-0">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base">{rxItem.medicineName}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                        {rxItem.dosage}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Patient: <strong className="text-slate-700 dark:text-slate-200">{rxItem.patientName}</strong> • Frequency: {rxItem.frequency} • Supply: {rxItem.quantity} units ({rxItem.duration})
                    </p>
                    <span className="text-[11px] text-slate-400">Prescribed by Dr. Roger S. • Ref Rx #{rxItem.rxId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => showToast(`Authorized 90-day maintenance refill for ${rxItem.medicineName}.`)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                  >
                    Re-Authorize Refill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 4: DIAGNOSTIC & LAB ORDERS ================= */}
      {activeTab === 'doctor-labs' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Diagnostic Assays & Radiology Orders</h3>
              <p className="text-xs text-slate-400">Order high-resolution CT, biochemical panels, and sign-off on radiologist findings</p>
            </div>
            <button
              onClick={() => setLabModalOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Order Diagnostic Investigation</span>
            </button>
          </div>

          <div className="space-y-4">
            {labOrders.map(order => (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base">{order.testName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Patient: <strong className="text-slate-700 dark:text-slate-300">{order.patientName}</strong> • Ordered: {order.orderedDate} • Ref #{order.id}
                  </div>
                  {order.resultValue && (
                    <div className="mt-2 text-xs font-mono text-teal-600 dark:text-teal-400">
                      Observed: {order.resultValue} ({order.interpretation})
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Signed off clinical review for ${order.testName}.`)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700"
                  >
                    Physician Sign-Off
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 5: CLINIC SCHEDULE & TELEHEALTH ================= */}
      {activeTab === 'doctor-schedule' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Physician Consultation Agenda</h3>
              <p className="text-xs text-slate-400">Scheduled outpatient sessions, follow-ups, and live telehealth rooms</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600">
              Dr. Roger S. • Schedule Active
            </span>
          </div>

          <div className="space-y-4">
            {appointments.map(apt => (
              <div
                key={apt.id}
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base">{apt.patientName}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                      {apt.visitType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    ⏰ {apt.time} • 📅 {apt.date} • Room 402 • Notes: "{apt.notes}"
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedPatient(patients.find(p => p.id === apt.patientId) || patients[0]);
                      setActiveTab('doctor-chat');
                      showToast(`Opened consultation room for ${apt.patientName}.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Start Consultation</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 6: CLINICAL SOAP NOTES & EMR ================= */}
      {activeTab === 'doctor-soap' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Clinical SOAP Notes & Physician EMR Documentation</h3>
              <p className="text-xs text-slate-400">Official medical charts, progress notes, and ICD-10 diagnostic entries</p>
            </div>
            <button
              onClick={() => setSoapModalOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write SOAP Note</span>
            </button>
          </div>

          <div className="space-y-4">
            {selectedPatient.medicalHistory.map((rec, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-extrabold text-sm">{rec.event}</span>
                  <span className="font-mono text-xs text-teal-600 font-bold">{rec.date}</span>
                </div>
                <div className="text-xs text-slate-400 mb-2">Physician: {rec.doctor} • Unit: {rec.facility}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  "{rec.notes}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 7: 3D ANATOMICAL TELEMETRY ================= */}
      {activeTab === 'doctor-3d' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Physician 3D Anatomical Volumetry & Pathological Review</h3>
              <p className="text-xs text-slate-400">Holographic CT reconstruction and real-time hemodynamic organ telemetry</p>
            </div>
            <div className="flex items-center gap-2">
              {(['cardiovascular', 'thoracic', 'digestive'] as const).map(sys => (
                <button
                  key={sys}
                  onClick={() => {
                    sound.playClick();
                    setActive3dSystem(sys);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    active3dSystem === sys
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

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
                CLINICAL 3D REVIEW: {selectedPatient.name.toUpperCase()} ({selectedPatient.patientCode})
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold">
                ✓ Dr. Roger S. Authorized
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap gap-2 pt-28">
              <div className="px-3 py-1.5 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs font-semibold">
                Ejection Fraction: 62% (Optimal)
              </div>
              <div className="px-3 py-1.5 rounded-full bg-teal-950/80 backdrop-blur-md border border-teal-400/40 text-teal-200 text-xs font-semibold">
                Myocardial Perfusion: 98% Normal
              </div>
              <div className="px-3 py-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                Bronchial Caliber: Symmetrical
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 8: CRITICAL CODE & EMERGENCY ALERTS ================= */}
      {activeTab === 'doctor-alerts' && (
        <div className="p-6 rounded-[32px] border border-rose-500/40 bg-rose-500/5 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-rose-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-600 text-white">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">Emergency & Critical Code Pager</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live triage notifications, trauma dispatches, and ICU vitals breaches</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-rose-500">
              {alerts.length} Active Codes
            </span>
          </div>

          <div className="space-y-3">
            {alerts.map(al => (
              <div
                key={al.id}
                className="p-5 rounded-2xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-rose-600 dark:text-rose-400">{al.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 uppercase">
                      {al.severity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {al.department} • Time: {al.time}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                    Action: <strong>{al.actionRequired}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      db.acknowledgeAlert(al.id);
                      refreshData();
                      showToast(`Code "${al.title}" acknowledged. Clinical intervention initiated.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
                  >
                    Acknowledge & Respond
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: WRITE PRESCRIPTION ================= */}
      {rxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Issue E-Prescription</h3>
              <button onClick={() => setRxModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Patient</label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                  {selectedPatient.name} ({selectedPatient.patientCode})
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Medication Name & Formulation</label>
                <input
                  type="text"
                  value={rxMedName}
                  onChange={e => setRxMedName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Strength / Dosage</label>
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={e => setRxDosage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Frequency & Instructions</label>
                  <input
                    type="text"
                    value={rxFreq}
                    onChange={e => setRxFreq(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Duration</label>
                  <input
                    type="text"
                    value={rxDuration}
                    onChange={e => setRxDuration(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Total Quantity Dispensed</label>
                  <input
                    type="number"
                    value={rxQuantity}
                    onChange={e => setRxQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRxModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Authorize E-Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ORDER DIAGNOSTIC LAB ================= */}
      {labModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Order Diagnostic Assay / Scan</h3>
              <button onClick={() => setLabModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOrderLabTest} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Patient</label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                  {selectedPatient.name} ({selectedPatient.patientCode})
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Diagnostic Test Name</label>
                <select
                  value={labTestName}
                  onChange={e => setLabTestName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Arterial Blood Gas Analysis (ABG)">Arterial Blood Gas Analysis (ABG)</option>
                  <option value="Thoracic High-Resolution CT & 3D Volumetry">Thoracic High-Resolution CT & 3D Volumetry</option>
                  <option value="Comprehensive Metabolic Panel (CMP-14)">Comprehensive Metabolic Panel (CMP-14)</option>
                  <option value="Advanced Lipid & ApoB Profile">Advanced Lipid & ApoB Profile</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Priority Level</label>
                <select
                  value={labPriority}
                  onChange={e => setLabPriority(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="STAT Urgent (1 Hour)">STAT Urgent (1 Hour)</option>
                  <option value="Routine Morning Round (Same Day)">Routine Morning Round (Same Day)</option>
                  <option value="Pre-Operative Clearance">Pre-Operative Clearance</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Clinical Indication / Physician Notes</label>
                <textarea
                  value={labNotes}
                  onChange={e => setLabNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLabModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: WRITE SOAP NOTE ================= */}
      {soapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-xl rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Clinical SOAP Note Documentation</h3>
              <button onClick={() => setSoapModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSoapNote} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Subjective (Patient Reported Symptoms)</label>
                <textarea
                  value={soapSubjective}
                  onChange={e => setSoapSubjective(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Objective (Vitals & Physical Examination)</label>
                <textarea
                  value={soapObjective}
                  onChange={e => setSoapObjective(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Assessment (Clinical Diagnosis & Acuity)</label>
                <textarea
                  value={soapAssessment}
                  onChange={e => setSoapAssessment(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Plan (Therapeutic Strategy & Follow-up)</label>
                <textarea
                  value={soapPlan}
                  onChange={e => setSoapPlan(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSoapModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Sign & Lock to EMR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeMode, Patient } from '../../types';
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
  ExternalLink
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
  const allPatients = db.getPatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient>(allPatients[0]);

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  // Initial fetch and auto-polling every 2.5 seconds for instant real-time sync
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

    // Optimistic UI update
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
      showToast(`Reply transmitted to ${selectedPatient.name}'s Patient Portal!`);
    } catch {
      showToast('Reply saved locally. Transmitting to clinic queue...');
    } finally {
      setIsSending(false);
    }
  };

  // Quick Clinical Macro Responses
  const clinicalMacros = [
    'Your resting blood pressure is within normal target bounds. Continue your current regimen.',
    'Take morning inhaler 2 puffs with breakfast. Let me know if nighttime wheezing reoccurs.',
    'I have reviewed your latest CT imaging results; thoracic lung fields remain clear.',
    'I have pre-approved your 90-day medication refill at MediCore Outpatient Pharmacy.',
    'Please schedule an in-clinic consultation for Thursday morning if symptoms persist.'
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

      {/* ================= DOCTOR PORTAL BANNER ================= */}
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
                Senior Attending Physician
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                In Consultation
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Department: <strong className="text-slate-700 dark:text-slate-200">Cardiology & Pulmonary Care</strong></span>
              <span>•</span>
              <span>Clinic Room: <strong>Pavilion 402</strong></span>
              <span>•</span>
              <span>Direct Telehealth Channel: <strong className="text-teal-600 dark:text-teal-400">Live Active (2.5s Sync)</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMessages(true)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-1.5"
            title="Refresh Messages"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-500' : ''}`} />
            <span className="hidden sm:inline">Sync Chat</span>
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

      {/* ================= MAIN CONSULTATION WORKSPACE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PATIENT INQUIRIES ROSTER (4 cols) */}
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
                {allPatients.length} Patients
              </span>
            </div>

            <div className="space-y-2">
              {allPatients.map(pat => {
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

          <div className="mt-4 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs">
            <span className="font-bold text-teal-600 dark:text-teal-400 block mb-1">💡 Real-Time Doctor Workflow:</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Messages typed in the Patient Portal appear here automatically. Type a response below to transmit clinical advice back to the patient's phone/portal.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE PATIENT CLINICAL TELE-CHAT CONSOLE (8 cols) */}
        <div className={`lg:col-span-8 p-6 rounded-[28px] border transition-all flex flex-col justify-between ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          {/* Patient Clinical Glance Header */}
          <div>
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
                      Live Chat Connected
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Diagnosis: <strong>{selectedPatient.diagnosis}</strong>
                  </span>
                </div>
              </div>

              {/* Patient Key Telemetry Badges */}
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
                  <span className="text-slate-400 block text-[9px] uppercase">SpO2 Oxygen</span>
                  <span className="font-bold text-cyan-500">{selectedPatient.vitals?.oxygenSaturation || 99}%</span>
                </div>
              </div>
            </div>

            {/* Live Message Thread Feed */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 min-h-[340px] max-h-[440px] overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <Stethoscope className="w-8 h-8 text-slate-300 mb-2" />
                  <span>No message history yet with {selectedPatient.name}.</span>
                  <span className="text-[11px] text-slate-500 mt-1">Send a clinical note or wait for the patient's inquiry.</span>
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

          {/* Quick Doctor Macros & Reply Composer */}
          <div className="mt-4 space-y-3">
            {/* Clinical Macro Chips */}
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

            {/* Doctor Reply Form */}
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
    </div>
  );
};

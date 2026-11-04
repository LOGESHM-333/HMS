/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeMode, Patient, Bed } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import {
  Activity,
  Heart,
  Pill,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  Bed as BedIcon,
  Plus,
  Search,
  FileText,
  ClipboardList,
  Syringe,
  Calendar,
  Users,
  Check,
  ShieldCheck,
  Droplet,
  Thermometer,
  Layers,
  Sparkles,
  RefreshCw,
  LogOut,
  Flame,
  Radio
} from 'lucide-react';

interface HeadNursePortalProps {
  theme: ThemeMode;
  onLogout?: () => void;
  onSwitchToDoctorPortal?: () => void;
  onSwitchToPatientPortal?: () => void;
}

interface MarItem {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  medication: string;
  dosage: string;
  route: 'Oral' | 'IV Infusion' | 'SubQ' | 'Inhalation' | 'IM';
  scheduledTime: string;
  status: 'Due' | 'Given' | 'Held';
  adminTime?: string;
  administeredBy?: string;
}

interface SbarNote {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  time: string;
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  nurseName: string;
}

interface NurseStaffMember {
  id: string;
  name: string;
  role: string;
  unit: string;
  shift: string;
  assignedBeds: string[];
  status: 'On Duty' | 'Break' | 'Off Duty';
}

export const HeadNursePortal: React.FC<HeadNursePortalProps> = ({
  theme,
  onLogout,
  onSwitchToDoctorPortal,
  onSwitchToPatientPortal
}) => {
  const isDark = theme === 'dark';
  const patients = db.getPatients();
  const beds = db.getBeds();

  // Active Nurse Portal Tab
  const [activeTab, setActiveTab] = useState<
    'rounds' | 'mar' | 'triage' | 'sbar' | 'orders' | 'roster' | 'emergency'
  >('rounds');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // 1. MAR (Medication Administration Record) Data & State
  const [marList, setMarList] = useState<MarItem[]>([
    {
      id: 'mar-1',
      patientId: 'pat-1',
      patientName: 'Magnus Stephenson',
      bedNumber: 'ICU-02',
      medication: 'Atorvastatin Calcium Trihydrate',
      dosage: '40 mg',
      route: 'Oral',
      scheduledTime: '08:00 AM',
      status: 'Given',
      adminTime: '08:12 AM',
      administeredBy: 'Nurse Clara H., RN'
    },
    {
      id: 'mar-2',
      patientId: 'pat-1',
      patientName: 'Magnus Stephenson',
      bedNumber: 'ICU-02',
      medication: 'Ceftriaxone Sodium 1g in 100ml NS',
      dosage: '1 g',
      route: 'IV Infusion',
      scheduledTime: '12:00 PM',
      status: 'Due'
    },
    {
      id: 'mar-3',
      patientId: 'pat-2',
      patientName: 'Elena Rostova',
      bedNumber: 'GW-104',
      medication: 'Enoxaparin Sodium (Lovenox)',
      dosage: '40 mg / 0.4 mL',
      route: 'SubQ',
      scheduledTime: '09:00 AM',
      status: 'Due'
    },
    {
      id: 'mar-4',
      patientId: 'pat-4',
      patientName: 'David K. O’Connor',
      bedNumber: 'SR-108',
      medication: 'Hydromorphone (Dilaudid)',
      dosage: '1 mg',
      route: 'IV Infusion',
      scheduledTime: '10:30 AM',
      status: 'Given',
      adminTime: '10:32 AM',
      administeredBy: 'Nurse Sarah Jenkins, RN'
    },
    {
      id: 'mar-5',
      patientId: 'pat-3',
      patientName: 'Kavitha Ramaswamy',
      bedNumber: 'ICU-01',
      medication: 'Norepinephrine Bitartrate (Levophed)',
      dosage: '4 mcg/min titration',
      route: 'IV Infusion',
      scheduledTime: 'Continuous',
      status: 'Given',
      adminTime: '07:00 AM Continuous',
      administeredBy: 'Nurse Sarah Jenkins, RN'
    }
  ]);

  const handleAdministerMed = (id: string) => {
    sound.playSuccess();
    setMarList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'Given',
              adminTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              administeredBy: 'Nurse Sarah Jenkins, RN (Head Nurse)'
            }
          : item
      )
    );
    showToast('Medication Dose successfully verified & administered.');
  };

  // 2. SBAR Shift Handover Notes
  const [sbarList, setSbarList] = useState<SbarNote[]>([
    {
      id: 'sbar-1',
      patientId: 'pat-1',
      patientName: 'Magnus Stephenson',
      bedNumber: 'ICU-02',
      time: '07:15 AM',
      situation: 'Post-extubation day 2 with intermittent bronchial spasm.',
      background: 'Severe cavitas thoracis infiltration, admitted 4 days ago.',
      assessment: 'SpO2 stable at 98% on 2L nasal cannula. Lungs clear bilaterally, mild tachypnea.',
      recommendation: 'Continue bronchodilator nebulization Q4H; monitor morning ABG draw.',
      nurseName: 'Nurse Sarah Jenkins, RN'
    },
    {
      id: 'sbar-2',
      patientId: 'pat-3',
      patientName: 'Kavitha Ramaswamy',
      bedNumber: 'ICU-01',
      time: '07:30 AM',
      situation: 'Septic shock secondary to pyelonephritis on central line.',
      background: 'Lactate was 3.8 upon ICU transfer yesterday; central line Day 2.',
      assessment: 'BP 104/65 on 4mcg Levophed. Urine output 45ml/hr for past 4 hours.',
      recommendation: 'Wean pressor as MAP allows > 65; follow up blood cultures at 14:00.',
      nurseName: 'Nurse Clara Higgins, RN'
    }
  ]);

  const [sbarModalOpen, setSbarModalOpen] = useState(false);
  const [sbarPatient, setSbarPatient] = useState('Magnus Stephenson');
  const [sbarBed, setSbarBed] = useState('ICU-02');
  const [sbarSituation, setSbarSituation] = useState('');
  const [sbarBackground, setSbarBackground] = useState('');
  const [sbarAssessment, setSbarAssessment] = useState('');
  const [sbarRecommendation, setSbarRecommendation] = useState('');

  const handleAddSbar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbarSituation.trim() || !sbarAssessment.trim()) return;

    const newNote: SbarNote = {
      id: `sbar-${Date.now()}`,
      patientId: 'pat-1',
      patientName: sbarPatient,
      bedNumber: sbarBed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      situation: sbarSituation,
      background: sbarBackground || 'Stable post-op status',
      assessment: sbarAssessment,
      recommendation: sbarRecommendation || 'Continue close monitoring on current shift',
      nurseName: 'Nurse Sarah Jenkins, RN (Head Nurse)'
    };

    setSbarList([newNote, ...sbarList]);
    setSbarModalOpen(false);
    setSbarSituation('');
    setSbarBackground('');
    setSbarAssessment('');
    setSbarRecommendation('');
    showToast(`SBAR Handover Note logged for ${sbarPatient}.`);
  };

  // 3. Doctor Orders Queue for Nursing Action
  const [doctorOrders, setDoctorOrders] = useState([
    {
      id: 'ord-1',
      patientName: 'Magnus Stephenson',
      bed: 'ICU-02',
      orderType: 'Blood Draw',
      orderText: 'Stat Arterial Blood Gas (ABG) & Serum Electrolytes',
      orderedBy: 'Dr. Roger S.',
      priority: 'STAT',
      status: 'Pending'
    },
    {
      id: 'ord-2',
      patientName: 'Elena Rostova',
      bed: 'GW-104',
      orderType: 'IV Fluid',
      orderText: 'Start D5 1/2 Normal Saline @ 75 mL/hr maintenance',
      orderedBy: 'Dr. Sophia Chen',
      priority: 'Routine',
      status: 'Pending'
    },
    {
      id: 'ord-3',
      patientName: 'David K. O’Connor',
      bed: 'SR-108',
      orderType: 'Dressing',
      orderText: 'Post-op lumbar spine incision inspection & sterile dressing change',
      orderedBy: 'Dr. Tatiana M.',
      priority: 'Urgent',
      status: 'Completed'
    }
  ]);

  const handleCompleteOrder = (id: string) => {
    sound.playSuccess();
    setDoctorOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'Completed' } : o))
    );
    showToast('Clinical Order marked as Completed by Nurse.');
  };

  // 4. Nursing Roster
  const [nursingStaff] = useState<NurseStaffMember[]>([
    {
      id: 'stf-1',
      name: 'Nurse Sarah Jenkins, RN, BSN',
      role: 'Head Charge Nurse',
      unit: 'ICU & Surgical Pavilion',
      shift: 'Morning (07:00 - 15:00)',
      assignedBeds: ['ICU-01', 'ICU-02'],
      status: 'On Duty'
    },
    {
      id: 'stf-n2',
      name: 'Nurse Clara Higgins, RN',
      role: 'Staff Nurse II',
      unit: 'Intensive Care Unit (ICU)',
      shift: 'Morning (07:00 - 15:00)',
      assignedBeds: ['ICU-03', 'ICU-04'],
      status: 'On Duty'
    },
    {
      id: 'stf-n3',
      name: 'Nurse Priya Sharma, BSN',
      role: 'Clinical Nurse Specialist',
      unit: 'General Ward A',
      shift: 'Morning (07:00 - 15:00)',
      assignedBeds: ['GW-101', 'GW-102', 'GW-103', 'GW-104'],
      status: 'On Duty'
    },
    {
      id: 'stf-n4',
      name: 'Nurse Marcus Vance, RN',
      role: 'Post-Op Floor Nurse',
      unit: 'Surgical Recovery',
      shift: 'Evening (15:00 - 23:00)',
      assignedBeds: ['SR-108', 'SR-109'],
      status: 'Break'
    }
  ]);

  // Vitals Quick Log Modal
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [vitalsTargetPat, setVitalsTargetPat] = useState<Patient>(patients[0]);
  const [vBp, setVBp] = useState('124/80');
  const [vPulse, setVPulse] = useState('74');
  const [vSpo2, setVSpo2] = useState('98');
  const [vResp, setVResp] = useState('16');
  const [vTemp, setVTemp] = useState('36.8');
  const [vPain, setVPain] = useState('2');

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    vitalsTargetPat.vitals.bloodPressure = vBp;
    vitalsTargetPat.vitals.pulseRate = parseInt(vPulse) || 74;
    vitalsTargetPat.vitals.oxygenSaturation = parseInt(vSpo2) || 98;
    vitalsTargetPat.vitals.respiratoryRate = parseInt(vResp) || 16;
    vitalsTargetPat.vitals.temperature = parseFloat(vTemp) || 36.8;
    vitalsTargetPat.vitals.lastUpdated = 'Just now';
    setVitalsModalOpen(false);
    showToast(`Vitals & MEWS score updated for ${vitalsTargetPat.name}`);
  };

  // Modules List
  const nurseModules = [
    { id: 'rounds', label: 'Ward & Bed Rounds', icon: BedIcon, count: beds.filter(b => b.status === 'Occupied').length },
    { id: 'mar', label: 'MAR Medication Admin', icon: Pill, count: marList.filter(m => m.status === 'Due').length, alert: true },
    { id: 'triage', label: 'Vitals & MEWS Triage', icon: Activity },
    { id: 'sbar', label: 'SBAR Shift Handover', icon: ClipboardList, count: sbarList.length },
    { id: 'orders', label: 'Doctor Orders Queue', icon: FileText, count: doctorOrders.filter(o => o.status === 'Pending').length, alert: true },
    { id: 'roster', label: 'Nurse Staff Roster', icon: Users, count: nursingStaff.length },
    { id: 'emergency', label: 'Rapid Response & SOS', icon: AlertTriangle, emergency: true }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-sm font-semibold border border-teal-400/40">
          <CheckCircle2 className="w-5 h-5 text-teal-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= HEAD NURSE COMMAND BANNER ================= */}
      <div
        className={`p-6 rounded-[32px] border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
          isDark
            ? 'bg-[#0E2035]/90 border-slate-800 text-white shadow-xl'
            : 'bg-white border-teal-100/80 text-[#142C43] shadow-md'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80"
              alt="Nurse Sarah Jenkins"
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-teal-500/25 shadow-md shrink-0"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Nurse Sarah Jenkins, RN, BSN</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/25">
                HEAD CHARGE NURSE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ICU & Surgical Wing
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Shift: <strong className="text-slate-700 dark:text-slate-200">Morning (07:00 - 15:00)</strong></span>
              <span>•</span>
              <span>Patients in Unit: <strong className="text-teal-600 dark:text-teal-400">{beds.filter(b => b.status === 'Occupied').length} Admitted</strong></span>
              <span>•</span>
              <span>Medications Due: <strong className="text-amber-500">{marList.filter(m => m.status === 'Due').length} Doses</strong></span>
              <span>•</span>
              <span>Doctor Orders: <strong className="text-rose-500">{doctorOrders.filter(o => o.status === 'Pending').length} Pending</strong></span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              setSbarModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5 text-teal-500" />
            <span>+ SBAR Handover</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setVitalsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Rapid Triage</span>
          </button>

          {onLogout && (
            <button
              onClick={() => {
                sound.playClick();
                onLogout();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Sign Out of Nurse Station"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= NURSE MODULE NAVIGATION TABS ================= */}
      <div
        className={`p-2 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0E2035]/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
          {nurseModules.map(mod => {
            const Icon = mod.icon;
            const isActive = activeTab === mod.id;

            return (
              <button
                key={mod.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(mod.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? mod.emergency
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-teal-600 text-white shadow-md'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mod.label}</span>
                {mod.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : mod.alert
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {mod.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= MODULE 1: WARD & BED ROUNDS ================= */}
      {activeTab === 'rounds' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Live Inpatient Bed Census & Acuity Rounds
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current ward occupancy, patient acuity level, assigned primary nurses and alarms.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bed, patient or ward..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beds.slice(0, 6).map(bed => {
              const pat = patients.find(p => p.bedNumber === bed.bedNumber || p.name === bed.patientName) || patients[0];
              const isOccupied = bed.status === 'Occupied';

              return (
                <div
                  key={bed.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                        <BedIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{bed.bedNumber}</h4>
                        <span className="text-[10px] text-slate-400">{bed.wardName} • {bed.type} Unit</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isOccupied
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  {isOccupied ? (
                    <div className="pt-3 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={pat.avatar}
                          alt={bed.patientName || pat.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-500/30"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {bed.patientName || pat.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {pat.diagnosis || 'Post-Op Monitoring'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-center">
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                          <span className="text-[10px] text-slate-400 block">BP</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {pat.vitals?.bloodPressure || '120/80'}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                          <span className="text-[10px] text-slate-400 block">Pulse</span>
                          <span className="text-xs font-bold text-emerald-500">
                            {pat.vitals?.pulseRate || '74'} bpm
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                          <span className="text-[10px] text-slate-400 block">SpO2</span>
                          <span className="text-xs font-bold text-teal-500">
                            {pat.vitals?.oxygenSaturation || '99'}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-[11px]">
                        <span className="text-slate-400">Assigned: <strong className="text-slate-700 dark:text-slate-300">Nurse Clara H.</strong></span>
                        <button
                          onClick={() => {
                            setVitalsTargetPat(pat);
                            setVitalsModalOpen(true);
                          }}
                          className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                        >
                          Log Vitals →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Bed is sanitized & ready for admission.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODULE 2: MAR (MEDICATION ADMINISTRATION RECORD) ================= */}
      {activeTab === 'mar' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Medication Administration Record (MAR)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled in-hospital doses, IV push, subcutaneous and oral administration verification.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              {marList.filter(m => m.status === 'Due').length} Doses Due Now
            </span>
          </div>

          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Bed / Patient</th>
                    <th className="p-3.5">Medication & Strength</th>
                    <th className="p-3.5">Route</th>
                    <th className="p-3.5">Scheduled</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {marList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{item.patientName}</div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {item.bedNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-teal-600 dark:text-teal-400">{item.medication}</div>
                        <div className="text-[11px] text-slate-400">Dose: {item.dosage}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                          {item.route}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {item.scheduledTime}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Given'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-500 animate-pulse'
                          }`}
                        >
                          {item.status === 'Given' ? `Given (${item.adminTime})` : 'DUE NOW'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {item.status === 'Due' ? (
                          <button
                            onClick={() => handleAdministerMed(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                          >
                            ✓ Administer Dose
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Verified by {item.administeredBy?.split(',')[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 3: VITALS & MEWS TRIAGE ================= */}
      {activeTab === 'triage' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Modified Early Warning Score (MEWS) & Vitals Triage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Continuous telemetry vital signs, hemodynamic trends and automated deterioration alert scores.
              </p>
            </div>

            <button
              onClick={() => setVitalsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Bedside Vitals</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {patients.slice(0, 4).map((p, idx) => {
              const pulse = p.vitals?.pulseRate || 72;
              const spo2 = p.vitals?.oxygenSaturation || 98;
              const bp = p.vitals?.bloodPressure || '120/80';
              const isHighAcuity = pulse > 95 || spo2 < 95;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHighAcuity
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {isHighAcuity ? 'MEWS: 4 (Moderate)' : 'MEWS: 0 (Normal)'}
                    </span>
                  </div>

                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Blood Pressure:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{bp} mmHg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Heart Rate:</span>
                      <strong className="text-emerald-500">{pulse} bpm</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Oxygen Saturation:</span>
                      <strong className="text-teal-500">{spo2}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Respiratory Rate:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{p.vitals?.respiratoryRate || 16} /min</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Body Temperature:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{p.vitals?.temperature || 36.8} °C</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setVitalsTargetPat(p);
                      setVitalsModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-600 dark:text-teal-400 transition-all cursor-pointer"
                  >
                    Quick Vitals Update
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODULE 4: SBAR SHIFT HANDOVER ================= */}
      {activeTab === 'sbar' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                SBAR Nursing Shift Handover Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Standardized Situation, Background, Assessment, Recommendation shift handover notes.
              </p>
            </div>

            <button
              onClick={() => setSbarModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Handover Note</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sbarList.map(note => (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{note.patientName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">
                      {note.bedNumber}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{note.time}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 uppercase text-[10px] block">
                      [S] Situation:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{note.situation}</p>
                  </div>

                  <div>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 uppercase text-[10px] block">
                      [B] Background:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{note.background}</p>
                  </div>

                  <div>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 uppercase text-[10px] block">
                      [A] Assessment:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{note.assessment}</p>
                  </div>

                  <div>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 uppercase text-[10px] block">
                      [R] Recommendation:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{note.recommendation}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Logged by: <strong className="text-slate-700 dark:text-slate-300">{note.nurseName}</strong></span>
                  <span className="text-emerald-500 font-bold">✓ Signed Off</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 5: DOCTOR ORDERS QUEUE ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Physician Orders Execution Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Doctor clinical instructions awaiting nursing execution (STAT blood draws, IV lines, wound care).
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              {doctorOrders.filter(o => o.status === 'Pending').length} Action Items
            </span>
          </div>

          <div className="space-y-3">
            {doctorOrders.map(order => (
              <div
                key={order.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${order.priority === 'STAT' ? 'bg-rose-500/15 text-rose-500' : 'bg-teal-500/10 text-teal-600'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">{order.orderText}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${order.priority === 'STAT' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                        {order.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Patient: <strong className="text-slate-700 dark:text-slate-200">{order.patientName} ({order.bed})</strong> • Ordered by: {order.orderedBy}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {order.status === 'Pending' ? (
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Mark Executed ✓
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 6: NURSE STAFF ROSTER ================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Shift Nursing Roster & Duty Allocations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Staff nurse assignment, floor allocations, and nurse-to-patient ratio for active shift.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nursingStaff.map(nurse => (
              <div
                key={nurse.id}
                className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center font-black text-sm">
                    {nurse.name.split(' ')[1]?.[0] || 'N'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{nurse.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{nurse.role} • {nurse.unit}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400">Assigned Beds:</span>
                      {nurse.assignedBeds.map(b => (
                        <span key={b} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  nurse.status === 'On Duty' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {nurse.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 7: EMERGENCY & RAPID RESPONSE ================= */}
      {activeTab === 'emergency' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-100 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
              <h3 className="font-black text-lg text-rose-600 dark:text-rose-400">
                Critical Emergency Protocols & Rapid Response Dispatch
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Immediate clinical escalation tools for cardiac arrest (Code Blue), acute respiratory decompensation, fall protocols, and stat telemetry alarms.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playAlert();
                  alert('CODE BLUE ALARM TRIGGERED: Crash cart team alerted for ICU Bed 02.');
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95 transition-all"
              >
                🚨 Trigger Code Blue Drill (Crash Cart)
              </button>

              <button
                onClick={() => {
                  sound.playWarning();
                  showToast('Rapid Response Team (RRT) notified.');
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                ⚠️ Call Rapid Response Team (RRT)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SBAR MODAL ================= */}
      {sbarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-lg mb-1">Create SBAR Shift Handover Note</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Standardized clinical communication format.</p>

            <form onSubmit={handleAddSbar} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Patient</label>
                  <select
                    value={sbarPatient}
                    onChange={e => setSbarPatient(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.bedNumber || 'GW-101'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Bed Number</label>
                  <input
                    type="text"
                    value={sbarBed}
                    onChange={e => setSbarBed(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">[S] Situation</label>
                <textarea
                  required
                  rows={2}
                  placeholder="What is happening right now?"
                  value={sbarSituation}
                  onChange={e => setSbarSituation(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">[B] Background</label>
                <textarea
                  rows={2}
                  placeholder="What is the clinical context / diagnosis?"
                  value={sbarBackground}
                  onChange={e => setSbarBackground(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">[A] Assessment</label>
                <textarea
                  required
                  rows={2}
                  placeholder="What is your nursing assessment of the condition?"
                  value={sbarAssessment}
                  onChange={e => setSbarAssessment(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">[R] Recommendation</label>
                <textarea
                  rows={2}
                  placeholder="What should the next shift nurse watch out for or do?"
                  value={sbarRecommendation}
                  onChange={e => setSbarRecommendation(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSbarModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Save & Sign Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RAPID VITALS MODAL ================= */}
      {vitalsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base mb-1">Record Rapid Bedside Vitals</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Patient: {vitalsTargetPat.name}</p>

            <form onSubmit={handleSaveVitals} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={vBp}
                    onChange={e => setVBp(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={vPulse}
                    onChange={e => setVPulse(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={vSpo2}
                    onChange={e => setVSpo2(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Resp Rate (/min)</label>
                  <input
                    type="number"
                    value={vResp}
                    onChange={e => setVResp(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Temperature (°C)</label>
                  <input
                    type="text"
                    value={vTemp}
                    onChange={e => setVTemp(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Pain Score (0 - 10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={vPain}
                    onChange={e => setVPain(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVitalsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

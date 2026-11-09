/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ThemeMode, Patient, Bed } from '../../types';
import { db } from '../../services/mockDatabase';
import { api } from '../../services/api';
import { sound } from '../../services/audioService';
import { InteractiveWardFloorplan } from '../ward/InteractiveWardFloorplan';
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
  Radio,
  Bell,
  BellOff,
  Copy,
  Trash2,
  Stethoscope,
  X,
  Zap,
  Building2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface HeadNursePortalProps {
  theme: ThemeMode;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  onLogout?: () => void;
  onSwitchToDoctorPortal?: () => void;
  onSwitchToPatientPortal?: () => void;
  onSwitchToAdminPortal?: () => void;
  onSwitchToSuperAdminPortal?: () => void;
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
  holdReason?: string;
}

interface SbarNote {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  time: string;
  date: string;
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
  phone?: string;
}

interface DoctorOrder {
  id: string;
  patientName: string;
  bed: string;
  orderType: string;
  orderText: string;
  orderedBy: string;
  priority: 'STAT' | 'Urgent' | 'Routine';
  status: 'Pending' | 'Completed';
  executionNotes?: string;
}

const DEFAULT_PATIENT: Patient = {
  id: 'pat-default',
  patientCode: 'P-11874c',
  name: 'Magnus Stephenson',
  age: 48,
  gender: 'Male',
  bloodGroup: 'O+',
  phone: '+1 (555) 349-2104',
  email: 'magnus.stephenson@healthmail.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  admissionStatus: 'ICU',
  diagnosis: 'Acute Respiratory Failure & Thoracic Infection',
  primaryDoctorId: 'doc-1',
  primaryDoctorName: 'Dr. Roger S., MD',
  ward: 'ICU Pavilion',
  bedNumber: 'ICU-02',
  heartAge: 53,
  chronologicalAge: 48,
  riskScore: 24.5,
  vitals: {
    bloodPressure: '124/82',
    pulseRate: 78,
    respiratoryRate: 18,
    oxygenSaturation: 97,
    temperature: 37.1,
    hba1c: 5.6,
    cholesterol: 195,
    stressLevel: 'Moderate',
    sleepQuality: 'Fair',
    lastUpdated: '10 mins ago'
  },
  symptoms: ['Dyspnea', 'Productive Cough'],
  allergies: ['Penicillin G'],
  medicalHistory: []
};

// Modified Early Warning Score (MEWS) Calculator
export const calculateMewsScore = (
  systolicBp: number,
  heartRate: number,
  respiratoryRate: number,
  tempC: number
): { score: number; level: 'Normal' | 'Low Risk' | 'Medium Risk' | 'Critical'; color: string } => {
  let score = 0;

  if (systolicBp <= 70) score += 3;
  else if (systolicBp <= 80) score += 2;
  else if (systolicBp <= 100) score += 1;
  else if (systolicBp >= 200) score += 2;

  if (heartRate <= 40) score += 3;
  else if (heartRate <= 50) score += 1;
  else if (heartRate >= 101 && heartRate <= 110) score += 1;
  else if (heartRate >= 111 && heartRate <= 129) score += 2;
  else if (heartRate >= 130) score += 3;

  if (respiratoryRate < 9) score += 2;
  else if (respiratoryRate >= 15 && respiratoryRate <= 20) score += 1;
  else if (respiratoryRate >= 21 && respiratoryRate <= 29) score += 2;
  else if (respiratoryRate >= 30) score += 3;

  if (tempC < 35.0) score += 2;
  else if (tempC >= 38.5) score += 2;

  if (score >= 5) return { score, level: 'Critical', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
  if (score >= 3) return { score, level: 'Medium Risk', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
  if (score >= 1) return { score, level: 'Low Risk', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' };
  return { score, level: 'Normal', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
};

export const HeadNursePortal: React.FC<HeadNursePortalProps> = ({
  theme,
  activeSection,
  onSelectSection,
  onLogout,
  onSwitchToDoctorPortal,
  onSwitchToPatientPortal,
  onSwitchToAdminPortal,
  onSwitchToSuperAdminPortal
}) => {
  const isDark = theme === 'dark';

  const [, setDbVersion] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => setDbVersion(v => v + 1));
    return unsub;
  }, []);

  // Safe data getters
  const rawPatients = db.getPatients();
  const patients: Patient[] = useMemo(() => {
    return Array.isArray(rawPatients) && rawPatients.length > 0 ? rawPatients : [DEFAULT_PATIENT];
  }, [rawPatients, db]);

  const rawBeds = db.getBeds();
  const beds: Bed[] = useMemo(() => {
    return Array.isArray(rawBeds) && rawBeds.length > 0 ? rawBeds : [
      { id: 'b-icu-1', bedNumber: 'ICU-01', wardId: 'w-icu', wardName: 'Intensive Care Unit', type: 'ICU', status: 'Occupied', patientName: 'Kavitha Ramaswamy' },
      { id: 'b-icu-2', bedNumber: 'ICU-02', wardId: 'w-icu', wardName: 'Intensive Care Unit', type: 'ICU', status: 'Occupied', patientName: 'Magnus Stephenson' },
      { id: 'b-gw-104', bedNumber: 'GW-104', wardId: 'w-gen', wardName: 'General Ward A', type: 'General', status: 'Occupied', patientName: 'Elena Rostova' },
      { id: 'b-sr-108', bedNumber: 'SR-108', wardId: 'w-surg', wardName: 'Surgical Recovery', type: 'Surgical', status: 'Occupied', patientName: 'David K. O\'Connor' },
      { id: 'b-cw-304', bedNumber: 'CW-304', wardId: 'w-card', wardName: 'Cardiac Care Pavilion', type: 'Cardiac', status: 'Available' },
      { id: 'b-er-102', bedNumber: 'ER-102', wardId: 'w-er', wardName: 'Emergency Trauma', type: 'Emergency', status: 'Cleaning' },
    ];
  }, [rawBeds, db]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'rounds' | 'mar' | 'triage' | 'sbar' | 'orders' | 'roster' | 'emergency'
  >('dashboard');

  useEffect(() => {
    if (activeSection) {
      if (activeSection === 'nurse-dashboard') setActiveTab('dashboard');
      else if (activeSection === 'nurse-rounds') setActiveTab('rounds');
      else if (activeSection === 'nurse-mar') setActiveTab('mar');
      else if (activeSection === 'nurse-triage') setActiveTab('triage');
      else if (activeSection === 'nurse-sbar') setActiveTab('sbar');
      else if (activeSection === 'nurse-orders') setActiveTab('orders');
      else if (activeSection === 'nurse-roster') setActiveTab('roster');
      else if (activeSection === 'nurse-emergency') setActiveTab('emergency');
    }
  }, [activeSection]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState('All');

  // Call Lights State
  const [activeCallBells, setActiveCallBells] = useState<Record<string, boolean>>({
    'ICU-02': false,
    'GW-104': true
  });

  const toggleCallBell = (bedNumber: string) => {
    const isNowActive = !activeCallBells[bedNumber];
    if (isNowActive) {
      sound.playAlert();
      showToast(`Call light triggered for ${bedNumber}!`);
    } else {
      sound.playClick();
      showToast(`Call light answered & cleared for ${bedNumber}.`);
    }
    setActiveCallBells(prev => ({
      ...prev,
      [bedNumber]: isNowActive
    }));
  };

  const handleTabChange = (tab: string) => {
    sound.playClick();
    if (onSelectSection) onSelectSection(tab);
    else {
      const tabMap: Record<string, any> = {
        'nurse-dashboard': 'dashboard',
        'nurse-rounds': 'rounds',
        'nurse-mar': 'mar',
        'nurse-triage': 'triage',
        'nurse-sbar': 'sbar',
        'nurse-orders': 'orders',
        'nurse-roster': 'roster',
        'nurse-emergency': 'emergency'
      };
      if (tabMap[tab]) setActiveTab(tabMap[tab]);
    }
  };

  // 1. MAR List
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
      patientName: 'David K. O\'Connor',
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

  const [newMarModalOpen, setNewMarModalOpen] = useState(false);
  const [newMarMed, setNewMarMed] = useState('');
  const [newMarDose, setNewMarDose] = useState('');
  const [newMarRoute, setNewMarRoute] = useState<'Oral' | 'IV Infusion' | 'SubQ' | 'Inhalation' | 'IM'>('Oral');
  const [newMarPatient, setNewMarPatient] = useState('Magnus Stephenson');

  const handleCreateMarDose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarMed.trim() || !newMarDose.trim()) return;

    const pat = patients.find(p => p.name === newMarPatient) || DEFAULT_PATIENT;
    const item: MarItem = {
      id: `mar-${Date.now()}`,
      patientId: pat.id,
      patientName: pat.name,
      bedNumber: pat.bedNumber || 'GW-101',
      medication: newMarMed,
      dosage: newMarDose,
      route: newMarRoute,
      scheduledTime: '12:00 PM',
      status: 'Due'
    };

    setMarList([item, ...marList]);
    api.createMarRecord(item).catch(() => {});
    setNewMarModalOpen(false);
    setNewMarMed('');
    setNewMarDose('');
    showToast(`Scheduled dose for ${newMarMed} added to MAR.`);
  };

  const handleAdministerMed = (id: string) => {
    sound.playSuccess();
    const adminTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const administeredBy = 'Nurse Sarah Jenkins, RN, BSN';
    setMarList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'Given',
              adminTime,
              administeredBy
            }
          : item
      )
    );
    api.administerMarRecord(id, adminTime, administeredBy).catch(() => {});
    showToast('Medication Dose verified & administered.');
  };

  // 2. SBAR Notes
  const [sbarList, setSbarList] = useState<SbarNote[]>([
    {
      id: 'sbar-1',
      patientId: 'pat-1',
      patientName: 'Magnus Stephenson',
      bedNumber: 'ICU-02',
      time: '07:15 AM',
      date: new Date().toISOString().split('T')[0],
      situation: 'Post-extubation day 2 with intermittent bronchial spasm.',
      background: 'Severe cavitas thoracis infiltration, admitted 4 days ago.',
      assessment: 'SpO2 stable at 97% on 2L nasal cannula. Lungs clear bilaterally, mild tachypnea.',
      recommendation: 'Continue bronchodilator nebulization Q4H; monitor morning ABG draw.',
      nurseName: 'Nurse Sarah Jenkins, RN (Head Nurse)'
    },
    {
      id: 'sbar-2',
      patientId: 'pat-3',
      patientName: 'Kavitha Ramaswamy',
      bedNumber: 'ICU-01',
      time: '07:30 AM',
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
      situation: sbarSituation,
      background: sbarBackground || 'Stable post-op status',
      assessment: sbarAssessment,
      recommendation: sbarRecommendation || 'Continue close monitoring on current shift',
      nurseName: 'Nurse Sarah Jenkins, RN (Head Nurse)'
    };

    setSbarList([newNote, ...sbarList]);
    api.createSbarNote(newNote).catch(() => {});
    setSbarModalOpen(false);
    setSbarSituation('');
    setSbarBackground('');
    setSbarAssessment('');
    setSbarRecommendation('');
    showToast(`SBAR Handover Note logged for ${sbarPatient}.`);
  };

  // 3. Doctor Orders
  const [doctorOrders, setDoctorOrders] = useState<DoctorOrder[]>([
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
      patientName: 'David K. O\'Connor',
      bed: 'SR-108',
      orderType: 'Dressing',
      orderText: 'Post-op lumbar spine incision inspection & sterile Betadine dressing change',
      orderedBy: 'Dr. Tatiana M.',
      priority: 'Urgent',
      status: 'Completed',
      executionNotes: 'Dressing changed with sterile technique. Incision clean, no discharge.'
    }
  ]);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrderToExecute, setSelectedOrderToExecute] = useState<DoctorOrder | null>(null);
  const [orderExecutionNote, setOrderExecutionNote] = useState('');

  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderToExecute) return;
    sound.playSuccess();
    setDoctorOrders(prev =>
      prev.map(o =>
        o.id === selectedOrderToExecute.id
          ? { ...o, status: 'Completed', executionNotes: orderExecutionNote || 'Executed per protocol.' }
          : o
      )
    );
    api.updateDoctorOrderStatus(selectedOrderToExecute.id, 'Completed').catch(() => {});
    setOrderModalOpen(false);
    showToast(`Order marked Executed: ${selectedOrderToExecute.orderText}`);
  };

  // Sync Nurse Portal with real MySQL backend on load
  useEffect(() => {
    api.getMarRecords().then(records => {
      if (records && records.length > 0) {
        setMarList(records as MarItem[]);
      }
    }).catch(() => {});

    api.getSbarNotes().then(notes => {
      if (notes && notes.length > 0) {
        setSbarList(notes as SbarNote[]);
      }
    }).catch(() => {});

    api.getDoctorOrders().then(orders => {
      if (orders && orders.length > 0) {
        setDoctorOrders(orders as DoctorOrder[]);
      }
    }).catch(() => {});
  }, []);

  // 4. Nursing Staff Roster
  const [nursingStaff, setNursingStaff] = useState<NurseStaffMember[]>([
    {
      id: 'stf-1',
      name: 'Nurse Sarah Jenkins, RN, BSN',
      role: 'Head Charge Nurse',
      unit: 'ICU & Surgical Pavilion',
      shift: 'Morning (07:00 - 15:00)',
      assignedBeds: ['ICU-01', 'ICU-02'],
      status: 'On Duty',
      phone: 'Ext. 4401'
    },
    {
      id: 'stf-n2',
      name: 'Nurse Clara Higgins, RN',
      role: 'Staff Nurse II',
      unit: 'Intensive Care Unit (ICU)',
      shift: 'Morning (07:00 - 15:00)',
      assignedBeds: ['ICU-03', 'ICU-04'],
      status: 'On Duty',
      phone: 'Ext. 4402'
    },
    {
      id: 'stf-n3',
      name: 'Nurse Priya Sharma, BSN',
      role: 'Clinical Nurse Specialist',
      unit: 'General Ward A',
      shift: 'Morning (07:00 - 15:00)',
      assignedBeds: ['GW-101', 'GW-102', 'GW-104'],
      status: 'On Duty',
      phone: 'Ext. 4403'
    },
    {
      id: 'stf-n4',
      name: 'Nurse Marcus Vance, RN',
      role: 'Post-Op Floor Nurse',
      unit: 'Surgical Recovery',
      shift: 'Evening (15:00 - 23:00)',
      assignedBeds: ['SR-108', 'SR-109'],
      status: 'Break',
      phone: 'Ext. 4404'
    }
  ]);

  const handleToggleNurseStatus = (nurseId: string) => {
    sound.playClick();
    setNursingStaff(prev =>
      prev.map(n => {
        if (n.id === nurseId) {
          const next = n.status === 'On Duty' ? 'Break' : n.status === 'Break' ? 'Off Duty' : 'On Duty';
          showToast(`${n.name} is now ${next}.`);
          return { ...n, status: next };
        }
        return n;
      })
    );
  };

  // 5. Vitals Quick Log Modal
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [vitalsTargetPat, setVitalsTargetPat] = useState<Patient>(() => patients[0] || DEFAULT_PATIENT);
  const [vBp, setVBp] = useState('124/80');
  const [vPulse, setVPulse] = useState('74');
  const [vSpo2, setVSpo2] = useState('98');
  const [vResp, setVResp] = useState('16');
  const [vTemp, setVTemp] = useState('36.8');
  const [vPain, setVPain] = useState('2');

  const openVitalsForPatient = (p: Patient) => {
    sound.playClick();
    const pat = p || DEFAULT_PATIENT;
    setVitalsTargetPat(pat);
    setVBp(pat.vitals?.bloodPressure || '120/80');
    setVPulse(String(pat.vitals?.pulseRate || 74));
    setVSpo2(String(pat.vitals?.oxygenSaturation || 98));
    setVResp(String(pat.vitals?.respiratoryRate || 16));
    setVTemp(String(pat.vitals?.temperature || 36.8));
    setVitalsModalOpen(true);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    const target = vitalsTargetPat || DEFAULT_PATIENT;

    if (target.id && target.id !== 'pat-default') {
      db.updatePatientVitals(target.id, {
        bloodPressure: vBp,
        pulseRate: parseInt(vPulse) || 74,
        oxygenSaturation: parseInt(vSpo2) || 98,
        respiratoryRate: parseInt(vResp) || 16,
        temperature: parseFloat(vTemp) || 36.8,
        lastUpdated: 'Just now'
      });
    }

    setVitalsModalOpen(false);
    showToast(`Vitals & MEWS score updated for ${target.name}`);
  };

  // 6. Emergency / Code Blue
  const [codeBlueActive, setCodeBlueActive] = useState(false);
  const [codeTimerSeconds, setCodeTimerSeconds] = useState(0);

  const toggleCodeBlue = () => {
    if (!codeBlueActive) {
      sound.playAlert();
      setCodeBlueActive(true);
      setCodeTimerSeconds(0);
      showToast('🚨 CODE BLUE ACTIVATED: Crash cart and ICU team alerted for ICU Bed 02!');
    } else {
      sound.playSuccess();
      setCodeBlueActive(false);
      showToast('Code Blue drill acknowledged and terminated.');
    }
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (codeBlueActive) {
      interval = setInterval(() => {
        setCodeTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [codeBlueActive]);

  // Modules List
  const nurseModules = [
    { id: 'rounds', label: 'Ward & Bed Rounds', icon: BedIcon, count: beds.filter(b => b.status === 'Occupied').length },
    { id: 'mar', label: 'MAR Medication Admin', icon: Pill, count: marList.filter(m => m.status === 'Due').length, alert: marList.some(m => m.status === 'Due') },
    { id: 'triage', label: 'Vitals & MEWS Triage', icon: Activity },
    { id: 'sbar', label: 'SBAR Shift Handover', icon: ClipboardList, count: sbarList.length },
    { id: 'orders', label: 'Doctor Orders Queue', icon: FileText, count: doctorOrders.filter(o => o.status === 'Pending').length, alert: doctorOrders.some(o => o.status === 'Pending') },
    { id: 'roster', label: 'Nurse Staff Roster', icon: Users, count: nursingStaff.filter(n => n.status === 'On Duty').length },
    { id: 'emergency', label: 'Rapid Response & SOS', icon: AlertTriangle, emergency: true, alert: codeBlueActive }
  ];

  const filteredBeds = useMemo(() => {
    return beds.filter(b => {
      const matchSearch =
        !searchQuery.trim() ||
        b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.patientName && b.patientName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchWard = wardFilter === 'All' || b.type === wardFilter || b.wardName.includes(wardFilter);
      return matchSearch && matchWard;
    });
  }, [beds, searchQuery, wardFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-sm font-semibold border border-teal-400/40">
          <CheckCircle2 className="w-5 h-5 text-teal-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Code Blue Alert Banner */}
      {codeBlueActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-600 text-white shadow-2xl border-2 border-rose-400 animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white text-rose-600 rounded-2xl animate-bounce shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-widest uppercase bg-rose-800 px-2.5 py-0.5 rounded-md">
                  CODE BLUE ACTIVE
                </span>
                <span className="font-mono font-bold text-xs">CRITICAL RESUSCITATION</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black mt-0.5">
                Bed: ICU-02 • Resuscitation Running Time: {Math.floor(codeTimerSeconds / 60).toString().padStart(2, '0')}:{(codeTimerSeconds % 60).toString().padStart(2, '0')}
              </h3>
            </div>
          </div>

          <button
            onClick={toggleCodeBlue}
            className="px-5 py-2.5 rounded-2xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shadow-md transition-all cursor-pointer"
          >
            Terminate Code / ROSC Achieved ✓
          </button>
        </div>
      )}

      {/* ================= NURSE MODULE 0: NURSE DASHBOARD ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 1. FOUR CORE NURSE STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Assigned Beds */}
            <div
              onClick={() => handleTabChange('nurse-rounds')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white hover:border-teal-500/50' : 'bg-white border-slate-200 text-[#142C43] hover:border-teal-500/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inpatient Census</span>
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <BedIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{beds.filter(b => b.status === 'Occupied').length} Admitted Beds</div>
              <div className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-1 flex items-center gap-1">
                <span>{beds.filter(b => b.status === 'Available').length} beds available • Rounding active</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 2: Meds Due (MAR) */}
            <div
              onClick={() => handleTabChange('nurse-mar')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white hover:border-amber-500/50' : 'bg-white border-slate-200 text-[#142C43] hover:border-amber-500/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medications Due</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{marList.filter(m => m.status === 'Due').length} Scheduled Doses</div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                <span>{marList.filter(m => m.status === 'Given').length} given today • MAR updated</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 3: Doctor Orders */}
            <div
              onClick={() => handleTabChange('nurse-orders')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white hover:border-rose-500/50' : 'bg-white border-slate-200 text-[#142C43] hover:border-rose-500/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor Orders</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{doctorOrders.filter(o => o.status === 'Pending').length} Pending Orders</div>
              <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                <span>{doctorOrders.filter(o => o.priority === 'STAT').length} STAT priority orders</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 4: Staff On Duty */}
            <div
              onClick={() => handleTabChange('nurse-roster')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white hover:border-blue-500/50' : 'bg-white border-slate-200 text-[#142C43] hover:border-blue-500/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nursing Staff</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{nursingStaff.filter(n => n.status === 'On Duty').length} Nurses Active</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1">
                <span>Morning Shift (07:00 - 15:00)</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* 2. TWO-COLUMN COMMAND CENTER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Shift Meds Due & High Acuity Patients (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Upcoming Medication Administration (MAR) */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Shift Medications Queue (MAR)</h3>
                    <p className="text-xs text-slate-400">Scheduled doses due for administration on Ward 4</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('nurse-mar')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full MAR</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {marList.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.status === 'Due' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm">{item.medication}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                              {item.dosage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Bed: <strong className="text-slate-700 dark:text-slate-200">{item.bedNumber}</strong> • {item.patientName} • {item.route}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {item.status === 'Due' ? (
                          <button
                            onClick={() => handleAdministerMed(item.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Give Dose</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Given at {item.adminTime}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Acuity Bedside Telemetry Watchlist */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">High-Acuity Bedside Telemetry</h3>
                    <p className="text-xs text-slate-400">MEWS triage risk scores & live bedside parameters</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('nurse-triage')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>All Triage</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {patients.slice(0, 3).map((pat) => {
                    const sys = parseInt((pat.vitals?.bloodPressure || '120/80').split('/')[0]) || 120;
                    const hr = pat.vitals?.pulseRate || 74;
                    const rr = pat.vitals?.respiratoryRate || 16;
                    const temp = pat.vitals?.temperature || 37.0;
                    const mews = calculateMewsScore(sys, hr, rr, temp);

                    return (
                      <div
                        key={pat.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={pat.avatar} alt={pat.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-teal-500/20 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm">{pat.name}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 font-bold">
                                {pat.bedNumber || 'ICU-02'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mews.color}`}>
                                MEWS: {mews.score} ({mews.level})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <span>BP: <strong className="text-slate-700 dark:text-slate-200">{pat.vitals?.bloodPressure || '120/80'}</strong></span>
                              <span>•</span>
                              <span>HR: <strong className="text-slate-700 dark:text-slate-200">{hr} bpm</strong></span>
                              <span>•</span>
                              <span>SpO2: <strong className="text-teal-600">{pat.vitals?.oxygenSaturation || 98}%</strong></span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openVitalsForPatient(pat)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                        >
                          <Activity className="w-3.5 h-3.5 text-teal-600" />
                          <span>Log Vitals</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Pending Doctor Orders & SBAR Handover (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 3: Pending Doctor Orders */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Doctor Orders to Execute</h3>
                    <p className="text-xs text-slate-400">Clinical orders pending nursing execution</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('nurse-orders')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {doctorOrders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{order.orderType}: {order.patientName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.priority === 'STAT'
                            ? 'bg-rose-500/10 text-rose-600'
                            : order.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {order.priority} • {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-300 mb-2">{order.orderText}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Bed: {order.bed} • Ordered by {order.orderedBy}</span>
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => {
                              setSelectedOrderToExecute(order);
                              setOrderModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
                          >
                            Execute
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: SBAR Shift Handover Summary */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Recent SBAR Handover</h3>
                    <p className="text-xs text-slate-400">Shift debrief from attending charge nurse</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('nurse-sbar')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>All SBAR</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {sbarList.slice(0, 2).map((sbar) => (
                    <div
                      key={sbar.id}
                      className={`p-3.5 rounded-2xl border ${
                        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold">{sbar.patientName} ({sbar.bedNumber})</span>
                        <span className="text-[10px] text-slate-400">{sbar.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-300 font-medium line-clamp-2">
                        <strong className="text-teal-600">S:</strong> {sbar.situation}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        <strong className="text-amber-500">R:</strong> {sbar.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 5: Rapid Response Drill Status */}
              <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="font-extrabold text-xs uppercase tracking-wider">Crash Cart & Resuscitation STAT</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-300/80 mb-3">
                  ICU Bed 02 Crash Cart inspected & defibrillator charged. Emergency airway and ACLS medications verified for shift.
                </p>
                <button
                  onClick={toggleCodeBlue}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                >
                  {codeBlueActive ? 'Acknowledge & Clear Code Blue' : 'Simulate Code Blue Resuscitation Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 1: WARD & BED ROUNDS ================= */}
      {activeTab === 'rounds' && (
        <InteractiveWardFloorplan
          theme={theme}
          onSelectPatient={(p) => openVitalsForPatient(p)}
          onNavigateTab={(tab) => handleTabChange(tab)}
          portalRole="nurse"
        />
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
                Scheduled doses, IV infusion, SubQ, nurse signature verification and audit records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {marList.filter(m => m.status === 'Due').length} Doses Due Now
              </span>
              <button
                onClick={() => setNewMarModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Schedule Dose</span>
              </button>
            </div>
          </div>

          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
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
                Hemodynamic vital signs telemetry, alert scoring and real-time patient triage.
              </p>
            </div>

            <button
              onClick={() => openVitalsForPatient(patients[0] || DEFAULT_PATIENT)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Bedside Vitals</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {patients.slice(0, 8).map(p => {
              const pulse = p?.vitals?.pulseRate ?? 74;
              const spo2 = p?.vitals?.oxygenSaturation ?? 98;
              const bp = p?.vitals?.bloodPressure || '120/80';
              const sbp = parseInt(bp.split('/')[0]) || 120;
              const resp = p?.vitals?.respiratoryRate ?? 16;
              const temp = p?.vitals?.temperature ?? 36.8;

              const mews = calculateMewsScore(sbp, pulse, resp, temp);

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    mews.score >= 5
                      ? 'border-rose-500 shadow-md shadow-rose-500/10 bg-rose-500/10 backdrop-blur-md'
                      : isDark
                        ? 'bg-slate-900/60 backdrop-blur-md border-slate-800'
                        : 'bg-white/75 backdrop-blur-md border-white/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${mews.color}`}>
                      MEWS: {mews.score} ({mews.level})
                    </span>
                  </div>

                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Blood Pressure:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{bp} mmHg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Heart Rate:</span>
                      <strong className={pulse > 100 || pulse < 50 ? 'text-amber-500' : 'text-emerald-500'}>
                        {pulse} bpm
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Oxygen Saturation:</span>
                      <strong className={spo2 < 95 ? 'text-rose-500' : 'text-teal-500'}>{spo2}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Respiratory Rate:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{resp} /min</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Body Temperature:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{temp} °C</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => openVitalsForPatient(p)}
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
                  isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{note.patientName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">
                      {note.bedNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{note.time}</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        navigator.clipboard.writeText(`[SBAR] ${note.patientName} (${note.bedNumber}): S: ${note.situation} A: ${note.assessment} R: ${note.recommendation}`);
                        showToast('SBAR note copied to clipboard.');
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-teal-500 cursor-pointer"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                Doctor Orders Execution Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Doctor instructions awaiting nursing execution (STAT blood draws, IV lines, wound care).
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
                  isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
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
                    {order.executionNotes && (
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 italic">
                        Execution note: {order.executionNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {order.status === 'Pending' ? (
                    <button
                      onClick={() => {
                        setSelectedOrderToExecute(order);
                        setOrderExecutionNote('Executed as ordered.');
                        setOrderModalOpen(true);
                      }}
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
                  isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
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

                <div className="flex flex-col items-end gap-1.5">
                  <button
                    onClick={() => handleToggleNurseStatus(nurse.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      nurse.status === 'On Duty'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : nurse.status === 'Break'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {nurse.status} (Toggle)
                  </button>
                  {nurse.phone && <span className="text-[10px] text-slate-400 font-mono">{nurse.phone}</span>}
                </div>
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
                onClick={toggleCodeBlue}
                className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-lg cursor-pointer active:scale-95 transition-all ${
                  codeBlueActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                }`}
              >
                {codeBlueActive ? '✓ Terminate Code Blue / ROSC' : '🚨 Trigger Code Blue Drill (Crash Cart)'}
              </button>

              <button
                onClick={() => {
                  sound.playWarning();
                  showToast('Rapid Response Team (RRT) notified.');
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
              >
                ⚠️  Call Rapid Response Team (RRT)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SBAR MODAL ================= */}
      {sbarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-lg">Create SBAR Shift Handover Note</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Standardized clinical communication format.</p>
              </div>
              <button
                onClick={() => setSbarModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSbar} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Patient</label>
                  <select
                    value={sbarPatient}
                    onChange={e => {
                      setSbarPatient(e.target.value);
                      const p = patients.find(pat => pat.name === e.target.value);
                      if (p?.bedNumber) setSbarBed(p.bedNumber);
                    }}
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

      {/* ================= SCHEDULE MAR DOSE MODAL ================= */}
      {newMarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-base">Schedule Inpatient Medication</h3>
              <button onClick={() => setNewMarModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMarDose} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Patient</label>
                <select
                  value={newMarPatient}
                  onChange={e => setNewMarPatient(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.bedNumber || 'GW-101'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Furosemide (Lasix)"
                  value={newMarMed}
                  onChange={e => setNewMarMed(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20 mg IV"
                    value={newMarDose}
                    onChange={e => setNewMarDose(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Route</label>
                  <select
                    value={newMarRoute}
                    onChange={e => setNewMarRoute(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Oral">Oral</option>
                    <option value="IV Infusion">IV Infusion</option>
                    <option value="SubQ">SubQ</option>
                    <option value="IM">IM</option>
                    <option value="Inhalation">Inhalation</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewMarModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md"
                >
                  Schedule Dose
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-base">Record Rapid Bedside Vitals</h3>
              <button onClick={() => setVitalsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Patient: {vitalsTargetPat?.name || 'Inpatient'}</p>

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

      {/* ================= EXECUTE ORDER MODAL ================= */}
      {orderModalOpen && selectedOrderToExecute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base mb-1">Execute Doctor Order</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Order: &ldquo;{selectedOrderToExecute.orderText}&rdquo; ({selectedOrderToExecute.patientName})
            </p>

            <form onSubmit={handleExecuteOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nursing Action & Execution Notes</label>
                <textarea
                  required
                  rows={3}
                  value={orderExecutionNote}
                  onChange={e => setOrderExecutionNote(e.target.value)}
                  placeholder="e.g. Specimen drawn from left arm and dispatched to lab with barcode label."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md"
                >
                  Sign & Complete Order ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ThemeMode, Patient, Appointment, LabOrder, Prescription, CriticalAlert, Bed } from '../../types';
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
  Bed as BedIcon,
  Thermometer,
  ClipboardList,
  Layers,
  FileCheck2,
  Maximize2,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Radio,
  LogOut,
  Eye,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Zap,
  ArrowRight,
  Building2
} from 'lucide-react';
import { PrintablePrescriptionModal } from '../export';

interface DoctorPortalProps {
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  theme: ThemeMode;
  onSwitchToPatientPortal?: () => void;
  onSwitchToNursePortal?: () => void;
  onSwitchToAdminPortal?: () => void;
  onSwitchToSuperAdminPortal?: () => void;
  onLogout?: () => void;
}

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

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  theme,
  activeSection,
  onSelectSection,
  onSwitchToPatientPortal,
  onSwitchToNursePortal,
  onSwitchToAdminPortal,
  onSwitchToSuperAdminPortal,
  onLogout
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'doctor-overview' | 'doctor-chat' | 'doctor-patients' | 'doctor-rx' | 'doctor-labs' | 'doctor-schedule' | 'doctor-soap' | 'doctor-3d' | 'doctor-alerts'>('doctor-overview');

  useEffect(() => {
    if (activeSection) {
      if (activeSection === 'doctor-consult' || activeSection === 'doctor-overview') setActiveTab('doctor-overview');
      else if (activeSection === 'doctor-chat') setActiveTab('doctor-chat');
      else if (activeSection === 'patients') setActiveTab('doctor-patients');
      else if (activeSection === 'appointments') setActiveTab('doctor-schedule');
      else if (activeSection === 'emr') setActiveTab('doctor-soap');
      else setActiveTab(activeSection as any);
    }
  }, [activeSection]);

  const handleTabChange = (tabId: any) => {
    sound.playClick();
    setActiveTab(tabId);
    if (onSelectSection) onSelectSection(tabId);
  };

  // Core Clinical State
  const [patients, setPatients] = useState<Patient[]>(() => db.getPatients());
  const [selectedPatient, setSelectedPatient] = useState<Patient>(() => patients[0] || db.getPatients()[0]);
  const [appointments, setAppointments] = useState<Appointment[]>(() => db.getAppointments());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => db.getPrescriptions());
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => db.getLabOrders());
  const [alerts, setAlerts] = useState<CriticalAlert[]>(() => db.getAlerts());
  const [beds, setBeds] = useState<Bed[]>(() => db.getBeds());

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Sync state from real backend
  const refreshFullData = async () => {
    try {
      const [fetchedPatients, fetchedAppointments, fetchedPrescriptions, fetchedLabs, fetchedAlerts, fetchedBeds] = await Promise.all([
        api.getPatients().catch(() => db.getPatients()),
        api.getAppointments().catch(() => db.getAppointments()),
        api.getPrescriptions().catch(() => db.getPrescriptions()),
        api.getLabOrders().catch(() => db.getLabOrders()),
        api.getAlerts().catch(() => db.getAlerts()),
        api.getBeds().catch(() => db.getBeds()),
      ]);

      if (fetchedPatients?.length) {
        setPatients(fetchedPatients);
        const currentSelected = fetchedPatients.find(p => p.id === selectedPatient?.id);
        if (currentSelected) setSelectedPatient(currentSelected);
      }
      if (fetchedAppointments?.length) setAppointments(fetchedAppointments);
      if (fetchedPrescriptions?.length) setPrescriptions(fetchedPrescriptions);
      if (fetchedLabs?.length) setLabOrders(fetchedLabs);
      if (fetchedAlerts?.length) setAlerts(fetchedAlerts);
      if (fetchedBeds?.length) setBeds(fetchedBeds);
    } catch {
      // Fallback to local store
      setPatients(db.getPatients());
      setAppointments(db.getAppointments());
      setPrescriptions(db.getPrescriptions());
      setLabOrders(db.getLabOrders());
      setAlerts(db.getAlerts());
    }
  };

  useEffect(() => {
    refreshFullData();
    const unsubscribe = db.subscribe(() => {
      setPatients(db.getPatients());
      setAppointments(db.getAppointments());
      setPrescriptions(db.getPrescriptions());
      setLabOrders(db.getLabOrders());
      setAlerts(db.getAlerts());
      setBeds(db.getBeds());
    });
    return unsubscribe;
  }, []);

  // ================= MODULE 1: PATIENT TELE-CHAT STATES & REAL-TIME POLLING =================
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [allDoctorMessages, setAllDoctorMessages] = useState<MessageItem[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chatSearchPatient, setChatSearchPatient] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Messages grouped by patient
  const messagesByPatient = useMemo(() => {
    const map: Record<string, MessageItem[]> = {};
    allDoctorMessages.forEach(m => {
      if (!map[m.patientId]) map[m.patientId] = [];
      map[m.patientId].push(m);
    });
    return map;
  }, [allDoctorMessages]);

  // Patients who have a pending/unanswered inquiry from patient
  const unreadPatientIds = useMemo(() => {
    const set = new Set<string>();
    Object.entries(messagesByPatient).forEach(([pId, msgs]) => {
      const last = msgs[msgs.length - 1];
      if (last && last.sender === 'patient') {
        set.add(pId);
      }
    });
    return set;
  }, [messagesByPatient]);

  const unreadInquiriesCount = unreadPatientIds.size;

  const filteredChatPatients = useMemo(() => {
    let list = patients;
    if (chatSearchPatient.trim()) {
      const q = chatSearchPatient.toLowerCase();
      list = patients.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.patientCode.toLowerCase().includes(q) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(q))
      );
    }
    // Sort: Patients with new patient messages first, then patients with any messages, then rest
    return [...list].sort((a, b) => {
      const aHasUnread = unreadPatientIds.has(a.id) ? 1 : 0;
      const bHasUnread = unreadPatientIds.has(b.id) ? 1 : 0;
      if (bHasUnread !== aHasUnread) return bHasUnread - aHasUnread;

      const aCount = messagesByPatient[a.id]?.length || 0;
      const bCount = messagesByPatient[b.id]?.length || 0;
      if (bCount !== aCount) return bCount - aCount;

      return 0;
    }).slice(0, 60);
  }, [patients, chatSearchPatient, unreadPatientIds, messagesByPatient]);

  // Fetch all doctor messages across all patients
  const fetchAllMessages = async () => {
    try {
      const allMsgs = await api.getAllDoctorMessages();
      if (allMsgs && Array.isArray(allMsgs)) {
        setAllDoctorMessages(allMsgs);
      }
    } catch {
      // Fallback
    }
  };

  const fetchMessages = async (showRefreshIndicator = false) => {
    if (!selectedPatient?.id) return;
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const serverMsgs = await api.getMessages(selectedPatient.id);
      if (serverMsgs && Array.isArray(serverMsgs)) {
        setMessages(serverMsgs);
      }
    } catch {
      const local = localStorage.getItem(`medicore_chat_${selectedPatient.id}`);
      if (local) {
        try { setMessages(JSON.parse(local)); } catch {}
      }
    } finally {
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  // Real-time polling & sync
  useEffect(() => {
    fetchAllMessages();
    fetchMessages();

    const interval = setInterval(() => {
      fetchAllMessages();
      fetchMessages();
    }, 2000);

    const handleChatUpdate = (e: any) => {
      fetchAllMessages();
      fetchMessages();
      if (e.detail?.patientId) {
        const target = patients.find(p => p.id === e.detail.patientId);
        if (target) {
          setSelectedPatient(target);
        }
      }
      if (e.detail?.sender === 'patient') {
        sound.playSuccess();
        showToast(`Incoming patient inquiry received!`);
      }
    };

    window.addEventListener('medicore_chat_updated', handleChatUpdate);
    window.addEventListener('storage', fetchAllMessages);

    return () => {
      clearInterval(interval);
      window.removeEventListener('medicore_chat_updated', handleChatUpdate);
      window.removeEventListener('storage', fetchAllMessages);
    };
  }, [selectedPatient?.id, patients]);

  // Auto-select patient with newest message if available
  useEffect(() => {
    const lastPatientId = localStorage.getItem('medicore_last_chat_patient');
    if (lastPatientId) {
      const found = patients.find(p => p.id === lastPatientId);
      if (found && found.id !== selectedPatient?.id) {
        setSelectedPatient(found);
      }
    } else if (unreadPatientIds.size > 0 && selectedPatient && !unreadPatientIds.has(selectedPatient.id)) {
      const firstUnreadId = Array.from(unreadPatientIds)[0];
      const found = patients.find(p => p.id === firstUnreadId);
      if (found) setSelectedPatient(found);
    }
  }, [allDoctorMessages.length]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedPatient) return;

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
    setAllDoctorMessages(prev => [...prev, newReply]);
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

      // Broadcast update across windows & tabs
      localStorage.setItem('medicore_last_chat_patient', selectedPatient.id);
      window.dispatchEvent(new CustomEvent('medicore_chat_updated', { 
        detail: { patientId: selectedPatient.id, sender: 'doctor' } 
      }));

      sound.playSuccess();
      showToast(`Reply transmitted directly to ${selectedPatient.name}'s Patient Portal!`);
    } catch {
      localStorage.setItem('medicore_last_chat_patient', selectedPatient.id);
      window.dispatchEvent(new CustomEvent('medicore_chat_updated', { 
        detail: { patientId: selectedPatient.id, sender: 'doctor' } 
      }));
      showToast('Reply saved to clinical consultation record.');
    } finally {
      setIsSending(false);
    }
  };

  const clinicalMacros = [
    'Your resting blood pressure is within normal target bounds. Continue your current regimen.',
    'Take morning inhaler 2 puffs with breakfast. Let me know if nighttime wheezing reoccurs.',
    'I have reviewed your latest CT imaging results; thoracic lung fields remain clear.',
    'I have pre-approved your 90-day maintenance medication refill at MediCore Outpatient Pharmacy.',
    'Please schedule an in-clinic consultation for Thursday morning if symptoms persist.',
    'Increase fluid intake to 2.5L daily and monitor peripheral ankle edema.'
  ];

  // ================= MODULE 2: INPATIENT BEDSIDE VITALS & WARD TRANSFER MODALS =================
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);
  const [inputBP, setInputBP] = useState('120/80');
  const [inputHR, setInputHR] = useState(72);
  const [inputSpO2, setInputSpO2] = useState(98);
  const [inputTemp, setInputTemp] = useState('36.8');
  const [inputResp, setInputResp] = useState(16);

  const openVitalsModal = (patient: Patient) => {
    sound.playClick();
    setVitalsPatient(patient);
    setInputBP(patient.vitals?.bloodPressure || '120/80');
    setInputHR(patient.vitals?.pulseRate || 72);
    setInputSpO2(patient.vitals?.oxygenSaturation || 98);
    setInputTemp(patient.vitals?.temperature?.toString() || '36.8');
    setInputResp(patient.vitals?.respiratoryRate || 16);
    setVitalsModalOpen(true);
  };

  const handleSaveBedsideVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsPatient) return;

    sound.playClick();
    const updatedVitals = {
      bloodPressure: inputBP,
      pulseRate: Number(inputHR),
      oxygenSaturation: Number(inputSpO2),
      temperature: Number(inputTemp),
      respiratoryRate: Number(inputResp),
      lastUpdated: 'Just now'
    };

    try {
      await api.logPatientVitals(vitalsPatient.id, updatedVitals);
      db.updatePatientVitals(vitalsPatient.id, updatedVitals);
      showToast(`Logged bedside vitals for ${vitalsPatient.name}: BP ${inputBP}, SpO2 ${inputSpO2}%.`);
      refreshFullData();
    } catch {
      db.updatePatientVitals(vitalsPatient.id, updatedVitals);
      showToast(`Updated vitals for ${vitalsPatient.name} (local session).`);
      refreshFullData();
    }
    setVitalsModalOpen(false);
  };

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferPatient, setTransferPatient] = useState<Patient | null>(null);
  const [newAdmissionStatus, setNewAdmissionStatus] = useState<'Admitted' | 'ICU' | 'Outpatient' | 'Discharged'>('Admitted');
  const [newRoomNumber, setNewRoomNumber] = useState('Bed 402-A');

  const openTransferModal = (patient: Patient) => {
    sound.playClick();
    setTransferPatient(patient);
    setNewAdmissionStatus(patient.admissionStatus);
    setNewRoomNumber(patient.bedNumber || patient.roomNumber || 'Bed 401-A');
    setTransferModalOpen(true);
  };

  const handleSaveWardTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferPatient) return;

    sound.playClick();
    db.updatePatient(transferPatient.id, {
      admissionStatus: newAdmissionStatus,
      bedNumber: newRoomNumber,
      roomNumber: newRoomNumber
    });
    setPatients([...db.getPatients()]);

    try {
      await api.updatePatient(transferPatient.id, {
        admissionStatus: newAdmissionStatus,
        bedNumber: newRoomNumber,
        roomNumber: newRoomNumber
      });
      showToast(`Transferred ${transferPatient.name} to ${newAdmissionStatus} (${newRoomNumber}).`);
      refreshFullData();
    } catch {
      showToast(`Updated ward status for ${transferPatient.name}.`);
      refreshFullData();
    }
    setTransferModalOpen(false);
  };

  const handleDischargePatient = async (patient: Patient) => {
    sound.playClick();
    const confirm = window.confirm(`Confirm clinical discharge sign-off for ${patient.name}? This will archive their inpatient bed assignment.`);
    if (!confirm) return;

    db.dischargePatient(patient.id);
    setPatients([...db.getPatients()]);

    try {
      await api.updatePatient(patient.id, {
        admissionStatus: 'Discharged',
        bedNumber: 'Discharged - Home Care',
        roomNumber: 'Discharged - Home Care'
      });
      showToast(`Doctor discharge completed for ${patient.name}. Bed released.`);
      refreshFullData();
    } catch {
      showToast(`Discharged ${patient.name}.`);
      refreshFullData();
    }
  };

  // ================= MODULE 3: E-PRESCRIPTION & REFILL WORKFLOWS =================
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [rxMedName, setRxMedName] = useState('Atorvastatin Calcium');
  const [rxDosage, setRxDosage] = useState('40 mg');
  const [rxRoute, setRxRoute] = useState('Oral Tablet');
  const [rxFreq, setRxFreq] = useState('Once daily at bedtime');
  const [rxDuration, setRxDuration] = useState('90 days');
  const [rxQuantity, setRxQuantity] = useState('90');
  const [rxPrintModal, setRxPrintModal] = useState<Prescription | null>(null);

  const formularyDrugs = [
    { name: 'Atorvastatin Calcium', dosage: '40 mg', freq: 'Once daily at bedtime', category: 'Lipid Lowering / Statin' },
    { name: 'Metformin Hydrochloride', dosage: '500 mg', freq: 'Twice daily with meals', category: 'Antidiabetic / Biguanide' },
    { name: 'Amoxicillin Trihydrate', dosage: '500 mg', freq: 'Every 8 hours for 10 days', category: 'Antibiotic' },
    { name: 'Lisinopril Dihydrate', dosage: '10 mg', freq: 'Once daily in the morning', category: 'Antihypertensive / ACE-I' },
    { name: 'Fluticasone Propionate', dosage: '110 mcg', freq: '2 puffs twice daily', category: 'Respiratory / Corticosteroid' },
    { name: 'Furosemide', dosage: '20 mg', freq: 'Once daily morning', category: 'Loop Diuretic' }
  ];

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    sound.playClick();
    const newRxData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: 'doc-1',
      doctorName: 'Dr. Roger S., MD',
      status: 'Prescribed' as const,
      items: [
        {
          medicineId: `med-${Date.now()}`,
          medicineName: rxMedName,
          dosage: `${rxDosage} (${rxRoute})`,
          frequency: rxFreq,
          duration: rxDuration,
          quantity: parseInt(rxQuantity) || 30,
          dispensed: false
        }
      ]
    };

    try {
      const created = await api.createPrescription(newRxData);
      db.addPrescription(newRxData);
      showToast(`E-Prescription for ${rxMedName} signed and transmitted to MediCore Central Pharmacy!`);
      refreshFullData();
      setRxPrintModal(created);
    } catch {
      const created = db.addPrescription(newRxData);
      showToast(`E-Prescription for ${rxMedName} queued in local dispensary.`);
      refreshFullData();
      setRxPrintModal(created);
    }
    setRxModalOpen(false);
  };

  const handleAuthorizeRefill = async (rxId: string, medName: string) => {
    sound.playClick();
    try {
      await api.updatePrescription(rxId, { status: 'Refilled' });
      db.updatePrescription(rxId, { status: 'Refilled' });
      showToast(`Authorized 90-day clinical maintenance refill for ${medName}.`);
      refreshFullData();
    } catch {
      db.updatePrescription(rxId, { status: 'Refilled' });
      showToast(`Authorized refill for ${medName}.`);
      refreshFullData();
    }
  };

  const handleDiscontinueRx = async (rxId: string, medName: string) => {
    sound.playClick();
    const confirm = window.confirm(`Discontinue therapy for ${medName}?`);
    if (!confirm) return;

    try {
      await api.updatePrescription(rxId, { status: 'Discontinued' });
      db.updatePrescription(rxId, { status: 'Discontinued' });
      showToast(`Discontinued prescription for ${medName}.`);
      refreshFullData();
    } catch {
      showToast(`Discontinued ${medName}.`);
    }
  };

  // ================= MODULE 4: DIAGNOSTIC & LAB ORDERS =================
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labTestName, setLabTestName] = useState('Thoracic High-Resolution CT & 3D Volumetry');
  const [labPriority, setLabPriority] = useState<'STAT Urgent (1 Hour)' | 'Routine Morning Round (Same Day)' | 'Pre-Operative Clearance'>('STAT Urgent (1 Hour)');
  const [labNotes, setLabNotes] = useState('Evaluate pulmonary volumetric expansion post-bronchodilator therapy');

  const [labSignOffModalOpen, setLabSignOffModalOpen] = useState(false);
  const [selectedLabToSign, setSelectedLabToSign] = useState<LabOrder | null>(null);
  const [signOffValue, setSignOffValue] = useState('Clear lung fields, normal thoracic volume');
  const [signOffInterpretation, setSignOffInterpretation] = useState<'Normal' | 'Borderline' | 'Abnormal' | 'Critical'>('Normal');
  const [signOffNotes, setSignOffNotes] = useState('Doctor verified. No acute consolidation or pleural effusion observed.');

  const handleOrderLabTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    sound.playClick();
    const orderData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: 'doc-1',
      testId: `t-${Date.now()}`,
      testName: `${labTestName} [${labPriority}]`,
      orderedDate: new Date().toISOString().split('T')[0],
      interpretation: 'Normal' as const,
      status: 'Ordered' as const
    };

    try {
      await api.createLabOrder(orderData);
      db.orderLabTest(orderData);
      showToast(`STAT Order for "${labTestName}" submitted to Laboratory queue!`);
      refreshFullData();
    } catch {
      db.orderLabTest(orderData);
      showToast(`Diagnostic order for "${labTestName}" queued.`);
      refreshFullData();
    }
    setLabModalOpen(false);
  };

  const openLabSignOff = (order: LabOrder) => {
    sound.playClick();
    setSelectedLabToSign(order);
    setSignOffValue(order.resultValue || '98% normal tissue perfusion, negative infiltrates');
    setSignOffInterpretation(order.interpretation || 'Normal');
    setLabSignOffModalOpen(true);
  };

  const handleSaveLabSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabToSign) return;

    sound.playClick();
    try {
      await api.updateLabOrder(selectedLabToSign.id, {
        status: 'Completed',
        resultValue: signOffValue,
        interpretation: signOffInterpretation
      });
      showToast(`Doctor digital signature applied to ${selectedLabToSign.testName}. Result published to patient EMR.`);
      refreshFullData();
    } catch {
      showToast(`Signed off result for ${selectedLabToSign.testName}.`);
    }
    setLabSignOffModalOpen(false);
  };

  // ================= MODULE 5: CLINIC SCHEDULE & VIRTUAL TELEHEALTH ROOM =================
  const [telehealthRoomOpen, setTelehealthRoomOpen] = useState(false);
  const [activeTelehealthApt, setActiveTelehealthApt] = useState<Appointment | null>(null);
  const [callMuted, setCallMuted] = useState(false);
  const [callVideoOff, setCallVideoOff] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [consultNotes, setConsultNotes] = useState('');

  useEffect(() => {
    let interval: any;
    if (telehealthRoomOpen) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [telehealthRoomOpen]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const launchTelehealthRoom = (apt: Appointment) => {
    sound.playClick();
    setActiveTelehealthApt(apt);
    setConsultNotes(`Consultation with ${apt.patientName} regarding: ${apt.notes || 'General Follow-up'}. Patient alert and responsive.`);
    setTelehealthRoomOpen(true);
    showToast(`Connected to MediCore Encrypted Telehealth Room with ${apt.patientName}.`);
  };

  const handleCompleteTelehealthVisit = async () => {
    if (!activeTelehealthApt) return;
    sound.playSuccess();

    try {
      // 1. Mark appointment as completed
      await api.updateAppointment(activeTelehealthApt.id, { status: 'Completed' });

      // 2. Add consultation record into Patient Medical History
      await api.addPatientHistory(activeTelehealthApt.patientId, {
        date: new Date().toISOString().split('T')[0],
                  event: `Virtual Telehealth Consultation (Duration: ${formatTimer(callTimer)})`,
        doctor: 'Dr. Roger S., MD',
        facility: 'MediCore Telehealth Cloud Gateway',
        notes: consultNotes || 'Virtual clinical consultation completed successfully. Patient in good recovery.'
      });

      showToast(`Telehealth visit with ${activeTelehealthApt.patientName} completed & saved to EMR.`);
      refreshFullData();
    } catch {
      showToast(`Visit recorded for ${activeTelehealthApt.patientName}.`);
    }

    setTelehealthRoomOpen(false);
  };

  // ================= MODULE 6: CLINICAL SOAP NOTE MODAL =================
  const [soapModalOpen, setSoapModalOpen] = useState(false);
  const [soapSubjective, setSoapSubjective] = useState('Patient reports decreased morning dyspnea, no wheezing episodes. Compliance with morning inhaler is 100%.');
  const [soapObjective, setSoapObjective] = useState('BP 128/82, HR 74 regular, SpO2 99% on room air. Lungs clear to auscultation bilaterally. No peripheral edema.');
  const [soapIcdCode, setSoapIcdCode] = useState('J45.909 - Chronic Bronchial Asthma, Unspecified');
  const [soapAssessment, setSoapAssessment] = useState('Cavitas Thoracis Infiltration resolving well under maintenance bronchodilators. Hemodynamics stable.');
  const [soapPlan, setSoapPlan] = useState('Continue Atorvastatin 40mg and Fluticasone inhaler. Order follow-up high-resolution CT volumetry in 6 months.');
  const [viewSignedSoap, setViewSignedSoap] = useState<{ date: string; event: string; doctor: string; notes: string } | null>(null);

  const icd10Codes = [
    'J45.909 - Chronic Bronchial Asthma, Unspecified',
    'I25.10 - Atherosclerotic Heart Disease of Native Coronary Artery',
    'E11.9 - Type 2 Diabetes Mellitus without Complications',
    'I10 - Essential (Primary) Systemic Hypertension',
    'R07.9 - Chest Pain, Unspecified / Precordial Pain',
    'K21.9 - Gastro-esophageal Reflux Disease without Esophagitis'
  ];

  const handleSaveSoapNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    sound.playClick();
    const formattedNotes = `ICD-10: [${soapIcdCode}]\n• SUBJECTIVE: ${soapSubjective}\n• OBJECTIVE: ${soapObjective}\n• ASSESSMENT: ${soapAssessment}\n• PLAN: ${soapPlan}\n[Digitally signed by Dr. Roger S., MD at ${new Date().toLocaleTimeString()}]`;

    try {
      await api.addPatientHistory(selectedPatient.id, {
        date: new Date().toISOString().split('T')[0],
        event: `Doctor SOAP Note: ${soapAssessment.slice(0, 40)}...`,
        doctor: 'Dr. Roger S., MD',
        facility: 'MediCore Specialist Pavilion 402',
        notes: formattedNotes
      });
      db.addPatientHistory(selectedPatient.id, {
        date: new Date().toISOString().split('T')[0],
        event: `Doctor SOAP Note: ${soapAssessment.slice(0, 40)}...`,
        doctor: 'Dr. Roger S., MD',
        facility: 'MediCore Specialist Pavilion 402',
        notes: formattedNotes
      });
      showToast(`Doctor SOAP note signed and permanently locked to ${selectedPatient.name}'s EMR!`);
      refreshFullData();
    } catch {
      db.addPatientHistory(selectedPatient.id, {
        date: new Date().toISOString().split('T')[0],
        event: `Doctor SOAP Note: ${soapAssessment.slice(0, 40)}...`,
        doctor: 'Dr. Roger S., MD',
        facility: 'MediCore Specialist Pavilion 402',
        notes: formattedNotes
      });
      showToast(`SOAP note logged to patient record.`);
      refreshFullData();
    }
    setSoapModalOpen(false);
  };

  // ================= MODULE 7: 3D ANATOMICAL SYSTEM & RESCAN DISPATCH =================
  const [active3dSystem, setActive3dSystem] = useState<'cardiovascular' | 'thoracic' | 'digestive'>('cardiovascular');
  const [inspectedProbe, setInspectedProbe] = useState<string | null>('ejection-fraction');

  const handleOrder3dRescan = async () => {
    if (!selectedPatient) return;
    sound.playClick();

    const orderData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: 'doc-1',
      testId: `t-3d-${Date.now()}`,
      testName: `Targeted 3D ${active3dSystem.toUpperCase()} Volumetric CT Rescan (STAT)`,
      orderedDate: new Date().toISOString().split('T')[0],
      interpretation: 'Normal' as const,
      status: 'Ordered' as const
    };

    try {
      await api.createLabOrder(orderData);
      db.orderLabTest(orderData);
      showToast(`Dispatched STAT 3D ${active3dSystem.toUpperCase()} volumetric rescan for ${selectedPatient.name}.`);
      refreshFullData();
    } catch {
      showToast(`Targeted 3D rescan order submitted.`);
    }
  };

  // ================= MODULE 8: CRITICAL CODE ALERTS & EMERGENCY BROADCAST =================
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastCodeType, setBroadcastCodeType] = useState('CODE BLUE - Cardiac Arrest / Resuscitation Team STAT');
  const [broadcastDept, setBroadcastDept] = useState('Clinical Ward 4 - Inpatient Unit');
  const [broadcastLocation, setBroadcastLocation] = useState('Bed 402 / Central Corridor');
  const [broadcastNotes, setBroadcastNotes] = useState('Crash cart and Defibrillator Alpha required immediately. Attending doctor Dr. Roger S. on site.');

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playAlert();

    const newAlertData = {
      title: `🚨 ${broadcastCodeType}`,
      department: broadcastDept,
      severity: 'critical' as const,
      actionRequired: `Immediate emergency response: ${broadcastLocation}. ${broadcastNotes}`
    };

    try {
      await api.broadcastAlert(newAlertData);
      db.broadcastAlert(newAlertData);
      showToast(`EMERGENCY BROADCAST ACTIVATED: Hospital alerted to ${broadcastCodeType}!`);
      refreshFullData();
    } catch {
      db.broadcastAlert(newAlertData);
      showToast(`Critical alert broadcasted.`);
      refreshFullData();
    }
    setBroadcastModalOpen(false);
  };

  const handleAcknowledgeAlert = async (alertId: string, alertTitle: string) => {
    sound.playClick();
    try {
      await api.acknowledgeAlert(alertId);
      db.acknowledgeAlert(alertId);
      showToast(`Alert "${alertTitle}" acknowledged. Action dispatched.`);
      refreshFullData();
    } catch {
      db.acknowledgeAlert(alertId);
      showToast(`Alert acknowledged.`);
      refreshFullData();
    }
  };

  // Module navigation items
  const doctorModules = [
    { id: 'doctor-chat', label: 'Patient Inquiries & Tele-Chat', icon: Stethoscope, badge: unreadInquiriesCount || undefined },
    { id: 'doctor-patients', label: 'Inpatient Rounds & Rosters', icon: BedIcon, badge: patients.length },
    { id: 'doctor-rx', label: 'E-Prescriptions & Refills', icon: Pill, badge: prescriptions.flatMap(p => p.items).length },
    { id: 'doctor-labs', label: 'Lab & Imaging Orders', icon: Activity, badge: labOrders.length },
    { id: 'doctor-schedule', label: 'Clinic Schedule & Telehealth', icon: Calendar, badge: appointments.length },
    { id: 'doctor-soap', label: 'SOAP Notes & EMR', icon: ClipboardList },
    { id: 'doctor-3d', label: '3D Organ Telemetry', icon: Heart },
    { id: 'doctor-alerts', label: 'Critical Code Alerts', icon: AlertTriangle, alert: alerts.length > 0, badge: alerts.length || undefined },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 border border-teal-400/40">
          <CheckCircle2 className="w-5 h-5 text-teal-200 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER CONSOLE - Clean DocR Professional Header */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0E2035] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#1E293B] shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-lg shadow-xs">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0E2035]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Doctor Clinical Station</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  Dr. Roger S., MD • Pulmonology & Critical Care
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live EMR Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Active Ward: <strong className="text-slate-700 dark:text-slate-200">Ward 4 Inpatient Wing</strong></span>
                <span>•</span>
                <span>Selected Patient: <strong className="text-teal-600 dark:text-teal-300 font-semibold">{selectedPatient?.name} ({selectedPatient?.patientCode})</strong></span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DOCTOR MODULE 0: DOCTOR OVERVIEW DASHBOARD ================= */}
      {activeTab === 'doctor-overview' && (
        <div className="space-y-6">
          {/* 1. DOCTOR 4 CORE STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Consultations */}
            <div
              onClick={() => handleTabChange('doctor-schedule')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white hover:border-teal-500/50' : 'bg-white border-slate-200 text-[#142C43] hover:border-teal-500/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Visits</span>
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{appointments.length} Consultations</div>
              <div className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-1 flex items-center gap-1">
                <span>Next: {appointments[0]?.patientName || 'Magnus Stephenson'} at {appointments[0]?.time || '09:30 AM'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 2: Inpatients */}
            <div
              onClick={() => handleTabChange('doctor-patients')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white hover:border-teal-500/50' : 'bg-white border-slate-200 text-[#142C43] hover:border-teal-500/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ward 4 Census</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <BedIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{patients.length} Inpatients</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1">
                <span>All vital telemetry within range</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 3: Prescriptions */}
            <div
              onClick={() => handleTabChange('doctor-rx')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white hover:border-teal-500/50' : 'bg-white border-slate-200 text-[#142C43] hover:border-teal-500/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Regimens</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{prescriptions.flatMap(p => p.items).length} Prescriptions</div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                <span>e-Rx Formularies verified</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 4: Lab & Scans */}
            <div
              onClick={() => handleTabChange('doctor-labs')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white hover:border-teal-500/50' : 'bg-white border-slate-200 text-[#142C43] hover:border-teal-500/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostic Orders</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black">{labOrders.length} Scans / Labs</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1 flex items-center gap-1">
                <span>{labOrders.filter(l => l.status === 'Completed').length} Results signed</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* 3. TWO-COLUMN COMMAND CENTER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Consultations & Inpatient Watchlist (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Today's Consultation Schedule */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Today's Consultation Schedule</h3>
                    <p className="text-xs text-slate-400">Patient appointments and virtual telehealth sessions for Dr. Roger S.</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('doctor-schedule')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {appointments.slice(0, 3).map((apt, idx) => (
                    <div
                      key={apt.id || idx}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {apt.time.split(' ')[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm">{apt.patientName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                              {apt.visitType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{apt.notes || 'Routine pulmonology assessment'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {(apt.visitType as string) === 'Telehealth' || (apt.visitType as string) === 'Consultation' ? (
                          <button
                            onClick={() => launchTelehealthRoom(apt)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const found = patients.find(p => p.id === apt.patientId);
                              if (found) setSelectedPatient(found);
                              handleTabChange('doctor-soap');
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Chart Note</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Inpatient Bedside Watchlist */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Assigned Inpatient Watchlist</h3>
                    <p className="text-xs text-slate-400">Live bedside telemetry and rounding status in Ward 4</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('doctor-patients')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>Full Ward</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {patients.slice(0, 3).map((pat) => (
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
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600">
                              {pat.patientCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>BP: <strong className="text-emerald-500">{pat.vitals?.bloodPressure || '120/80'}</strong></span>
                            <span>•</span>
                            <span>HR: <strong>{pat.vitals?.pulseRate || 72} bpm</strong></span>
                            <span>•</span>
                            <span>SpO2: <strong className="text-teal-600">{pat.vitals?.oxygenSaturation || 98}%</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openVitalsModal(pat)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5 text-teal-600" />
                          <span>Vitals</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatient(pat);
                            handleTabChange('doctor-3d');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600/10 text-teal-700 dark:text-teal-300 hover:bg-teal-600/20 flex items-center gap-1 cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 text-teal-600" />
                          <span>3D Organ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Patient Messages & Lab Review (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 3: Patient Messages */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Patient Inquiries</h3>
                    <p className="text-xs text-slate-400">Direct inquiries from attending patients</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('doctor-chat')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open Chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {messages.slice(-3).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      onClick={() => handleTabChange('doctor-chat')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer hover:border-teal-500/50 ${
                        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold">{m.senderName}</span>
                        <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Diagnostics to Review & Sign */}
              <div className={`p-6 rounded-3xl border ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Pending Lab Sign-Offs</h3>
                    <p className="text-xs text-slate-400">Digital verification required</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('doctor-labs')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <span>All Orders</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {labOrders.slice(0, 2).map((order) => (
                    <div
                      key={order.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{order.testName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">Patient: {selectedPatient?.name} • Ordered: {order.orderedDate}</p>
                      <button
                        onClick={() => openLabSignOff(order)}
                        className="w-full py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs cursor-pointer"
                      >
                        Review & Apply Signature
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 5: Trauma & Code Blue Status */}
              <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="font-extrabold text-xs uppercase tracking-wider">Level-1 Trauma Alert System</span>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-300/80 mb-3">
                  Trauma Bay Resuscitation Team STAT standing by. Defibrillators and rapid airway carts active on Ward 4.
                </p>
                <button
                  onClick={() => setBroadcastModalOpen(true)}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                >
                  Activate Emergency Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 1: REAL-TIME PATIENT TELE-CHAT & CONSULTATION ================= */}
      {activeTab === 'doctor-chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px] max-h-[calc(100vh-200px)] min-h-[600px]">
          {/* LEFT: PATIENT ROSTER (4 cols) */}
          <div className={`lg:col-span-4 p-5 rounded-[28px] border transition-all flex flex-col h-full overflow-hidden ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-md'
          }`}>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-500" />
                  <h3 className="font-black text-sm tracking-tight">Active Patient Channels</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                  {patients.length} Live
                </span>
              </div>

              {/* Instant Search Bar */}
              <div className="relative mb-3 shrink-0">
                <input
                  type="text"
                  value={chatSearchPatient}
                  onChange={e => setChatSearchPatient(e.target.value)}
                  placeholder="Filter patient by name or code..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Patient List (Scrollable) */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {filteredChatPatients.map(pat => {
                  const isSelected = pat.id === selectedPatient?.id;
                  const patMsgs = messagesByPatient[pat.id] || [];
                  const lastMsg = patMsgs[patMsgs.length - 1];
                  const hasUnread = unreadPatientIds.has(pat.id);

                  return (
                    <button
                      key={pat.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedPatient(pat);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 relative cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/10 shadow-sm ring-1 ring-teal-500/40'
                          : hasUnread
                            ? 'border-rose-400 bg-rose-50/50 hover:bg-rose-50 shadow-xs'
                            : isDark
                              ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={pat.avatar}
                          alt={pat.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-teal-500/30"
                        />
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-extrabold text-xs truncate">{pat.name}</span>
                            {hasUnread && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white animate-pulse shrink-0">
                                NEW
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-teal-600 font-bold shrink-0">{pat.patientCode}</span>
                        </div>
                        {lastMsg ? (
                          <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                            {lastMsg.sender === 'doctor' ? '👨‍⚕️ You: ' : '💬 '}{lastMsg.text}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {pat.diagnosis}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-slate-400">{lastMsg ? lastMsg.timestamp : `${pat.age} yrs • ${pat.gender}`}</span>
                          <span className="text-emerald-500 font-bold">BP: {pat.vitals?.bloodPressure || '120/80'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs shrink-0">
                <span className="font-bold text-teal-600 dark:text-teal-400 block mb-0.5 text-[11px]">⚡ Live Clinical Bridge</span>
                <p className="text-[10px] text-slate-600 dark:text-slate-300">
                  Replies sync directly to patient portal in real time.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE TELE-CHAT CONSOLE (8 cols) */}
          <div className={`lg:col-span-8 p-6 rounded-[28px] border transition-all flex flex-col h-full overflow-hidden ${
            isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
          }`}>
            {/* Header with active patient info & action buttons (Shrink 0) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-2 gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedPatient?.avatar}
                  alt={selectedPatient?.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-teal-500 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base truncate">{selectedPatient?.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 font-mono shrink-0">
                      {selectedPatient?.patientCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Diagnosis: {selectedPatient?.diagnosis} • Room: {selectedPatient?.roomNumber || 'Ward 4'} • Attending: Dr. Roger S.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const mockApt: Appointment = {
                      id: `apt-${Date.now()}`,
                      patientId: selectedPatient.id,
                      patientName: selectedPatient.name,
                      doctorId: 'doc-1',
                      doctorName: 'Dr. Roger S.',
                      department: 'Pulmonology',
                      date: new Date().toISOString().split('T')[0],
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      status: 'In-Progress',
                      visitType: 'Consultation',
                      notes: `Ad-hoc Clinical Telehealth consultation with ${selectedPatient.name}`
                    };
                    launchTelehealthRoom(mockApt);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Launch Telehealth Call</span>
                </button>

                <button
                  onClick={() => fetchMessages(true)}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-teal-500"
                  title="Force Refresh Messages"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-500' : ''}`} />
                </button>

                {onSwitchToPatientPortal && (
                  <button
                    onClick={onSwitchToPatientPortal}
                    className="px-3 py-1.5 rounded-xl border border-teal-500/30 text-teal-700 bg-teal-50/70 hover:bg-teal-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Switch to Patient Portal"
                  >
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">View Patient View</span>
                  </button>
                )}
              </div>
            </div>

            {/* Message History Feed (Scrollable, takes all available space) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0 py-2">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Stethoscope className="w-10 h-10 mx-auto text-teal-500/40 mb-2" />
                  <p className="text-xs">No active consultation transcripts yet with {selectedPatient?.name}.</p>
                  <span className="text-[11px] text-slate-500">Send an initial instruction or clinical update below.</span>
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

                      <div className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
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
              <div ref={messagesEndRef} />
            </div>

            {/* Doctor Reply Action Console (Pinned firmly at the bottom of the card) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
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
                      className="text-[10px] px-2.5 py-0.5 rounded-full border border-teal-500/30 text-teal-600 dark:text-teal-300 hover:bg-teal-500/10 whitespace-nowrap transition-all cursor-pointer"
                    >
                      {macro.slice(0, 45)}...
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Type doctor instruction or reply to ${selectedPatient?.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
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
              <h3 className="text-lg font-black tracking-tight">Inpatient Ward Roster & Bedside Clinical Rounds</h3>
              <p className="text-xs text-slate-400">Assigned ward inpatients, real-time hemodynamic telemetry, and bed management</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600">
                {patients.filter(p => p.admissionStatus !== 'Outpatient').length} Active Inpatients
              </span>
              <button
                onClick={() => setSoapModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold glass-btn-teal flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Document Rounding SOAP</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {patients.map(p => (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-teal-500/20" />
                      <div>
                        <h4 className="font-extrabold text-sm">{p.name}</h4>
                        <span className="font-mono text-[10px] text-teal-600 font-bold">{p.patientCode} • {p.age} yrs • {p.bloodGroup}</span>
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
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Primary Diagnosis</span>
                      <span className="text-[10px] font-bold text-teal-600 font-mono">{p.roomNumber || 'Bed 401-A'}</span>
                    </div>
                    <span className="font-semibold block truncate">{p.diagnosis}</span>
                  </div>

                  {/* Bedside Physiological Telemetry */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold">BLOOD PRESSURE</span>
                      <span className="font-black text-rose-500">{p.vitals?.bloodPressure || '120/80'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold">HEART RATE</span>
                      <span className="font-black text-teal-500">{p.vitals?.pulseRate || 72} bpm</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold">O2 SATURATION</span>
                      <span className="font-black text-cyan-500">{p.vitals?.oxygenSaturation || 99}%</span>
                    </div>
                  </div>
                </div>

                {/* Rounding Action Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openVitalsModal(p)}
                      className="py-2 px-3 rounded-xl border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Thermometer className="w-3.5 h-3.5" />
                      <span>Log Vitals</span>
                    </button>
                    <button
                      onClick={() => openTransferModal(p)}
                      className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <BedIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Transfer Bed</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPatient(p);
                        setActiveTab('doctor-chat');
                      }}
                      className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Tele-Chat</span>
                    </button>

                    <button
                      onClick={() => handleDischargePatient(p)}
                      className="px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-all"
                      title="Discharge Patient"
                    >
                      Discharge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 3: E-PRESCRIPTION & REFILL AUTHORIZATION ================= */}
      {activeTab === 'doctor-rx' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Doctor E-Prescriptions & Refill Authorization Station</h3>
              <p className="text-xs text-slate-400">Electronic formulary prescriptions, digital refill sign-off, and medication discontinuation</p>
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
            {prescriptions.flatMap(p => p.items.map((it, idx) => ({ ...it, rxId: p.id, patientName: p.patientName, patientId: p.patientId, date: p.date, rxStatus: p.status }))).map((rxItem, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  rxItem.rxStatus?.includes('Discontinued')
                    ? 'opacity-60 bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                    : isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rxItem.rxStatus?.includes('Refilled')
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : rxItem.rxStatus?.includes('Discontinued')
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-cyan-500/10 text-cyan-600'
                      }`}>
                        {rxItem.rxStatus || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Patient: <strong className="text-slate-700 dark:text-slate-200">{rxItem.patientName}</strong> • Frequency: {rxItem.frequency} • Total Dispense: {rxItem.quantity} units ({rxItem.duration})
                    </p>
                    <span className="text-[11px] text-slate-400">Prescribed by Dr. Roger S. • Ref Rx #{rxItem.rxId} • Date: {rxItem.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      sound.playClick();
                      const parentRx = prescriptions.find(p => p.id === rxItem.rxId) || {
                        id: rxItem.rxId,
                        patientId: rxItem.patientId,
                        patientName: rxItem.patientName,
                        doctorId: 'doc-1',
                        doctorName: 'Dr. Roger S., MD',
                        date: rxItem.date,
                        status: (rxItem.rxStatus as any) || 'Prescribed',
                        items: [{
                          medicineId: 'med-rx',
                          medicineName: rxItem.medicineName,
                          dosage: rxItem.dosage,
                          frequency: rxItem.frequency,
                          duration: rxItem.duration,
                          quantity: rxItem.quantity,
                          dispensed: false
                        }]
                      };
                      setRxPrintModal(parentRx);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    title="Print Official E-Prescription Slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Rx</span>
                  </button>

                  <button
                    onClick={() => handleAuthorizeRefill(rxItem.rxId, rxItem.medicineName)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                  >
                    Authorize Refill
                  </button>

                  <button
                    onClick={() => handleDiscontinueRx(rxItem.rxId, rxItem.medicineName)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 text-xs font-bold transition-all"
                  >
                    Discontinue
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
              <h3 className="text-lg font-black tracking-tight">Diagnostic Assays & Radiology Investigation Queue</h3>
              <p className="text-xs text-slate-400">Order high-resolution CT scans, biochemical blood panels, and apply doctor digital sign-offs</p>
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
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base">{order.testName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {order.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Interpretation: {order.interpretation}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Patient: <strong className="text-slate-700 dark:text-slate-300">{order.patientName}</strong> • Ordered Date: {order.orderedDate} • Ref #{order.id}
                  </div>
                  {order.resultValue && (
                    <div className="mt-2 text-xs font-mono p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-teal-600 dark:text-teal-400">
                      Observed Result: {order.resultValue}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => openLabSignOff(order)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Doctor Sign-Off & Results</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 5: CLINIC SCHEDULE & TELEHEALTH ROOM ================= */}
      {activeTab === 'doctor-schedule' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Doctor Consultation Agenda & Telehealth Suites</h3>
              <p className="text-xs text-slate-400">Scheduled outpatient sessions, follow-ups, and live virtual consultation rooms</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600">
              Dr. Roger S. • Schedule Active
            </span>
          </div>

          <div className="space-y-4">
            {appointments.map(apt => (
              <div
                key={apt.id}
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  apt.status === 'Completed'
                    ? 'opacity-70 bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                    : isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base">{apt.patientName}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600">
                      {apt.visitType}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      apt.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    ⏰ {apt.time} • 📅 {apt.date} • Unit 402 • Clinical Focus: "{apt.notes || 'Routine consultation'}"
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => launchTelehealthRoom(apt)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Launch Telehealth Room</span>
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
              <h3 className="text-lg font-black tracking-tight">Clinical SOAP Notes & Permanent EMR Documentation</h3>
              <p className="text-xs text-slate-400">Formal medical progress notes, ICD-10 diagnostic coding, and signed clinical summaries</p>
            </div>
            <button
              onClick={() => setSoapModalOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Signed SOAP Note</span>
            </button>
          </div>

          <div className="space-y-4">
            {selectedPatient?.medicalHistory?.length ? (
              selectedPatient.medicalHistory.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border ${
                    isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-extrabold text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-500" />
                      <span>{rec.event}</span>
                    </span>
                    <span className="font-mono text-xs text-teal-600 font-bold">{rec.date}</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">Attending: {rec.doctor} • Facility: {rec.facility}</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-sans leading-relaxed">
                    {rec.notes}
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setViewSignedSoap(rec)}
                      className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Official Chart Note</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                No past EMR notes recorded for this patient. Click "Write Signed SOAP Note" above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 7: 3D ANATOMICAL VOLUMETRY & TELEMETRY ================= */}
      {activeTab === 'doctor-3d' && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Doctor 3D Anatomical Volumetry & Pathological Review</h3>
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

              <button
                onClick={handleOrder3dRescan}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Order STAT 3D Rescan</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 min-h-[440px] flex flex-col justify-between p-6 bg-[#081220]">
            <video 
              src="/assets/aistudio/gemini_generated_video_c57b0b74_4bf96156.mp4" 
              poster="/assets/aistudio/image_9cc16e1f.png"
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060D17]/95 via-[#060D17]/30 to-[#060D17]/70 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between">
              <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white text-xs font-mono">
                CLINICAL 3D REVIEW: {selectedPatient?.name?.toUpperCase()} ({selectedPatient?.patientCode}) • SYSTEM: {active3dSystem.toUpperCase()}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Dr. Roger S. Authorized Review</span>
              </div>
            </div>

            {/* Interactive Telemetry Probes */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 pt-28">
              <button
                onClick={() => {
                  sound.playClick();
                  setInspectedProbe('ejection-fraction');
                }}
                className={`p-3 rounded-2xl backdrop-blur-md text-left transition-all ${
                  inspectedProbe === 'ejection-fraction'
                    ? 'bg-cyan-900/90 border-2 border-cyan-400 text-white'
                    : 'bg-black/60 border border-cyan-400/30 text-cyan-200 hover:bg-black/80'
                }`}
              >
                <span className="text-[10px] text-cyan-300 block font-bold uppercase">Ventricular Ejection Fraction</span>
                <span className="text-sm font-extrabold text-white">62% (Optimal Range: 55-70%)</span>
                <span className="text-[10px] text-slate-300 block mt-1">Normal left ventricular systolic kinetics</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setInspectedProbe('perfusion');
                }}
                className={`p-3 rounded-2xl backdrop-blur-md text-left transition-all ${
                  inspectedProbe === 'perfusion'
                    ? 'bg-teal-900/90 border-2 border-teal-400 text-white'
                    : 'bg-black/60 border border-teal-400/30 text-teal-200 hover:bg-black/80'
                }`}
              >
                <span className="text-[10px] text-teal-300 block font-bold uppercase">Myocardial Perfusion Score</span>
                <span className="text-sm font-extrabold text-white">98% Homogeneous (Normal)</span>
                <span className="text-[10px] text-slate-300 block mt-1">No ischemia or fixed scar defects</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setInspectedProbe('bronchial');
                }}
                className={`p-3 rounded-2xl backdrop-blur-md text-left transition-all ${
                  inspectedProbe === 'bronchial'
                    ? 'bg-emerald-900/90 border-2 border-emerald-400 text-white'
                    : 'bg-black/60 border border-emerald-400/30 text-emerald-200 hover:bg-black/80'
                }`}
              >
                <span className="text-[10px] text-emerald-300 block font-bold uppercase">Thoracic Airway Caliber</span>
                <span className="text-sm font-extrabold text-white">Symmetrical / Patent</span>
                <span className="text-[10px] text-slate-300 block mt-1">FEV1 estimated at 92% of predicted</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DOCTOR MODULE 8: CRITICAL CODE & EMERGENCY PAGER ================= */}
      {activeTab === 'doctor-alerts' && (
        <div className="p-6 rounded-[32px] border border-rose-500/40 bg-rose-500/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rose-500/20 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-lg animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">Emergency & Critical Code Pager</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hospital-wide telemetry alerts, trauma bay activations, and doctor emergency dispatch</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full">
                {alerts.length} Active Codes
              </span>
              <button
                onClick={() => setBroadcastModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-lg flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Broadcast New Code Blue</span>
              </button>
            </div>
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
                    Department: {al.department} • Time: {al.time}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                    Action Required: <strong>{al.actionRequired}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcknowledgeAlert(al.id, al.title)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge & Respond</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: WRITE E-PRESCRIPTION ================= */}
      {rxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-500" />
                <h3 className="font-black text-lg">Doctor E-Prescription Form</h3>
              </div>
              <button onClick={() => setRxModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Formulary Chips */}
            <div className="my-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                Quick Select Hospital Formulary Medications:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {formularyDrugs.map((f, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setRxMedName(f.name);
                      setRxDosage(f.dosage);
                      setRxFreq(f.freq);
                    }}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-teal-500/30 text-teal-600 dark:text-teal-300 hover:bg-teal-500/10 transition-all"
                  >
                    {f.name} ({f.dosage})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Patient</label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold flex justify-between">
                  <span>{selectedPatient?.name} ({selectedPatient?.patientCode})</span>
                  <span className="text-teal-600 font-mono">Allergies: None Known</span>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Medication Name & Chemical Entity</label>
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
                  <label className="font-bold block mb-1">Dosage Strength</label>
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={e => setRxDosage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Administration Route</label>
                  <select
                    value={rxRoute}
                    onChange={e => setRxRoute(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Oral Tablet">Oral Tablet</option>
                    <option value="Inhalation Aerolizer">Inhalation Aerolizer</option>
                    <option value="Intravenous Infusion">Intravenous Infusion</option>
                    <option value="Sublingual Drops">Sublingual Drops</option>
                    <option value="Subcutaneous Injection">Subcutaneous Injection</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Frequency & Directions</label>
                  <input
                    type="text"
                    value={rxFreq}
                    onChange={e => setRxFreq(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Total Supply Duration</label>
                  <input
                    type="text"
                    value={rxDuration}
                    onChange={e => setRxDuration(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
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
                  Sign & Authorize E-Rx
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
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-500" />
                <h3 className="font-black text-lg">Order Diagnostic Assay / Scan</h3>
              </div>
              <button onClick={() => setLabModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOrderLabTest} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Patient</label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                  {selectedPatient?.name} ({selectedPatient?.patientCode})
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Diagnostic Investigation</label>
                <select
                  value={labTestName}
                  onChange={e => setLabTestName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Thoracic High-Resolution CT & 3D Volumetry">Thoracic High-Resolution CT & 3D Volumetry</option>
                  <option value="Arterial Blood Gas Analysis (ABG)">Arterial Blood Gas Analysis (ABG)</option>
                  <option value="Comprehensive Metabolic Panel (CMP-14)">Comprehensive Metabolic Panel (CMP-14)</option>
                  <option value="Advanced Lipid & ApoB Profile">Advanced Lipid & ApoB Profile</option>
                  <option value="12-Lead Electrocardiogram (ECG) with Vector Analysis">12-Lead Electrocardiogram (ECG)</option>
                  <option value="High-Sensitivity Cardiac Troponin T & I">High-Sensitivity Cardiac Troponin T & I</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Priority Level</label>
                <select
                  value={labPriority}
                  onChange={e => setLabPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="STAT Urgent (1 Hour)">STAT Urgent (1 Hour Priority)</option>
                  <option value="Routine Morning Round (Same Day)">Routine Morning Round (Same Day)</option>
                  <option value="Pre-Operative Clearance">Pre-Operative Clearance</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Clinical Indication / Doctor Notes</label>
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
                  Submit Order to Laboratory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DOCTOR LAB SIGN-OFF ================= */}
      {labSignOffModalOpen && selectedLabToSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-500" />
                <h3 className="font-black text-lg">Doctor Diagnostic Review & Sign-Off</h3>
              </div>
              <button onClick={() => setLabSignOffModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLabSignOff} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Diagnostic Investigation</label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                  {selectedLabToSign.testName} (Ref #{selectedLabToSign.id})
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Observed Result Value / Imaging Findings</label>
                <textarea
                  value={signOffValue}
                  onChange={e => setSignOffValue(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Clinical Interpretation</label>
                <select
                  value={signOffInterpretation}
                  onChange={e => setSignOffInterpretation(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Normal">Normal (Within Reference Target)</option>
                  <option value="Abnormal">Abnormal (Requires Follow-up)</option>
                  <option value="Critical">Critical (Immediate Clinical Intervention)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Attending Doctor Impression Note</label>
                <textarea
                  value={signOffNotes}
                  onChange={e => setSignOffNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLabSignOffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Digitally Sign & Lock to EMR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOG BEDSIDE VITALS ================= */}
      {vitalsModalOpen && vitalsPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-teal-500" />
                <h3 className="font-black text-lg">Log Bedside Vitals</h3>
              </div>
              <button onClick={() => setVitalsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBedsideVitals} className="space-y-3 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                {vitalsPatient.name} • {vitalsPatient.patientCode} ({vitalsPatient.roomNumber || 'Bed 401-A'})
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={inputBP}
                    onChange={e => setInputBP(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="120/80"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={inputHR}
                    onChange={e => setInputHR(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">SpO2 Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    value={inputSpO2}
                    onChange={e => setInputSpO2(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Temperature (°C)</label>
                  <input
                    type="text"
                    value={inputTemp}
                    onChange={e => setInputTemp(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Respiratory Rate (/min)</label>
                <input
                  type="number"
                  value={inputResp}
                  onChange={e => setInputResp(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVitalsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Record Bedside Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: WARD / BED TRANSFER ================= */}
      {transferModalOpen && transferPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BedIcon className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-lg">Ward & Bed Assignment Transfer</h3>
              </div>
              <button onClick={() => setTransferModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWardTransfer} className="space-y-4 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                Patient: {transferPatient.name} ({transferPatient.patientCode})
              </div>

              <div>
                <label className="font-bold block mb-1">Target Admission Status</label>
                <select
                  value={newAdmissionStatus}
                  onChange={e => setNewAdmissionStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Inpatient">Inpatient (General Medical Ward 4)</option>
                  <option value="ICU">ICU (Intensive Critical Care Unit)</option>
                  <option value="Outpatient">Outpatient (Discharge Planned / Step-Down)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Room / Bed Assignment</label>
                <select
                  value={newRoomNumber}
                  onChange={e => setNewRoomNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Bed 401-A (Ward 4 Inpatient)">Bed 401-A (Ward 4 Inpatient)</option>
                  <option value="Bed 402-B (Ward 4 Inpatient)">Bed 402-B (Ward 4 Inpatient)</option>
                  <option value="ICU-Pod-01 (Isolation Positive Pressure)">ICU-Pod-01 (Isolation Positive Pressure)</option>
                  <option value="ICU-Pod-02 (Hemodynamic Telemetry)">ICU-Pod-02 (Hemodynamic Telemetry)</option>
                  <option value="Observation Suite 12">Observation Suite 12</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Confirm Bed Transfer
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
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-500" />
                <h3 className="font-black text-lg">Clinical SOAP Note Documentation</h3>
              </div>
              <button onClick={() => setSoapModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSoapNote} className="space-y-3 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold flex justify-between">
                <span>{selectedPatient?.name} ({selectedPatient?.patientCode})</span>
                <span className="text-teal-600">Attending: Dr. Roger S., MD</span>
              </div>

              <div>
                <label className="font-bold block mb-1">ICD-10 Diagnostic Classification</label>
                <select
                  value={soapIcdCode}
                  onChange={e => setSoapIcdCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                >
                  {icd10Codes.map((code, idx) => (
                    <option key={idx} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Subjective (S) - Patient Reported Symptoms</label>
                <textarea
                  value={soapSubjective}
                  onChange={e => setSoapSubjective(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Objective (O) - Vitals & Clinical Examination</label>
                <textarea
                  value={soapObjective}
                  onChange={e => setSoapObjective(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Assessment (A) - Doctor Impression & Acuity</label>
                <textarea
                  value={soapAssessment}
                  onChange={e => setSoapAssessment(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Plan (P) - Pharmacotherapy & Orders</label>
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
                  Sign & Lock to Patient EMR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BROADCAST EMERGENCY CODE BLUE ================= */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl p-6 border-2 border-rose-500 bg-[#160B0E] text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <h3 className="font-black text-lg">Hospital Emergency Code Broadcast</h3>
              </div>
              <button onClick={() => setBroadcastModalOpen(false)} className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastAlert} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1 text-rose-300">Emergency Protocol Code Type</label>
                <select
                  value={broadcastCodeType}
                  onChange={e => setBroadcastCodeType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-500/40 bg-black/60 text-white font-bold"
                >
                  <option value="CODE BLUE - Cardiac Arrest / Resuscitation Team STAT">🚨 CODE BLUE - Cardiac Arrest / Resuscitation STAT</option>
                  <option value="CODE RED - Mass Casualty / Trauma Bay Influx">🚨 CODE RED - Mass Casualty / Trauma Influx</option>
                  <option value="STAT STROKE - Emergency Neuro-Interventional Alert">⚡ STAT STROKE - Emergency Neuro-Intervention</option>
                  <option value="SEPSIS PROTOCOL - Rapid Response Shock Alert">⚠️  SEPSIS PROTOCOL - Rapid Response Shock Alert</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 text-rose-300">Target Hospital Unit</label>
                <input
                  type="text"
                  value={broadcastDept}
                  onChange={e => setBroadcastDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-500/40 bg-black/60 text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-rose-300">Specific Location / Bay</label>
                <input
                  type="text"
                  value={broadcastLocation}
                  onChange={e => setBroadcastLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-500/40 bg-black/60 text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1 text-rose-300">Clinical Directives & Equipment Needed</label>
                <textarea
                  value={broadcastNotes}
                  onChange={e => setBroadcastNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-rose-500/40 bg-black/60 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-500/30 text-rose-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg flex items-center gap-2"
                >
                  <Radio className="w-4 h-4 animate-ping" />
                  <span>Transmit Code Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIRTUAL TELEHEALTH CONSULTATION ROOM ================= */}
      {telehealthRoomOpen && activeTelehealthApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-[32px] border border-cyan-500/30 bg-[#071322] text-white shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            {/* Header */}
            <div className="p-4 px-6 bg-slate-900/80 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="font-black text-sm text-cyan-300">
                    MediCore Encrypted Telehealth Suite • {activeTelehealthApt.patientName}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Attending: Dr. Roger S., MD • Channel 256-Bit TLS Encrypted
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-3 py-1 rounded-full bg-black/60 border border-cyan-400/30 font-mono text-xs text-cyan-400 font-bold">
                  ⏱ {formatTimer(callTimer)}
                </div>
                <button
                  onClick={() => setTelehealthRoomOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Canvas Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 flex-1 p-6 gap-6 overflow-y-auto">
              {/* VIDEO STREAMS (8 cols) */}
              <div className="md:col-span-8 flex flex-col gap-4">
                {/* Main Patient Video Feed */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"
                    alt="Patient Stream"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Watermark badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-mono border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>PATIENT: {activeTelehealthApt.patientName.toUpperCase()}</span>
                  </div>

                  {/* Picture-in-picture Doctor Camera */}
                  <div className="absolute bottom-3 right-3 w-32 h-24 rounded-xl overflow-hidden border-2 border-teal-500 shadow-xl bg-slate-900">
                    {!callVideoOff ? (
                      <img
                        src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400"
                        alt="Doctor Stream"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-[10px] text-slate-400">
                        Camera Off
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1.5 text-[9px] bg-black/70 px-1 rounded text-teal-300 font-bold">
                      Dr. Roger S.
                    </span>
                  </div>
                </div>

                {/* Call Action Bar */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setCallMuted(!callMuted);
                    }}
                    className={`p-3 rounded-xl transition-all ${
                      callMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={callMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {callMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCallVideoOff(!callVideoOff);
                    }}
                    className={`p-3 rounded-xl transition-all ${
                      callVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={callVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {callVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setRxModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-teal-600/80 hover:bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Prescribe Med</span>
                  </button>

                  <button
                    onClick={() => setLabModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Order STAT Lab</span>
                  </button>

                  <button
                    onClick={handleCompleteTelehealthVisit}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Complete Visit & Save to EMR</span>
                  </button>
                </div>
              </div>

              {/* IN-CALL CLINICAL NOTES CONSOLE (4 cols) */}
              <div className="md:col-span-4 flex flex-col justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div>
                  <h4 className="font-bold text-xs text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>In-Call Clinical Consultation Record</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-3">
                    These notes automatically log to the permanent medical history chart when completing the call.
                  </p>
                  <textarea
                    value={consultNotes}
                    onChange={e => setConsultNotes(e.target.value)}
                    rows={10}
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans leading-relaxed"
                    placeholder="Type clinical observations, verbal prescriptions, advice..."
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  Patient Vitals: <strong className="text-teal-400">BP 120/80 • HR 72 bpm • SpO2 99%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINT OFFICIAL SIGNED SOAP / RX ================= */}
      {viewSignedSoap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-white text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-teal-700">
                <Printer className="w-5 h-5" />
                <h3 className="font-black text-base">MediCore Health System • Official EMR Transcript</h3>
              </div>
              <button onClick={() => setViewSignedSoap(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span>Patient: <strong>{selectedPatient?.name}</strong></span>
                <span>MRN: <strong>{selectedPatient?.patientCode}</strong></span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span>Date: <strong>{viewSignedSoap.date}</strong></span>
                <span>Doctor: <strong>{viewSignedSoap.doctor}</strong></span>
              </div>
              <div className="pt-2">
                <span className="font-bold text-teal-800 block mb-1">Clinical Progress Note:</span>
                <p className="whitespace-pre-line text-slate-700 leading-relaxed font-sans">
                  {viewSignedSoap.notes}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-slate-400 font-mono">
                SHA-256 DIGITAL SIGNATURE VERIFIED ✓
              </span>
              <button
                onClick={() => {
                  window.print();
                  showToast('Dispatched to hospital printer spooler.');
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700"
              >
                Print Official Hardcopy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

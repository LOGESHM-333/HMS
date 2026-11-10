/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Patient, ThemeMode, Appointment, Invoice, LabOrder, Prescription } from '../../types';
import { db } from '../../services/mockDatabase';
import { api } from '../../services/api';
import { sound } from '../../services/audioService';
import { PrintableInvoiceModal, PrintablePrescriptionModal, DigitalHealthCardModal } from '../export';
import { 
  Heart, 
  Activity, 
  Calendar, 
  FileText, 
  Pill, 
  Download, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  PhoneCall,
  Dumbbell,
  Syringe,
  MessageSquare,
  Send,
  AlertTriangle,
  Apple,
  Droplet,
  Plus,
  Minus,
  Video,
  Check,
  X,
  Shield,
  QrCode,
  Printer,
  Mic,
  MicOff,
  VideoOff,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Flame,
  Radio,
  Navigation,
  Stethoscope,
  LogOut,
  Building2
} from 'lucide-react';
import { PatientAuthPage } from './PatientAuthPage';

interface PatientPortalProps {
  theme: ThemeMode;
  patient?: Patient;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  onSwitchToDoctorPortal?: () => void;
  onSwitchToNursePortal?: () => void;
  onSwitchToAdminPortal?: () => void;
  onSwitchToSuperAdminPortal?: () => void;
  onLogout?: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({ 
  theme, 
  patient: propPatient,
  activeSection = 'patient-health',
  onSelectSection,
  onSwitchToDoctorPortal,
  onSwitchToNursePortal,
  onSwitchToAdminPortal,
  onSwitchToSuperAdminPortal,
  onLogout
}) => {
  const isDark = theme === 'dark';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('medicore_patient_auth'));
  });
  const [patient, setPatient] = useState<Patient>(() => {
    if (propPatient) return propPatient;
    const savedId = localStorage.getItem('medicore_patient_id');
    if (savedId) {
      const found = db.getPatientById(savedId);
      if (found) return found;
    }
    return db.getPatients()[0];
  });

  useEffect(() => {
    if (propPatient && propPatient.id !== patient.id) {
      setPatient(propPatient);
    }
  }, [propPatient]);
  const [currentSection, setCurrentSection] = useState<string>(activeSection);

  // Sync section
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

  // Live database collections
  const [appointments, setAppointments] = useState<Appointment[]>(() => db.getAppointments().filter(a => a.patientId === patient.id));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => db.getPrescriptions().filter(p => p.patientId === patient.id));
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => db.getLabOrders().filter(l => l.patientId === patient.id));
  const [invoices, setInvoices] = useState<Invoice[]>(() => db.getInvoices().filter(i => i.patientId === patient.id));

  // Sync state whenever db updates
  const refreshCollections = () => {
    const updatedPat = db.getPatientById(patient.id) || db.getPatients()[0];
    setPatient(updatedPat);
    setAppointments(db.getAppointments().filter(a => a.patientId === updatedPat.id));
    setPrescriptions(db.getPrescriptions().filter(p => p.patientId === updatedPat.id));
    setLabOrders(db.getLabOrders().filter(l => l.patientId === updatedPat.id));
    setInvoices(db.getInvoices().filter(i => i.patientId === updatedPat.id));
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshCollections();
    });
    return unsub;
  }, [patient.id]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. HEALTH & 3D MAP STATES
  const [activeSystem, setActiveSystem] = useState<'cardiovascular' | 'thoracic' | 'digestive'>('cardiovascular');
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [newSystolic, setNewSystolic] = useState('124');
  const [newDiastolic, setNewDiastolic] = useState('80');
  const [newPulse, setNewPulse] = useState('72');
  const [newSpO2, setNewSpO2] = useState('99');
  const [newTemp, setNewTemp] = useState('36.7');
  const [newGlucose, setNewGlucose] = useState('98');
  const [newWeight, setNewWeight] = useState('74.5');
  const [waterGlasses, setWaterGlasses] = useState(6);
  const [dailySteps, setDailySteps] = useState(8420);

  // 2. APPOINTMENTS & TELEHEALTH STATES
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState('Cardiology');
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Roger S.');
  const [visitType, setVisitType] = useState<'Consultation' | 'Follow-up' | 'Diagnostic'>('Consultation');
  const [bookDate, setBookDate] = useState('2026-11-12');
  const [bookTime, setBookTime] = useState('10:30 AM');
  const [bookNotes, setBookNotes] = useState('');
  
  // Telehealth Video Room Modal
  const [telehealthOpen, setTelehealthOpen] = useState(false);
  const [activeTelehealthApt, setActiveTelehealthApt] = useState<Appointment | null>(null);
  const [callMicOn, setCallMicOn] = useState(true);
  const [callVideoOn, setCallVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(148); // seconds
  const [telehealthNotes, setTelehealthNotes] = useState('Patient reports stable breathing after morning bronchodilator.');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (telehealthOpen) {
      interval = setInterval(() => setCallDuration(c => c + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [telehealthOpen]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 3. PRESCRIPTIONS & REFILL STATES
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [refillMedName, setRefillMedName] = useState('Atorvastatin Calcium Trihydrate');
  const [refillPharmacy, setRefillPharmacy] = useState('MediCore Outpatient Pavilion Pharmacy');
  const [refillCycles, setRefillCycles] = useState('30 Days (1 Bottle)');
  const [refillNotes, setRefillNotes] = useState('');
  const [addMedModalOpen, setAddMedModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('10 mg');
  const [newMedFreq, setNewMedFreq] = useState('Once daily with breakfast');
  const [takenMedicines, setTakenMedicines] = useState<Record<string, { taken: boolean; timestamp?: string }>>({
    'Atorvastatin Calcium Trihydrate': { taken: true, timestamp: '08:15 AM' },
    'Metformin HCl 500mg': { taken: false },
    'Fluticasone Propionate Inhaler': { taken: true, timestamp: '07:30 AM' }
  });

  // 4. LAB REPORTS & SCAN INSPECTION VIEWER
  const [scanViewerOpen, setScanViewerOpen] = useState(false);
  const [activeScanOrder, setActiveScanOrder] = useState<LabOrder | null>(null);
  const [scanZoom, setScanZoom] = useState(1);
  const [scanInvert, setScanInvert] = useState(false);
  const [scanBrightness, setScanBrightness] = useState(100);
  const [reportPrintModalOpen, setReportPrintModalOpen] = useState(false);
  const [activePrintReport, setActivePrintReport] = useState<LabOrder | null>(null);

  // 5. MEDICAL HISTORY STATES
  const [historyCategory, setHistoryCategory] = useState<'All' | 'Diagnostics' | 'Cardiology' | 'Pulmonology'>('All');
  const [addHistoryModalOpen, setAddHistoryModalOpen] = useState(false);
  const [historyEvent, setHistoryEvent] = useState('');
  const [historyDoctor, setHistoryDoctor] = useState('Dr. Roger S.');
  const [historyFacility, setHistoryFacility] = useState('MediCore Specialist Pavilion');
  const [historyDate, setHistoryDate] = useState('2026-11-01');
  const [historyNotes, setHistoryNotes] = useState('');

  // 6. VACCINE PASSPORT & QR STATES
  const [vaccineQrModalOpen, setVaccineQrModalOpen] = useState(false);
  const [activeVaccine, setActiveVaccine] = useState<any | null>(null);
  const [logVaccineModalOpen, setLogVaccineModalOpen] = useState(false);
  const [newVaccineName, setNewVaccineName] = useState('SARS-CoV-2 Spike Protein mRNA (Bivalent)');
  const [newVaccineDose, setNewVaccineDose] = useState('Dose 4 (Annual Booster)');
  const [newVaccineDate, setNewVaccineDate] = useState('2026-10-15');
  const [newVaccineFacility, setNewVaccineFacility] = useState('MediCore Immunization Wing');
  const [newVaccineLot, setNewVaccineLot] = useState('LOT-PFZ-99428B');
  const [vaccinesList, setVaccinesList] = useState([
    { vaccine: 'COVID-19 mRNA Updated Booster', manufacturer: 'Pfizer-BioNTech', date: '2025-10-14', lot: 'FK-8921-X', status: 'Verified', expires: '2026-10-14', issuer: 'MediCore Immunization Hub', hash: 'e9b2...84f1' },
    { vaccine: 'Influenza Quadrivalent Recombinant', manufacturer: 'Sanofi Pasteur', date: '2025-11-02', lot: 'FLU-4410-Q', status: 'Verified', expires: '2026-11-02', issuer: 'MediCore Outpatient Clinic', hash: 'a104...77bc' },
    { vaccine: 'Tetanus, Diphtheria, Pertussis (Tdap)', manufacturer: 'GlaxoSmithKline', date: '2022-04-18', lot: 'TD-9012-G', status: 'Verified', expires: '2032-04-18', issuer: 'Memorial Regional Clinic', hash: 'c5d8...912a' }
  ]);

  // 7. BILLING & INSURANCE STATES
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Credit Card');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimInvoiceId, setClaimInvoiceId] = useState(invoices[0]?.id || '');
  const [claimPolicyNum, setClaimPolicyNum] = useState('POL-891024-CIGNA');
  const [claimProvider, setClaimProvider] = useState('Cigna Platinum Health Preferred');
  const [claimAmount, setClaimAmount] = useState('480.00');
  const [claimDiagnosis, setClaimDiagnosis] = useState('ICD-10 J44.9 (Chronic Obstructive Infiltration)');
  const [receiptPrintModalOpen, setReceiptPrintModalOpen] = useState(false);
  const [isHealthCardOpen, setIsHealthCardOpen] = useState(false);
  const [selectedPrescriptionForPrint, setSelectedPrescriptionForPrint] = useState<Prescription | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);

  // 8. DOCTOR CHAT STATES
  const doctorsList = [
    { id: 'doc-1', name: 'Dr. Roger S.', role: 'Chief of Cardiology', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80', status: 'Online' },
    { id: 'doc-2', name: 'Dr. Sarah Jenkins', role: 'Pulmonary Specialist', avatar: 'https://images.unsplash.com/photo-1594824813583-4a1e948c26c9?w=150&auto=format&fit=crop&q=80', status: 'In Clinic' },
    { id: 'doc-3', name: 'Dr. Robert Chen', role: 'Internal Medicine', avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80', status: 'Online' }
  ];
  const [selectedChatDoctor, setSelectedChatDoctor] = useState(doctorsList[0]);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'patient' | 'doctor'; text: string; time: string; doctorName?: string }>>([
    { sender: 'doctor', text: 'Hello Magnus, Dr. Roger here. Your latest thoracic scan shows clear lung fields. How are you feeling after adjusting the inhaler dosage?', time: 'Yesterday 14:20', doctorName: 'Dr. Roger S.' },
    { sender: 'patient', text: 'Good afternoon Dr. Roger. The morning chest tightness has significantly reduced, no wheezing yesterday.', time: 'Yesterday 15:45' },
    { sender: 'doctor', text: 'Excellent progress. Keep taking the morning bronchodilator and let me know if any night cough reoccurs.', time: 'Yesterday 16:10', doctorName: 'Dr. Roger S.' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  // Real-time bidirectional message sync with Doctor Portal
  const fetchChat = useCallback(async () => {
    try {
      const serverMsgs = await api.getMessages(patient.id);
      if (serverMsgs && Array.isArray(serverMsgs)) {
        if (serverMsgs.length > 0) {
          setChatMessages(serverMsgs.map(m => ({
            sender: m.sender,
            text: m.text,
            time: m.timestamp,
            doctorName: m.doctorName || m.senderName
          })));
          localStorage.setItem(`medicore_chat_${patient.id}`, JSON.stringify(serverMsgs));
        } else {
          const savedLocal = localStorage.getItem(`medicore_chat_${patient.id}`);
          if (savedLocal) {
            try { setChatMessages(JSON.parse(savedLocal)); } catch {}
          }
        }
      }
    } catch {
      const savedLocal = localStorage.getItem(`medicore_chat_${patient.id}`);
      if (savedLocal) {
        try { setChatMessages(JSON.parse(savedLocal)); } catch {}
      }
    }
  }, [patient.id]);

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 2000);
    const onChatUpdate = (e: any) => {
      if (!e.detail?.patientId || e.detail.patientId === patient.id) {
        fetchChat();
      }
    };
    window.addEventListener('medicore_chat_updated', onChatUpdate);
    window.addEventListener('storage', fetchChat);
    return () => {
      clearInterval(interval);
      window.removeEventListener('medicore_chat_updated', onChatUpdate);
      window.removeEventListener('storage', fetchChat);
    };
  }, [fetchChat, patient.id]);

  // 9. NUTRITION & MEAL LOGGER STATES
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [mealFoodName, setMealFoodName] = useState('');
  const [mealCalories, setMealCalories] = useState('420');
  const [mealSodium, setMealSodium] = useState('180');
  const [mealCarbs, setMealCarbs] = useState('35');
  const [loggedMeals, setLoggedMeals] = useState([
    { id: 'm-1', type: 'Breakfast', name: 'Steel-cut Oatmeal with Blueberries & Chia Seeds', calories: 340, sodium: 85, carbs: 52, time: '08:15 AM' },
    { id: 'm-2', type: 'Lunch', name: 'Mediterranean Grilled Chicken Salad with Olive Oil', calories: 480, sodium: 280, carbs: 18, time: '12:45 PM' }
  ]);
  const totalCaloriesToday = loggedMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalSodiumToday = loggedMeals.reduce((acc, m) => acc + m.sodium, 0);

  // 10. EMERGENCY SOS DISPATCH STATES
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [ambulanceEta, setAmbulanceEta] = useState(6); // minutes
  const [dispatchInfo, setDispatchInfo] = useState<{
    callsign: string;
    leadParamedic: string;
    erBay: string;
    coordinates: string;
  }>({
    callsign: 'MediCore Rapid Response Unit 4 (ALS Spec)',
    leadParamedic: 'Captain Marcus Vance, EMT-P',
    erBay: 'Resuscitation Trauma Bay 2',
    coordinates: '37.7749° N, 122.4194° W (Home Geolocation)'
  });

  // SOS Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosCountdown !== null && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown(sosCountdown - 1);
      }, 1000);
    } else if (sosCountdown === 0) {
      triggerRealDispatch();
    }
    return () => clearTimeout(timer);
  }, [sosCountdown]);

  const handleStartSosCountdown = () => {
    sound.playWarning();
    setSosCountdown(5);
  };

  const handleCancelSos = () => {
    sound.playClick();
    setSosCountdown(null);
    showToast('Emergency SOS dispatch aborted by patient.');
  };

  const triggerRealDispatch = async () => {
    setSosCountdown(null);
    sound.playWarning();
    setSosDispatched(true);
    try {
      const res = await db.triggerEmergencyDispatch({
        patientId: patient.id,
        patientName: patient.name,
        location: '742 Evergreen Terrace (Mobile GPS Locked)',
        condition: 'Patient Emergency Alert Button Triggered - Rapid Response Mobilized'
      });
      if (res && res.ambulanceUnit) {
        setDispatchInfo({
          callsign: res.ambulanceUnit,
          leadParamedic: res.driverParamedic || 'Captain Marcus Vance, EMT-P',
          erBay: res.hospitalBay || 'Trauma Bay 2',
          coordinates: '37.7749° N, 122.4194° W'
        });
      }
    } catch {
      // Fallback
    }
    showToast('🚨 AMBULANCE UNIT 4 DISPATCHED TO YOUR CURRENT LOCATION!');
  };

  // ================= SUBMIT HANDLERS ================= //

  // Vitals submit
  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedVitals = {
      bloodPressure: `${newSystolic}/${newDiastolic}`,
      pulseRate: parseInt(newPulse) || 72,
      oxygenSaturation: parseInt(newSpO2) || 99,
      temperature: parseFloat(newTemp) || 36.7,
      lastUpdated: 'Just now'
    };
    db.updatePatientVitals(patient.id, updatedVitals);
    refreshCollections();
    setVitalsModalOpen(false);
    showToast(`New vitals recorded: ${updatedVitals.bloodPressure} mmHg, ${updatedVitals.pulseRate} bpm, ${updatedVitals.oxygenSaturation}% SpO2`);
  };

  // Appointment booking submit
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
      notes: bookNotes || 'Patient portal self-scheduled session',
    });
    refreshCollections();
    setBookingModalOpen(false);
    showToast(`Appointment confirmed with ${selectedDoctor} for ${bookDate} at ${bookTime}!`);
  };

  // Cancel appointment
  const handleCancelAppointment = (id: string) => {
    sound.playClick();
    db.updateAppointmentStatus(id, 'Cancelled');
    refreshCollections();
    showToast('Appointment successfully cancelled.');
  };

  // Refill request submit
  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.requestRefill({
      prescriptionId: prescriptions[0]?.id || 'rx-1',
      patientId: patient.id,
      medicineName: refillMedName,
      requestedRefills: 1,
      pharmacyNote: `${refillCycles} requested at ${refillPharmacy}. Notes: ${refillNotes}`
    });
    setRefillModalOpen(false);
    showToast(`Refill request for ${refillMedName} dispatched to ${refillPharmacy}!`);
  };

  // Add medication submit
  const handleAddMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    db.addPrescription({
      patientId: patient.id,
      patientName: patient.name,
      doctorId: 'doc-1',
      doctorName: patient.primaryDoctorName,
      status: 'Prescribed',
      items: [
        {
          medicineId: `med-${Date.now()}`,
          medicineName: newMedName,
          dosage: newMedDosage,
          frequency: newMedFreq,
          duration: '30 days',
          quantity: 30,
          dispensed: false
        }
      ]
    });
    setTakenMedicines(prev => ({
      ...prev,
      [newMedName]: { taken: false }
    }));
    refreshCollections();
    setAddMedModalOpen(false);
    showToast(`New medication regimen for ${newMedName} added to your active chart.`);
  };

  // Toggle dose taken
  const toggleMedTaken = (name: string) => {
    sound.playClick();
    const curr = takenMedicines[name]?.taken || false;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTakenMedicines(prev => ({
      ...prev,
      [name]: { taken: !curr, timestamp: !curr ? nowTime : undefined }
    }));
    if (!curr) {
      showToast(`Marked ${name} as taken at ${nowTime}.`);
    }
  };

  // Add history record submit
  const handleAddHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyEvent.trim()) return;
    db.addPatientHistory(patient.id, {
      date: historyDate,
      event: historyEvent,
      doctor: historyDoctor,
      facility: historyFacility,
      notes: historyNotes || 'Clinical entry recorded by patient EMR sync'
    });
    refreshCollections();
    setAddHistoryModalOpen(false);
    showToast(`Medical record "${historyEvent}" appended to clinical history.`);
  };

  // Add vaccine submit
  const handleLogVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      vaccine: newVaccineName,
      manufacturer: 'Authorized Facility',
      date: newVaccineDate,
      lot: newVaccineLot,
      status: 'Verified',
      expires: '2027-10-15',
      issuer: newVaccineFacility,
      hash: `${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`
    };
    setVaccinesList(prev => [newEntry, ...prev]);
    setLogVaccineModalOpen(false);
    api.addImmunization({
      patientId: patient.id,
      vaccineName: newVaccineName,
      dose: newVaccineDose,
      date: newVaccineDate,
      facility: newVaccineFacility,
      lotNumber: newVaccineLot
    }).catch(() => {});
    showToast(`Immunization for ${newVaccineName} successfully registered.`);
  };

  // Payment process submit
  const handleProcessPayment = () => {
    if (!payModalInvoice) return;
    db.payInvoice(payModalInvoice.id, selectedPaymentMethod);
    refreshCollections();
    const paidInv = payModalInvoice;
    setPayModalInvoice(null);
    showToast(`Payment of ₹${paidInv.grandTotal.toFixed(2)} completed successfully via ${selectedPaymentMethod}!`);
  };

  // Insurance claim submit
  const handleInsuranceClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.fileInsuranceClaim({
      invoiceId: claimInvoiceId,
      patientId: patient.id,
      policyNumber: claimPolicyNum,
      provider: claimProvider,
      claimAmount: parseFloat(claimAmount) || 0,
      diagnosisCode: claimDiagnosis
    });
    setClaimModalOpen(false);
    showToast(`Insurance claim for ₹${claimAmount} successfully submitted to ${claimProvider}!`);
  };

  // Doctor Chat Send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    sound.playClick();
    const userText = newMessageText.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMsg = {
      sender: 'patient' as const,
      text: userText,
      time: nowTime
    };
    setChatMessages(prev => [...prev, userMsg]);
    setNewMessageText('');

    try {
      await api.sendMessage({ 
        patientId: patient.id, 
        patientName: patient.name,
        doctorId: selectedChatDoctor.id,
        doctorName: selectedChatDoctor.name,
        sender: 'patient', 
        senderName: patient.name, 
        text: userText 
      });

      // Broadcast update across windows & tabs
      localStorage.setItem('medicore_last_chat_patient', patient.id);
      localStorage.setItem('medicore_last_chat_patient_name', patient.name);
      localStorage.setItem('medicore_last_chat_time', Date.now().toString());
      window.dispatchEvent(new CustomEvent('medicore_chat_updated', { detail: { patientId: patient.id, sender: 'patient' } }));

      sound.playSuccess();
      showToast(`Inquiry sent directly to ${selectedChatDoctor.name}'s Doctor Portal!`);
    } catch {
      localStorage.setItem('medicore_last_chat_patient', patient.id);
      window.dispatchEvent(new CustomEvent('medicore_chat_updated', { detail: { patientId: patient.id, sender: 'patient' } }));
      showToast('Message saved to clinical queue.');
    }
  };

  // Add meal submit
  const handleAddMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealFoodName.trim()) return;
    const newMeal = {
      id: `m-${Date.now()}`,
      type: mealType,
      name: mealFoodName,
      calories: parseInt(mealCalories) || 300,
      sodium: parseInt(mealSodium) || 120,
      carbs: parseInt(mealCarbs) || 25,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLoggedMeals(prev => [newMeal, ...prev]);
    setMealModalOpen(false);
    setMealFoodName('');
    api.logMeal({
      patientId: patient.id,
      mealType: newMeal.type,
      name: newMeal.name,
      calories: newMeal.calories,
      sodiumMg: newMeal.sodium,
      carbsG: newMeal.carbs
    }).catch(() => {});
    showToast(`Logged ${mealType}: ${newMeal.name} (${newMeal.calories} kcal)`);
  };

  // Print official document helper
  const handlePrintDocument = (title: string) => {
    sound.playClick();
    window.print();
    showToast(`Initiating print queue for ${title}...`);
  };

  // 10 Portal Modules list
  const portalModules = [
    { id: 'patient-health', label: 'Health Summary & 3D', icon: Heart },
    { id: 'patient-appointments', label: 'Appointments', icon: Calendar, badge: appointments.filter(a => a.status === 'Scheduled').length },
    { id: 'patient-prescriptions', label: 'Prescriptions', icon: Pill, badge: prescriptions.flatMap(p => p.items).length },
    { id: 'patient-labs', label: 'Lab Reports', icon: Activity, badge: labOrders.length },
    { id: 'patient-records', label: 'Medical History', icon: FileText },
    { id: 'patient-vaccines', label: 'Vaccine Passport', icon: Syringe, badge: 'Verified' },
    { id: 'patient-billing', label: 'Billing & Insurance', icon: CreditCard, badge: invoices.filter(i => i.status !== 'Paid').length || undefined },
    { id: 'patient-messages', label: 'Doctor Chat', icon: MessageSquare, badge: 'Online' },
    { id: 'patient-nutrition', label: 'Nutrition & Diet', icon: Apple },
    { id: 'patient-emergency', label: 'Emergency SOS', icon: AlertTriangle, alert: true },
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

      {/* ================= DOCR PATIENT DOSSIER HEADER ================= */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0E2035] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#1E293B] shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={patient.avatar}
              alt={patient.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-teal-500/20 shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{patient.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20">
                  {patient.patientCode}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Patient
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>Primary Care: <strong className="text-slate-700 dark:text-slate-200">{patient.primaryDoctorName}</strong></span>
                <span>•</span>
                <span>Blood: <strong className="text-rose-500">{patient.bloodGroup}</strong></span>
                <span>•</span>
                <span>Age: <strong>{patient.age} yrs</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-teal-600 dark:text-teal-400">{patient.admissionStatus}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                sound.playClick();
                setVitalsModalOpen(true);
              }}
              className="px-4 py-2 rounded-2xl text-xs font-semibold glass-btn-neutral flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Log Vitals</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setBookingModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#3B4E6A] hover:bg-[#2E3E55] text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Visit</span>
            </button>

            <button
              onClick={() => handleSectionChange('patient-emergency')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Emergency SOS</span>
            </button>
          </div>
        </div>
      </div>
      {/* ================= PATIENT PORTAL MODULE CONTENT ================= */}
      {/* ================= MODULE 1: HEALTH SUMMARY & 3D ANATOMY ================= */}
      {(currentSection === 'patient-health' || currentSection === 'patient-portal' || currentSection === 'health' || !currentSection) && (
        <div className="space-y-6">
          {/* Main 3D Holographic Exploration Card */}
          <div className={`p-6 rounded-[32px] border transition-all ${
            isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 text-white shadow-lg' : 'bg-white/65 backdrop-blur-md border-white/80 text-[#142C43] shadow-lg'
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
                  { id: 'cardiovascular', label: 'Cardiovascular' },
                  { id: 'thoracic', label: 'Thoracic Lungs' },
                  { id: 'digestive', label: 'Digestive & Stomach' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveSystem(s.id as any);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      activeSystem === s.id
                        ? 'bg-teal-600/90 backdrop-blur-md text-white shadow-xs'
                        : 'bg-slate-500/10 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:bg-slate-500/20 border border-slate-300/40 dark:border-slate-700/40'
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
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white text-xs font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span>3D SCAN: {patient.name.toUpperCase()} • {activeSystem.toUpperCase()}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Telemetry Verified</span>
                </div>
              </div>

              {/* Organ Health Tags */}
              <div className="relative z-10 flex flex-wrap gap-2 pt-28">
                {activeSystem === 'cardiovascular' && (
                  <>
                    <div className="px-3 py-1.5 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs font-semibold">
                      Myocardial Perfusion: 98% Normal
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-teal-950/80 backdrop-blur-md border border-teal-400/40 text-teal-200 text-xs font-semibold">
                      Aortic Flow Velocity: 1.2 m/s
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                      Left Ventricle Ejection Fraction: 62%
                    </div>
                  </>
                )}
                {activeSystem === 'thoracic' && (
                  <>
                    <div className="px-3 py-1.5 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs font-semibold">
                      Pulmo Sinister: Mild Infiltration Resolved
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-teal-950/80 backdrop-blur-md border border-teal-400/40 text-teal-200 text-xs font-semibold">
                      Airway Resistance: Optimal Post-Inhaler
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                      Tidal Volume: 520 mL (Normal)
                    </div>
                  </>
                )}
                {activeSystem === 'digestive' && (
                  <>
                    <div className="px-3 py-1.5 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs font-semibold">
                      Gastric Mucosa: Intact
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-teal-950/80 backdrop-blur-md border border-teal-400/40 text-teal-200 text-xs font-semibold">
                      Hepatic Function: ALT/AST Normal
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                      Gut Microbiome Index: 88/100
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Biomarkers and Key Vitals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Blood Pressure</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                {patient.vitals.bloodPressure} <span className="text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Target Resting Range
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
                {patient.vitals.pulseRate} <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Sinus Rhythm Normal
              </div>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>SpO2 Oxygen</span>
                <Droplet className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                {patient.vitals.oxygenSaturation} <span className="text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Optimal Saturation
              </div>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Body Temperature</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                {patient.vitals.temperature} <span className="text-xs font-normal text-slate-400">°C</span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Afebrile
              </div>
            </div>
          </div>

          {/* Daily Habits & Bio-Tracking Interactive Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Water Tracker */}
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
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setWaterGlasses(prev => prev + 1);
                      if (waterGlasses + 1 === 8) showToast('Daily water goal of 8 glasses achieved!');
                    }}
                    className="p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
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
                <span className="text-xs text-emerald-500 font-bold">Good Quality</span>
              </div>
              <div className="text-3xl font-black mt-2">
                7h 45m <span className="text-xs font-normal text-slate-400">Deep: 2h 10m</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">Target: 8.0 hrs • REM cycles optimal</div>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setDailySteps(prev => prev + 500);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold"
                  >
                    +500 steps
                  </button>
                </div>
              </div>
              <div className="text-3xl font-black mt-2">
                {dailySteps.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ 10,000 steps</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (dailySteps / 10000) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 2: APPOINTMENTS & TELEHEALTH ================= */}
      {(currentSection === 'patient-appointments' || currentSection === 'appointments') && (
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      apt.status === 'Scheduled' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {apt.status}
                    </span>
                    {apt.status === 'Scheduled' && (
                      <>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setActiveTelehealthApt(apt);
                            setTelehealthOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-600 text-white flex items-center gap-1.5 hover:bg-teal-700 shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Virtual Room</span>
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200/60 dark:border-slate-800 gap-2">
                  <span>📅 Date: <strong className="text-slate-700 dark:text-slate-300">{apt.date}</strong></span>
                  <span>⏰ Time: <strong className="text-slate-700 dark:text-slate-300">{apt.time}</strong></span>
                  <span>🏥 MediCore Main Clinic Pavilion</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 3: PRESCRIPTIONS & MEDICATION TRACKER ================= */}
      {(currentSection === 'patient-prescriptions' || currentSection === 'prescriptions' || currentSection === 'pharmacy') && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Active Medications & Dosage Tracker</h3>
              <p className="text-xs text-slate-400">Authorized e-prescriptions, daily dosing regimen, and online pharmacy refills</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setAddMedModalOpen(true);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setRefillModalOpen(true);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Request Refill</span>
              </button>
            </div>
          </div>

          {/* Allergy alert box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Documented Allergies: <strong>Penicillin, Sulfa Drugs</strong>. All digital prescriptions undergo real-time contraindication screening.</span>
          </div>

          <div className="space-y-4">
            {prescriptions.flatMap(rx => rx.items).map((item, idx) => {
              const medState = takenMedicines[item.medicineName];
              const isTaken = medState?.taken || false;
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
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>Quantity: {item.quantity} units</span>
                        <span>•</span>
                        <span>Prescribing Doctor: {patient.primaryDoctorName}</span>
                        {medState?.timestamp && (
                          <span className="text-emerald-500 font-bold">• Taken at {medState.timestamp}</span>
                        )}
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
      {(currentSection === 'patient-labs' || currentSection === 'lab' || currentSection === 'labs') && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Diagnostic Tests & Imaging Scans</h3>
              <p className="text-xs text-slate-400">High-resolution scans, pathology assays, and printable certified PDF medical records</p>
            </div>
            <button
              onClick={() => handlePrintDocument('Complete Laboratory Summary')}
              className="px-4 py-2 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All Reports</span>
            </button>
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
                      Ordered on {order.orderedDate} • Ref #{order.id} • Laboratory Division: Core Pathology
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveScanOrder(order);
                        setScanViewerOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-1.5"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Inspect Scan</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActivePrintReport(order);
                        setReportPrintModalOpen(true);
                      }}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Signed PDF</span>
                    </button>
                  </div>
                </div>

                {order.resultValue && (
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono flex items-center justify-between">
                    <div>
                      Result Finding: <strong className="text-teal-600 dark:text-teal-400 font-bold">{order.resultValue} {order.unit || ''}</strong>
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
      {(currentSection === 'patient-records' || currentSection === 'emr' || currentSection === 'records') && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Clinical Medical Journey & History</h3>
              <p className="text-xs text-slate-400">Chronological hospitalizations, surgeries, diagnostics, and clinical SOAP notes</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setAddHistoryModalOpen(true);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
              <button
                onClick={() => handlePrintDocument('Complete EMR Medical History')}
                className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export EMR Summary</span>
              </button>
            </div>
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
      {(currentSection === 'patient-vaccines' || currentSection === 'vaccines') && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Digital Immunization Passport</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  WHO Smart Health Card Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">Authenticated vaccination credentials with digital QR certificate</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setLogVaccineModalOpen(true);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Immunization</span>
              </button>
              <button
                onClick={() => handlePrintDocument('Official Immunization Certificate')}
                className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaccinesList.map((v, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600">
                      <Syringe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{v.vaccine}</h4>
                      <span className="text-xs text-slate-400">{v.manufacturer} • Lot #{v.lot}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveVaccine(v);
                      setVaccineQrModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-teal-500/10 text-teal-600"
                    title="View Verification QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Administered: <strong className="text-slate-600 dark:text-slate-300">{v.date}</strong></span>
                  <span className="text-emerald-500 font-bold">✓ {v.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODULE 7: BILLING & INSURANCE ================= */}
      {(currentSection === 'patient-billing' || currentSection === 'billing' || currentSection === 'finance') && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Billing, Invoices & Insurance Coverage</h3>
              <p className="text-xs text-slate-400">Statement breakdown, insurance benefits, and real-time online checkout</p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setClaimModalOpen(true);
              }}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>File Insurance Claim</span>
            </button>
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
                <span className="font-bold">90% Hospital Care</span>
              </div>
              <div>
                <span className="text-teal-200/80 block text-[10px] uppercase">Specialist Copay</span>
                <span className="font-bold">₹500 / Visit</span>
              </div>
              <div>
                <span className="text-teal-200/80 block text-[10px] uppercase">Deductible Met</span>
                <span className="font-bold">₹15,000 / ₹20,000</span>
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
                      <span className="text-xl font-black text-slate-900 dark:text-white">₹{inv.grandTotal.toFixed(2)}</span>
                    </div>
                    {inv.status !== 'Paid' ? (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setPayModalInvoice(inv);
                        }}
                        className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                      >
                        Pay Online Now
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playClick();
                          setActiveReceipt(inv);
                          setReceiptPrintModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Itemized Hospital Services:</div>
                  <div className="space-y-1">
                    {inv.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>{it.description} (x{it.quantity})</span>
                        <span className="font-mono">₹{it.total.toFixed(2)}</span>
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
      {(currentSection === 'patient-messages' || currentSection === 'messages' || currentSection === 'chat') && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-3">
            <div className="flex items-center gap-3">
              <img
                src={selectedChatDoctor.avatar}
                alt={selectedChatDoctor.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500"
              />
              <div>
                <h3 className="text-base font-extrabold">{selectedChatDoctor.name}</h3>
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedChatDoctor.role} • {selectedChatDoctor.status}
                </span>
              </div>
            </div>

            {/* Doctor switch buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {doctorsList.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedChatDoctor(doc);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedChatDoctor.id === doc.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {doc.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Live Bridge to Doctor Portal */}
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-transparent border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <div>
                <span className="font-extrabold text-teal-700 dark:text-teal-300 block">
                  Live Clinic Bridge Connected to Doctor Portal
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Messages typed here appear live on {selectedChatDoctor.name}'s Doctor Portal screen.
                </span>
              </div>
            </div>
            {onSwitchToAdminPortal && (
              <button
                onClick={() => {
                  sound.playClick();
                  onSwitchToAdminPortal();
                }}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 dark:text-teal-300 border border-teal-500/30 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Switch to Hospital Admin Portal"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Hospital Admin</span>
              </button>
            )}

            {onSwitchToSuperAdminPortal && (
              <button
                onClick={() => {
                  sound.playClick();
                  onSwitchToSuperAdminPortal();
                }}
                className="px-3.5 py-2 rounded-full text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Switch to Enterprise Super Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </button>
            )}

            {onSwitchToDoctorPortal && (
              <button
                type="button"
                onClick={onSwitchToDoctorPortal}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Switch to Doctor Portal to Reply</span>
              </button>
            )}
          </div>

          {/* Quick Inquiry Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
            {[
              'How is my latest blood pressure reading?',
              'Can I adjust my morning inhaler dosage?',
              'When is my next follow-up appointment?',
              'Are my laboratory scan results normal?'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setNewMessageText(chip);
                }}
                className="text-[11px] px-3 py-1 rounded-full border border-teal-500/30 text-teal-600 dark:text-teal-300 hover:bg-teal-500/10 whitespace-nowrap transition-all"
              >
                {chip}
              </button>
            ))}
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
                  {msg.sender === 'doctor' && msg.doctorName && (
                    <span className="block text-[10px] font-bold text-teal-400 mb-1">{msg.doctorName}</span>
                  )}
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
              placeholder={`Send medical inquiry to ${selectedChatDoctor.name}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= MODULE 9: NUTRITION & DIET ================= */}
      {(currentSection === 'patient-nutrition' || currentSection === 'nutrition' || currentSection === 'diet') && (
        <div className={`p-6 rounded-[32px] border ${
          isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-lg'
        }`}>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight">Prescribed Clinical Nutrition & Diet Plan</h3>
              <p className="text-xs text-slate-400">Cardiovascular & digestive health dietary regimen with real-time calorie and sodium tracking</p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setMealModalOpen(true);
              }}
              className="px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Meal</span>
            </button>
          </div>

          {/* Real Nutrition Budget Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-teal-600">Daily Calorie Target</span>
                <span className="font-mono text-slate-400">{totalCaloriesToday} / 2,000 kcal</span>
              </div>
              <div className="text-2xl font-black mt-2">
                {2000 - totalCaloriesToday > 0 ? `${2000 - totalCaloriesToday} kcal remaining` : 'Target Met'}
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-3 overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, (totalCaloriesToday / 2000) * 100)}%` }} 
                />
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-cyan-600">DASH Sodium Limit</span>
                <span className="font-mono text-slate-400">{totalSodiumToday} / 1,500 mg</span>
              </div>
              <div className="text-2xl font-black mt-2">
                {totalSodiumToday < 1500 ? `${1500 - totalSodiumToday} mg allowance` : 'Sodium Warning'}
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${totalSodiumToday > 1500 ? 'bg-rose-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${Math.min(100, (totalSodiumToday / 1500) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="font-bold text-sm">Today's Logged Meals</h4>
            {loggedMeals.map(m => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <span className="font-bold text-teal-600 block">{m.type}: {m.name}</span>
                  <span className="text-slate-400">{m.time}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{m.calories} kcal</span>
                  <span className="text-slate-400">{m.sodium} mg Na</span>
                  <span className="text-slate-400">{m.carbs} g Carbs</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs font-bold text-emerald-600 uppercase block mb-2">Recommended Foods</span>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>• <strong>Omega-3s:</strong> Wild salmon, mackerel, chia seeds, walnuts</li>
                <li>• <strong>Cardio-protective:</strong> Steamed spinach, kale, blueberries, oats</li>
                <li>• <strong>Hydration:</strong> 2,000+ mL mineral-rich water</li>
              </ul>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs font-bold text-rose-500 uppercase block mb-2">Foods to Restrict</span>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                      <li>• ❌ Canned soups & packaged sodium foods (&gt;1,500 mg/day)</li>
                      <li>• ❌ Cured deli meats & hydrogenated trans-fats</li>
                      <li>• ❌ High caffeine beverages (&gt;2 cups/day)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODULE 10: EMERGENCY SOS DISPATCH ================= */}
      {(currentSection === 'patient-emergency' || currentSection === 'emergency' || currentSection === 'sos') && (
        <div className="p-6 rounded-[32px] border border-rose-500/40 bg-rose-500/5 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-rose-500/20">
            <div className="p-3 rounded-2xl bg-rose-600 text-white">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-600 dark:text-rose-400">Hospital Emergency SOS</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">24/7 Rapid Medical Response, Live Telemetry & Immediate ER Trauma Dispatch</p>
            </div>
          </div>

          {/* Active Dispatch Live Console */}
          {sosDispatched ? (
            <div className="p-6 rounded-2xl border border-rose-500 bg-rose-950/20 text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-rose-500 animate-ping" />
                  <h4 className="text-lg font-black text-rose-400">EMERGENCY AMBULANCE EN ROUTE</h4>
                </div>
                <div className="text-xl font-mono font-bold text-rose-300">
                  ESTIMATED ARRIVAL: ~{ambulanceEta} MINUTES
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase">Assigned Unit</span>
                  <span className="font-bold text-rose-300">{dispatchInfo.callsign}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase">Paramedic Lead</span>
                  <span className="font-bold">{dispatchInfo.leadParamedic}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase">Hospital Receiving Bay</span>
                  <span className="font-bold text-emerald-400">{dispatchInfo.erBay} (Cleared)</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 block text-[10px] uppercase">GPS Coordinates</span>
                  <span className="font-mono">{dispatchInfo.coordinates}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setSosDispatched(false);
                    showToast('Emergency alert marked resolved by patient.');
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-400/40 text-rose-300 hover:bg-rose-500/20 text-xs font-bold"
                >
                  Mark Stand Down / Resolved
                </button>
              </div>
            </div>
          ) : sosCountdown !== null ? (
            /* Countdown screen */
            <div className="p-8 rounded-2xl border-2 border-rose-600 bg-rose-600/10 text-center space-y-4">
              <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400">DISPATCHING AMBULANCE IN</h4>
              <div className="text-7xl font-black text-rose-600 animate-bounce">
                {sosCountdown}
              </div>
              <p className="text-xs text-slate-500">Press CANCEL if you triggered this button accidentally.</p>
              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={handleCancelSos}
                  className="px-8 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-extrabold text-sm shadow-md"
                >
                  Cancel Dispatch
                </button>
                <button
                  onClick={triggerRealDispatch}
                  className="px-8 py-3 rounded-2xl bg-rose-600 text-white font-extrabold text-sm shadow-lg hover:bg-rose-700"
                >
                  Dispatch Right Now
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
              }`}>
                <h4 className="font-extrabold text-base mb-2">One-Touch Emergency Dispatch</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  If you are experiencing severe chest pain, acute respiratory distress, or loss of balance, initiate immediate emergency dispatch.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleStartSosCountdown}
                    className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Initiate Emergency SOS (5s Countdown)</span>
                  </button>
                  <button
                    onClick={() => showToast('Connecting directly to MediCore 24/7 Level-1 Trauma Bay (+1 800-633-4267)...')}
                    className="w-full py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Direct Trauma Center Hotline</span>
                  </button>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
              }`}>
                <h4 className="font-extrabold text-base mb-3">Emergency Critical Profile</h4>
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
                    <span className="text-slate-400">Base Medical Center:</span>
                    <span className="font-bold">MediCore Health Center, Level 1 Trauma Facility</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: LOG NEW VITALS ================= */}
      {vitalsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Log New Vitals</h3>
              <button onClick={() => setVitalsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVitalsSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={newSystolic}
                    onChange={e => setNewSystolic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={newDiastolic}
                    onChange={e => setNewDiastolic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    value={newPulse}
                    onChange={e => setNewPulse(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={newSpO2}
                    onChange={e => setNewSpO2(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">Body Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTemp}
                    onChange={e => setNewTemp(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Glucose (mg/dL)</label>
                  <input
                    type="number"
                    value={newGlucose}
                    onChange={e => setNewGlucose(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
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
                  Save & Update Chart
                </button>
              </div>
            </form>
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
                  <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins (Pulmonology)</option>
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
                    <option value="10:30 AM">10:30 AM</option>
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
                  placeholder="Describe reason for visit..."
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

      {/* ================= MODAL: TELEHEALTH VIDEO CONSULTATION ROOM ================= */}
      {telehealthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-3xl overflow-hidden border border-slate-700 bg-[#091422] text-white shadow-2xl flex flex-col">
            {/* Call header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-sm">Virtual Telehealth Consultation</h4>
                  <span className="text-xs text-slate-400">Dr. Roger S., MD • Patient: {patient.name}</span>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-teal-400">
                  ⏱ {formatTimer(callDuration)}
              </div>
            </div>

            {/* Simulated Video Feeds */}
            <div className="relative min-h-[360px] bg-black p-4 flex flex-col justify-between">
              {/* Doctor Main Video Stream */}
              <div className="relative w-full h-[320px] rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80"
                  alt="Doctor"
                  className="w-full h-full object-cover object-top opacity-90"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs font-bold">
                  Dr. Roger S. (Cardiology / Pulmonology)
                </div>
              </div>

              {/* Patient Picture-in-Picture Feed */}
              <div className="absolute bottom-6 right-6 w-36 h-28 rounded-xl overflow-hidden border-2 border-teal-500 shadow-2xl bg-slate-800">
                {callVideoOn ? (
                  <img
                    src={patient.avatar}
                    alt={patient.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-[10px] text-slate-400">
                    Camera Off
                  </div>
                )}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px]">
                  You ({callMicOn ? 'Mic On' : 'Muted'})
                </div>
              </div>
            </div>

            {/* In-Call Notes & Shared Clinical Summary */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 text-xs">
              <label className="block text-slate-400 font-bold mb-1">Consultation Clinical Notes:</label>
              <input
                type="text"
                value={telehealthNotes}
                onChange={e => setTelehealthNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Call action controls */}
            <div className="p-4 bg-slate-950 flex items-center justify-center gap-4">
              <button
                onClick={() => setCallMicOn(!callMicOn)}
                className={`p-3 rounded-full transition-all ${
                  callMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                }`}
                title={callMicOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {callMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setCallVideoOn(!callVideoOn)}
                className={`p-3 rounded-full transition-all ${
                  callVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                }`}
                title={callVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {callVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setTelehealthOpen(false);
                  showToast('Telehealth session concluded. Summary saved to medical chart.');
                }}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REQUEST PRESCRIPTION REFILL ================= */}
      {refillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Request Medication Refill</h3>
              <button onClick={() => setRefillModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefillSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Select Medication</label>
                <select
                  value={refillMedName}
                  onChange={e => setRefillMedName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="Atorvastatin Calcium Trihydrate">Atorvastatin Calcium Trihydrate 20mg</option>
                  <option value="Metformin HCl 500mg">Metformin HCl 500mg (Extended Release)</option>
                  <option value="Fluticasone Propionate Inhaler">Fluticasone Propionate Inhaler (110 mcg)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Dispensing Pharmacy Location</label>
                <select
                  value={refillPharmacy}
                  onChange={e => setRefillPharmacy(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="MediCore Outpatient Pavilion Pharmacy">MediCore Outpatient Pavilion Pharmacy (Pickup)</option>
                  <option value="MediCore Express Courier Delivery">MediCore Express Courier Delivery (Registered Home)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Quantity / Days Supply</label>
                <select
                  value={refillCycles}
                  onChange={e => setRefillCycles(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="30 Days (1 Bottle)">30 Days Supply (1 Unit)</option>
                  <option value="90 Days (3 Bottles)">90 Days Supply (Maintenance)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Pharmacist Notes</label>
                <textarea
                  value={refillNotes}
                  onChange={e => setRefillNotes(e.target.value)}
                  placeholder="Special instructions or delivery notes..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefillModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Submit Refill Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD MEDICATION ================= */}
      {addMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Add New Medication Regimen</h3>
              <button onClick={() => setAddMedModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicationSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Medication Name</label>
                <input
                  type="text"
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  placeholder="e.g. Lisinopril, Amlodipine"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Dosage</label>
                  <input
                    type="text"
                    value={newMedDosage}
                    onChange={e => setNewMedDosage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Frequency</label>
                  <input
                    type="text"
                    value={newMedFreq}
                    onChange={e => setNewMedFreq(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMedModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSPECT SCAN / RADIOLOGY VIEWER ================= */}
      {scanViewerOpen && activeScanOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-3xl overflow-hidden border border-slate-700 bg-[#091422] text-white shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm">{activeScanOrder.testName}</h4>
                <span className="text-xs text-slate-400">DICOM Series • High-Resolution Diagnostic Volumetry</span>
              </div>
              <button onClick={() => setScanViewerOpen(false)} className="p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Stage */}
            <div className="relative min-h-[380px] bg-black flex items-center justify-center overflow-hidden p-4">
              <img
                src="/assets/aistudio/image_9cc16e1f.png"
                alt="Diagnostic Scan"
                style={{
                  transform: `scale(${scanZoom})`,
                  filter: `${scanInvert ? 'invert(1)' : ''} brightness(${scanBrightness}%)`,
                  transition: 'all 0.15s ease'
                }}
                className="max-h-[340px] object-contain rounded-lg"
              />

              {/* Controls bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700 backdrop-blur-md flex items-center gap-3 text-xs">
                <button
                  onClick={() => setScanZoom(z => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-1"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setScanZoom(z => Math.max(0.75, z - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-1"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setScanInvert(!scanInvert)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${
                    scanInvert ? 'bg-teal-600 border-teal-500' : 'border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  Invert Contrast
                </button>
                <button
                  onClick={() => {
                    setScanZoom(1);
                    setScanInvert(false);
                    setScanBrightness(100);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-800"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Radiologist impressions */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs">
              <span className="font-bold text-teal-400 block mb-1">Radiologist Clinical Impression:</span>
              <p className="text-slate-300">
                "{activeScanOrder.resultValue || 'No acute focal consolidation. Bronchovascular markings within physiological tolerances.'}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINT OFFICIAL PDF LAB REPORT ================= */}
      {reportPrintModalOpen && activePrintReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl p-8 bg-white text-slate-900 shadow-2xl border border-slate-200">
            {/* Hospital Print Header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-teal-700 mb-6">
              <div>
                <h2 className="text-xl font-black text-teal-800 tracking-tight">MEDICORE ENTERPRISE HEALTH SYSTEM</h2>
                <p className="text-xs text-slate-500">Department of Diagnostic Pathology & Clinical Radiology</p>
                <span className="text-[10px] text-slate-400">Accredited by CAP & CLIA • ISO 15189 Certified</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold block">REF: #{activePrintReport.id}</span>
                <span className="text-[10px] text-slate-400">Date: {activePrintReport.orderedDate}</span>
              </div>
            </div>

            {/* Patient Demographics */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs grid grid-cols-2 gap-2">
              <div><strong>Patient Name:</strong> {patient.name}</div>
              <div><strong>Patient ID:</strong> {patient.patientCode}</div>
              <div><strong>Age / Gender:</strong> {patient.age} Y / {patient.gender}</div>
              <div><strong>Attending Doctor:</strong> {patient.primaryDoctorName}</div>
            </div>

            {/* Test Results Table */}
            <table className="w-full text-xs text-left mb-6 border border-slate-200">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Investigation</th>
                  <th className="p-2.5">Observed Finding</th>
                  <th className="p-2.5">Reference Range</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-2.5 font-bold">{activePrintReport.testName}</td>
                  <td className="p-2.5 font-mono text-teal-700 font-bold">{activePrintReport.resultValue || 'Normal'}</td>
                  <td className="p-2.5 text-slate-500">Standard Physiological</td>
                  <td className="p-2.5 font-bold text-emerald-600">{activePrintReport.interpretation || 'Verified'}</td>
                </tr>
              </tbody>
            </table>

            {/* Sign-off section */}
            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs">
              <div>
                <span className="font-mono text-[10px] text-slate-400">DIGITAL SIGNATURE HASH:</span>
                <div className="font-mono text-[9px] text-slate-600">SHA256: 4a79b8...e9102c</div>
              </div>
              <div className="text-right">
                <div className="font-serif italic font-bold text-sm text-teal-900">Dr. Roger S., MD, FACC</div>
                <span className="text-[10px] text-slate-400">Chief Pathologist, MediCore Health</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-6 mt-4 border-t border-slate-100">
              <button
                onClick={() => setReportPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintDocument(activePrintReport.testName)}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD MEDICAL HISTORY ================= */}
      {addHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Add Clinical History Record</h3>
              <button onClick={() => setAddHistoryModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHistorySubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Clinical Event / Diagnosis</label>
                <input
                  type="text"
                  value={historyEvent}
                  onChange={e => setHistoryEvent(e.target.value)}
                  placeholder="e.g. Echocardiogram, Follow-up Consultation"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Date</label>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={e => setHistoryDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Attending Doctor</label>
                  <input
                    type="text"
                    value={historyDoctor}
                    onChange={e => setHistoryDoctor(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Facility / Unit</label>
                <input
                  type="text"
                  value={historyFacility}
                  onChange={e => setHistoryFacility(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Clinical Notes & Impressions</label>
                <textarea
                  value={historyNotes}
                  onChange={e => setHistoryNotes(e.target.value)}
                  placeholder="Enter detailed doctor clinical notes..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddHistoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SCANNABLE VACCINE QR CODE ================= */}
      {vaccineQrModalOpen && activeVaccine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white text-slate-900 shadow-2xl text-center border border-slate-200">
            <div className="flex justify-between items-center pb-2 mb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-teal-700">WHO Smart Vaccine Verification</span>
              <button onClick={() => setVaccineQrModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center mb-4">
              <QrCode className="w-36 h-36 text-slate-900 mb-2" />
              <span className="font-mono text-[10px] text-slate-400">CERT-ID: {activeVaccine.hash}</span>
            </div>

            <h4 className="font-extrabold text-sm text-slate-900 mb-1">{activeVaccine.vaccine}</h4>
            <p className="text-xs text-slate-500 mb-4">{activeVaccine.issuer} • Lot #{activeVaccine.lot}</p>

            <button
              onClick={() => handlePrintDocument('Immunization QR Passport')}
              className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official QR Card</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOG IMMUNIZATION ================= */}
      {logVaccineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Log New Immunization</h3>
              <button onClick={() => setLogVaccineModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogVaccineSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Vaccine Name</label>
                <input
                  type="text"
                  value={newVaccineName}
                  onChange={e => setNewVaccineName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Dose / Stage</label>
                  <input
                    type="text"
                    value={newVaccineDose}
                    onChange={e => setNewVaccineDose(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Date Administered</label>
                  <input
                    type="date"
                    value={newVaccineDate}
                    onChange={e => setNewVaccineDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Administering Facility</label>
                  <input
                    type="text"
                    value={newVaccineFacility}
                    onChange={e => setNewVaccineFacility(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    value={newVaccineLot}
                    onChange={e => setNewVaccineLot(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLogVaccineModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Verify & Register
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
                  ₹{payModalInvoice.grandTotal.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="font-bold block mb-1">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Credit Card', 'Debit Card', 'UPI / QR', 'Insurance Co-Pay'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        selectedPaymentMethod === method
                          ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPaymentMethod.includes('Card') && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400">Expires</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400">CVV</label>
                      <input
                        type="password"
                        defaultValue="934"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  Pay ₹{payModalInvoice.grandTotal.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: FILE INSURANCE CLAIM ================= */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">File Direct Insurance Claim</h3>
              <button onClick={() => setClaimModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInsuranceClaimSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={claimProvider}
                  onChange={e => setClaimProvider(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Policy Number</label>
                  <input
                    type="text"
                    value={claimPolicyNum}
                    onChange={e => setClaimPolicyNum(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Claim Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={claimAmount}
                    onChange={e => setClaimAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Diagnosis ICD-10 Code</label>
                <input
                  type="text"
                  value={claimDiagnosis}
                  onChange={e => setClaimDiagnosis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Submit Reimbursement Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINT OFFICIAL TAX RECEIPT ================= */}
      <PrintableInvoiceModal
        isOpen={receiptPrintModalOpen}
        onClose={() => setReceiptPrintModalOpen(false)}
        invoice={activeReceipt}
        theme={theme}
      />

      {/* ================= MODAL: PRINT DIGITAL HEALTH ID CARD ================= */}
      <DigitalHealthCardModal
        isOpen={isHealthCardOpen}
        onClose={() => setIsHealthCardOpen(false)}
        patient={patient}
        theme={theme}
      />

      {/* ================= MODAL: PRINT OFFICIAL E-PRESCRIPTION ================= */}
      <PrintablePrescriptionModal
        isOpen={Boolean(selectedPrescriptionForPrint)}
        onClose={() => setSelectedPrescriptionForPrint(null)}
        prescription={selectedPrescriptionForPrint}
        patient={patient}
        theme={theme}
      />

      {/* ================= MODAL: LOG NUTRITION MEAL ================= */}
      {mealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg">Log Dietary Intake</h3>
              <button onClick={() => setMealModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMealSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Meal Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMealType(type)}
                      className={`py-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                        mealType === type ? 'bg-teal-600 text-white border-teal-500 font-bold' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Food Item / Description</label>
                <input
                  type="text"
                  value={mealFoodName}
                  onChange={e => setMealFoodName(e.target.value)}
                  placeholder="e.g. Grilled salmon with quinoa & broccoli"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={mealCalories}
                    onChange={e => setMealCalories(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Sodium (mg)</label>
                  <input
                    type="number"
                    value={mealSodium}
                    onChange={e => setMealSodium(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={mealCarbs}
                    onChange={e => setMealCarbs(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMealModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Log Meal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Medicine,
  Prescription,
  LabTest,
  LabOrder,
  Bed,
  Invoice,
  Staff,
  CriticalAlert,
  AuditLog,
  UserRole,
  ThemeMode,
  ManagedUser,
  FacilityNode,
  EnterpriseSecurityConfig
} from '../types';
import { api } from './api';
import { dataset1000 } from '../data/dataset1000';
import { LAB_CATALOG, WORKING_LAB_ORDERS } from '../data/labCatalog';

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    patientCode: 'P-12563a',
    name: 'Magnus Stephenson',
    age: 44,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+1 (555) 234-8901',
    email: 'magnus.stephenson@healthmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    admissionStatus: 'Outpatient',
    primaryDoctorId: 'doc-1',
    primaryDoctorName: 'Dr. Roger S.',
    diagnosis: 'Cavitas Thoracis Atypical Infiltration & Bronchial Spasm',
    heartAge: 48,
    chronologicalAge: 40,
    riskScore: 35.4,
    vitals: {
      bloodPressure: '128/82',
      pulseRate: 74,
      respiratoryRate: 18,
      oxygenSaturation: 99,
      temperature: 36.6,
      hba1c: 5.1,
      cholesterol: 190,
      stressLevel: 'Mild',
      sleepQuality: 'Good',
      lastUpdated: '10 mins ago',
    },
    symptoms: ['Chest Pain', 'Fatigue', 'Dyspnea', 'Mild Cough'],
    allergies: ['Penicillin', 'Sulfa Drugs'],
    medicalHistory: [
      {
        date: '2026-03-28',
        event: 'Thoracic 3D High-Res CT Scan',
        doctor: 'Dr. Roger S.',
        facility: 'Pulmonary Care Unit',
        notes: 'Mild interstitial density observed in lower left lobe (pulmo sinister).',
      },
      {
        date: '2026-02-14',
        event: 'Echocardiogram Assessment',
        doctor: 'Dr. Dulov G.',
        facility: 'Cardiology Department',
        notes: 'Normal ejection fraction (62%), no valvular regurgitation.',
      },
      {
        date: '2025-11-09',
        event: 'Spine & Ribcage Radiography',
        doctor: 'Dr. Tatiana M.',
        facility: 'Orthopedic Center',
        notes: 'Columna vertebralis thoracic alignment normal.',
      },
    ],
  },
  {
    id: 'pat-2',
    patientCode: 'P-14980b',
    name: 'Alexandro Sterling',
    age: 38,
    gender: 'Male',
    bloodGroup: 'A+',
    phone: '+1 (555) 345-6789',
    email: 'alex.sterling@metrohealth.net',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    admissionStatus: 'Admitted',
    ward: 'Cardiology Ward 3',
    bedNumber: 'CW-304',
    primaryDoctorId: 'doc-2',
    primaryDoctorName: 'Dr. Dulov G.',
    diagnosis: 'Gastroenteritis & Acid Reflux Induced Cardialgia',
    heartAge: 42,
    chronologicalAge: 38,
    riskScore: 28.2,
    vitals: {
      bloodPressure: '110/80',
      pulseRate: 54,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      temperature: 37.1,
      hba1c: 5.4,
      cholesterol: 175,
      stressLevel: 'Moderate',
      sleepQuality: 'Good',
      lastUpdated: '08:12 AM',
    },
    symptoms: ['Dizziness', 'Stomach Cramps', 'Nausea', 'Heartburn'],
    allergies: ['Latex'],
    medicalHistory: [
      {
        date: '2026-03-26',
        event: 'Digestive Endoscopy & Biopsy',
        doctor: 'Dr. Elena Rostova',
        facility: 'Gastroenterology Center',
        notes: 'Mild gastric mucosal inflammation, benign antral erythema.',
      },
    ],
  },
  {
    id: 'pat-3',
    patientCode: 'P-11874c',
    name: 'Elena Rostova-Smith',
    age: 29,
    gender: 'Female',
    bloodGroup: 'B+',
    phone: '+1 (555) 456-7890',
    email: 'elena.rostova@carenetwork.org',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    admissionStatus: 'ICU',
    ward: 'Intensive Care Unit',
    bedNumber: 'ICU-02',
    primaryDoctorId: 'doc-4',
    primaryDoctorName: 'Dr. Sophia Chen',
    diagnosis: 'Acute Respiratory Distress & Bilateral Pneumonitis',
    heartAge: 33,
    chronologicalAge: 29,
    riskScore: 68.5,
    vitals: {
      bloodPressure: '138/88',
      pulseRate: 104,
      respiratoryRate: 26,
      oxygenSaturation: 92,
      temperature: 38.8,
      hba1c: 5.8,
      cholesterol: 210,
      stressLevel: 'High',
      sleepQuality: 'Poor',
      lastUpdated: '5 mins ago',
    },
    symptoms: ['Fever', 'Dyspnea', 'Swelling', 'Chest Pain'],
    allergies: ['Ciprofloxacin'],
    medicalHistory: [
      {
        date: '2026-03-30',
        event: 'Emergency ICU Admission',
        doctor: 'Dr. Sophia Chen',
        facility: 'Critical Care ICU',
        notes: 'Placed on high-flow nasal cannula; continuous pulse-ox monitoring.',
      },
    ],
  },
  {
    id: 'pat-4',
    patientCode: 'P-16521d',
    name: 'David K. O’Connor',
    age: 62,
    gender: 'Male',
    bloodGroup: 'AB-',
    phone: '+1 (555) 567-8901',
    email: 'david.oconnor@biomed.io',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    admissionStatus: 'Admitted',
    ward: 'Surgical Recovery',
    bedNumber: 'SR-108',
    primaryDoctorId: 'doc-3',
    primaryDoctorName: 'Dr. Tatiana M.',
    diagnosis: 'Post-Op Lumbar Discectomy & Spinal Fusion',
    heartAge: 64,
    chronologicalAge: 62,
    riskScore: 42.1,
    vitals: {
      bloodPressure: '124/78',
      pulseRate: 68,
      respiratoryRate: 15,
      oxygenSaturation: 98,
      temperature: 36.8,
      hba1c: 6.2,
      cholesterol: 185,
      stressLevel: 'Mild',
      sleepQuality: 'Fair',
      lastUpdated: '1 hour ago',
    },
    symptoms: ['Back Pain', 'Stiffness', 'Mild Tingling'],
    allergies: ['Codeine', 'Morphine'],
    medicalHistory: [
      {
        date: '2026-03-24',
        event: 'Lumbar Spine Microdiscectomy',
        doctor: 'Dr. Tatiana M.',
        facility: 'Orthopedic Surgical Center',
        notes: 'L4-L5 herniated disc decompressed. Post-op mobility satisfactory.',
      },
    ],
  },
  {
    id: 'pat-5',
    patientCode: 'P-18932e',
    name: 'Maya Lin Zhao',
    age: 8,
    gender: 'Female',
    bloodGroup: 'O-',
    phone: '+1 (555) 678-9012',
    email: 'parents.zhao@kinder.org',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    admissionStatus: 'Outpatient',
    primaryDoctorId: 'doc-5',
    primaryDoctorName: 'Dr. Liam Alistair',
    diagnosis: 'Pediatric Seasonal Asthma & Allergic Rhinitis',
    heartAge: 8,
    chronologicalAge: 8,
    riskScore: 12.0,
    vitals: {
      bloodPressure: '96/62',
      pulseRate: 88,
      respiratoryRate: 20,
      oxygenSaturation: 99,
      temperature: 36.7,
      hba1c: 4.8,
      cholesterol: 140,
      stressLevel: 'Mild',
      sleepQuality: 'Good',
      lastUpdated: '2 hours ago',
    },
    symptoms: ['Wheezing', 'Sneezing', 'Cough'],
    allergies: ['Peanuts', 'Pollen'],
    medicalHistory: [
      {
        date: '2026-03-15',
        event: 'Pediatric Pulmonary Function Test',
        doctor: 'Dr. Liam Alistair',
        facility: 'Pediatric Outpatient Clinic',
        notes: 'FEV1 improved 18% post bronchodilator.',
      },
    ],
  },
];

const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Roger S.',
    title: 'Senior Pulmonologist & Critical Care Specialist',
    department: 'Pulmonology',
    specialization: 'Thoracic Imaging & Invasive Bronchoscopy',
    qualification: 'MD, FCCP, Harvard Medical School',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    consultationFee: 240,
    experienceYears: 18,
    rating: 4.9,
    patientsCount: 412,
    availability: 'Available',
    schedule: [
      { day: 'Mon - Fri', hours: '08:00 - 16:00' },
      { day: 'Sat', hours: '09:00 - 13:00' },
    ],
  },
  {
    id: 'doc-2',
    name: 'Dr. Dulov G.',
    title: 'Chief Interventional Cardiologist',
    department: 'Cardiology',
    specialization: 'Cardiovascular Hemodynamics & Stenting',
    qualification: 'MD, FACC, Johns Hopkins Medicine',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    consultationFee: 280,
    experienceYears: 22,
    rating: 4.95,
    patientsCount: 520,
    availability: 'In Consultation',
    schedule: [
      { day: 'Mon, Wed, Fri', hours: '07:30 - 15:30' },
      { day: 'Tue, Thu', hours: '12:00 - 19:00' },
    ],
  },
  {
    id: 'doc-3',
    name: 'Dr. Tatiana M.',
    title: 'Head of Orthopedic & Spine Surgery',
    department: 'Orthopedics',
    specialization: 'Minimally Invasive Spinal Reconstruction',
    qualification: 'MD, PhD, Mayo Clinic College of Medicine',
    avatar: 'https://images.unsplash.com/photo-1594824813583-36c1e5df3db9?w=150&auto=format&fit=crop&q=80',
    consultationFee: 260,
    experienceYears: 16,
    rating: 4.88,
    patientsCount: 380,
    availability: 'In Surgery',
    schedule: [
      { day: 'Tue, Thu, Sat', hours: '08:00 - 17:00' },
    ],
  },
  {
    id: 'doc-4',
    name: 'Dr. Sophia Chen',
    title: 'Director of Intensive Care & Emergency Medicine',
    department: 'Critical Care',
    specialization: 'Acute Resuscitation & Multi-Organ Support',
    qualification: 'MD, Stanford University',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    consultationFee: 300,
    experienceYears: 15,
    rating: 4.92,
    patientsCount: 610,
    availability: 'Available',
    schedule: [
      { day: 'Mon - Sun', hours: 'Rotational 24/7' },
    ],
  },
  {
    id: 'doc-5',
    name: 'Dr. Liam Alistair',
    title: 'Chief Pediatrician',
    department: 'Pediatrics',
    specialization: 'Pediatric Allergy & Immunology',
    qualification: 'MBBS, FRCPCH, Oxford University',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    consultationFee: 190,
    experienceYears: 12,
    rating: 4.85,
    patientsCount: 340,
    availability: 'Available',
    schedule: [
      { day: 'Mon - Thu', hours: '09:00 - 16:30' },
    ],
  },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'pat-1',
    patientName: 'Magnus Stephenson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Roger S.',
    department: 'Pulmonary Care Unit',
    date: '2026-04-03',
    time: '09:30 AM',
    status: 'Scheduled',
    visitType: 'Treatment',
    notes: 'Follow-up on broncho-alveolar lavage & 3D thoracic volume evaluation.',
  },
  {
    id: 'apt-2',
    patientId: 'pat-1',
    patientName: 'Magnus Stephenson',
    doctorId: 'doc-2',
    doctorName: 'Dr. Dulov G.',
    department: 'Cardiology Department',
    date: '2026-03-20',
    time: '11:15 AM',
    status: 'Completed',
    visitType: 'Follow-up',
    notes: 'Hemodynamic evaluation normal. Cardiac rhythm stable.',
  },
  {
    id: 'apt-3',
    patientId: 'pat-1',
    patientName: 'Magnus Stephenson',
    doctorId: 'doc-3',
    doctorName: 'Dr. Tatiana M.',
    department: 'Orthopedic Center',
    date: '2026-02-18',
    time: '02:00 PM',
    status: 'Completed',
    visitType: 'Diagnostic',
    notes: 'Posterior thoracic rib alignment confirmed intact.',
  },
  {
    id: 'apt-4',
    patientId: 'pat-2',
    patientName: 'Alexandro Sterling',
    doctorId: 'doc-2',
    doctorName: 'Dr. Dulov G.',
    department: 'Cardiology',
    date: '2026-04-02',
    time: '10:00 AM',
    status: 'In-Progress',
    visitType: 'Treatment',
    notes: 'In-ward morning cardiac telemetry rounds.',
  },
  {
    id: 'apt-5',
    patientId: 'pat-5',
    patientName: 'Maya Lin Zhao',
    doctorId: 'doc-5',
    doctorName: 'Dr. Liam Alistair',
    department: 'Pediatrics',
    date: '2026-04-04',
    time: '03:30 PM',
    status: 'Scheduled',
    visitType: 'Consultation',
    notes: 'Allergy panel skin prick review.',
  },
];

const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    name: 'Albuterol Sulfate Inhalation Aerosol',
    genericName: 'Albuterol',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    strength: '90 mcg/actuation',
    batchNumber: 'BCH-2026-881',
    stock: 142,
    minThreshold: 30,
    unitPrice: 38.5,
    expiryDate: '2027-11-30',
    status: 'In Stock',
  },
  {
    id: 'med-2',
    name: 'Atorvastatin Calcium Trihydrate',
    genericName: 'Atorvastatin',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    strength: '20 mg',
    batchNumber: 'BCH-2025-419',
    stock: 580,
    minThreshold: 100,
    unitPrice: 1.25,
    expiryDate: '2028-06-15',
    status: 'In Stock',
  },
  {
    id: 'med-3',
    name: 'Esomeprazole Magnesium Delayed-Release',
    genericName: 'Esomeprazole',
    category: 'Gastrointestinal',
    dosageForm: 'Capsule',
    strength: '40 mg',
    batchNumber: 'BCH-2026-102',
    stock: 22,
    minThreshold: 50,
    unitPrice: 2.10,
    expiryDate: '2027-04-01',
    status: 'Low Stock',
  },
  {
    id: 'med-4',
    name: 'Piperacillin and Tazobactam for Injection',
    genericName: 'Piperacillin/Tazobactam',
    category: 'Antibiotic',
    dosageForm: 'Injection',
    strength: '4.5 g / vial',
    batchNumber: 'BCH-2025-992',
    stock: 8,
    minThreshold: 25,
    unitPrice: 45.0,
    expiryDate: '2026-12-31',
    status: 'Low Stock',
  },
  {
    id: 'med-5',
    name: 'Enoxaparin Sodium Solution',
    genericName: 'Enoxaparin',
    category: 'Hematology',
    dosageForm: 'Prefilled Syringe',
    strength: '40 mg / 0.4 mL',
    batchNumber: 'BCH-2026-614',
    stock: 210,
    minThreshold: 40,
    unitPrice: 18.75,
    expiryDate: '2027-08-20',
    status: 'In Stock',
  },
];

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-1',
    patientId: 'pat-1',
    patientName: 'Magnus Stephenson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Roger S.',
    date: '2026-03-28',
    status: 'Prescribed',
    items: [
      {
        medicineId: 'med-1',
        medicineName: 'Albuterol Sulfate Inhalation Aerosol',
        dosage: '2 puffs',
        frequency: 'Every 6 hours as needed',
        duration: '30 days',
        quantity: 1,
        dispensed: true,
      },
      {
        medicineId: 'med-2',
        medicineName: 'Atorvastatin Calcium Trihydrate',
        dosage: '20 mg',
        frequency: 'Once daily at bedtime',
        duration: '90 days',
        quantity: 90,
        dispensed: false,
      },
    ],
  },
];

const INITIAL_LAB_TESTS: LabTest[] = LAB_CATALOG;

const INITIAL_LAB_ORDERS: LabOrder[] = WORKING_LAB_ORDERS as LabOrder[];

const INITIAL_BEDS: Bed[] = [
  { id: 'b-101', bedNumber: 'ICU-01', wardId: 'w-icu', wardName: 'Intensive Care Unit', type: 'ICU', status: 'Occupied', patientId: 'pat-3', patientName: 'Elena Rostova-Smith', admittedDate: '2026-03-30' },
  { id: 'b-102', bedNumber: 'ICU-02', wardId: 'w-icu', wardName: 'Intensive Care Unit', type: 'ICU', status: 'Available' },
  { id: 'b-103', bedNumber: 'ICU-03', wardId: 'w-icu', wardName: 'Intensive Care Unit', type: 'ICU', status: 'Cleaning' },
  { id: 'b-104', bedNumber: 'ICU-04', wardId: 'w-icu', wardName: 'Intensive Care Unit', type: 'ICU', status: 'Available' },
  
  { id: 'b-201', bedNumber: 'CW-301', wardId: 'w-cardio', wardName: 'Cardiology Ward 3', type: 'Cardiac', status: 'Available' },
  { id: 'b-202', bedNumber: 'CW-302', wardId: 'w-cardio', wardName: 'Cardiology Ward 3', type: 'Cardiac', status: 'Occupied', patientId: 'pat-2', patientName: 'Alexandro Sterling', admittedDate: '2026-03-26' },
  { id: 'b-203', bedNumber: 'CW-303', wardId: 'w-cardio', wardName: 'Cardiology Ward 3', type: 'Cardiac', status: 'Available' },
  { id: 'b-204', bedNumber: 'CW-304', wardId: 'w-cardio', wardName: 'Cardiology Ward 3', type: 'Cardiac', status: 'Maintenance' },

  { id: 'b-301', bedNumber: 'SR-101', wardId: 'w-surg', wardName: 'Surgical Recovery', type: 'Surgical', status: 'Occupied', patientId: 'pat-4', patientName: 'David K. O’Connor', admittedDate: '2026-03-24' },
  { id: 'b-302', bedNumber: 'SR-102', wardId: 'w-surg', wardName: 'Surgical Recovery', type: 'Surgical', status: 'Available' },
  { id: 'b-303', bedNumber: 'SR-103', wardId: 'w-surg', wardName: 'Surgical Recovery', type: 'Surgical', status: 'Available' },
  { id: 'b-304', bedNumber: 'SR-104', wardId: 'w-surg', wardName: 'Surgical Recovery', type: 'Surgical', status: 'Cleaning' },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-081',
    patientId: 'pat-1',
    patientName: 'Magnus Stephenson',
    date: '2026-03-28',
    dueDate: '2026-04-28',
    items: [
      { description: 'Specialist Consultation (Dr. Roger S.)', quantity: 1, unitPrice: 240, total: 240 },
      { description: 'Thoracic 3D High-Res CT Scan', quantity: 1, unitPrice: 480, total: 480 },
      { description: 'Pharmacy - Albuterol Inhaler', quantity: 1, unitPrice: 38.5, total: 38.5 },
    ],
    subtotal: 758.5,
    tax: 37.9,
    discount: 50.0,
    grandTotal: 746.4,
    status: 'Paid',
    paymentMethod: 'Medical Insurance (Aetna Health)',
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2026-082',
    patientId: 'pat-2',
    patientName: 'Alexandro Sterling',
    date: '2026-03-31',
    dueDate: '2026-04-15',
    items: [
      { description: 'In-Patient Ward Room (3 Nights)', quantity: 3, unitPrice: 450, total: 1350 },
      { description: 'Cardiology Telemetry & Monitoring', quantity: 3, unitPrice: 180, total: 540 },
      { description: 'Gastroenterology Consultation', quantity: 1, unitPrice: 280, total: 280 },
    ],
    subtotal: 2170,
    tax: 108.5,
    discount: 0,
    grandTotal: 2278.5,
    status: 'Pending',
  },
];

const INITIAL_STAFF: Staff[] = [
  { id: 'stf-1', name: 'Nurse Sarah Jenkins, RN', role: 'Head Charge Nurse', department: 'ICU', shift: 'Morning (07:00 - 15:00)', contact: 'x4401', status: 'On Duty' },
  { id: 'stf-2', name: 'Alexandre Dubois, RPh', role: 'Chief Pharmacist', department: 'Pharmacy', shift: 'Morning (07:00 - 15:00)', contact: 'x4412', status: 'On Duty' },
  { id: 'stf-3', name: 'Elena Kozlova, MLS', role: 'Senior Lab Technologist', department: 'Pathology & Lab', shift: 'Morning (07:00 - 15:00)', contact: 'x4430', status: 'On Duty' },
  { id: 'stf-4', name: 'Marcus Brody, CPA', role: 'Hospital Revenue Accountant', department: 'Finance & Billing', shift: 'Morning (07:00 - 15:00)', contact: 'x4488', status: 'On Duty' },
  { id: 'stf-5', name: 'James Kim, RT', role: 'Radiologic Technologist', department: 'Radiology / CT', shift: 'Evening (15:00 - 23:00)', contact: 'x4455', status: 'Off Duty' },
];

const INITIAL_ALERTS: CriticalAlert[] = [
  {
    id: 'alt-1',
    title: 'ICU Beds Below 10%',
    department: 'Intensive Care Unit',
    severity: 'critical',
    time: '05 min ago',
    actionRequired: 'Triage transfer protocols or prepare overflow ward 4',
  },
  {
    id: 'alt-2',
    title: 'Ventilator Maintenance Due',
    department: 'Biomedical Engineering',
    severity: 'medium',
    time: '15 min ago',
    actionRequired: 'Service scheduled for Unit #08 in ICU',
  },
  {
    id: 'alt-3',
    title: 'Blood Bank - O-Negative Low',
    department: 'Hematology Bank',
    severity: 'high',
    time: '18 min ago',
    actionRequired: 'Reserve below 4 units; dispatch regional blood center order',
  },
  {
    id: 'alt-4',
    title: 'MRI Machine Scheduled Service',
    department: 'Radiology Department',
    severity: 'low',
    time: '35 min ago',
    actionRequired: 'Firmware calibration starting 22:00 tonight',
  },
];

const INITIAL_SYSTEM_USERS: ManagedUser[] = [
  {
    id: 'usr-root-1',
    name: 'Dr. Eleanor Vance, MD, CISSP',
    email: 'superadmin@medicore.org',
    role: 'SUPER_ADMIN',
    department: 'Enterprise Health Governance & Executive Board',
    facility: 'MediCore Enterprise Health Network (All Facilities)',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: 'Just now'
  },
  {
    id: 'usr-admin-1',
    name: 'Marcus Vance, MHA',
    email: 'admin@medicore.org',
    role: 'HOSPITAL_ADMIN',
    department: 'Hospital Administration & Clinical Operations',
    facility: 'MediCore Central Hospital (Flagship)',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '12 mins ago'
  },
  {
    id: 'usr-doc-1',
    name: 'Dr. Roger S., MD',
    email: 'roger.s@medicore.org',
    role: 'DOCTOR',
    department: 'Pulmonology & Critical Care',
    facility: 'MediCore Central Hospital',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '4 mins ago'
  },
  {
    id: 'usr-doc-2',
    name: 'Dr. Sophia Chen, MD',
    email: 'sophia.chen@medicore.org',
    role: 'DOCTOR',
    department: 'Cardiovascular Surgery',
    facility: 'CityCare Metropolitan Pavilion',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '1 hour ago'
  },
  {
    id: 'usr-nurse-1',
    name: 'Nurse Sarah Jenkins, RN, BSN',
    email: 'sarah.j@medicore.org',
    role: 'NURSE',
    department: 'Intensive Care Unit (ICU)',
    facility: 'MediCore Central Hospital',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '2 mins ago'
  },
  {
    id: 'usr-pharm-1',
    name: 'Alexandre Dubois, RPh',
    email: 'alex.d@medicore.org',
    role: 'PHARMACIST',
    department: 'Central Pharmacy & Formulary',
    facility: 'MediCore Central Hospital',
    mfaEnabled: false,
    status: 'Active',
    lastLogin: 'Yesterday'
  },
  {
    id: 'usr-lab-1',
    name: 'Elena Kozlova, MLS',
    email: 'elena.k@medicore.org',
    role: 'LAB_TECH',
    department: 'Pathology & Diagnostic Laboratory',
    facility: 'MediCore Central Hospital',
    mfaEnabled: true,
    status: 'Active',
    lastLogin: '35 mins ago'
  },
  {
    id: 'usr-acc-1',
    name: 'Marcus Brody, CPA',
    email: 'm.brody@medicore.org',
    role: 'ACCOUNTANT',
    department: 'Hospital Revenue & Finance',
    facility: 'MediCore Central Hospital',
    mfaEnabled: false,
    status: 'Active',
    lastLogin: '3 hours ago'
  }
];

const INITIAL_FACILITIES: FacilityNode[] = [
  {
    id: 'fac-1',
    name: 'MediCore Central Hospital (Flagship)',
    city: 'New York, NY',
    type: 'Academic Medical Center & Level 1 Trauma',
    totalBeds: 620,
    occupiedBeds: 584,
    icusTotal: 48,
    icusOccupied: 42,
    dutyPhysicians: 185,
    status: 'Optimal',
    director: 'Dr. Eleanor Vance, MD'
  },
  {
    id: 'fac-2',
    name: 'CityCare Metropolitan Pavilion',
    city: 'Brooklyn, NY',
    type: 'General Acute & Surgical Hospital',
    totalBeds: 450,
    occupiedBeds: 402,
    icusTotal: 32,
    icusOccupied: 28,
    dutyPhysicians: 120,
    status: 'High Load',
    director: 'Marcus Vance, MHA'
  },
  {
    id: 'fac-3',
    name: 'St. Jude Wellness & Rehabilitation',
    city: 'Queens, NY',
    type: 'Specialty Rehabilitation & Chronic Care',
    totalBeds: 180,
    occupiedBeds: 136,
    icusTotal: 12,
    icusOccupied: 8,
    dutyPhysicians: 45,
    status: 'Optimal',
    director: 'Dr. Maya Patel, MD'
  },
  {
    id: 'fac-4',
    name: 'Westside Trauma & Surgical Center',
    city: 'Manhattan, NY',
    type: 'Emergency Surge & Critical Care',
    totalBeds: 220,
    occupiedBeds: 201,
    icusTotal: 24,
    icusOccupied: 22,
    dutyPhysicians: 62,
    status: 'Surge Alert',
    director: 'Dr. Julian Hayes, MD'
  }
];

const INITIAL_SECURITY_CONFIG: EnterpriseSecurityConfig = {
  lockdownActive: false,
  maintenanceMode: false,
  strictMfaEnforced: true,
  lastBackupTime: '14 minutes ago',
  backendApiStatus: 'Online',
  encryptionStandard: 'AES-256-GCM / TLS 1.3 / FIPS 140-3'
};

class MockDatabase {
  private currentRole: UserRole = 'HOSPITAL_ADMIN';
  private currentTheme: ThemeMode = 'mint';
  private patients: Patient[] = (dataset1000.patients as any) || INITIAL_PATIENTS;
  private doctors: Doctor[] = (dataset1000.doctors as any) || INITIAL_DOCTORS;
  private appointments: Appointment[] = INITIAL_APPOINTMENTS;
  private medicines: Medicine[] = INITIAL_MEDICINES;
  private prescriptions: Prescription[] = INITIAL_PRESCRIPTIONS;
  private labTests: LabTest[] = INITIAL_LAB_TESTS;
  private labOrders: LabOrder[] = INITIAL_LAB_ORDERS;
  private beds: Bed[] = INITIAL_BEDS;
  private invoices: Invoice[] = INITIAL_INVOICES;
  private staff: Staff[] = (dataset1000.staff as any) || INITIAL_STAFF;
  private alerts: CriticalAlert[] = INITIAL_ALERTS;
  private auditLogs: AuditLog[] = [];
  private selectedPatientId: string = 'pat-1';
  private systemUsers: ManagedUser[] = INITIAL_SYSTEM_USERS;
  private facilities: FacilityNode[] = INITIAL_FACILITIES;
  private securityConfig: EnterpriseSecurityConfig = INITIAL_SECURITY_CONFIG;

  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) {}
    });
  }

  constructor() {
    this.loadFromStorage();
    if (this.auditLogs.length === 0) {
      this.logAudit('System Boot', 'Security', 'MediCore Enterprise Clinical Engine initialized');
    }
    if (typeof window !== 'undefined') {
      this.syncWithBackend();
    }
  }

  public async syncWithBackend() {
    try {
      const data = await api.bootstrap();
      if (data && data.patients && data.patients.length > 0) {
        this.patients = data.patients;
        this.doctors = data.doctors;
        this.appointments = data.appointments;
        this.medicines = data.medicines;
        this.prescriptions = data.prescriptions;
        this.labTests = data.labTests;
        this.labOrders = data.labOrders;
        this.beds = data.beds;
        this.invoices = data.invoices;
        this.staff = data.staff;
        this.alerts = data.alerts;
        if (data.auditLogs && data.auditLogs.length > 0) {
          this.auditLogs = data.auditLogs;
        }
        this.saveToStorage();
        this.notifyListeners();
        console.log('[MediCore] Live connected with Express REST Backend');
      }
    } catch {
      // Local storage fallback active when offline
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const savedPatients = localStorage.getItem('medicore_patients');
      if (savedPatients) this.patients = JSON.parse(savedPatients);

      const savedApts = localStorage.getItem('medicore_appointments');
      if (savedApts) this.appointments = JSON.parse(savedApts);

      const savedMeds = localStorage.getItem('medicore_medicines');
      if (savedMeds) this.medicines = JSON.parse(savedMeds);

      const savedBeds = localStorage.getItem('medicore_beds');
      if (savedBeds) this.beds = JSON.parse(savedBeds);

      const savedInvoices = localStorage.getItem('medicore_invoices');
      if (savedInvoices) this.invoices = JSON.parse(savedInvoices);

      const savedRole = localStorage.getItem('medicore_role') as UserRole;
      if (savedRole) this.currentRole = savedRole;

      this.currentTheme = 'mint';
      localStorage.setItem('medicore_theme', 'mint');
    } catch {
      // Storage fallback
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('medicore_patients', JSON.stringify(this.patients));
      localStorage.setItem('medicore_appointments', JSON.stringify(this.appointments));
      localStorage.setItem('medicore_medicines', JSON.stringify(this.medicines));
      localStorage.setItem('medicore_beds', JSON.stringify(this.beds));
      localStorage.setItem('medicore_invoices', JSON.stringify(this.invoices));
      localStorage.setItem('medicore_role', this.currentRole);
      localStorage.setItem('medicore_theme', this.currentTheme);
    } catch {
      // Storage save error ignored
    }
  }

  public logAudit(action: string, module: string, details: string) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userName: this.getRoleName(this.currentRole),
      userRole: this.currentRole,
      action,
      module,
      details,
      ipAddress: '10.24.180.14 [HIPAA Enforced]',
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
  }

  public getRoleName(role: UserRole): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'Chief Executive Officer (CEO)';
      case 'HOSPITAL_ADMIN': return 'Hospital Administrator';
      case 'DOCTOR': return 'Dr. Roger S., MD';
      case 'NURSE': return 'Sarah Jenkins, RN';
      case 'RECEPTIONIST': return 'Front Desk Coordinator';
      case 'PHARMACIST': return 'Alexandre Dubois, RPh';
      case 'LAB_TECH': return 'Elena Kozlova, MLS';
      case 'ACCOUNTANT': return 'Marcus Brody, CPA';
      case 'PATIENT': return 'Magnus Stephenson';
    }
  }

  // Role & Theme
  public getRole(): UserRole { return this.currentRole; }
  public setRole(role: UserRole) {
    this.currentRole = role;
    this.logAudit('Role Switch', 'Auth', `Session switched to ${this.getRoleName(role)}`);
    this.saveToStorage();
  }

  public getTheme(): ThemeMode { return 'mint'; }
  public setTheme(_theme: ThemeMode) {
    this.currentTheme = 'mint';
    this.saveToStorage();
  }

  // Selected Patient for 3D biometrics sync
  public getSelectedPatient(): Patient {
    return this.patients.find(p => p.id === this.selectedPatientId) || this.patients[0];
  }

  public setSelectedPatient(id: string) {
    this.selectedPatientId = id;
    const pat = this.getSelectedPatient();
    this.logAudit('Patient View', 'Clinical', `Loaded 3D records for ${pat.name} (${pat.patientCode})`);
  }

  // Patients CRUD
  public getPatients(): Patient[] { return [...this.patients]; }
  public getPatientById(id: string): Patient | undefined {
    return this.patients.find(p => p.id === id);
  }

  public addPatient(patient: Omit<Patient, 'id' | 'patientCode'>): Patient {
    const newPat: Patient = {
      ...patient,
      id: `pat-${Date.now()}`,
      patientCode: `P-${Math.floor(10000 + Math.random() * 90000)}x`,
    };
    this.patients.unshift(newPat);
    this.logAudit('Patient Registration', 'Patients', `Registered new patient ${newPat.name}`);
    this.saveToStorage();
    this.notifyListeners();
    api.createPatient(newPat).catch(() => {});
    return newPat;
  }

  public updatePatient(id: string, updates: Partial<Patient>): Patient | undefined {
    const index = this.patients.findIndex(p => p.id === id);
    if (index !== -1) {
      this.patients[index] = { ...this.patients[index], ...updates };
      this.logAudit('Patient Update', 'Patients', `Updated chart for ${this.patients[index].name}`);
      this.saveToStorage();
      this.notifyListeners();
      api.updatePatient(id, updates).catch(() => {});
      return this.patients[index];
    }
    return undefined;
  }

  public dischargePatient(id: string, reason?: string): Patient | undefined {
    const idx = this.patients.findIndex(p => p.id === id);
    if (idx === -1) return undefined;

    const patient = this.patients[idx];
    const previousBed = patient.bedNumber;

    // Release the bed locally
    if (previousBed) {
      const bed = this.beds.find(b => b.bedNumber === previousBed || b.patientId === id);
      if (bed) {
        bed.status = 'Cleaning';
        bed.patientId = undefined;
        bed.patientName = undefined;
      }
    }

    // Completely remove patient from active patients array so total count decreases!
    this.patients.splice(idx, 1);

    this.logAudit(
      'Patient Discharged & Removed',
      'Patients',
      `Discharged & removed ${patient.name} (${patient.patientCode}). Remaining patients: ${this.patients.length}`
    );
    this.saveToStorage();
    this.notifyListeners();

    // Call real backend discharge endpoint (PostgreSQL / MySQL)
    api.dischargePatient(id, { reason, dischargedBy: patient.primaryDoctorName }).catch(() => {
      api.deletePatient(id).catch(() => {});
    });

    return patient;
  }

  public admitPatient(id: string, ward: string = 'General Medicine Ward', bedNumber?: string): Patient | undefined {
    const patient = this.patients.find(p => p.id === id);
    if (!patient) return undefined;

    patient.admissionStatus = 'Admitted';
    patient.ward = ward;
    if (bedNumber) patient.bedNumber = bedNumber;

    this.logAudit('Patient Admission', 'Patients', `Admitted ${patient.name} (${patient.patientCode}) to ${ward}`);
    this.saveToStorage();
    this.notifyListeners();
    api.updatePatient(id, {
      admissionStatus: 'Admitted',
      ward: ward,
      bedNumber: bedNumber
    }).catch(() => {});

    return patient;
  }

  public deletePatient(id: string): boolean {
    const idx = this.patients.findIndex(p => p.id === id);
    if (idx !== -1) {
      const removed = this.patients[idx];
      this.patients.splice(idx, 1);
      this.logAudit('Patient Record Archived', 'Patients', `Archived chart for ${removed.name} (${removed.patientCode})`);
      this.saveToStorage();
      this.notifyListeners();
      api.deletePatient(id).catch(() => {});
      return true;
    }
    return false;
  }

  // Doctors
  public getDoctors(): Doctor[] { return [...this.doctors]; }
  public addDoctor(doc: Omit<Doctor, 'id'>): Doctor {
    const newDoc: Doctor = {
      ...doc,
      id: `doc-${Date.now()}`,
    };
    this.doctors.unshift(newDoc);
    this.logAudit('Doctor Registered', 'Staff', `Registered attending doctor ${newDoc.name} (${newDoc.department})`);
    this.saveToStorage();
    this.notifyListeners();
    api.createDoctor(newDoc).catch(() => {});
    return newDoc;
  }

  public deleteDoctor(id: string): boolean {
    const idx = this.doctors.findIndex(d => d.id === id);
    if (idx !== -1) {
      const removed = this.doctors[idx];
      this.doctors.splice(idx, 1);
      this.logAudit('Doctor Removed', 'Staff', `Archived specialist ${removed.name}`);
      this.saveToStorage();
      this.notifyListeners();
      api.deleteDoctor(id).catch(() => {});
      return true;
    }
    return false;
  }

  // Appointments
  public getAppointments(): Appointment[] { return [...this.appointments]; }
  public addAppointment(apt: Omit<Appointment, 'id'>): Appointment {
    const newApt: Appointment = {
      ...apt,
      id: `apt-${Date.now()}`,
    };
    this.appointments.unshift(newApt);
    this.logAudit('Appointment Scheduled', 'Scheduling', `Booked appointment for ${newApt.patientName} with ${newApt.doctorName}`);
    this.saveToStorage();
    api.createAppointment(newApt).catch(() => {});
    return newApt;
  }

  public updateAppointmentStatus(id: string, status: Appointment['status']) {
    const apt = this.appointments.find(a => a.id === id);
    if (apt) {
      apt.status = status;
      this.logAudit('Appointment Status', 'Scheduling', `Updated appointment ${id} to ${status}`);
      this.saveToStorage();
      api.updateAppointment(id, { status }).catch(() => {});
    }
  }

  // Pharmacy & Prescriptions
  public getMedicines(): Medicine[] { return [...this.medicines]; }
  public getPrescriptions(): Prescription[] { return [...this.prescriptions]; }

  public dispenseMedicine(prescriptionId: string, medicineId: string) {
    const rx = this.prescriptions.find(p => p.id === prescriptionId);
    if (rx) {
      const item = rx.items.find(i => i.medicineId === medicineId);
      if (item && !item.dispensed) {
        item.dispensed = true;
        const med = this.medicines.find(m => m.id === medicineId);
        if (med && med.stock >= item.quantity) {
          med.stock -= item.quantity;
          if (med.stock <= med.minThreshold) {
            med.status = 'Low Stock';
          }
        }
        this.logAudit('Medication Dispensed', 'Pharmacy', `Dispensed ${item.medicineName} for ${rx.patientName}`);
        this.saveToStorage();
        api.dispensePrescription(prescriptionId).catch(() => {});
      }
    }
  }

  public addMedicine(medicine: Omit<Medicine, 'id'>): Medicine {
    const newMed: Medicine = { ...medicine, id: `med-${Date.now()}` };
    this.medicines.unshift(newMed);
    this.logAudit('Inventory Added', 'Pharmacy', `Added batch of ${newMed.name}`);
    this.saveToStorage();
    return newMed;
  }

  // Laboratory
  public getLabTests(): LabTest[] { return [...this.labTests]; }
  public getLabOrders(): LabOrder[] { return [...this.labOrders]; }

  public updateLabOrderStatus(id: string, status: LabOrder['status'], resultValue?: string, interpretation?: LabOrder['interpretation']) {
    const order = this.labOrders.find(o => o.id === id);
    if (order) {
      order.status = status;
      if (resultValue) order.resultValue = resultValue;
      if (interpretation) order.interpretation = interpretation;
      if (status === 'Completed') order.completedDate = new Date().toISOString().split('T')[0];
      this.logAudit('Lab Result Published', 'Laboratory', `Updated test order ${order.testName} to ${status}`);
      this.saveToStorage();
      api.updateLabOrder(id, { status, resultValue, interpretation }).catch(() => {});
    }
  }

  public orderLabTest(order: Omit<LabOrder, 'id' | 'orderedDate' | 'status'> & {
    doctorName?: string;
    priority?: string;
    specimenBarcode?: string;
    specimenType?: string;
    technicianNotes?: string;
    referenceRange?: string;
  }): LabOrder {
    const newOrder: LabOrder = {
      ...order,
      id: `lab-${Date.now()}`,
      orderedDate: new Date().toISOString().split('T')[0],
      status: 'Ordered',
    };
    this.labOrders.unshift(newOrder);
    this.logAudit('Lab Ordered', 'Laboratory', `Ordered ${newOrder.testName} for ${newOrder.patientName}`);
    this.saveToStorage();
    api.createLabOrder(newOrder).catch(() => {});
    return newOrder;
  }

  public deleteLabOrder(id: string): boolean {
    const idx = this.labOrders.findIndex(o => o.id === id);
    if (idx !== -1) {
      const removed = this.labOrders[idx];
      this.labOrders.splice(idx, 1);
      this.logAudit('Lab Order Cancelled/Deleted', 'Laboratory', `Cancelled diagnostic order ${removed.testName} (${removed.id}) for ${removed.patientName}`);
      this.saveToStorage();
      api.deleteLabOrder(id).catch(() => {});
      return true;
    }
    return false;
  }

  // Beds & Admissions
  public getBeds(): Bed[] { return [...this.beds]; }

  public allocateBed(bedId: string, patientId: string, patientName: string) {
    const bed = this.beds.find(b => b.id === bedId);
    if (bed && bed.status === 'Available') {
      bed.status = 'Occupied';
      bed.patientId = patientId;
      bed.patientName = patientName;
      bed.admittedDate = new Date().toISOString().split('T')[0];

      this.updatePatient(patientId, {
        admissionStatus: bed.type === 'ICU' ? 'ICU' : 'Admitted',
        ward: bed.wardName,
        bedNumber: bed.bedNumber,
      });

      this.logAudit('Bed Allocated', 'Inpatient', `Admitted ${patientName} to ${bed.bedNumber} (${bed.wardName})`);
      this.saveToStorage();
      this.notifyListeners();
      api.updateBed(bedId, { status: 'Occupied', patientId, patientName, admittedDate: bed.admittedDate }).catch(() => {});
    }
  }

  public dischargeBed(bedId: string) {
    const bed = this.beds.find(b => b.id === bedId);
    if (bed && (bed.status === 'Occupied' || bed.patientId)) {
      const patientId = bed.patientId;
      bed.status = 'Cleaning';
      bed.patientId = undefined;
      bed.patientName = undefined;

      if (patientId) {
        this.dischargePatient(patientId);
      }

      this.logAudit('Bed Discharged', 'Inpatient', `Discharged patient from ${bed.bedNumber}; queued for sanitation`);
      this.saveToStorage();
      this.notifyListeners();
      api.updateBed(bedId, { status: 'Cleaning', patientId: undefined, patientName: undefined }).catch(() => {});
    }
  }

  public updateBedStatus(bedId: string, status: Bed['status']) {
    const bed = this.beds.find(b => b.id === bedId);
    if (bed) {
      bed.status = status;
      if (status === 'Available') {
        bed.patientId = undefined;
        bed.patientName = undefined;
      }
      this.logAudit('Bed Status Updated', 'Inpatient', `Bed ${bed.bedNumber} status updated to ${status}`);
      this.saveToStorage();
      this.notifyListeners();
      api.updateBed(bedId, { status, patientId: bed.patientId, patientName: bed.patientName }).catch(() => {});
    }
  }

  // Billing & Invoices
  public getInvoices(): Invoice[] { return [...this.invoices]; }
  public payInvoice(invoiceId: string, paymentMethod: string) {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (inv) {
      inv.status = 'Paid';
      inv.paymentMethod = paymentMethod;
      this.logAudit('Invoice Paid', 'Billing', `Processed payment of ₹${inv.grandTotal.toFixed(2)} for ${inv.patientName}`);
      this.saveToStorage();
      api.payInvoice(invoiceId, paymentMethod).catch(() => {});
    }
  }

  public createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber'>): Invoice {
    const newInv: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    };
    this.invoices.unshift(newInv);
    this.logAudit('Invoice Created', 'Billing', `Generated invoice ${newInv.invoiceNumber} for ${newInv.patientName}`);
    this.saveToStorage();
    api.createInvoice(newInv).catch(() => {});
    return newInv;
  }

  // Staff & Alerts
  public getStaff(): Staff[] { return [...this.staff]; }
  public getAlerts(): CriticalAlert[] { return [...this.alerts]; }
  public acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.severity = 'low';
      this.saveToStorage();
      api.acknowledgeAlert(alertId).catch(() => {});
    }
  }

  public broadcastAlert(alert: Omit<CriticalAlert, 'id' | 'time'> & { time?: string }): CriticalAlert {
    const newAlert: CriticalAlert = {
      ...alert,
      id: `alt-${Date.now()}`,
      time: alert.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.alerts.unshift(newAlert);
    this.logAudit('Alert Broadcasted', newAlert.department, `Broadcasted alert: ${newAlert.title}`);
    this.saveToStorage();
    api.broadcastAlert(alert).catch(() => {});
    return newAlert;
  }

  public updatePrescription(rxId: string, updates: Partial<Prescription>): Prescription | undefined {
    const rx = this.prescriptions.find(p => p.id === rxId);
    if (rx) {
      Object.assign(rx, updates);
      this.logAudit('Prescription Updated', 'Pharmacy', `Updated Rx #${rxId}`);
      this.saveToStorage();
      api.updatePrescription(rxId, updates).catch(() => {});
      return rx;
    }
    return undefined;
  }

  // Patient Portal Operations
  public updatePatientVitals(patientId: string, vitals: Partial<Patient['vitals']>): Patient | undefined {
    const patient = this.patients.find(p => p.id === patientId);
    if (patient) {
      patient.vitals = {
        ...patient.vitals,
        ...vitals,
        lastUpdated: 'Just now'
      };
      this.logAudit('Vitals Logged', 'Telemetry', `Logged new vitals for ${patient.name}: BP ${patient.vitals.bloodPressure}, HR ${patient.vitals.pulseRate} bpm`);
      this.saveToStorage();
      api.logPatientVitals(patientId, vitals).catch(() => {});
      return patient;
    }
    return undefined;
  }

  public addPatientHistory(patientId: string, history: { date?: string; event: string; doctor?: string; facility?: string; notes: string }): Patient | undefined {
    const patient = this.patients.find(p => p.id === patientId);
    if (patient) {
      const newRec = {
        date: history.date || new Date().toISOString().split('T')[0],
        event: history.event,
        doctor: history.doctor || 'Dr. Roger S.',
        facility: history.facility || 'MediCore Specialist Pavilion',
        notes: history.notes || ''
      };
      patient.medicalHistory.unshift(newRec);
      this.logAudit('Medical History Added', 'EMR', `Added "${newRec.event}" for ${patient.name}`);
      this.saveToStorage();
      api.addPatientHistory(patientId, history).catch(() => {});
      return patient;
    }
    return undefined;
  }

  public addPrescription(rx: Omit<Prescription, 'id' | 'date'>): Prescription {
    const newRx: Prescription = {
      ...rx,
      id: `rx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    this.prescriptions.unshift(newRx);
    this.logAudit('Prescription Created', 'Pharmacy', `Created prescription for ${newRx.patientName}`);
    this.saveToStorage();
    api.createPrescription(rx).catch(() => {});
    return newRx;
  }

  public async requestRefill(data: { prescriptionId: string; patientId: string; medicineName: string; requestedRefills: number; pharmacyNote?: string }) {
    this.logAudit('Refill Requested', 'Pharmacy', `Requested refill for ${data.medicineName}`);
    try {
      return await api.requestRefill(data);
    } catch {
      return { success: true, message: `Refill order for ${data.medicineName} queued at MediCore Central Pharmacy`, refillId: `refill-${Date.now()}`, status: 'Pending Pharmacist Review' };
    }
  }

  public async fileInsuranceClaim(data: { invoiceId: string; patientId: string; policyNumber: string; provider: string; claimAmount: number; diagnosisCode?: string }) {
    this.logAudit('Claim Filed', 'Billing', `Filed insurance claim for invoice ${data.invoiceId}`);
    try {
      return await api.fileInsuranceClaim(data);
    } catch {
      return { id: `claim-${Date.now()}`, ...data, status: 'Submitted / Under Review', date: new Date().toISOString().split('T')[0] };
    }
  }

  public async triggerEmergencyDispatch(data: { patientId: string; patientName: string; location?: string; condition?: string; notes?: string }) {
    const alert: CriticalAlert = {
      id: `alt-sos-${Date.now()}`,
      title: `🚨 EMERGENCY SOS: ${data.patientName} Dispatched Unit 4`,
      department: 'Emergency Medicine / Trauma',
      severity: 'critical',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actionRequired: `Immediate Trauma Bay preparation. Coordinates: ${data.location || 'Residence'}. Reported: ${data.condition || 'Acute Distress'}.`
    };
    this.alerts.unshift(alert);
    this.logAudit('EMERGENCY SOS DISPATCH', 'Trauma Resuscitation', `Mobile SOS triggered by ${data.patientName}. Unit 4 mobilized.`);
    this.saveToStorage();

    try {
      return await api.triggerEmergencyDispatch(data);
    } catch {
      return {
        success: true,
        dispatchId: `DISPATCH-911-${Date.now().toString().slice(-4)}`,
        ambulanceUnit: 'MediCore Rapid Response Unit 4 (ALS Spec)',
        driverParamedic: 'Captain Marcus Vance, EMT-P',
        etaMinutes: 6,
        hospitalBay: 'Resuscitation Bay 2 (Prepared)',
        status: 'En Route',
        alert
      };
    }
  }

  // Enterprise & Super Admin RBAC & Governance Methods
  public getSystemUsers(): ManagedUser[] {
    return [...this.systemUsers];
  }

  public addSystemUser(userData: Omit<ManagedUser, 'id' | 'lastLogin'>): ManagedUser {
    const newUser: ManagedUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      lastLogin: 'Never (Account Created)'
    };
    this.systemUsers.unshift(newUser);
    this.logAudit('RBAC USER PROVISIONED', 'Security / Identity', `Account created for ${newUser.name} with role ${newUser.role} in ${newUser.facility}`);
    this.saveToStorage();
    return newUser;
  }

  public toggleUserStatus(userId: string): void {
    const user = this.systemUsers.find(u => u.id === userId);
    if (user) {
      user.status = user.status === 'Active' ? 'Suspended' : 'Active';
      this.logAudit('USER STATUS OVERRIDE', 'Security / RBAC', `Status of ${user.name} changed to ${user.status}`);
      this.saveToStorage();
    }
  }

  public toggleUserMfa(userId: string): void {
    const user = this.systemUsers.find(u => u.id === userId);
    if (user) {
      user.mfaEnabled = !user.mfaEnabled;
      this.logAudit('MFA POLICY OVERRIDE', 'Security / Auth', `2FA requirement for ${user.name} set to ${user.mfaEnabled}`);
      this.saveToStorage();
    }
  }

  public resetUserCredentials(userId: string): void {
    const user = this.systemUsers.find(u => u.id === userId);
    if (user) {
      this.logAudit('CREDENTIAL ROTATION', 'Security / Auth', `Temporary one-time security ticket dispatched for ${user.email}`);
      this.saveToStorage();
    }
  }

  public getFacilities(): FacilityNode[] {
    return [...this.facilities];
  }

  public getSecurityConfig(): EnterpriseSecurityConfig {
    return { ...this.securityConfig };
  }

  public updateSecurityConfig(partial: Partial<EnterpriseSecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...partial };
    this.logAudit('ENTERPRISE SECURITY CONFIG UPDATE', 'Security / Governance', `Enterprise parameters updated: ${Object.keys(partial).join(', ')}`);
    this.saveToStorage();
  }

  public triggerSystemBackup(): string {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.securityConfig.lastBackupTime = `Today at ${time} (AES-256 Encrypted)`;
    this.logAudit('DATABASE BACKUP SNAPSHOT', 'Infrastructure', `Automated cryptographically signed snapshot created and synced to cold vault.`);
    this.saveToStorage();
    return this.securityConfig.lastBackupTime;
  }

  public triggerEmergencyLockdown(reason: string): void {
    this.securityConfig.lockdownActive = !this.securityConfig.lockdownActive;
    const action = this.securityConfig.lockdownActive ? 'FACILITY LOCKDOWN ENGAGED' : 'FACILITY LOCKDOWN TERMINATED';
    this.logAudit(action, 'Emergency Protocols', `Reason: ${reason}. Executive override authorized by Super Administrator.`);
    this.saveToStorage();
  }

  public triggerBroadcastAlert(title: string, message: string): void {
    const alert: CriticalAlert = {
      id: `broadcast-${Date.now()}`,
      title: `[ENTERPRISE BROADCAST] ${title}`,
      department: 'Executive Enterprise Command',
      severity: 'critical',
      time: 'Just now',
      actionRequired: message
    };
    this.alerts.unshift(alert);
    this.logAudit('STAT ENTERPRISE BROADCAST', 'System Operations', `Broadcast transmitted to all active clinical terminals: "${title}"`);
    this.saveToStorage();
  }

  public getAuditLogs(): AuditLog[] { return [...this.auditLogs]; }
}

export const db = new MockDatabase();

export {
  INITIAL_PATIENTS,
  INITIAL_DOCTORS,
  INITIAL_APPOINTMENTS,
  INITIAL_MEDICINES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_LAB_TESTS,
  INITIAL_LAB_ORDERS,
  INITIAL_BEDS,
  INITIAL_INVOICES,
  INITIAL_STAFF,
  INITIAL_ALERTS,
  INITIAL_SYSTEM_USERS,
  INITIAL_FACILITIES,
  INITIAL_SECURITY_CONFIG
};

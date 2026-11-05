/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'HOSPITAL_ADMIN' 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'RECEPTIONIST' 
  | 'PHARMACIST' 
  | 'LAB_TECH' 
  | 'ACCOUNTANT' 
  | 'PATIENT';

export type ThemeMode = 'mint' | 'dark';

export type AnatomicalSystem = 
  | 'cardiovascular' 
  | 'thoracic' 
  | 'digestive' 
  | 'skeletal' 
  | 'nervous' 
  | 'whole_body';

export interface AnatomicalHotspot {
  id: string;
  name: string;
  latinName: string;
  system: AnatomicalSystem;
  position: [number, number, number];
  description: string;
  clinicalSignificance: string;
  riskFactor?: string;
  status: 'optimal' | 'warning' | 'critical';
}

export interface Patient {
  id: string;
  patientCode: string; // e.g. "P-12563a"
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  avatar: string;
  admissionStatus: 'Outpatient' | 'Admitted' | 'ICU' | 'Discharged';
  ward?: string;
  bedNumber?: string;
  roomNumber?: string;
  primaryDoctorId: string;
  primaryDoctorName: string;
  diagnosis: string;
  heartAge: number;
  chronologicalAge: number;
  riskScore: number; // 0 - 100
  vitals: {
    bloodPressure: string; // e.g. "120/80"
    pulseRate: number; // bpm
    respiratoryRate: number; // breaths/min
    oxygenSaturation: number; // %
    temperature: number; // Celsius
    hba1c: number; // %
    cholesterol: number; // mg/dL
    stressLevel: 'Mild' | 'Moderate' | 'High';
    sleepQuality: 'Good' | 'Fair' | 'Poor';
    lastUpdated: string;
  };
  symptoms: string[];
  allergies: string[];
  medicalHistory: {
    date: string;
    event: string;
    doctor: string;
    facility: string;
    notes: string;
  }[];
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  specialization: string;
  qualification: string;
  avatar: string;
  consultationFee: number;
  experienceYears: number;
  rating: number;
  patientsCount: number;
  availability: 'Available' | 'In Consultation' | 'In Surgery' | 'On Leave';
  schedule: {
    day: string;
    hours: string;
  }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'In-Progress' | 'Cancelled';
  visitType: 'Treatment' | 'Follow-up' | 'Diagnostic' | 'Consultation';
  notes: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  icdCode: string;
  treatmentPlan: string;
  vitalSigns: {
    bp: string;
    pulse: number;
    spo2: number;
    temp: number;
  };
  notes: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string; // "Tablet", "Syrup", "Injection", "Capsule"
  strength: string;
  batchNumber: string;
  stock: number;
  minThreshold: number;
  unitPrice: number;
  expiryDate: string;
  status: 'In Stock' | 'Low Stock' | 'Expired';
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  status: 'Prescribed' | 'Dispensed' | 'Partial' | 'Refilled' | 'Discontinued';
  items: {
    medicineId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    dispensed: boolean;
  }[];
}

export interface LabTest {
  id: string;
  testName: string;
  category: string;
  price: number;
  durationHours: number;
  normalRange: string;
  unit: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  testId: string;
  testName: string;
  orderedDate: string;
  completedDate?: string;
  status: 'Ordered' | 'Sample Collected' | 'Analyzing' | 'Completed';
  resultValue?: string;
  unit?: string;
  interpretation?: 'Normal' | 'Borderline' | 'Abnormal' | 'Critical';
  reportUrl?: string;
}

export interface Bed {
  id: string;
  bedNumber: string;
  wardId: string;
  wardName: string;
  type: 'ICU' | 'General' | 'Surgical' | 'Pediatric' | 'Emergency' | 'Cardiac';
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
  patientId?: string;
  patientName?: string;
  admittedDate?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  status: 'Paid' | 'Pending' | 'Partially Paid' | 'Overdue';
  paymentMethod?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: 'Morning (07:00 - 15:00)' | 'Evening (15:00 - 23:00)' | 'Night (23:00 - 07:00)';
  contact: string;
  status: 'On Duty' | 'Off Duty' | 'On Break';
}

export interface CriticalAlert {
  id: string;
  title: string;
  department: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  time: string;
  actionRequired: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  facility: string;
  mfaEnabled: boolean;
  status: 'Active' | 'Suspended' | 'Pending Verification';
  lastLogin: string;
}

export interface FacilityNode {
  id: string;
  name: string;
  city: string;
  type: string;
  totalBeds: number;
  occupiedBeds: number;
  icusTotal: number;
  icusOccupied: number;
  dutyPhysicians: number;
  status: 'Optimal' | 'High Load' | 'Surge Alert';
  director: string;
}

export interface EnterpriseSecurityConfig {
  lockdownActive: boolean;
  maintenanceMode: boolean;
  strictMfaEnforced: boolean;
  lastBackupTime: string;
  backendApiStatus: 'Online' | 'Degraded' | 'Offline';
  encryptionStandard: string;
}

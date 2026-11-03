/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Patient,
  Doctor,
  Appointment,
  Medicine,
  Prescription,
  LabTest,
  LabOrder,
  Bed,
  Invoice,
  Staff,
  CriticalAlert,
  AuditLog
} from '../types';

const API_BASE = typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[MediCore API Error at ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; system: string; records: Record<string, number> }>('/health'),

  // Bootstrap (all collections)
  bootstrap: () => request<{
    patients: Patient[];
    doctors: Doctor[];
    appointments: Appointment[];
    medicines: Medicine[];
    prescriptions: Prescription[];
    labTests: LabTest[];
    labOrders: LabOrder[];
    beds: Bed[];
    invoices: Invoice[];
    staff: Staff[];
    alerts: CriticalAlert[];
    auditLogs: AuditLog[];
  }>('/bootstrap'),

  // Patients
  getPatients: () => request<Patient[]>('/patients'),
  getPatient: (id: string) => request<Patient>(`/patients/${id}`),
  createPatient: (patient: Omit<Patient, 'id' | 'patientCode'>) => 
    request<Patient>('/patients', { method: 'POST', body: JSON.stringify(patient) }),
  updatePatient: (id: string, updates: Partial<Patient>) => 
    request<Patient>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deletePatient: (id: string) => 
    request<{ message: string; patient: Patient }>(`/patients/${id}`, { method: 'DELETE' }),

  // Doctors
  getDoctors: () => request<Doctor[]>('/doctors'),

  // Appointments
  getAppointments: () => request<Appointment[]>('/appointments'),
  createAppointment: (apt: Omit<Appointment, 'id'>) => 
    request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(apt) }),
  updateAppointment: (id: string, updates: Partial<Appointment>) => 
    request<Appointment>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

  // Beds
  getBeds: () => request<Bed[]>('/beds'),
  updateBed: (id: string, updates: Partial<Bed>) => 
    request<Bed>(`/beds/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

  // Pharmacy
  getMedicines: () => request<Medicine[]>('/pharmacy/medicines'),
  getPrescriptions: () => request<Prescription[]>('/pharmacy/prescriptions'),
  createPrescription: (rx: Omit<Prescription, 'id' | 'date'>) => 
    request<Prescription>('/pharmacy/prescriptions', { method: 'POST', body: JSON.stringify(rx) }),
  dispensePrescription: (id: string) => 
    request<Prescription>(`/pharmacy/prescriptions/${id}/dispense`, { method: 'PUT' }),

  // Laboratory
  getLabTests: () => request<LabTest[]>('/lab/tests'),
  getLabOrders: () => request<LabOrder[]>('/lab/orders'),
  createLabOrder: (order: Omit<LabOrder, 'id' | 'orderDate'>) => 
    request<LabOrder>('/lab/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateLabOrder: (id: string, updates: Partial<LabOrder>) => 
    request<LabOrder>(`/lab/orders/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

  // Billing
  getInvoices: () => request<Invoice[]>('/billing/invoices'),
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => 
    request<Invoice>('/billing/invoices', { method: 'POST', body: JSON.stringify(invoice) }),
  payInvoice: (id: string, paymentMethod: string) => 
    request<Invoice>(`/billing/invoices/${id}/pay`, { method: 'PUT', body: JSON.stringify({ paymentMethod }) }),

  // Staff & Alerts
  getStaff: () => request<Staff[]>('/staff'),
  getAlerts: () => request<CriticalAlert[]>('/alerts'),
  acknowledgeAlert: (id: string) => 
    request<{ message: string; alert?: CriticalAlert }>(`/alerts/${id}/acknowledge`, { method: 'POST' }),

  // Ward Telemetry Stats
  getWardStats: () => request<{
    wardName: string;
    level: string;
    bedsSummary: { total: number; occupied: number; available: number; label: string };
    vitals: Record<string, { value: string | number; unit: string; ref: string; status: string }>;
    operationalMetrics: { patientsInClinic: number; inTheWaitingRoom: number; medianWaitMinutes: number; openEscalations: number };
  }>('/ward/stats'),

  // Patient Portal Extended Operations
  logPatientVitals: (patientId: string, vitals: Partial<Patient['vitals']>) => 
    request<Patient>(`/patients/${patientId}/vitals`, { method: 'POST', body: JSON.stringify(vitals) }),
  
  addPatientHistory: (patientId: string, history: { date?: string; event: string; doctor?: string; facility?: string; notes: string }) => 
    request<Patient>(`/patients/${patientId}/history`, { method: 'POST', body: JSON.stringify(history) }),

  requestRefill: (data: { prescriptionId: string; patientId: string; medicineName: string; requestedRefills: number; pharmacyNote?: string }) => 
    request<{ success: boolean; message: string; refillId: string; status: string }>('/prescriptions/refill', { method: 'POST', body: JSON.stringify(data) }),

  fileInsuranceClaim: (data: { invoiceId: string; patientId: string; policyNumber: string; provider: string; claimAmount: number; diagnosisCode?: string }) => 
    request<any>('/billing/claim', { method: 'POST', body: JSON.stringify(data) }),

  getInsuranceClaims: (patientId: string) => 
    request<any[]>(`/billing/claims/${patientId}`),

  triggerEmergencyDispatch: (data: { patientId: string; patientName: string; location?: string; condition?: string; notes?: string }) => 
    request<{ success: boolean; dispatchId: string; ambulanceUnit: string; driverParamedic: string; etaMinutes: number; hospitalBay: string; status: string; alert: CriticalAlert }>('/emergency/dispatch', { method: 'POST', body: JSON.stringify(data) }),

  getMessages: (patientId: string) => 
    request<Array<{ id: string; patientId: string; sender: 'patient' | 'doctor'; senderName: string; text: string; timestamp: string }>>(`/messages/${patientId}`),

  sendMessage: (data: { patientId: string; sender: 'patient' | 'doctor'; senderName: string; text: string }) => 
    request<any>('/messages', { method: 'POST', body: JSON.stringify(data) }),

  getMeals: (patientId: string) => 
    request<Array<{ id: string; patientId: string; mealType: string; name: string; calories: number; sodiumMg: number; carbsG: number; timestamp: string }>>(`/meals/${patientId}`),

  logMeal: (meal: { patientId: string; mealType: string; name: string; calories: number; sodiumMg: number; carbsG: number }) => 
    request<any>('/meals', { method: 'POST', body: JSON.stringify(meal) }),

  getImmunizations: (patientId: string) => 
    request<Array<{ id: string; patientId: string; vaccineName: string; dose: string; date: string; facility: string; lotNumber: string; verified: boolean }>>(`/immunizations/${patientId}`),

  addImmunization: (imm: { patientId: string; vaccineName: string; dose: string; date?: string; facility?: string; lotNumber?: string }) => 
    request<any>('/immunizations', { method: 'POST', body: JSON.stringify(imm) }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
};

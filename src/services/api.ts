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

export const CLOUD_TUNNEL_URL = 'https://mod-socks-barriers-argument.trycloudflare.com';

export function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('medicore_api_url');
    if (saved) return saved.replace(/\/$/, '') + '/api';

    if ((window as any).__MEDICORE_API_URL__) return (window as any).__MEDICORE_API_URL__;

    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api';

    const host = window.location.hostname;
    // Local development (localhost / 127.0.0.1)
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api';
    }

    // Remote deployments (Vercel, friend's device, public internet)
    return `${CLOUD_TUNNEL_URL}/api`;
  }
  return 'http://localhost:5000/api';
}

export function setCustomBackendUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('medicore_api_url', url);
    else localStorage.removeItem('medicore_api_url');
  }
}

export function getActiveBackendUrl(): string {
  return resolveApiBase();
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = resolveApiBase();
  const url = `${base}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
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

  // Discharge patient → PostgreSQL/MySQL admission_status = 'Discharged', bed released
  dischargePatient: (id: string, opts?: { reason?: string; dischargedBy?: string; notes?: string }) =>
    request<{ success: boolean; patient: Patient; dischargeDate: string; dischargeTime: string; message: string }>(
      `/patients/${id}/discharge`,
      { method: 'POST', body: JSON.stringify(opts || {}) }
    ),

  // Admit patient → PostgreSQL/MySQL admission_status = 'Admitted'/'ICU', bed assigned
  admitPatient: (id: string, opts?: { ward?: string; bedNumber?: string; admissionStatus?: string; admittingDoctor?: string; notes?: string }) =>
    request<{ success: boolean; patient: Patient; admitDate: string; admitTime: string; message: string }>(
      `/patients/${id}/admit`,
      { method: 'POST', body: JSON.stringify(opts || {}) }
    ),

  // Doctors
  getDoctors: () => request<Doctor[]>('/doctors'),
  createDoctor: (doctor: Omit<Doctor, 'id'>) => request<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(doctor) }),
  deleteDoctor: (id: string) => request<{ message: string; doctor: Doctor }>(`/doctors/${id}`, { method: 'DELETE' }),

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
  updatePrescription: (id: string, updates: Partial<Prescription>) => 
    request<Prescription>(`/pharmacy/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),

  // Laboratory
  getLabTests: () => request<LabTest[]>('/lab/tests'),
  getLabOrders: () => request<LabOrder[]>('/lab/orders'),
  createLabOrder: (order: Partial<LabOrder>) => 
    request<LabOrder>('/lab/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateLabOrder: (id: string, updates: Partial<LabOrder>) => 
    request<LabOrder>(`/lab/orders/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteLabOrder: (id: string) =>
    request<{ message: string; id: string }>(`/lab/orders/${id}`, { method: 'DELETE' }),

  // Billing
  getInvoices: () => request<Invoice[]>('/billing/invoices'),
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => 
    request<Invoice>('/billing/invoices', { method: 'POST', body: JSON.stringify(invoice) }),
  payInvoice: (id: string, paymentMethod: string) => 
    request<Invoice>(`/billing/invoices/${id}/pay`, { method: 'PUT', body: JSON.stringify({ paymentMethod }) }),

  // Staff & Alerts
  getStaff: () => request<Staff[]>('/staff'),
  getAlerts: () => request<CriticalAlert[]>('/alerts'),
  broadcastAlert: (alert: Omit<CriticalAlert, 'id' | 'time'> & { time?: string }) => 
    request<CriticalAlert>('/alerts', { method: 'POST', body: JSON.stringify(alert) }),
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
    request<Array<{ id: string; patientId: string; patientName?: string; doctorId?: string; doctorName?: string; sender: 'patient' | 'doctor'; senderName: string; text: string; timestamp: string }>>(`/messages/${patientId}`),

  getAllDoctorMessages: () => 
    request<Array<{ id: string; patientId: string; patientName?: string; doctorId?: string; doctorName?: string; sender: 'patient' | 'doctor'; senderName: string; text: string; timestamp: string }>>('/doctor/messages'),

  sendMessage: (data: { patientId: string; patientName?: string; doctorId?: string; doctorName?: string; sender: 'patient' | 'doctor'; senderName: string; text: string }) => 
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

  // Nurse Portal Dedicated Endpoints (MySQL)
  getMarRecords: () => 
    request<Array<{ id: string; patientId: string; patientName: string; bedNumber: string; medication: string; dosage: string; route: any; scheduledTime: string; status: 'Due' | 'Given' | 'Held'; adminTime?: string; administeredBy?: string; holdReason?: string }>>('/nurse/mar'),
  
  createMarRecord: (mar: { patientId: string; patientName: string; bedNumber: string; medication: string; dosage: string; route: string; scheduledTime: string; status?: string }) => 
    request<any>('/nurse/mar', { method: 'POST', body: JSON.stringify(mar) }),

  administerMarRecord: (id: string, adminTime?: string, administeredBy?: string) => 
    request<any>(`/nurse/mar/${id}/administer`, { method: 'POST', body: JSON.stringify({ adminTime, administeredBy }) }),

  holdMarRecord: (id: string, holdReason: string) => 
    request<any>(`/nurse/mar/${id}/hold`, { method: 'POST', body: JSON.stringify({ holdReason }) }),

  getSbarNotes: () => 
    request<Array<{ id: string; patientId: string; patientName: string; bedNumber: string; time: string; date: string; situation: string; background: string; assessment: string; recommendation: string; nurseName: string }>>('/nurse/sbar'),

  createSbarNote: (sbar: { patientId: string; patientName: string; bedNumber: string; situation: string; background: string; assessment: string; recommendation: string; nurseName: string }) => 
    request<any>('/nurse/sbar', { method: 'POST', body: JSON.stringify(sbar) }),

  getDoctorOrders: () => 
    request<Array<{ id: string; patientName: string; bed: string; orderType: string; orderText: string; orderedBy: string; priority: 'STAT' | 'Urgent' | 'Routine'; status?: string; createdAt?: string }>>('/doctor-orders'),

  createDoctorOrder: (order: { patientName: string; bed: string; orderType: string; orderText: string; orderedBy: string; priority: string; status?: string }) => 
    request<any>('/doctor-orders', { method: 'POST', body: JSON.stringify(order) }),

  updateDoctorOrderStatus: (id: string, status: string) => 
    request<any>(`/doctor-orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

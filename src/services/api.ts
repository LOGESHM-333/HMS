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

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
};

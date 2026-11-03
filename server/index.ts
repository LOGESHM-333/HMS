/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import {
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
  INITIAL_ALERTS
} from '../src/services/mockDatabase';
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
  AuditLog
} from '../src/types';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Middleware
app.use(express.json());

// Enable CORS
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

interface DatabaseSchema {
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
  messages?: Array<{ id: string; patientId: string; sender: 'patient' | 'doctor'; senderName: string; text: string; timestamp: string }>;
  meals?: Array<{ id: string; patientId: string; mealType: string; name: string; calories: number; sodiumMg: number; carbsG: number; timestamp: string }>;
  claims?: Array<{ id: string; invoiceId: string; patientId: string; policyNumber: string; provider: string; claimAmount: number; diagnosisCode: string; status: string; date: string }>;
  immunizations?: Array<{ id: string; patientId: string; vaccineName: string; dose: string; date: string; facility: string; lotNumber: string; verified: boolean }>;
}

let dbData: DatabaseSchema;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): DatabaseSchema {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.messages) parsed.messages = [];
      if (!parsed.meals) parsed.meals = [];
      if (!parsed.claims) parsed.claims = [];
      if (!parsed.immunizations) parsed.immunizations = [];
      return parsed;
    } catch (e) {
      console.warn('Failed to parse database.json, seeding new database...', e);
    }
  }

  // Initial seed
  const initialData: DatabaseSchema = {
    patients: INITIAL_PATIENTS,
    doctors: INITIAL_DOCTORS,
    appointments: INITIAL_APPOINTMENTS,
    medicines: INITIAL_MEDICINES,
    prescriptions: INITIAL_PRESCRIPTIONS,
    labTests: INITIAL_LAB_TESTS,
    labOrders: INITIAL_LAB_ORDERS,
    beds: INITIAL_BEDS,
    invoices: INITIAL_INVOICES,
    staff: INITIAL_STAFF,
    alerts: INITIAL_ALERTS,
    messages: [
      { id: 'msg-1', patientId: 'pat-1', sender: 'doctor', senderName: 'Dr. Roger S.', text: 'Hello Magnus, Dr. Roger here. Your latest thoracic scan shows clear lung fields. How are you feeling after adjusting the inhaler dosage?', timestamp: 'Yesterday 14:20' },
      { id: 'msg-2', patientId: 'pat-1', sender: 'patient', senderName: 'Magnus Stephenson', text: 'Good afternoon Dr. Roger. The morning chest tightness has significantly reduced, no wheezing yesterday.', timestamp: 'Yesterday 15:45' },
      { id: 'msg-3', patientId: 'pat-1', sender: 'doctor', senderName: 'Dr. Roger S.', text: 'Excellent progress. Keep taking the morning bronchodilator and let me know if any night cough reoccurs.', timestamp: 'Yesterday 16:10' }
    ],
    meals: [
      { id: 'meal-1', patientId: 'pat-1', mealType: 'Breakfast', name: 'Steel-cut Oatmeal with Blueberries & Chia Seeds', calories: 340, sodiumMg: 85, carbsG: 52, timestamp: 'Today 08:15 AM' },
      { id: 'meal-2', patientId: 'pat-1', mealType: 'Lunch', name: 'Mediterranean Grilled Chicken Salad with Olive Oil', calories: 480, sodiumMg: 280, carbsG: 18, timestamp: 'Today 12:45 PM' }
    ],
    claims: [],
    immunizations: [
      { id: 'imm-1', patientId: 'pat-1', vaccineName: 'SARS-CoV-2 Spike Protein mRNA (Bivalent Booster)', dose: 'Dose 3 (Booster)', date: '2025-10-14', facility: 'MediCore Central Immunization Hub', lotNumber: 'PFZ-99428-B', verified: true },
      { id: 'imm-2', patientId: 'pat-1', vaccineName: 'Influenza Quadrivalent Recombinant', dose: 'Annual Dose', date: '2025-11-02', facility: 'MediCore Outpatient Clinic', lotNumber: 'FLU-55102-Q', verified: true },
      { id: 'imm-3', patientId: 'pat-1', vaccineName: 'Tetanus, Diphtheria, Pertussis (Tdap)', dose: 'Decennial Booster', date: '2022-04-18', facility: 'Memorial Health Center', lotNumber: 'TDP-11094-T', verified: true }
    ],
    auditLogs: [
      {
        id: `audit-init`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        userName: 'MediCore System Engine',
        userRole: 'SUPER_ADMIN',
        action: 'System Boot',
        module: 'Backend',
        details: 'MediCore REST API engine running on port 5000 with persistent database',
        ipAddress: '127.0.0.1 [REST API Server]',
      }
    ],
  };

  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving to database.json:', err);
  }
}

dbData = loadDatabase();

function logAudit(action: string, module: string, details: string) {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    userName: 'Clinical System',
    userRole: 'SUPER_ADMIN',
    action,
    module,
    details,
    ipAddress: '127.0.0.1 [Active REST API]',
  };
  dbData.auditLogs.unshift(log);
  if (dbData.auditLogs.length > 100) dbData.auditLogs.pop();
}

// ================= ROUTES ================= //

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'MediCore Enterprise Clinical Backend',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    records: {
      patients: dbData.patients.length,
      appointments: dbData.appointments.length,
      beds: dbData.beds.length,
      medicines: dbData.medicines.length,
      invoices: dbData.invoices.length,
    }
  });
});

// Full state snapshot
app.get('/api/bootstrap', (_req: Request, res: Response) => {
  res.json(dbData);
});

// Patients
app.get('/api/patients', (_req: Request, res: Response) => {
  res.json(dbData.patients);
});

app.get('/api/patients/:id', (req: Request, res: Response) => {
  const patient = dbData.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

app.post('/api/patients', (req: Request, res: Response) => {
  const newPatient: Patient = {
    ...req.body,
    id: `pat-${Date.now()}`,
    patientCode: `P-${Math.floor(10000 + Math.random() * 90000)}${String.fromCharCode(97 + Math.floor(Math.random() * 26))}`,
  };
  dbData.patients.unshift(newPatient);
  logAudit('Patient Registration', 'Patients', `Registered patient ${newPatient.name} [${newPatient.patientCode}]`);
  saveDatabase(dbData);
  res.status(201).json(newPatient);
});

app.put('/api/patients/:id', (req: Request, res: Response) => {
  const index = dbData.patients.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Patient not found' });
  dbData.patients[index] = { ...dbData.patients[index], ...req.body };
  logAudit('Patient Vitals Update', 'Patients', `Updated clinical chart for ${dbData.patients[index].name}`);
  saveDatabase(dbData);
  res.json(dbData.patients[index]);
});

// Update Patient Vitals
app.post('/api/patients/:id/vitals', (req: Request, res: Response) => {
  const patient = dbData.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  patient.vitals = {
    ...patient.vitals,
    ...req.body,
    lastUpdated: 'Just now'
  };

  logAudit('Vitals Logged', 'Telemetry', `Logged new vitals for ${patient.name}: BP ${patient.vitals.bloodPressure}, HR ${patient.vitals.pulseRate} bpm, SpO2 ${patient.vitals.oxygenSaturation}%`);
  saveDatabase(dbData);
  res.json(patient);
});

// Add Patient Medical History Record
app.post('/api/patients/:id/history', (req: Request, res: Response) => {
  const patient = dbData.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const newRecord = {
    date: req.body.date || new Date().toISOString().split('T')[0],
    event: req.body.event || 'Clinical Consultation',
    doctor: req.body.doctor || 'Dr. Roger S.',
    facility: req.body.facility || 'MediCore Specialist Pavilion',
    notes: req.body.notes || ''
  };

  patient.medicalHistory.unshift(newRecord);
  logAudit('Medical History Added', 'EMR', `Added record "${newRecord.event}" to ${patient.name}'s chart`);
  saveDatabase(dbData);
  res.json(patient);
});

app.delete('/api/patients/:id', (req: Request, res: Response) => {
  const index = dbData.patients.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Patient not found' });
  const removed = dbData.patients.splice(index, 1)[0];
  logAudit('Patient Discharge/Archive', 'Patients', `Discharged ${removed.name}`);
  saveDatabase(dbData);
  res.json({ message: 'Patient removed', patient: removed });
});

// Doctors
app.get('/api/doctors', (_req: Request, res: Response) => {
  res.json(dbData.doctors);
});

// Appointments
app.get('/api/appointments', (_req: Request, res: Response) => {
  res.json(dbData.appointments);
});

app.post('/api/appointments', (req: Request, res: Response) => {
  const newAppointment: Appointment = {
    ...req.body,
    id: `apt-${Date.now()}`,
  };
  dbData.appointments.unshift(newAppointment);
  logAudit('Appointment Scheduled', 'Appointments', `Booked appointment for ${newAppointment.patientName} with ${newAppointment.doctorName}`);
  saveDatabase(dbData);
  res.status(201).json(newAppointment);
});

app.put('/api/appointments/:id', (req: Request, res: Response) => {
  const index = dbData.appointments.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Appointment not found' });
  dbData.appointments[index] = { ...dbData.appointments[index], ...req.body };
  logAudit('Appointment Updated', 'Appointments', `Status changed to ${dbData.appointments[index].status} for ${dbData.appointments[index].patientName}`);
  saveDatabase(dbData);
  res.json(dbData.appointments[index]);
});

// Beds
app.get('/api/beds', (_req: Request, res: Response) => {
  res.json(dbData.beds);
});

app.put('/api/beds/:id', (req: Request, res: Response) => {
  const index = dbData.beds.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Bed not found' });
  dbData.beds[index] = { ...dbData.beds[index], ...req.body };
  logAudit('Bed Status Modified', 'Bed Management', `Bed ${dbData.beds[index].bedNumber} status updated to ${dbData.beds[index].status}`);
  saveDatabase(dbData);
  res.json(dbData.beds[index]);
});

// Pharmacy
app.get('/api/pharmacy/medicines', (_req: Request, res: Response) => {
  res.json(dbData.medicines);
});

app.get('/api/pharmacy/prescriptions', (_req: Request, res: Response) => {
  res.json(dbData.prescriptions);
});

app.post('/api/pharmacy/prescriptions', (req: Request, res: Response) => {
  const newRx: Prescription = {
    ...req.body,
    id: `rx-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
  };
  dbData.prescriptions.unshift(newRx);
  logAudit('Prescription Issued', 'Pharmacy', `Rx created for ${newRx.patientName}`);
  saveDatabase(dbData);
  res.status(201).json(newRx);
});

app.put('/api/pharmacy/prescriptions/:id/dispense', (req: Request, res: Response) => {
  const rx = dbData.prescriptions.find(p => p.id === req.params.id);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });
  rx.status = 'Dispensed';

  // Reduce inventory stock for matched medicines
  rx.items.forEach(item => {
    item.dispensed = true;
    const med = dbData.medicines.find(m => m.id === item.medicineId);
    if (med && med.stock >= item.quantity) {
      med.stock -= item.quantity;
      if (med.stock <= med.minThreshold) {
        med.status = 'Low Stock';
      }
    }
  });

  logAudit('Prescription Dispensed', 'Pharmacy', `Dispensed medicines for Rx #${rx.id}`);
  saveDatabase(dbData);
  res.json(rx);
});

app.put('/api/pharmacy/prescriptions/:id', (req: Request, res: Response) => {
  const index = dbData.prescriptions.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Prescription not found' });
  dbData.prescriptions[index] = { ...dbData.prescriptions[index], ...req.body };
  logAudit('Prescription Updated', 'Pharmacy', `Updated Rx #${dbData.prescriptions[index].id} status to ${req.body.status || 'Updated'}`);
  saveDatabase(dbData);
  res.json(dbData.prescriptions[index]);
});

// Laboratory
app.get('/api/lab/tests', (_req: Request, res: Response) => {
  res.json(dbData.labTests);
});

app.get('/api/lab/orders', (_req: Request, res: Response) => {
  res.json(dbData.labOrders);
});

app.post('/api/lab/orders', (req: Request, res: Response) => {
  const newOrder: LabOrder = {
    ...req.body,
    id: `lab-${Date.now()}`,
    orderDate: new Date().toISOString().split('T')[0],
  };
  dbData.labOrders.unshift(newOrder);
  logAudit('Lab Order Created', 'Laboratory', `Ordered ${newOrder.testName} for ${newOrder.patientName}`);
  saveDatabase(dbData);
  res.status(201).json(newOrder);
});

app.put('/api/lab/orders/:id', (req: Request, res: Response) => {
  const index = dbData.labOrders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Lab order not found' });
  dbData.labOrders[index] = { ...dbData.labOrders[index], ...req.body };
  logAudit('Lab Order Completed', 'Laboratory', `Completed test ${dbData.labOrders[index].testName}`);
  saveDatabase(dbData);
  res.json(dbData.labOrders[index]);
});

// Billing
app.get('/api/billing/invoices', (_req: Request, res: Response) => {
  res.json(dbData.invoices);
});

app.post('/api/billing/invoices', (req: Request, res: Response) => {
  const newInvoice: Invoice = {
    ...req.body,
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
  };
  dbData.invoices.unshift(newInvoice);
  logAudit('Invoice Created', 'Billing', `Generated invoice ${newInvoice.invoiceNumber} for ${newInvoice.patientName}`);
  saveDatabase(dbData);
  res.status(201).json(newInvoice);
});

app.put('/api/billing/invoices/:id/pay', (req: Request, res: Response) => {
  const inv = dbData.invoices.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  inv.status = 'Paid';
  inv.paymentMethod = req.body.paymentMethod || 'Online Credit';
  logAudit('Invoice Paid', 'Billing', `Processed payment of $${inv.grandTotal.toFixed(2)} for ${inv.patientName}`);
  saveDatabase(dbData);
  res.json(inv);
});

// Staff
app.get('/api/staff', (_req: Request, res: Response) => {
  res.json(dbData.staff);
});

// Alerts
app.get('/api/alerts', (_req: Request, res: Response) => {
  res.json(dbData.alerts);
});

app.post('/api/alerts', (req: Request, res: Response) => {
  const newAlert: CriticalAlert = {
    id: `alt-${Date.now()}`,
    title: req.body.title || '🚨 Critical Alert Broadcast',
    department: req.body.department || 'Emergency Medicine',
    severity: req.body.severity || 'critical',
    time: req.body.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionRequired: req.body.actionRequired || 'Immediate physician review',
  };
  dbData.alerts.unshift(newAlert);
  logAudit('CRITICAL ALERT BROADCAST', newAlert.department, `Doctor broadcasted alert: ${newAlert.title}`);
  saveDatabase(dbData);
  res.status(201).json(newAlert);
});

app.post('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const alert = dbData.alerts.find(a => a.id === req.params.id);
  if (alert) {
    alert.severity = 'low';
    logAudit('Critical Alert Acknowledged', 'Telemetry', `Acknowledged alert: ${alert.title}`);
    saveDatabase(dbData);
  }
  res.json({ message: 'Alert acknowledged', alert });
});

// Ward Telemetry & Overview Stats
app.get('/api/ward/stats', (_req: Request, res: Response) => {
  const totalBeds = dbData.beds.length;
  const occupiedBeds = dbData.beds.filter(b => b.status === 'Occupied').length;
  const criticalPatients = dbData.patients.filter(p => p.admissionStatus === 'ICU' || (p.vitals && p.vitals.oxygenSaturation < 93)).length;
  const waitingPatients = dbData.patients.filter(p => p.admissionStatus === 'Outpatient').length;

  res.json({
    wardName: 'MediCore Clinical Ward 4',
    level: 'Level 2',
    bedsSummary: {
      total: totalBeds,
      occupied: occupiedBeds,
      available: totalBeds - occupiedBeds,
      label: `${occupiedBeds} of ${totalBeds} beds`,
    },
    vitals: {
      heartRate: { value: 92, unit: 'bpm', ref: '60 to 100', status: 'Normal' },
      bloodPressure: { value: '148/94', unit: 'mmHg', ref: 'under 130/80', status: 'Stage 2' },
      spo2: { value: 91, unit: '%', ref: '95 to 100', status: 'Low' },
      temperature: { value: 37.8, unit: '°C', ref: '36.1 to 37.2', status: 'Raised' },
      respiratoryRate: { value: 18, unit: '/min', ref: '12 to 20', status: 'Normal' },
      news2Score: { value: 6, unit: '', ref: '0 to 4', status: 'Urgent review' }
    },
    operationalMetrics: {
      patientsInClinic: dbData.patients.length,
      inTheWaitingRoom: waitingPatients,
      medianWaitMinutes: 12,
      openEscalations: criticalPatients || 3
    }
  });
});

// Prescription Refill Request
app.post('/api/prescriptions/refill', (req: Request, res: Response) => {
  const { prescriptionId, patientId, medicineName, requestedRefills, pharmacyNote } = req.body;
  const rx = dbData.prescriptions.find(p => p.id === prescriptionId);
  const patient = dbData.patients.find(p => p.id === patientId);

  logAudit('Refill Requested', 'Pharmacy', `Refill order submitted for ${medicineName} (${requestedRefills} cycles) by ${patient ? patient.name : 'Patient'}`);
  saveDatabase(dbData);

  res.json({
    success: true,
    message: `Refill order for ${medicineName} successfully queued at MediCore Central Pharmacy`,
    rxId: prescriptionId,
    refillId: `refill-${Date.now()}`,
    status: 'Pending Pharmacist Review'
  });
});

// Insurance Claim Submission
app.post('/api/billing/claim', (req: Request, res: Response) => {
  const { invoiceId, patientId, policyNumber, provider, claimAmount, diagnosisCode } = req.body;
  const newClaim = {
    id: `claim-${Date.now()}`,
    invoiceId,
    patientId,
    policyNumber,
    provider: provider || 'MediCore Platinum Health Plan',
    claimAmount: Number(claimAmount) || 0,
    diagnosisCode: diagnosisCode || 'ICD-10 Z00.00',
    status: 'Submitted / Under Review',
    date: new Date().toISOString().split('T')[0]
  };

  if (!dbData.claims) dbData.claims = [];
  dbData.claims.unshift(newClaim);

  logAudit('Insurance Claim Filed', 'Billing', `Filed claim #${newClaim.id} for $${newClaim.claimAmount} with ${newClaim.provider}`);
  saveDatabase(dbData);
  res.status(201).json(newClaim);
});

app.get('/api/billing/claims/:patientId', (req: Request, res: Response) => {
  const claims = (dbData.claims || []).filter(c => c.patientId === req.params.patientId);
  res.json(claims);
});

// Emergency SOS Dispatch
app.post('/api/emergency/dispatch', (req: Request, res: Response) => {
  const { patientId, patientName, location, condition, notes } = req.body;
  
  const alert: CriticalAlert = {
    id: `alt-sos-${Date.now()}`,
    title: `🚨 EMERGENCY SOS: ${patientName || 'Patient'} Dispatched Unit 4`,
    department: 'Emergency Medicine / Trauma',
    severity: 'critical',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    actionRequired: `Immediate Trauma Bay preparation. Coordinates: ${location || 'GPS Locked (Residence)'}. Reported: ${condition || 'Acute Distress'}.`
  };

  dbData.alerts.unshift(alert);
  logAudit('EMERGENCY SOS DISPATCH', 'Trauma Resuscitation', `Mobile SOS triggered by ${patientName || patientId}. Rapid Response Unit 4 mobilized. Location: ${location || 'Mobile GPS'}`);
  saveDatabase(dbData);

  res.status(201).json({
    success: true,
    dispatchId: `DISPATCH-911-${Date.now().toString().slice(-4)}`,
    ambulanceUnit: 'MediCore Rapid Response Unit 4 (ALS Spec)',
    driverParamedic: 'Captain Marcus Vance, EMT-P',
    etaMinutes: 6,
    hospitalBay: 'Resuscitation Bay 2 (Prepared)',
    status: 'En Route',
    alert
  });
});

// Doctor Chat Messages
app.get('/api/messages/:patientId', (req: Request, res: Response) => {
  const messages = (dbData.messages || []).filter(m => m.patientId === req.params.patientId);
  res.json(messages);
});

app.get('/api/doctor/messages', (_req: Request, res: Response) => {
  res.json(dbData.messages || []);
});

app.post('/api/messages', (req: Request, res: Response) => {
  const newMsg = {
    id: `msg-${Date.now()}`,
    patientId: req.body.patientId || 'pat-1',
    patientName: req.body.patientName || 'Magnus Stephenson',
    doctorId: req.body.doctorId || 'doc-1',
    doctorName: req.body.doctorName || 'Dr. Roger S.',
    sender: req.body.sender || 'patient',
    senderName: req.body.senderName || (req.body.sender === 'doctor' ? 'Dr. Roger S.' : 'Magnus Stephenson'),
    text: req.body.text || '',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  if (!dbData.messages) dbData.messages = [];
  dbData.messages.push(newMsg);

  if (newMsg.sender === 'doctor') {
    logAudit('Physician Consultation Reply', 'Telehealth', `Dr. ${newMsg.senderName} replied to patient ${newMsg.patientName}: "${newMsg.text.slice(0, 40)}..."`);
  } else {
    logAudit('Patient Clinical Inquiry', 'Telehealth', `Patient ${newMsg.senderName} sent inquiry to ${newMsg.doctorName}: "${newMsg.text.slice(0, 40)}..."`);
  }

  saveDatabase(dbData);
  res.status(201).json(newMsg);
});

// Nutrition Meal Logging
app.get('/api/meals/:patientId', (req: Request, res: Response) => {
  const meals = (dbData.meals || []).filter(m => m.patientId === req.params.patientId);
  res.json(meals);
});

app.post('/api/meals', (req: Request, res: Response) => {
  const newMeal = {
    id: `meal-${Date.now()}`,
    patientId: req.body.patientId || 'pat-1',
    mealType: req.body.mealType || 'Lunch',
    name: req.body.name || 'Cardiac Healthy Plate',
    calories: Number(req.body.calories) || 300,
    sodiumMg: Number(req.body.sodiumMg) || 150,
    carbsG: Number(req.body.carbsG) || 30,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  if (!dbData.meals) dbData.meals = [];
  dbData.meals.push(newMeal);

  logAudit('Nutrition Logged', 'Wellness', `Logged ${newMeal.name} (${newMeal.calories} kcal) for patient`);
  saveDatabase(dbData);
  res.status(201).json(newMeal);
});

// Immunizations
app.get('/api/immunizations/:patientId', (req: Request, res: Response) => {
  const list = (dbData.immunizations || []).filter(i => i.patientId === req.params.patientId);
  res.json(list);
});

app.post('/api/immunizations', (req: Request, res: Response) => {
  const newImm = {
    id: `imm-${Date.now()}`,
    patientId: req.body.patientId || 'pat-1',
    vaccineName: req.body.vaccineName || 'Immunization',
    dose: req.body.dose || 'Dose 1',
    date: req.body.date || new Date().toISOString().split('T')[0],
    facility: req.body.facility || 'MediCore Immunization Wing',
    lotNumber: req.body.lotNumber || `LOT-${Math.floor(10000 + Math.random() * 90000)}`,
    verified: true
  };

  if (!dbData.immunizations) dbData.immunizations = [];
  dbData.immunizations.push(newImm);

  logAudit('Immunization Logged', 'Preventive Care', `Recorded ${newImm.vaccineName} (${newImm.dose})`);
  saveDatabase(dbData);
  res.status(201).json(newImm);
});

// Audit Logs
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json(dbData.auditLogs);
});

// Start listening
app.listen(PORT, () => {
  console.log(`[MediCore] Real Express Backend REST Server is running on http://localhost:${PORT}`);
  console.log(`[MediCore] Persistent database file: ${DB_FILE}`);
});

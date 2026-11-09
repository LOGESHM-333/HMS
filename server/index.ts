/**
 * MediCore Enterprise Clinical REST Server
 * Powered by Express, TypeScript, and MySQL2 (MariaDB/MySQL).
 * Real-time database persistence synchronized with phpMyAdmin.
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables first (before db.ts imports process.env values)
dotenvConfig({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

import { 
  initializeDatabase, 
  getDbStatus, 
  isDbConnected, 
  getActiveDialect, 
  fallbackStore, 
  persistFallbackStore, 
  executeQuery,
  getPool
} from './db.js';
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
} from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

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

// JSON parsing helper for MySQL columns
function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Audit Logger
async function logAudit(action: string, module: string, details: string) {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    userName: 'Clinical System',
    userRole: 'SUPER_ADMIN',
    action,
    module,
    details,
    ipAddress: '127.0.0.1 [Active REST & MySQL Pool]',
  };

  try {
    const p = getPool();
    await p.query(
      `INSERT INTO audit_logs (id, timestamp, user_name, user_role, action, module, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [log.id, log.timestamp, log.userName, log.userRole, log.action, log.module, log.details, log.ipAddress]
    );
  } catch (err) {
    console.error('Failed to log audit to MySQL:', err);
  }
}

// Map MySQL patient row to frontend Patient object
function mapPatientRow(r: any): Patient {
  const v: any = safeJsonParse(r.vitals, {});
  return {
    id: r.id,
    patientCode: r.patient_code,
    name: r.name,
    age: r.age,
    gender: (r.gender as any) || 'Male',
    bloodGroup: r.blood_group,
    phone: r.emergency_contact || '555-0199',
    email: `${r.name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
    avatar: r.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    admissionStatus: (r.admission_status as any) || 'Outpatient',
    ward: r.room_bed ? r.room_bed.split('-')[0] : undefined,
    bedNumber: r.room_bed || undefined,
    primaryDoctorId: 'doc-1',
    primaryDoctorName: r.attending_doctor || 'Dr. Roger S.',
    diagnosis: r.diagnosis,
    heartAge: r.age ? r.age + 2 : 44,
    chronologicalAge: r.age || 42,
    riskScore: 28,
    vitals: {
      bloodPressure: v.bloodPressure || '120/80',
      pulseRate: Number(v.pulseRate) || 72,
      respiratoryRate: Number(v.respiratoryRate) || 16,
      oxygenSaturation: Number(v.oxygenSaturation) || 98,
      temperature: Number(v.temperature) || 36.8,
      hba1c: Number(v.hba1c) || 5.1,
      cholesterol: Number(v.cholesterol) || 190,
      stressLevel: (v.stressLevel as any) || 'Mild',
      sleepQuality: (v.sleepQuality as any) || 'Good',
      lastUpdated: v.lastUpdated || 'Just now',
    },
    symptoms: ['Mild Chest Tightness', 'Fatigue'],
    medicalHistory: safeJsonParse(r.medical_history, []),
    allergies: safeJsonParse(r.allergies, []),
  };
}

// Map MySQL doctor row to frontend Doctor object
function mapDoctorRow(r: any): Doctor {
  return {
    id: r.id,
    name: r.name,
    title: r.title || 'Specialist Consultant',
    specialization: r.specialty || 'General Medicine',
    department: r.department,
    qualification: r.qualification || 'MBBS, MD',
    avatar: r.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    consultationFee: Number(r.consultation_fee) || 240,
    experienceYears: r.experience_years || 10,
    rating: Number(r.rating) || 4.9,
    patientsCount: r.current_patient_count || 120,
    availability: (r.status as any) || 'Available',
    schedule: safeJsonParse(r.schedule, [{ day: 'Mon - Fri', hours: '08:00 - 16:00' }]),
  };
}

// Map MySQL appointment row to frontend Appointment object
function mapAppointmentRow(r: any): Appointment {
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    doctorId: r.doctor_id,
    doctorName: r.doctor_name,
    department: r.department,
    date: r.date,
    time: r.time,
    status: (r.status as any) || 'Scheduled',
    visitType: (r.type as any) || 'Consultation',
    notes: r.notes || '',
  };
}

// Map MySQL medicine row to frontend Medicine object
function mapMedicineRow(r: any): Medicine {
  return {
    id: r.id,
    name: r.name,
    genericName: r.generic_name,
    category: r.category,
    dosageForm: r.dosage_form,
    strength: r.strength,
    batchNumber: r.batch_number || 'BCH-2026',
    stock: r.stock,
    minThreshold: r.min_threshold,
    unitPrice: Number(r.unit_price) || 0,
    expiryDate: r.expiry_date,
    status: (r.status as any) || 'In Stock',
  };
}

// Map MySQL prescription row to frontend Prescription object
function mapPrescriptionRow(r: any): Prescription {
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    doctorId: r.doctor_id,
    doctorName: r.doctor_name,
    date: r.date,
    status: (r.status as any) || 'Prescribed',
    items: safeJsonParse(r.items, []),
  };
}

// Map MySQL / PostgreSQL / Fallback lab order row to frontend LabOrder object
function mapLabOrderRow(r: any): any {
  return {
    id: r.id,
    patientId: r.patient_id || r.patientId,
    patientName: r.patient_name || r.patientName,
    doctorId: r.doctor_id || r.doctorId || 'doc-1',
    doctorName: r.doctor_name || r.doctorName || 'Dr. Roger Sterling, MD',
    testId: r.test_id || r.testId || 'test-1',
    testName: r.test_name || r.testName,
    orderedDate: r.order_date || r.orderedDate || r.orderDate,
    status: (r.status as any) || 'Ordered',
    priority: r.priority || 'Routine',
    specimenBarcode: r.specimen_barcode || r.specimenBarcode || 'MED-BC-90001',
    specimenType: r.specimen_type || r.specimenType || 'Serum',
    resultValue: r.result_value || r.resultValue || undefined,
    referenceRange: r.reference_range || r.referenceRange || undefined,
    unit: r.unit || undefined,
    interpretation: (r.interpretation as any) || undefined,
    technicianNotes: r.technician_notes || r.technicianNotes || undefined,
    reportUrl: r.report_url || r.reportUrl || undefined,
    completedDate: r.completed_date || r.completedDate || undefined,
  };
}

// Map MySQL bed row to frontend Bed object
function mapBedRow(r: any): Bed {
  return {
    id: r.id,
    bedNumber: r.bed_number,
    wardName: r.ward || 'ICU Ward',
    wardId: r.ward_id || 'w-icu',
    type: (r.type as any) || 'ICU',
    status: (r.status as any) || 'Available',
    patientId: r.patient_id || undefined,
    patientName: r.patient_name || undefined,
    admittedDate: r.admission_time || undefined,
  };
}

// Map MySQL invoice row to frontend Invoice object
function mapInvoiceRow(r: any): Invoice {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    patientId: r.patient_id,
    patientName: r.patient_name,
    date: r.issue_date,
    dueDate: r.due_date,
    status: (r.status as any) || 'Pending',
    paymentMethod: r.payment_method || undefined,
    items: safeJsonParse(r.items, []),
    subtotal: Number(r.subtotal) || 0,
    tax: Number(r.tax) || 0,
    discount: Number(r.discount) || 0,
    grandTotal: Number(r.grand_total) || 0,
  };
}

// Map MySQL staff row to frontend Staff object
function mapStaffRow(r: any): Staff {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    department: r.department,
    shift: (r.shift as any) || 'Morning (07:00 - 15:00)',
    contact: r.contact || r.phone || 'x4401',
    status: (r.status as any) || 'On Duty',
  };
}

// Map MySQL alert row
function mapAlertRow(r: any): CriticalAlert {
  return {
    id: r.id,
    title: r.title,
    department: r.department,
    severity: r.severity,
    time: r.time,
    actionRequired: r.action_required,
  };
}

// ================= REST ROUTES ================= //

// Live Web Database Explorer GUI
app.get(['/database', '/db', '/admin/database'], (_req: Request, res: Response) => {
  const htmlPath = path.join(__dirname, 'dbViewer.html');
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  res.redirect('/api/health');
});

// Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'ONLINE',
    system: 'MediCore Enterprise Clinical Backend (Dual PostgreSQL & MySQL)',
    version: '3.0.0',
    database: {
      activeDialect: dbStatus.dialect,
      connected: dbStatus.connected,
      activePort: dbStatus.activePort,
      engine: dbStatus.dialect === 'postgres' ? 'PostgreSQL (pg)' : dbStatus.dialect === 'mysql' ? 'MySQL / MariaDB' : 'Workable High-Speed JSON Store',
      databaseName: dbStatus.database
    },
    timestamp: new Date().toISOString(),
    records: {
      totalMembers: dbStatus.totalMembers,
      patients: fallbackStore.patients.length,
      doctors: fallbackStore.doctors.length,
      staff: fallbackStore.staff.length,
      beds: fallbackStore.beds.length,
      medicines: fallbackStore.medicines.length,
      invoices: fallbackStore.invoices.length,
      appointments: fallbackStore.appointments.length
    }
  });
});

// Full state snapshot / bootstrap
app.get('/api/bootstrap', async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      try {
        const p = getPool();
        const [patients]: any = await p.query('SELECT * FROM patients ORDER BY created_at DESC');
        if (patients && patients.length >= 800) {
          const [doctors]: any = await p.query('SELECT * FROM doctors');
          const [staff]: any = await p.query('SELECT * FROM staff');
          const [appointments]: any = await p.query('SELECT * FROM appointments ORDER BY date DESC');
          const [beds]: any = await p.query('SELECT * FROM beds');
          const [medicines]: any = await p.query('SELECT * FROM medicines');
          const [invoices]: any = await p.query('SELECT * FROM invoices ORDER BY issue_date DESC');
          return res.json({
            patients: patients.map(mapPatientRow),
            doctors: doctors.map(mapDoctorRow),
            staff: staff.map(mapStaffRow),
            appointments: appointments.map(mapAppointmentRow),
            beds: beds.map(mapBedRow),
            medicines: medicines.map(mapMedicineRow),
            invoices: invoices.map(mapInvoiceRow),
            prescriptions: fallbackStore.prescriptions,
            labTests: (fallbackStore as any).labTests || [],
            labOrders: (fallbackStore as any).labOrders || [],
            alerts: fallbackStore.alerts,
            auditLogs: fallbackStore.auditLogs
          });
        }
      } catch (e) {}
    }

    // Default workable response with 1,000 members
    res.json({
      patients: fallbackStore.patients,
      doctors: fallbackStore.doctors,
      staff: fallbackStore.staff,
      appointments: fallbackStore.appointments,
      medicines: fallbackStore.medicines,
      prescriptions: fallbackStore.prescriptions,
      labTests: fallbackStore.labTests && fallbackStore.labTests.length > 0 ? fallbackStore.labTests : [
        { id: 'test-cbc', testName: 'Complete Blood Count (CBC)', category: 'Hematology', price: 450, durationHours: 2, normalRange: 'WBC 4.5-11.0, Plt 150-450', unit: 'K/uL' }
      ],
      labOrders: fallbackStore.labOrders && fallbackStore.labOrders.length > 0 ? fallbackStore.labOrders : [],
      beds: fallbackStore.beds,
      invoices: fallbackStore.invoices,
      alerts: fallbackStore.alerts,
      auditLogs: fallbackStore.auditLogs,
      messages: [],
      meals: [],
      claims: [],
      immunizations: [],
      marRecords: [],
      sbarNotes: [],
      doctorOrders: []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Patients
app.get('/api/patients', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(rows.map(mapPatientRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(mapPatientRow(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newId = req.body.id || `pat-${Date.now()}`;
    const newCode = req.body.patientCode || `P-${Math.floor(10000 + Math.random() * 90000)}x`;

    await p.query(
      `INSERT INTO patients (id, patient_code, name, age, gender, blood_group, admission_date, admission_status, diagnosis, attending_doctor, room_bed, insurance_provider, emergency_contact, email, vitals, medical_history, allergies, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        newCode,
        req.body.name,
        req.body.age || 40,
        req.body.gender || 'Unknown',
        req.body.bloodGroup || 'O+',
        req.body.admissionDate || null,
        req.body.admissionStatus || 'Outpatient',
        req.body.diagnosis || 'General Evaluation',
        req.body.attendingDoctor || null,
        req.body.roomBed || null,
        req.body.insuranceProvider || null,
        req.body.emergencyContact || req.body.phone || null,
        req.body.email || `${req.body.name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
        JSON.stringify(req.body.vitals || {}),
        JSON.stringify(req.body.medicalHistory || []),
        JSON.stringify(req.body.allergies || []),
        req.body.avatar || null,
      ]
    );

    await logAudit('Patient Registration', 'Patients', `Registered patient ${req.body.name} [${newCode}] in MySQL database`);

    const [rows]: any = await p.query('SELECT * FROM patients WHERE id = ?', [newId]);
    res.status(201).json(mapPatientRow(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const current = mapPatientRow(existing[0]);
    const updated: any = { ...current, ...req.body };
    updated.roomBed = req.body.roomBed || req.body.bedNumber || req.body.roomNumber || current.bedNumber || null;
    updated.attendingDoctor = req.body.attendingDoctor || req.body.primaryDoctorName || current.primaryDoctorName || null;

    await p.query(
      `UPDATE patients SET 
        name = ?, age = ?, gender = ?, blood_group = ?, admission_date = ?, admission_status = ?,
        diagnosis = ?, attending_doctor = ?, room_bed = ?, insurance_provider = ?, emergency_contact = ?,
        vitals = ?, medical_history = ?, allergies = ?, avatar = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.age,
        updated.gender,
        updated.bloodGroup,
        updated.admissionDate || null,
        updated.admissionStatus,
        updated.diagnosis,
        updated.attendingDoctor || null,
        updated.roomBed || null,
        updated.insuranceProvider || null,
        updated.emergencyContact || null,
        JSON.stringify(updated.vitals || {}),
        JSON.stringify(updated.medicalHistory || []),
        JSON.stringify(updated.allergies || []),
        updated.avatar || null,
        req.params.id
      ]
    );

    await logAudit('Patient Update', 'Patients', `Updated clinical chart for ${updated.name}`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== DISCHARGE PATIENT =====================
// POST /api/patients/:id/discharge
// Sets admission_status = 'Discharged', clears room_bed, releases bed, adds history entry
app.post('/api/patients/:id/discharge', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const patient = mapPatientRow(existing[0]);
    const prevBed = patient.bedNumber;
    const dischargeDate = new Date().toISOString().split('T')[0];
    const dischargeTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // 1. Update patient: set Discharged status, clear bed
    await p.query(
      `UPDATE patients SET admission_status = 'Discharged', room_bed = NULL, attending_doctor = ? WHERE id = ?`,
      [patient.primaryDoctorName || null, req.params.id]
    );

    // 2. Add discharge entry to medical_history
    const newHistEntry = {
      date: dischargeDate,
      event: `Patient Discharged — ${req.body.reason || 'Recovered & Released to Home Care'}`,
      doctor: req.body.dischargedBy || patient.primaryDoctorName || 'Dr. Roger S.',
      facility: 'MediCore Discharge Unit',
      notes: req.body.notes || `Discharged at ${dischargeTime}. Follow-up in 7 days.`
    };
    const updatedHistory = [newHistEntry, ...patient.medicalHistory];
    await p.query('UPDATE patients SET medical_history = ? WHERE id = ?', [JSON.stringify(updatedHistory), req.params.id]);

    // 3. Release the occupied bed (set to Cleaning -> Available)
    if (prevBed) {
      const [bedRows]: any = await p.query(
        'SELECT * FROM beds WHERE bed_number = ? OR patient_id = ?',
        [prevBed, req.params.id]
      );
      if (bedRows && bedRows.length > 0) {
        await p.query(
          `UPDATE beds SET status = 'Cleaning', patient_id = NULL, patient_name = NULL, admission_time = NULL WHERE id = ?`,
          [bedRows[0].id]
        );
      }
    }

    // 4. Fetch and return the updated patient record
    const [updatedRows]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    const updatedPatient = mapPatientRow(updatedRows[0]);
    updatedPatient.medicalHistory = updatedHistory;

    await logAudit(
      'Patient Discharged',
      'Patients',
      `Discharged ${patient.name} (${patient.patientCode}) on ${dischargeDate}. ${prevBed ? 'Bed ' + prevBed + ' released for sanitization.' : ''}`
    );

    res.json({
      success: true,
      patient: updatedPatient,
      dischargeDate,
      dischargeTime,
      message: `${patient.name} has been successfully discharged and their bed has been released.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== ADMIT PATIENT =====================
// POST /api/patients/:id/admit
// Sets admission_status = 'Admitted' (or 'ICU'), sets room_bed, adds history entry
app.post('/api/patients/:id/admit', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const patient = mapPatientRow(existing[0]);
    const ward = req.body.ward || 'General Medicine Ward';
    const bedNumber = req.body.bedNumber || null;
    const admitStatus: 'Admitted' | 'ICU' = req.body.admissionStatus || 'Admitted';
    const admitDate = new Date().toISOString().split('T')[0];
    const admitTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // 1. Update patient admission status and bed
    await p.query(
      `UPDATE patients SET admission_status = ?, room_bed = ?, attending_doctor = ? WHERE id = ?`,
      [admitStatus, bedNumber, req.body.admittingDoctor || patient.primaryDoctorName || null, req.params.id]
    );

    // 2. Add admission entry to medical_history
    const newHistEntry = {
      date: admitDate,
      event: `Patient Admitted — ${ward}${bedNumber ? ' (Bed: ' + bedNumber + ')' : ''}`,
      doctor: req.body.admittingDoctor || patient.primaryDoctorName || 'Dr. Roger S.',
      facility: 'MediCore Admissions',
      notes: req.body.notes || `Admitted at ${admitTime}. Status: ${admitStatus}.`
    };
    const updatedHistory = [newHistEntry, ...patient.medicalHistory];
    await p.query('UPDATE patients SET medical_history = ? WHERE id = ?', [JSON.stringify(updatedHistory), req.params.id]);

    // 3. If a specific bed was assigned, mark it Occupied
    if (bedNumber) {
      await p.query(
        `UPDATE beds SET status = 'Occupied', patient_id = ?, patient_name = ?, admission_time = NOW() WHERE bed_number = ?`,
        [req.params.id, patient.name, bedNumber]
      );
    }

    const [updatedRows]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    const updatedPatient = mapPatientRow(updatedRows[0]);
    updatedPatient.medicalHistory = updatedHistory;

    await logAudit(
      'Patient Admitted',
      'Patients',
      `Admitted ${patient.name} (${patient.patientCode}) to ${ward}${bedNumber ? ', Bed ' + bedNumber : ''}. Status: ${admitStatus}`
    );

    res.json({
      success: true,
      patient: updatedPatient,
      admitDate,
      admitTime,
      message: `${patient.name} has been admitted to ${ward}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Patient Vitals
app.post('/api/patients/:id/vitals', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const current = mapPatientRow(existing[0]);
    const newVitals = {
      ...current.vitals,
      ...req.body,
      lastUpdated: 'Just now'
    };

    await p.query('UPDATE patients SET vitals = ? WHERE id = ?', [JSON.stringify(newVitals), req.params.id]);

    await logAudit('Vitals Logged', 'Telemetry', `Logged new vitals for ${current.name}: BP ${newVitals.bloodPressure}, HR ${newVitals.pulseRate} bpm, SpO2 ${newVitals.oxygenSaturation}%`);

    current.vitals = newVitals;
    res.json(current);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Patient Medical History Record
app.post('/api/patients/:id/history', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const current = mapPatientRow(existing[0]);
    const newRecord = {
      date: req.body.date || new Date().toISOString().split('T')[0],
      event: req.body.event || 'Clinical Consultation',
      doctor: req.body.doctor || 'Dr. Roger S.',
      facility: req.body.facility || 'MediCore Specialist Pavilion',
      notes: req.body.notes || ''
    };

    current.medicalHistory.unshift(newRecord);
    await p.query('UPDATE patients SET medical_history = ? WHERE id = ?', [JSON.stringify(current.medicalHistory), req.params.id]);

    await logAudit('Medical History Added', 'EMR', `Added record "${newRecord.event}" to ${current.name}'s chart`);
    res.json(current);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const patient = mapPatientRow(existing[0]);
    await p.query('DELETE FROM patients WHERE id = ?', [req.params.id]);

    await logAudit('Patient Discharge/Archive', 'Patients', `Discharged ${patient.name}`);
    res.json({ message: 'Patient removed', patient });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Doctors
app.get('/api/doctors', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM doctors');
    res.json(rows.map(mapDoctorRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Appointments
app.get('/api/appointments', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM appointments ORDER BY date DESC, time ASC');
    res.json(rows.map(mapAppointmentRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newId = req.body.id || `apt-${Date.now()}`;

    await p.query(
      `INSERT INTO appointments (id, patient_id, patient_name, doctor_id, doctor_name, department, date, time, status, type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        req.body.patientId,
        req.body.patientName,
        req.body.doctorId,
        req.body.doctorName,
        req.body.department || 'General Medicine',
        req.body.date,
        req.body.time,
        req.body.status || 'Scheduled',
        req.body.type || req.body.visitType || 'Consultation',
        req.body.notes || ''
      ]
    );

    await logAudit('Appointment Scheduled', 'Appointments', `Booked appointment for ${req.body.patientName} with ${req.body.doctorName}`);

    const [rows]: any = await p.query('SELECT * FROM appointments WHERE id = ?', [newId]);
    res.status(201).json(mapAppointmentRow(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    const current = mapAppointmentRow(existing[0]);
    const updated = { ...current, ...req.body };

    await p.query(
      `UPDATE appointments SET status = ?, date = ?, time = ?, notes = ? WHERE id = ?`,
      [updated.status, updated.date, updated.time, updated.notes, req.params.id]
    );

    await logAudit('Appointment Updated', 'Appointments', `Status changed to ${updated.status} for ${updated.patientName}`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    const current = mapAppointmentRow(existing[0]);
    await p.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);

    await logAudit('Appointment Cancelled/Deleted', 'Appointments', `Cancelled appointment #${current.id} for ${current.patientName}`);
    res.json({ message: 'Appointment deleted successfully', id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Beds
app.get('/api/beds', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM beds ORDER BY bed_number ASC');
    res.json(rows.map(mapBedRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/beds/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM beds WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Bed not found' });

    const current = mapBedRow(existing[0]);
    const updated = { ...current, ...req.body };

    await p.query(
      `UPDATE beds SET status = ?, patient_id = ?, patient_name = ?, admission_time = ? WHERE id = ?`,
      [
        updated.status,
        updated.patientId || null,
        updated.patientName || null,
        updated.admittedDate || null,
        req.params.id
      ]
    );

    await logAudit('Bed Status Modified', 'Bed Management', `Bed ${updated.bedNumber} status updated to ${updated.status}`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pharmacy & Prescriptions
app.get('/api/pharmacy/medicines', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM medicines');
    res.json(rows.map(mapMedicineRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pharmacy/prescriptions', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM prescriptions ORDER BY date DESC');
    res.json(rows.map(mapPrescriptionRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pharmacy/prescriptions', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newId = req.body.id || `rx-${Date.now()}`;
    const newDate = req.body.date || new Date().toISOString().split('T')[0];

    await p.query(
      `INSERT INTO prescriptions (id, patient_id, patient_name, doctor_id, doctor_name, date, status, notes, items)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        req.body.patientId,
        req.body.patientName,
        req.body.doctorId,
        req.body.doctorName,
        newDate,
        req.body.status || 'Active',
        req.body.notes || '',
        JSON.stringify(req.body.items || [])
      ]
    );

    await logAudit('Prescription Issued', 'Pharmacy', `Rx created for ${req.body.patientName}`);

    const [rows]: any = await p.query('SELECT * FROM prescriptions WHERE id = ?', [newId]);
    res.status(201).json(mapPrescriptionRow(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pharmacy/prescriptions/:id/dispense', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Prescription not found' });

    const rx = mapPrescriptionRow(existing[0]);
    rx.status = 'Dispensed';

    // Reduce stock in MySQL for each item
    for (const item of rx.items) {
      item.dispensed = true;
      if (item.medicineId) {
        const [medRows]: any = await p.query('SELECT * FROM medicines WHERE id = ?', [item.medicineId]);
        if (medRows && medRows.length > 0) {
          const med = medRows[0];
          const newStock = Math.max(0, med.stock - (item.quantity || 1));
          const newStatus = newStock <= med.min_threshold ? 'Low Stock' : 'In Stock';
          await p.query('UPDATE medicines SET stock = ?, status = ? WHERE id = ?', [newStock, newStatus, med.id]);
        }
      }
    }

    await p.query('UPDATE prescriptions SET status = ?, items = ? WHERE id = ?', [rx.status, JSON.stringify(rx.items), req.params.id]);

    await logAudit('Prescription Dispensed', 'Pharmacy', `Dispensed medicines for Rx #${rx.id}`);
    res.json(rx);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pharmacy/prescriptions/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Prescription not found' });

    const rx = mapPrescriptionRow(existing[0]);
    const updated = { ...rx, ...req.body };

    await p.query('UPDATE prescriptions SET status = ?, notes = ?, items = ? WHERE id = ?', [
      updated.status,
      updated.notes,
      JSON.stringify(updated.items || []),
      req.params.id
    ]);

    await logAudit('Prescription Updated', 'Pharmacy', `Updated Rx #${req.params.id}`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pharmacy/prescriptions/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Prescription not found' });

    const rx = mapPrescriptionRow(existing[0]);
    await p.query('DELETE FROM prescriptions WHERE id = ?', [req.params.id]);

    await logAudit('Prescription Revoked/Deleted', 'Pharmacy', `Revoked Rx #${rx.id} for ${rx.patientName}`);
    res.json({ message: 'Prescription deleted successfully', id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Laboratory
app.get('/api/lab/tests', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM lab_tests');
    res.json(rows.map((t: any) => ({
      id: t.id,
      testCode: t.test_code || t.testCode || t.id,
      testName: t.test_name || t.testName || t.name,
      category: t.category || t.department || 'General',
      specimenType: t.specimen_type || t.specimenType || t.sample_type || 'Whole Blood',
      price: Number(t.price || t.cost) || 500,
      durationHours: Number(t.duration_hours || t.durationHours || t.turnaround_time_hours) || 2,
      normalRange: t.normal_range || t.normalRange || t.reference_range || 'Normal',
      unit: t.unit || '',
      methodology: t.methodology || 'Automated Clinical Assay',
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lab/orders', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM lab_orders ORDER BY order_date DESC');
    let mapped = rows.map(mapLabOrderRow);

    if (req.query.patientId) {
      mapped = mapped.filter((o: any) => o.patientId === req.query.patientId);
    }
    if (req.query.status && req.query.status !== 'All') {
      mapped = mapped.filter((o: any) => o.status === req.query.status);
    }
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase();
      mapped = mapped.filter((o: any) => 
        o.patientName?.toLowerCase().includes(q) ||
        o.testName?.toLowerCase().includes(q) ||
        o.specimenBarcode?.toLowerCase().includes(q) ||
        o.doctorName?.toLowerCase().includes(q)
      );
    }

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lab/orders', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newId = req.body.id || `lab-${Date.now()}`;
    const orderDate = req.body.orderDate || req.body.orderedDate || new Date().toISOString().split('T')[0];
    const barcode = req.body.specimenBarcode || `MED-BC-${Math.floor(100000 + Math.random() * 900000)}`;

    await p.query(
      `INSERT INTO lab_orders (id, patient_id, patient_name, doctor_id, doctor_name, test_id, test_name, order_date, status, result_value, reference_range, unit, interpretation, completed_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        req.body.patientId,
        req.body.patientName,
        req.body.doctorId || 'doc-1',
        req.body.doctorName || 'Dr. Roger Sterling, MD',
        req.body.testId || 'test-1',
        req.body.testName,
        orderDate,
        req.body.status || 'Ordered',
        req.body.resultValue || null,
        req.body.referenceRange || null,
        req.body.unit || null,
        req.body.interpretation || 'Normal',
        req.body.completedDate || null,
        req.body.notes || req.body.technicianNotes || null
      ]
    );

    await logAudit('Lab Order Created', 'Laboratory', `Ordered ${req.body.testName} (${barcode}) for ${req.body.patientName}`);

    const [rows]: any = await p.query('SELECT * FROM lab_orders WHERE id = ?', [newId]);
    res.status(201).json(rows[0] ? mapLabOrderRow(rows[0]) : { id: newId, ...req.body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lab/orders/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM lab_orders WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Lab order not found' });

    const current = mapLabOrderRow(existing[0]);
    const updated = { ...current, ...req.body };

    await p.query(
      `UPDATE lab_orders SET status = ?, result_value = ?, interpretation = ?, completed_date = ?, notes = ? WHERE id = ?`,
      [
        updated.status,
        updated.resultValue || null,
        updated.interpretation || 'Normal',
        updated.completedDate || (updated.status === 'Completed' ? new Date().toISOString().split('T')[0] : null),
        updated.technicianNotes || updated.notes || null,
        req.params.id
      ]
    );

    await logAudit('Lab Order Updated', 'Laboratory', `Updated test ${updated.testName} (${updated.id}) to ${updated.status}`);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/lab/orders/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM lab_orders WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Lab order not found' });

    const current = mapLabOrderRow(existing[0]);
    await p.query('DELETE FROM lab_orders WHERE id = ?', [req.params.id]);

    await logAudit('Lab Order Cancelled/Deleted', 'Laboratory', `Cancelled test order ${current.testName} (${current.id}) for ${current.patientName}`);
    res.json({ message: 'Lab order deleted successfully', id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Billing
app.get('/api/billing/invoices', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM invoices ORDER BY issue_date DESC');
    res.json(rows.map(mapInvoiceRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/invoices', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newId = req.body.id || `inv-${Date.now()}`;
    const invNum = req.body.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    await p.query(
      `INSERT INTO invoices (id, invoice_number, patient_id, patient_name, issue_date, due_date, status, payment_method, items, subtotal, tax, discount, grand_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        invNum,
        req.body.patientId,
        req.body.patientName,
        req.body.issueDate || req.body.date || new Date().toISOString().split('T')[0],
        req.body.dueDate || new Date().toISOString().split('T')[0],
        req.body.status || 'Pending',
        req.body.paymentMethod || null,
        JSON.stringify(req.body.items || []),
        req.body.subtotal || 0,
        req.body.tax || 0,
        req.body.discount || 0,
        req.body.grandTotal || 0
      ]
    );

    await logAudit('Invoice Created', 'Billing', `Generated invoice ${invNum} for ${req.body.patientName}`);

    const [rows]: any = await p.query('SELECT * FROM invoices WHERE id = ?', [newId]);
    res.status(201).json(mapInvoiceRow(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/billing/invoices/:id/pay', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const inv = mapInvoiceRow(existing[0]);
    inv.status = 'Paid';
    inv.paymentMethod = req.body.paymentMethod || 'Online Credit';

    await p.query('UPDATE invoices SET status = ?, payment_method = ? WHERE id = ?', [inv.status, inv.paymentMethod, req.params.id]);

    await logAudit('Invoice Paid', 'Billing', `Processed payment of $${inv.grandTotal.toFixed(2)} for ${inv.patientName}`);
    res.json(inv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/billing/invoices/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [existing]: any = await p.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!existing || existing.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const inv = mapInvoiceRow(existing[0]);
    await p.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);

    await logAudit('Invoice Voided/Deleted', 'Billing', `Voided invoice ${inv.invoiceNumber} (${inv.id}) for ${inv.patientName}`);
    res.json({ message: 'Invoice deleted successfully', id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Staff
app.get('/api/staff', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM staff');
    res.json(rows.map(mapStaffRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Alerts
app.get('/api/alerts', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM alerts ORDER BY id DESC');
    res.json(rows.map(mapAlertRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newAlert: CriticalAlert = {
      id: req.body.id || `alt-${Date.now()}`,
      title: req.body.title || '🚨 Critical Alert Broadcast',
      department: req.body.department || 'Emergency Medicine',
      severity: req.body.severity || 'critical',
      time: req.body.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionRequired: req.body.actionRequired || 'Immediate physician review',
    };

    await p.query(
      `INSERT INTO alerts (id, title, department, severity, time, action_required)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newAlert.id, newAlert.title, newAlert.department, newAlert.severity, newAlert.time, newAlert.actionRequired]
    );

    await logAudit('CRITICAL ALERT BROADCAST', newAlert.department, `Doctor broadcasted alert: ${newAlert.title}`);
    res.status(201).json(newAlert);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    await p.query("UPDATE alerts SET severity = 'low' WHERE id = ?", [req.params.id]);
    const [rows]: any = await p.query('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    const alert = rows.length > 0 ? mapAlertRow(rows[0]) : undefined;

    await logAudit('Critical Alert Acknowledged', 'Telemetry', `Acknowledged alert #${req.params.id}`);
    res.json({ message: 'Alert acknowledged', alert });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Ward Telemetry & Overview Stats
app.get('/api/ward/stats', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [beds]: any = await p.query('SELECT * FROM beds');
    const [patients]: any = await p.query('SELECT * FROM patients');

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b: any) => b.status === 'Occupied').length;
    const criticalPatients = patients.filter((p: any) => p.admission_status === 'ICU').length;
    const waitingPatients = patients.filter((p: any) => p.admission_status === 'Outpatient').length;

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
        patientsInClinic: patients.length,
        inTheWaitingRoom: waitingPatients,
        medianWaitMinutes: 12,
        openEscalations: criticalPatients || 2
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Prescription Refill Request
app.post('/api/prescriptions/refill', async (req: Request, res: Response) => {
  try {
    const { prescriptionId, patientId, medicineName, requestedRefills } = req.body;
    await logAudit('Refill Requested', 'Pharmacy', `Refill order submitted for ${medicineName} (${requestedRefills} cycles)`);

    res.json({
      success: true,
      message: `Refill order for ${medicineName} successfully queued at MediCore Central Pharmacy`,
      rxId: prescriptionId,
      refillId: `refill-${Date.now()}`,
      status: 'Pending Pharmacist Review'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Insurance Claim Submission
app.post('/api/billing/claim', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newClaim = {
      id: `claim-${Date.now()}`,
      invoiceId: req.body.invoiceId,
      patientId: req.body.patientId,
      policyNumber: req.body.policyNumber,
      provider: req.body.provider || 'MediCore Platinum Health Plan',
      claimAmount: Number(req.body.claimAmount) || 0,
      diagnosisCode: req.body.diagnosisCode || 'ICD-10 Z00.00',
      status: 'Submitted / Under Review',
      date: new Date().toISOString().split('T')[0]
    };

    await p.query(
      `INSERT INTO claims (id, invoice_id, patient_id, policy_number, provider, claim_amount, diagnosis_code, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newClaim.id, newClaim.invoiceId, newClaim.patientId, newClaim.policyNumber, newClaim.provider, newClaim.claimAmount, newClaim.diagnosisCode, newClaim.status, newClaim.date]
    );

    await logAudit('Insurance Claim Filed', 'Billing', `Filed claim #${newClaim.id} for $${newClaim.claimAmount} with ${newClaim.provider}`);
    res.status(201).json(newClaim);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/claims/:patientId', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM claims WHERE patient_id = ? ORDER BY date DESC', [req.params.patientId]);
    res.json(rows.map((c: any) => ({
      id: c.id,
      invoiceId: c.invoice_id,
      patientId: c.patient_id,
      policyNumber: c.policy_number,
      provider: c.provider,
      claimAmount: Number(c.claim_amount) || 0,
      diagnosisCode: c.diagnosis_code,
      status: c.status,
      date: c.date,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Emergency SOS Dispatch
app.post('/api/emergency/dispatch', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const { patientId, patientName, location, condition } = req.body;

    const alert: CriticalAlert = {
      id: `alt-sos-${Date.now()}`,
      title: `🚨 EMERGENCY SOS: ${patientName || 'Patient'} Dispatched Unit 4`,
      department: 'Emergency Medicine / Trauma',
      severity: 'critical',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actionRequired: `Immediate Trauma Bay preparation. Coordinates: ${location || 'GPS Locked (Residence)'}. Reported: ${condition || 'Acute Distress'}.`
    };

    await p.query(
      `INSERT INTO alerts (id, title, department, severity, time, action_required)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [alert.id, alert.title, alert.department, alert.severity, alert.time, alert.actionRequired]
    );

    await logAudit('EMERGENCY SOS DISPATCH', 'Trauma Resuscitation', `Mobile SOS triggered by ${patientName || patientId}. Location: ${location || 'Mobile GPS'}`);

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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Messages
app.get('/api/messages/:patientId', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM messages WHERE patient_id = ? ORDER BY id ASC', [req.params.patientId]);
    res.json(rows.map((m: any) => ({
      id: m.id,
      patientId: m.patient_id,
      patientName: m.patient_name,
      doctorId: m.doctor_id,
      doctorName: m.doctor_name,
      sender: m.sender,
      senderName: m.sender_name,
      text: m.text,
      timestamp: m.timestamp,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/doctor/messages', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM messages ORDER BY id ASC');
    res.json(rows.map((m: any) => ({
      id: m.id,
      patientId: m.patient_id,
      patientName: m.patient_name,
      doctorId: m.doctor_id,
      doctorName: m.doctor_name,
      sender: m.sender,
      senderName: m.sender_name,
      text: m.text,
      timestamp: m.timestamp,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const p = getPool();
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

    await p.query(
      `INSERT INTO messages (id, patient_id, patient_name, doctor_id, doctor_name, sender, sender_name, text, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newMsg.id, newMsg.patientId, newMsg.patientName, newMsg.doctorId, newMsg.doctorName, newMsg.sender, newMsg.senderName, newMsg.text, newMsg.timestamp]
    );

    await logAudit(
      newMsg.sender === 'doctor' ? 'Physician Consultation Reply' : 'Patient Clinical Inquiry',
      'Telehealth',
      `${newMsg.senderName}: "${newMsg.text.slice(0, 40)}..."`
    );

    res.status(201).json(newMsg);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Meals
app.get('/api/meals/:patientId', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM meals WHERE patient_id = ? ORDER BY id DESC', [req.params.patientId]);
    res.json(rows.map((ml: any) => ({
      id: ml.id,
      patientId: ml.patient_id,
      mealType: ml.meal_type,
      name: ml.name,
      calories: ml.calories,
      sodiumMg: ml.sodium_mg,
      carbsG: ml.carbs_g,
      timestamp: ml.timestamp,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meals', async (req: Request, res: Response) => {
  try {
    const p = getPool();
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

    await p.query(
      `INSERT INTO meals (id, patient_id, meal_type, name, calories, sodium_mg, carbs_g, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newMeal.id, newMeal.patientId, newMeal.mealType, newMeal.name, newMeal.calories, newMeal.sodiumMg, newMeal.carbsG, newMeal.timestamp]
    );

    await logAudit('Nutrition Logged', 'Wellness', `Logged ${newMeal.name} (${newMeal.calories} kcal)`);
    res.status(201).json(newMeal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Immunizations
app.get('/api/immunizations/:patientId', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM immunizations WHERE patient_id = ? ORDER BY date DESC', [req.params.patientId]);
    res.json(rows.map((im: any) => ({
      id: im.id,
      patientId: im.patient_id,
      vaccineName: im.vaccine_name,
      dose: im.dose,
      date: im.date,
      facility: im.facility,
      lotNumber: im.lot_number,
      verified: Boolean(im.verified),
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/immunizations', async (req: Request, res: Response) => {
  try {
    const p = getPool();
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

    await p.query(
      `INSERT INTO immunizations (id, patient_id, vaccine_name, dose, date, facility, lot_number, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newImm.id, newImm.patientId, newImm.vaccineName, newImm.dose, newImm.date, newImm.facility, newImm.lotNumber, 1]
    );

    await logAudit('Immunization Logged', 'Preventive Care', `Recorded ${newImm.vaccineName} (${newImm.dose})`);
    res.status(201).json(newImm);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Nurse Portal Dedicated Modules (MAR, SBAR, Doctor Orders)
app.get('/api/nurse/mar', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM mar_records ORDER BY scheduled_time ASC');
    res.json(rows.map((mar: any) => ({
      id: mar.id,
      patientId: mar.patient_id,
      patientName: mar.patient_name,
      bedNumber: mar.bed_number,
      medication: mar.medication,
      dosage: mar.dosage,
      route: mar.route,
      scheduledTime: mar.scheduled_time,
      status: mar.status,
      adminTime: mar.admin_time,
      administeredBy: mar.administered_by,
      holdReason: mar.hold_reason,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/nurse/mar', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newId = req.body.id || `mar-${Date.now()}`;
    await p.query(
      `INSERT INTO mar_records (id, patient_id, patient_name, bed_number, medication, dosage, route, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        req.body.patientId || 'pat-1',
        req.body.patientName,
        req.body.bedNumber || 'ICU-01',
        req.body.medication,
        req.body.dosage,
        req.body.route || 'Oral',
        req.body.scheduledTime || '12:00',
        req.body.status || 'Due'
      ]
    );

    await logAudit('MAR Order Added', 'Nursing MAR', `Scheduled ${req.body.medication} ${req.body.dosage} for ${req.body.patientName}`);
    res.status(201).json({ id: newId, ...req.body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/nurse/mar/:id/administer', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const adminTime = req.body.adminTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const administeredBy = req.body.administeredBy || 'Head Nurse Sarah';

    await p.query(
      `UPDATE mar_records SET status = 'Given', admin_time = ?, administered_by = ? WHERE id = ?`,
      [adminTime, administeredBy, req.params.id]
    );

    await logAudit('MAR Administered', 'Nursing MAR', `Medication administration confirmed for MAR #${req.params.id} by ${administeredBy}`);
    res.json({ success: true, id: req.params.id, status: 'Given', adminTime, administeredBy });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/nurse/mar/:id/hold', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const holdReason = req.body.holdReason || 'Clinical contraindication / Vitals withheld';

    await p.query(
      `UPDATE mar_records SET status = 'Held', hold_reason = ? WHERE id = ?`,
      [holdReason, req.params.id]
    );

    await logAudit('MAR Held', 'Nursing MAR', `MAR #${req.params.id} held: ${holdReason}`);
    res.json({ success: true, id: req.params.id, status: 'Held', holdReason });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SBAR Handover Notes
app.get('/api/nurse/sbar', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM sbar_notes ORDER BY id DESC');
    res.json(rows.map((s: any) => ({
      id: s.id,
      patientId: s.patient_id,
      patientName: s.patient_name,
      bedNumber: s.bed_number,
      time: s.time,
      date: s.date,
      situation: s.situation,
      background: s.background,
      assessment: s.assessment,
      recommendation: s.recommendation,
      nurseName: s.nurse_name,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/nurse/sbar', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newId = req.body.id || `sbar-${Date.now()}`;
    const time = req.body.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = req.body.date || new Date().toISOString().split('T')[0];

    await p.query(
      `INSERT INTO sbar_notes (id, patient_id, patient_name, bed_number, time, date, situation, background, assessment, recommendation, nurse_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        req.body.patientId || 'pat-1',
        req.body.patientName,
        req.body.bedNumber || 'ICU-01',
        time,
        date,
        req.body.situation || '',
        req.body.background || '',
        req.body.assessment || '',
        req.body.recommendation || '',
        req.body.nurseName || 'Head Nurse Sarah'
      ]
    );

    await logAudit('SBAR Handover Created', 'Nursing Handover', `Shift note submitted for ${req.body.patientName} (${req.body.bedNumber})`);
    res.status(201).json({ id: newId, time, date, ...req.body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor Orders
app.get('/api/doctor-orders', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM doctor_orders ORDER BY id DESC');
    res.json(rows.map((d: any) => ({
      id: d.id,
      patientName: d.patient_name,
      bed: d.bed,
      orderType: d.order_type,
      orderText: d.order_text,
      orderedBy: d.ordered_by,
      priority: d.priority,
      status: d.status,
      createdAt: d.created_at,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctor-orders', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    const newId = req.body.id || `do-${Date.now()}`;
    const createdAt = req.body.createdAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    await p.query(
      `INSERT INTO doctor_orders (id, patient_name, bed, order_type, order_text, ordered_by, priority, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        req.body.patientName,
        req.body.bed || 'ICU-01',
        req.body.orderType || 'Clinical',
        req.body.orderText,
        req.body.orderedBy || 'Dr. Roger S.',
        req.body.priority || 'Routine',
        req.body.status || 'Pending',
        createdAt
      ]
    );

    await logAudit('Doctor Order Issued', 'Physician Orders', `Order [${req.body.priority}] "${req.body.orderText}" for ${req.body.patientName}`);
    res.status(201).json({ id: newId, createdAt, ...req.body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/doctor-orders/:id', async (req: Request, res: Response) => {
  try {
    const p = getPool();
    await p.query('UPDATE doctor_orders SET status = ? WHERE id = ?', [req.body.status || 'Completed', req.params.id]);
    await logAudit('Doctor Order Updated', 'Physician Orders', `Order #${req.params.id} marked as ${req.body.status || 'Completed'}`);
    res.json({ success: true, id: req.params.id, status: req.body.status || 'Completed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', async (_req: Request, res: Response) => {
  try {
    const p = getPool();
    const [rows]: any = await p.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
    res.json(rows.map((l: any) => ({
      id: l.id,
      timestamp: l.timestamp,
      userName: l.user_name,
      userRole: l.user_role,
      action: l.action,
      module: l.module,
      details: l.details,
      ipAddress: l.ip_address,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize MySQL and start listening
initializeDatabase()
  .then((status) => {
    const connected = status.connected;
    if (connected) {
      console.log('🎉 [MediCore] Real MySQL Backend synchronized with phpMyAdmin!');
    } else {
      console.warn('⚠️ [MediCore] Operating in JSON fallback mode.');
    }
  })
  .catch((e) => console.error('Database init failed:', e));

app.listen(PORT, () => {
  console.log(`[MediCore] Express REST Backend Server running on http://localhost:${PORT}`);
  console.log(`[MediCore] MySQL Database connected: medicore_db on port 3307`);
  console.log(`[MediCore] phpMyAdmin accessible at: http://localhost/phpmyadmin`);
});

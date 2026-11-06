/**
 * MediCore MySQL Database Service
 * Provides connection pool, table schema management, and migration/seeding.
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
export const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3307, // XAMPP MariaDB port
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medicore_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;
let isConnected = false;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

export function isDbConnected(): boolean {
  return isConnected;
}

/**
 * Initialize database, create tables, and seed initial records.
 */
export async function initializeDatabase(): Promise<boolean> {
  let serverConn: mysql.Connection | null = null;
  try {
    serverConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      connectTimeout: 5000,
    });

    console.log(`[MediCore MySQL] Connected to MySQL engine on port ${DB_CONFIG.port}`);
    await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[MediCore MySQL] Database '${DB_CONFIG.database}' verified/created`);
  } catch (err: any) {
    console.error(`[MediCore MySQL] Initial connection failed on port ${DB_CONFIG.port}:`, err.message);
    if (DB_CONFIG.port === 3307) {
      try {
        console.log('[MediCore MySQL] Trying fallback port 3306...');
        serverConn = await mysql.createConnection({
          host: DB_CONFIG.host,
          port: 3306,
          user: DB_CONFIG.user,
          password: DB_CONFIG.password,
          connectTimeout: 3000,
        });
        DB_CONFIG.port = 3306;
        await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`[MediCore MySQL] Database '${DB_CONFIG.database}' verified/created on fallback port 3306`);
      } catch (fallbackErr: any) {
        console.error('[MediCore MySQL] Fallback connection failed:', fallbackErr.message);
        isConnected = false;
        return false;
      }
    } else {
      isConnected = false;
      return false;
    }
  } finally {
    if (serverConn) await serverConn.end();
  }

  pool = mysql.createPool(DB_CONFIG);
  isConnected = true;

  await createTables();
  await seedInitialData();

  console.log('[MediCore MySQL] All database tables ready & synchronized with phpMyAdmin!');
  return true;
}

async function createTables() {
  const p = getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(64) PRIMARY KEY,
      patient_code VARCHAR(32) NOT NULL,
      name VARCHAR(128) NOT NULL,
      age INT NOT NULL,
      gender VARCHAR(16) NOT NULL,
      blood_group VARCHAR(16) NOT NULL,
      admission_date VARCHAR(64) NULL,
      admission_status VARCHAR(64) NOT NULL,
      diagnosis VARCHAR(255) NOT NULL,
      attending_doctor VARCHAR(128) NULL,
      room_bed VARCHAR(32) NULL,
      insurance_provider VARCHAR(128) NULL,
      emergency_contact VARCHAR(64) NULL,
      vitals JSON NULL,
      medical_history JSON NULL,
      allergies JSON NULL,
      avatar VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      title VARCHAR(255) NULL,
      specialty VARCHAR(128) NULL,
      department VARCHAR(128) NOT NULL,
      qualification VARCHAR(128) NULL,
      experience_years INT DEFAULT 5,
      room_number VARCHAR(32) NULL,
      consultation_fee DECIMAL(10, 2) DEFAULT 150.00,
      consultation_hours VARCHAR(64) NULL,
      available_days JSON NULL,
      schedule JSON NULL,
      rating DECIMAL(3, 1) DEFAULT 4.9,
      current_patient_count INT DEFAULT 0,
      avatar VARCHAR(255) NULL,
      status VARCHAR(32) DEFAULT 'Available'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      patient_name VARCHAR(128) NOT NULL,
      doctor_id VARCHAR(64) NOT NULL,
      doctor_name VARCHAR(128) NOT NULL,
      department VARCHAR(128) NOT NULL,
      date VARCHAR(64) NOT NULL,
      time VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      type VARCHAR(64) NULL,
      notes TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS medicines (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      generic_name VARCHAR(128) NOT NULL,
      category VARCHAR(64) NOT NULL,
      dosage_form VARCHAR(64) NOT NULL,
      strength VARCHAR(64) NOT NULL,
      batch_number VARCHAR(64) NULL,
      stock INT NOT NULL,
      min_threshold INT NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      expiry_date VARCHAR(64) NOT NULL,
      manufacturer VARCHAR(128) NULL,
      status VARCHAR(32) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      patient_name VARCHAR(128) NOT NULL,
      doctor_id VARCHAR(64) NOT NULL,
      doctor_name VARCHAR(128) NOT NULL,
      date VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      notes TEXT NULL,
      items JSON NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS lab_tests (
      id VARCHAR(64) PRIMARY KEY,
      test_code VARCHAR(32) NULL,
      name VARCHAR(128) NOT NULL,
      department VARCHAR(128) NULL,
      sample_type VARCHAR(64) NULL,
      turnaround_time_hours INT DEFAULT 24,
      cost DECIMAL(10, 2) NOT NULL,
      reference_range VARCHAR(128) NULL,
      unit VARCHAR(32) NULL,
      is_active BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS lab_orders (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      patient_name VARCHAR(128) NOT NULL,
      doctor_id VARCHAR(64) NULL,
      doctor_name VARCHAR(128) NULL,
      test_id VARCHAR(64) NULL,
      test_name VARCHAR(128) NOT NULL,
      order_date VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      result_value VARCHAR(255) NULL,
      reference_range VARCHAR(128) NULL,
      unit VARCHAR(32) NULL,
      interpretation VARCHAR(32) NULL,
      completed_date VARCHAR(64) NULL,
      notes TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS beds (
      id VARCHAR(64) PRIMARY KEY,
      bed_number VARCHAR(32) NOT NULL,
      ward_id VARCHAR(64) NULL,
      ward VARCHAR(64) NOT NULL,
      department VARCHAR(64) NULL,
      type VARCHAR(32) NULL,
      floor VARCHAR(32) NULL,
      status VARCHAR(32) NOT NULL,
      patient_id VARCHAR(64) NULL,
      patient_name VARCHAR(128) NULL,
      admission_time VARCHAR(64) NULL,
      daily_rate DECIMAL(10, 2) DEFAULT 250.00
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(64) PRIMARY KEY,
      invoice_number VARCHAR(64) NOT NULL,
      patient_id VARCHAR(64) NOT NULL,
      patient_name VARCHAR(128) NOT NULL,
      issue_date VARCHAR(64) NOT NULL,
      due_date VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      payment_method VARCHAR(64) NULL,
      items JSON NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      tax DECIMAL(10, 2) NOT NULL,
      discount DECIMAL(10, 2) NOT NULL,
      grand_total DECIMAL(10, 2) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      role VARCHAR(64) NOT NULL,
      department VARCHAR(64) NOT NULL,
      shift VARCHAR(64) NOT NULL,
      phone VARCHAR(64) NULL,
      email VARCHAR(128) NULL,
      contact VARCHAR(64) NULL,
      status VARCHAR(32) NOT NULL,
      avatar VARCHAR(255) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(64) NOT NULL,
      severity VARCHAR(32) NOT NULL,
      time VARCHAR(32) NOT NULL,
      action_required TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      timestamp VARCHAR(64) NOT NULL,
      user_name VARCHAR(128) NOT NULL,
      user_role VARCHAR(64) NOT NULL,
      action VARCHAR(128) NOT NULL,
      module VARCHAR(64) NOT NULL,
      details TEXT NULL,
      ip_address VARCHAR(64) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      patient_name VARCHAR(128) NULL,
      doctor_id VARCHAR(64) NULL,
      doctor_name VARCHAR(128) NULL,
      sender VARCHAR(32) NOT NULL,
      sender_name VARCHAR(128) NOT NULL,
      text TEXT NOT NULL,
      timestamp VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS meals (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      meal_type VARCHAR(64) NOT NULL,
      name VARCHAR(128) NOT NULL,
      calories INT NOT NULL,
      sodium_mg INT NOT NULL,
      carbs_g INT NOT NULL,
      timestamp VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS claims (
      id VARCHAR(64) PRIMARY KEY,
      invoice_id VARCHAR(64) NOT NULL,
      patient_id VARCHAR(64) NOT NULL,
      policy_number VARCHAR(128) NOT NULL,
      provider VARCHAR(128) NOT NULL,
      claim_amount DECIMAL(10, 2) NOT NULL,
      diagnosis_code VARCHAR(64) NOT NULL,
      status VARCHAR(64) NOT NULL,
      date VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS immunizations (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      vaccine_name VARCHAR(255) NOT NULL,
      dose VARCHAR(64) NOT NULL,
      date VARCHAR(64) NOT NULL,
      facility VARCHAR(128) NOT NULL,
      lot_number VARCHAR(64) NOT NULL,
      verified BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS mar_records (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      patient_name VARCHAR(128) NOT NULL,
      bed_number VARCHAR(32) NOT NULL,
      medication VARCHAR(128) NOT NULL,
      dosage VARCHAR(64) NOT NULL,
      route VARCHAR(64) NOT NULL,
      scheduled_time VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL,
      admin_time VARCHAR(64) NULL,
      administered_by VARCHAR(128) NULL,
      hold_reason TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS sbar_notes (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      patient_name VARCHAR(128) NOT NULL,
      bed_number VARCHAR(32) NOT NULL,
      time VARCHAR(64) NOT NULL,
      date VARCHAR(64) NOT NULL,
      situation TEXT NULL,
      background TEXT NULL,
      assessment TEXT NULL,
      recommendation TEXT NULL,
      nurse_name VARCHAR(128) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS doctor_orders (
      id VARCHAR(64) PRIMARY KEY,
      patient_name VARCHAR(128) NOT NULL,
      bed VARCHAR(32) NOT NULL,
      order_type VARCHAR(64) NOT NULL,
      order_text TEXT NOT NULL,
      ordered_by VARCHAR(128) NOT NULL,
      priority VARCHAR(32) NOT NULL,
      status VARCHAR(32) DEFAULT 'Pending',
      created_at VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function seedInitialData() {
  const p = getPool();
  const dbFile = path.join(__dirname, 'data', 'database.json');
  if (!fs.existsSync(dbFile)) return;

  const raw = fs.readFileSync(dbFile, 'utf-8');
  const data = JSON.parse(raw);

  // Check patients
  const [patientRows]: any = await p.query('SELECT COUNT(*) as cnt FROM patients');
  if (patientRows[0].cnt === 0 && Array.isArray(data.patients)) {
    for (const pat of data.patients) {
      await p.query(
        `INSERT INTO patients (id, patient_code, name, age, gender, blood_group, admission_date, admission_status, diagnosis, attending_doctor, room_bed, insurance_provider, emergency_contact, vitals, medical_history, allergies, avatar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pat.id,
          pat.patientCode || `P-${Math.floor(10000 + Math.random() * 90000)}`,
          pat.name,
          pat.age || 40,
          pat.gender || 'Unknown',
          pat.bloodGroup || 'O+',
          pat.admissionDate || null,
          pat.admissionStatus || 'Outpatient',
          pat.diagnosis || 'General Evaluation',
          pat.attendingDoctor || null,
          pat.roomBed || null,
          pat.insuranceProvider || null,
          pat.emergencyContact || null,
          JSON.stringify(pat.vitals || {}),
          JSON.stringify(pat.medicalHistory || []),
          JSON.stringify(pat.allergies || []),
          pat.avatar || null,
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.patients.length} patients`);
  }

  // Check doctors
  const [docRows]: any = await p.query('SELECT COUNT(*) as cnt FROM doctors');
  if (docRows[0].cnt === 0 && Array.isArray(data.doctors)) {
    for (const doc of data.doctors) {
      await p.query(
        `INSERT INTO doctors (id, name, title, specialty, department, qualification, experience_years, room_number, consultation_fee, consultation_hours, available_days, schedule, rating, current_patient_count, avatar, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doc.id,
          doc.name,
          doc.title || null,
          doc.specialization || doc.specialty || 'General Practitioner',
          doc.department || 'General Medicine',
          doc.qualification || 'MBBS, MD',
          doc.experienceYears || 5,
          doc.roomNumber || 'Room 101',
          doc.consultationFee || 150.00,
          doc.consultationHours || '09:00 - 17:00',
          JSON.stringify(doc.availableDays || []),
          JSON.stringify(doc.schedule || []),
          doc.rating || 4.9,
          doc.patientsCount || doc.currentPatientCount || 0,
          doc.avatar || null,
          doc.availability || doc.status || 'Available'
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.doctors.length} doctors`);
  }

  // Check appointments
  const [aptRows]: any = await p.query('SELECT COUNT(*) as cnt FROM appointments');
  if (aptRows[0].cnt === 0 && Array.isArray(data.appointments)) {
    for (const a of data.appointments) {
      await p.query(
        `INSERT INTO appointments (id, patient_id, patient_name, doctor_id, doctor_name, department, date, time, status, type, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id,
          a.patientId,
          a.patientName,
          a.doctorId,
          a.doctorName,
          a.department || 'General Medicine',
          a.date,
          a.time,
          a.status,
          a.visitType || a.type || 'Consultation',
          a.notes || ''
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.appointments.length} appointments`);
  }

  // Check medicines
  const [medRows]: any = await p.query('SELECT COUNT(*) as cnt FROM medicines');
  if (medRows[0].cnt === 0 && Array.isArray(data.medicines)) {
    for (const m of data.medicines) {
      await p.query(
        `INSERT INTO medicines (id, name, generic_name, category, dosage_form, strength, batch_number, stock, min_threshold, unit_price, expiry_date, manufacturer, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          m.name,
          m.genericName,
          m.category,
          m.dosageForm,
          m.strength,
          m.batchNumber || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
          m.stock,
          m.minThreshold,
          m.unitPrice,
          m.expiryDate,
          m.manufacturer || 'MediCore Pharma Labs',
          m.status
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.medicines.length} medicines`);
  }

  // Check prescriptions
  const [rxRows]: any = await p.query('SELECT COUNT(*) as cnt FROM prescriptions');
  if (rxRows[0].cnt === 0 && Array.isArray(data.prescriptions)) {
    for (const rx of data.prescriptions) {
      await p.query(
        `INSERT INTO prescriptions (id, patient_id, patient_name, doctor_id, doctor_name, date, status, notes, items)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [rx.id, rx.patientId, rx.patientName, rx.doctorId, rx.doctorName, rx.date, rx.status, rx.notes || '', JSON.stringify(rx.items || [])]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.prescriptions.length} prescriptions`);
  }

  // Check lab tests
  const [ltRows]: any = await p.query('SELECT COUNT(*) as cnt FROM lab_tests');
  if (ltRows[0].cnt === 0 && Array.isArray(data.labTests)) {
    for (const lt of data.labTests) {
      await p.query(
        `INSERT INTO lab_tests (id, test_code, name, department, sample_type, turnaround_time_hours, cost, reference_range, unit, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lt.id,
          lt.testCode || `TC-${Math.floor(100 + Math.random() * 900)}`,
          lt.testName || lt.name || 'Diagnostic Panel',
          lt.category || lt.department || 'Clinical Laboratory',
          lt.sampleType || 'Venous Blood / Serum',
          lt.durationHours || lt.turnaroundTimeHours || 24,
          lt.price || lt.cost || 120.00,
          lt.normalRange || lt.referenceRange || 'Negative / Normal',
          lt.unit || null,
          lt.isActive !== undefined ? lt.isActive : true
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.labTests.length} lab tests`);
  }

  // Check lab orders
  const [loRows]: any = await p.query('SELECT COUNT(*) as cnt FROM lab_orders');
  if (loRows[0].cnt === 0 && Array.isArray(data.labOrders)) {
    for (const lo of data.labOrders) {
      await p.query(
        `INSERT INTO lab_orders (id, patient_id, patient_name, doctor_id, doctor_name, test_id, test_name, order_date, status, result_value, reference_range, unit, interpretation, completed_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lo.id,
          lo.patientId,
          lo.patientName,
          lo.doctorId || 'doc-1',
          lo.doctorName || 'Dr. Roger S.',
          lo.testId || 'test-1',
          lo.testName,
          lo.orderedDate || lo.orderDate || new Date().toISOString().split('T')[0],
          lo.status,
          lo.resultValue || null,
          lo.referenceRange || null,
          lo.unit || null,
          lo.interpretation || null,
          lo.completedDate || null,
          lo.notes || null
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.labOrders.length} lab orders`);
  }

  // Check beds
  const [bedRows]: any = await p.query('SELECT COUNT(*) as cnt FROM beds');
  if (bedRows[0].cnt === 0 && Array.isArray(data.beds)) {
    for (const b of data.beds) {
      await p.query(
        `INSERT INTO beds (id, bed_number, ward_id, ward, department, type, floor, status, patient_id, patient_name, admission_time, daily_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.id,
          b.bedNumber,
          b.wardId || null,
          b.wardName || b.ward || 'General Ward',
          b.department || b.type || 'Inpatient',
          b.type || 'Standard',
          b.floor || 'Floor 2',
          b.status,
          b.patientId || null,
          b.patientName || null,
          b.admittedDate || b.admissionTime || null,
          b.dailyRate || 250.00
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.beds.length} beds`);
  }

  // Check invoices
  const [invRows]: any = await p.query('SELECT COUNT(*) as cnt FROM invoices');
  if (invRows[0].cnt === 0 && Array.isArray(data.invoices)) {
    for (const inv of data.invoices) {
      await p.query(
        `INSERT INTO invoices (id, invoice_number, patient_id, patient_name, issue_date, due_date, status, payment_method, items, subtotal, tax, discount, grand_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inv.id,
          inv.invoiceNumber,
          inv.patientId,
          inv.patientName,
          inv.date || inv.issueDate || new Date().toISOString().split('T')[0],
          inv.dueDate || new Date().toISOString().split('T')[0],
          inv.status,
          inv.paymentMethod || null,
          JSON.stringify(inv.items || []),
          inv.subtotal,
          inv.tax,
          inv.discount,
          inv.grandTotal
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.invoices.length} invoices`);
  }

  // Check staff
  const [staffRows]: any = await p.query('SELECT COUNT(*) as cnt FROM staff');
  if (staffRows[0].cnt === 0 && Array.isArray(data.staff)) {
    for (const s of data.staff) {
      await p.query(
        `INSERT INTO staff (id, name, role, department, shift, phone, email, contact, status, avatar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          s.name,
          s.role,
          s.department,
          s.shift,
          s.phone || s.contact || null,
          s.email || `${s.name.toLowerCase().replace(/[^a-z]/g, '')}@medicore.org`,
          s.contact || s.phone || null,
          s.status,
          s.avatar || null
        ]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.staff.length} staff`);
  }

  // Check alerts
  const [alertRows]: any = await p.query('SELECT COUNT(*) as cnt FROM alerts');
  if (alertRows[0].cnt === 0 && Array.isArray(data.alerts)) {
    for (const a of data.alerts) {
      await p.query(
        `INSERT INTO alerts (id, title, department, severity, time, action_required)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [a.id, a.title, a.department, a.severity, a.time, a.actionRequired]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.alerts.length} alerts`);
  }

  // Check messages
  const [msgRows]: any = await p.query('SELECT COUNT(*) as cnt FROM messages');
  if (msgRows[0].cnt === 0 && Array.isArray(data.messages)) {
    for (const m of data.messages) {
      await p.query(
        `INSERT INTO messages (id, patient_id, patient_name, doctor_id, doctor_name, sender, sender_name, text, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.patientId, m.patientName || 'Magnus Stephenson', m.doctorId || 'doc-1', m.doctorName || 'Dr. Roger S.', m.sender, m.senderName, m.text, m.timestamp]
      );
    }
    console.log(`[MediCore MySQL] Seeded ${data.messages.length} messages`);
  }

  // Check meals
  const [mealRows]: any = await p.query('SELECT COUNT(*) as cnt FROM meals');
  if (mealRows[0].cnt === 0 && Array.isArray(data.meals) && data.meals.length > 0) {
    for (const ml of data.meals) {
      await p.query(
        `INSERT INTO meals (id, patient_id, meal_type, name, calories, sodium_mg, carbs_g, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ml.id, ml.patientId, ml.mealType, ml.name, ml.calories, ml.sodiumMg, ml.carbsG, ml.timestamp]
      );
    }
  }

  // Check immunizations
  const [immRows]: any = await p.query('SELECT COUNT(*) as cnt FROM immunizations');
  if (immRows[0].cnt === 0 && Array.isArray(data.immunizations) && data.immunizations.length > 0) {
    for (const im of data.immunizations) {
      await p.query(
        `INSERT INTO immunizations (id, patient_id, vaccine_name, dose, date, facility, lot_number, verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [im.id, im.patientId, im.vaccineName, im.dose, im.date, im.facility, im.lotNumber, im.verified ? 1 : 0]
      );
    }
  }

  // Seed default MAR records for Nurse Portal
  const [marRows]: any = await p.query('SELECT COUNT(*) as cnt FROM mar_records');
  if (marRows[0].cnt === 0) {
    const defaultMars = [
      { id: 'mar-1', patient_id: 'pat-1', patient_name: 'Magnus Stephenson', bed_number: 'ICU-01', medication: 'Meropenem IV', dosage: '1g q8h', route: 'IV Infusion', scheduled_time: '18:00', status: 'Due' },
      { id: 'mar-2', patient_id: 'pat-1', patient_name: 'Magnus Stephenson', bed_number: 'ICU-01', medication: 'Albuterol Nebulizer', dosage: '2.5mg / 3mL', route: 'Inhalation', scheduled_time: '14:00', status: 'Given', admin_time: '14:05', administered_by: 'Head Nurse Sarah' },
      { id: 'mar-3', patient_id: 'pat-2', patient_name: 'Elena Rostova', bed_number: 'WARD-204', medication: 'Metoprolol Tartrate', dosage: '25mg', route: 'Oral', scheduled_time: '20:00', status: 'Due' },
      { id: 'mar-4', patient_id: 'pat-3', patient_name: 'David Chen', bed_number: 'OR-02', medication: 'Cefazolin IV', dosage: '2g', route: 'IV Infusion', scheduled_time: '16:30', status: 'Given', admin_time: '16:32', administered_by: 'Nurse Jennifer' },
    ];
    for (const mar of defaultMars) {
      await p.query(
        `INSERT INTO mar_records (id, patient_id, patient_name, bed_number, medication, dosage, route, scheduled_time, status, admin_time, administered_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [mar.id, mar.patient_id, mar.patient_name, mar.bed_number, mar.medication, mar.dosage, mar.route, mar.scheduled_time, mar.status, mar.admin_time || null, mar.administered_by || null]
      );
    }
    console.log(`[MediCore MySQL] Seeded MAR records`);
  }

  // Seed default SBAR notes
  const [sbarRows]: any = await p.query('SELECT COUNT(*) as cnt FROM sbar_notes');
  if (sbarRows[0].cnt === 0) {
    const defaultSbar = [
      {
        id: 'sbar-1',
        patient_id: 'pat-1',
        patient_name: 'Magnus Stephenson',
        bed_number: 'ICU-01',
        time: '17:30',
        date: new Date().toISOString().split('T')[0],
        situation: 'Patient experiencing mild expiratory wheeze following nebulizer treatment. SpO2 93% on 2L NC.',
        background: 'Admitted 3 days ago with acute COPD exacerbation & bilateral infiltrates.',
        assessment: 'Breath sounds clear in upper lobes; reduced in left base. Patient hemodynamically stable.',
        recommendation: 'Continue nebulizer regimen every 4 hours. Titrate O2 to maintain SpO2 >= 94%.',
        nurse_name: 'Head Nurse Sarah Jenkins, RN'
      }
    ];
    for (const sb of defaultSbar) {
      await p.query(
        `INSERT INTO sbar_notes (id, patient_id, patient_name, bed_number, time, date, situation, background, assessment, recommendation, nurse_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sb.id, sb.patient_id, sb.patient_name, sb.bed_number, sb.time, sb.date, sb.situation, sb.background, sb.assessment, sb.recommendation, sb.nurse_name]
      );
    }
    console.log(`[MediCore MySQL] Seeded SBAR notes`);
  }

  // Seed default Doctor Orders
  const [docOrderRows]: any = await p.query('SELECT COUNT(*) as cnt FROM doctor_orders');
  if (docOrderRows[0].cnt === 0) {
    const defaultOrders = [
      { id: 'do-1', patient_name: 'Magnus Stephenson', bed: 'ICU-01', order_type: 'Medication', order_text: 'Administer IV Solu-Medrol 40mg STAT', ordered_by: 'Dr. Roger S.', priority: 'STAT', status: 'Pending', created_at: '17:15' },
      { id: 'do-2', patient_name: 'Elena Rostova', bed: 'WARD-204', order_type: 'Lab', order_text: 'Repeat Troponin I in 6 hours', ordered_by: 'Dr. Roger S.', priority: 'Urgent', status: 'Acknowledged', created_at: '16:00' },
      { id: 'do-3', patient_name: 'David Chen', bed: 'OR-02', order_type: 'Telemetry', order_text: 'Continuous 12-lead ECG monitoring post-op', ordered_by: 'Dr. Roger S.', priority: 'Routine', status: 'Completed', created_at: '14:30' }
    ];
    for (const d of defaultOrders) {
      await p.query(
        `INSERT INTO doctor_orders (id, patient_name, bed, order_type, order_text, ordered_by, priority, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.id, d.patient_name, d.bed, d.order_type, d.order_text, d.ordered_by, d.priority, d.status, d.created_at]
      );
    }
    console.log(`[MediCore MySQL] Seeded Doctor Orders`);
  }
}

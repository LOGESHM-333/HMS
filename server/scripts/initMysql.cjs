const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const MYSQL_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'logesh@2007',
  multipleStatements: true
};

async function init() {
  console.log(`[MediCore] Connecting to MySQL on ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}...`);
  const conn = await mysql.createConnection(MYSQL_CONFIG);

  console.log('[MediCore] Creating database `medicore_db`...');
  await conn.query('CREATE DATABASE IF NOT EXISTS `medicore_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  await conn.query('USE `medicore_db`;');

  console.log('[MediCore] Executing schema.mysql.sql DDL...');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../schema.mysql.sql'), 'utf8');
  await conn.query(schemaSql);

  // Load dataset and operational data
  const datasetPath = path.join(__dirname, '../data/dataset_1000.json');
  const dbDataPath = path.join(__dirname, '../data/database.json');
  const dbData = fs.existsSync(dbDataPath) ? JSON.parse(fs.readFileSync(dbDataPath, 'utf8')) : {};
  const datasetData = fs.existsSync(datasetPath) ? JSON.parse(fs.readFileSync(datasetPath, 'utf8')) : {};
  const store = { ...dbData, ...datasetData };
  store.beds = dbData.beds || [];
  store.appointments = dbData.appointments || [];
  store.medicines = dbData.medicines || [];
  store.prescriptions = dbData.prescriptions || [];
  store.invoices = dbData.invoices || [];
  store.labTests = dbData.labTests || [];
  store.labOrders = dbData.labOrders || [];

  console.log(`[MediCore] Seeding 1,000 members dataset into MySQL tables...`);

  // Patients
  const patients = store.patients || [];
  console.log(`Inserting ${patients.length} patients...`);
  for (const p of patients) {
    await conn.query(
      `INSERT INTO patients (
        id, patient_code, name, age, gender, blood_group, emergency_contact,
        email, avatar, admission_status, room_bed, attending_doctor, diagnosis,
        vitals, allergies, medical_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        admission_status = VALUES(admission_status),
        room_bed = VALUES(room_bed),
        diagnosis = VALUES(diagnosis),
        vitals = VALUES(vitals)`,
      [
        p.id,
        p.patientCode || p.id,
        p.name,
        p.age || 40,
        p.gender || 'Male',
        p.bloodGroup || 'O+',
        p.phone || p.emergencyContact || '555-0199',
        p.email || `${p.name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
        p.avatar || null,
        p.admissionStatus || 'Outpatient',
        p.bedNumber || p.roomBed || null,
        p.primaryDoctorName || p.attendingDoctor || 'Dr. Roger S.',
        p.diagnosis || 'Clinical evaluation',
        JSON.stringify(p.vitals || {}),
        JSON.stringify(p.allergies || []),
        JSON.stringify(p.medicalHistory || [])
      ]
    );
  }

  // Doctors
  const doctors = store.doctors || [];
  console.log(`Inserting ${doctors.length} doctors...`);
  for (const d of doctors) {
    const spec = d.specialty || d.department || 'General Medicine';
    const dept = d.department || d.specialty || 'General Medicine';
    await conn.query(
      `INSERT INTO doctors (
        id, name, title, specialty, department, qualification, avatar,
        consultation_fee, experience_years, rating, current_patient_count, status, schedule
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), specialty = VALUES(specialty)`,
      [
        d.id,
        d.name,
        d.title || 'Senior Consultant',
        spec,
        dept,
        d.qualification || 'MBBS, MD',
        d.avatar || null,
        d.consultationFee || 1200.00,
        d.experienceYears || 10,
        d.rating || 4.9,
        d.currentPatientCount || 12,
        d.status || 'Available',
        JSON.stringify(d.schedule || {})
      ]
    );
  }

  // Staff
  const staff = store.staff || [];
  console.log(`Inserting ${staff.length} staff members...`);
  for (const s of staff) {
    await conn.query(
      `INSERT INTO staff (id, name, role, department, shift, contact, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role)`,
      [s.id, s.name, s.role, s.department, s.shift || 'Morning', s.contact || '555-0100', s.status || 'On Duty']
    );
  }

  // Beds
  const beds = store.beds || [];
  console.log(`Inserting ${beds.length} beds...`);
  for (const b of beds) {
    await conn.query(
      `INSERT INTO beds (id, bed_number, ward_id, ward_name, type, status, patient_id, patient_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), patient_id = VALUES(patient_id), patient_name = VALUES(patient_name)`,
      [b.id, b.bedNumber, b.wardId || 'w-1', b.wardName || 'General Ward', b.type || 'General', b.status || 'Available', b.patientId || null, b.patientName || null]
    );
  }

  // Medicines
  const medicines = store.medicines || [];
  console.log(`Inserting ${medicines.length} medicines...`);
  for (const m of medicines) {
    await conn.query(
      `INSERT INTO medicines (id, name, generic_name, category, dosage_form, strength, batch_number, stock, min_threshold, unit_price, expiry_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE stock = VALUES(stock), unit_price = VALUES(unit_price)`,
      [
        m.id,
        m.name,
        m.genericName || m.name,
        m.category || 'General',
        m.dosageForm || 'Tablet',
        m.strength || '500mg',
        m.batchNumber || 'BATCH-001',
        m.stock || 100,
        m.minThreshold || 20,
        m.unitPrice || 45.00,
        m.expiryDate || '2027-12-31',
        m.status || 'In Stock'
      ]
    );
  }

  // Appointments
  const appointments = store.appointments || [];
  console.log(`Inserting ${appointments.length} appointments...`);
  for (const a of appointments) {
    await conn.query(
      `INSERT INTO appointments (id, patient_id, patient_name, doctor_id, doctor_name, department, date, time, status, type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [a.id, a.patientId, a.patientName, a.doctorId, a.doctorName, a.department, a.date, a.time, a.status || 'Scheduled', a.type || 'Consultation', a.notes || null]
    );
  }

  // Prescriptions
  const prescriptions = store.prescriptions || [];
  console.log(`Inserting ${prescriptions.length} prescriptions...`);
  for (const pr of prescriptions) {
    await conn.query(
      `INSERT INTO prescriptions (id, patient_id, patient_name, doctor_id, doctor_name, date, status, items)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), items = VALUES(items)`,
      [pr.id, pr.patientId, pr.patientName, pr.doctorId, pr.doctorName, pr.date, pr.status || 'Prescribed', JSON.stringify(pr.items || [])]
    );
  }

  // Invoices
  const invoices = store.invoices || [];
  console.log(`Inserting ${invoices.length} invoices...`);
  for (const inv of invoices) {
    const issueDate = inv.issueDate || inv.date || new Date().toISOString().split('T')[0];
    const dueDate = inv.dueDate || '2026-05-15';
    await conn.query(
      `INSERT INTO invoices (id, invoice_number, patient_id, patient_name, issue_date, due_date, status, payment_method, items, subtotal, tax, discount, grand_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [inv.id, inv.invoiceNumber, inv.patientId, inv.patientName, issueDate, dueDate, inv.status || 'Pending', inv.paymentMethod || null, JSON.stringify(inv.items || []), inv.subtotal || 0, inv.tax || 0, inv.discount || 0, inv.grandTotal || 0]
    );
  }

  // Lab Tests & Lab Orders
  const labTests = store.labTests || [];
  console.log(`Inserting ${labTests.length} laboratory assays...`);
  for (const lt of labTests) {
    await conn.query(
      `INSERT INTO lab_tests (id, test_code, test_name, category, specimen_type, price, duration_hours, normal_range, unit, methodology)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE test_name = VALUES(test_name), price = VALUES(price)`,
      [lt.id, lt.testCode || lt.id, lt.testName, lt.category, lt.specimenType || 'Whole Blood', lt.price || 500, lt.durationHours || 4, lt.normalRange || 'Normal', lt.unit || '', lt.methodology || 'Automated Analyzer']
    );
  }

  const labOrders = store.labOrders || [];
  console.log(`Inserting ${labOrders.length} laboratory orders...`);
  for (const lo of labOrders) {
    const orderDate = lo.orderDate || lo.orderedDate || lo.date || '2026-04-06';
    await conn.query(
      `INSERT INTO lab_orders (
        id, patient_id, patient_name, doctor_id, doctor_name, test_id, test_name,
        order_date, completed_date, status, priority, specimen_barcode, specimen_type,
        result_value, reference_range, unit, interpretation, technician_notes, report_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), result_value = VALUES(result_value)`,
      [
        lo.id,
        lo.patientId,
        lo.patientName,
        lo.doctorId,
        lo.doctorName || 'Dr. Roger S.',
        lo.testId,
        lo.testName,
        orderDate,
        lo.completedDate || null,
        lo.status || 'Ordered',
        lo.priority || 'Routine',
        lo.specimenBarcode || null,
        lo.specimenType || 'Whole Blood',
        lo.resultValue ? (typeof lo.resultValue === 'object' ? JSON.stringify(lo.resultValue) : String(lo.resultValue)) : null,
        lo.referenceRange || null,
        lo.unit || null,
        lo.interpretation || 'Normal',
        lo.technicianNotes || null,
        lo.reportUrl || null
      ]
    );
  }

  console.log('\n--- VERIFYING MYSQL DATABASE TABLE COUNTS ---');
  const tables = ['patients', 'doctors', 'staff', 'beds', 'medicines', 'appointments', 'prescriptions', 'invoices', 'lab_tests', 'lab_orders'];
  for (const t of tables) {
    const [res] = await conn.query(`SELECT COUNT(*) AS total FROM \`${t}\``);
    console.log(`Table ${t.padEnd(16)}: ${res[0].total} records`);
  }

  await conn.end();
  console.log('\n>>> MYSQL DATABASE medicore_db IS FULLY SEEDED & READY! <<<');
}

init().catch(err => {
  console.error('[MediCore] MySQL Init Error:', err);
  process.exit(1);
});

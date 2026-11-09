/**
 * Full MySQL Seeder - seeds beds, medicines, appointments, invoices from database.json
 * Run: node ./node_modules/tsx/dist/cli.mjs server/scripts/seedMysqlAll.ts
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fs from 'fs';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });

const pool = await mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medicore_db',
});

const dbPath = path.join(__dirname, '../data/database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('🌱 Seeding beds, medicines, appointments, invoices into MySQL...');

// Seed Beds
for (const bed of (db.beds || [])) {
  try {
    await pool.query(
      `INSERT IGNORE INTO beds (id, bed_number, ward_id, ward, ward_name, type, status, patient_id, patient_name, admission_time, admitted_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bed.id,
        bed.bedNumber,
        bed.wardId || 'w-gen',
        bed.wardName || bed.ward || 'General Ward',
        bed.wardName || bed.ward || 'General Ward',
        bed.type || 'General',
        bed.status || 'Available',
        bed.patientId || null,
        bed.patientName || null,
        bed.admittedDate || null,
        bed.admittedDate || null,
      ]
    );
  } catch (e: any) { console.warn('Bed skip:', e.message); }
}
console.log(`✅ Beds: ${db.beds?.length || 0} seeded`);

// Seed Medicines
for (const med of (db.medicines || [])) {
  try {
    await pool.query(
      `INSERT IGNORE INTO medicines (id, name, generic_name, category, dosage_form, strength, batch_number, stock, min_threshold, unit_price, expiry_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        med.id,
        med.name,
        med.genericName || med.name,
        med.category || 'General',
        med.dosageForm || 'Tablet',
        med.strength || '500mg',
        med.batchNumber || 'BCH-2026',
        med.stock || 0,
        med.minThreshold || 20,
        med.unitPrice || 0,
        med.expiryDate || '2027-12-31',
        med.status || 'In Stock',
      ]
    );
  } catch (e: any) { console.warn('Medicine skip:', e.message); }
}
console.log(`✅ Medicines: ${db.medicines?.length || 0} seeded`);

// Seed Appointments
for (const apt of (db.appointments || [])) {
  try {
    await pool.query(
      `INSERT IGNORE INTO appointments (id, patient_id, patient_name, doctor_id, doctor_name, department, date, time, status, type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        apt.id,
        apt.patientId,
        apt.patientName,
        apt.doctorId || 'doc-1',
        apt.doctorName || 'Dr. Roger S.',
        apt.department || 'General Medicine',
        apt.date,
        apt.time || '09:00',
        apt.status || 'Scheduled',
        apt.visitType || apt.type || 'Consultation',
        apt.notes || '',
      ]
    );
  } catch (e: any) { console.warn('Appointment skip:', e.message); }
}
console.log(`✅ Appointments: ${db.appointments?.length || 0} seeded`);

// Seed Invoices
for (const inv of (db.invoices || [])) {
  try {
    await pool.query(
      `INSERT IGNORE INTO invoices (id, invoice_number, patient_id, patient_name, issue_date, due_date, status, payment_method, items, subtotal, tax, discount, grand_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inv.id,
        inv.invoiceNumber || `INV-${Date.now()}`,
        inv.patientId,
        inv.patientName,
        inv.date || inv.issueDate || new Date().toISOString().split('T')[0],
        inv.dueDate || new Date().toISOString().split('T')[0],
        inv.status || 'Pending',
        inv.paymentMethod || null,
        JSON.stringify(inv.items || []),
        inv.subtotal || 0,
        inv.tax || 0,
        inv.discount || 0,
        inv.grandTotal || 0,
      ]
    );
  } catch (e: any) { console.warn('Invoice skip:', e.message); }
}
console.log(`✅ Invoices: ${db.invoices?.length || 0} seeded`);

await pool.end();
console.log('\n🎉 All seed data inserted into MySQL medicore_db!');
process.exit(0);


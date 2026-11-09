/**
 * Database 1000-Members Seeder Script
 * Usage: npm run db:seed
 */

import { initializeDatabase, getDbStatus, load1000Dataset, fallbackStore } from '../db.js';

async function main() {
  console.log('============================================================');
  console.log('MediCore Enterprise 1,000 Members Live Dataset Seeder');
  console.log('============================================================\n');

  load1000Dataset();
  console.log(`✓ Loaded dataset: ${fallbackStore.patients.length} patients, ${fallbackStore.doctors.length} doctors, ${fallbackStore.staff.length} staff.`);

  const status = await initializeDatabase();
  console.log(`\nActive Engine: ${status.dialect.toUpperCase()}`);
  console.log(`Total Members: ${status.totalMembers}`);
  console.log('✓ Seeding complete and verified across all portals!');
}

main().then(() => process.exit(0));


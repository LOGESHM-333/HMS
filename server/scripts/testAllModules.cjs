const http = require('http');

function checkEndpoint(name, path) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port: 5000, path }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const count = Array.isArray(parsed) ? `${parsed.length} items` : typeof parsed === 'object' ? 'OK (Object)' : 'OK';
          resolve({ name, path, status: res.statusCode, count, success: res.statusCode < 400 });
        } catch {
          resolve({ name, path, status: res.statusCode, count: `${body.length} bytes (HTML/Raw)`, success: res.statusCode < 400 });
        }
      });
    });
    req.on('error', (err) => resolve({ name, path, status: 'ERROR', count: err.message, success: false }));
  });
}

async function audit() {
  console.log('=== MEDICORE ENTERPRISE 100% MODULE HEALTH AUDIT ===\n');

  const endpoints = [
    { name: 'System Health & MySQL Status', path: '/api/health' },
    { name: 'Database Web Explorer GUI', path: '/database' },
    { name: 'Full Bootstrap State', path: '/api/bootstrap' },
    { name: 'Patients Directory (1000 Dataset)', path: '/api/patients' },
    { name: 'Individual Patient Dossier (pat-1)', path: '/api/patients/pat-1' },
    { name: 'Doctors Specialist Directory', path: '/api/doctors' },
    { name: 'Hospital Healthcare Staff Roster', path: '/api/staff' },
    { name: 'Inpatient Beds & Ward Matrix', path: '/api/beds' },
    { name: 'Ward Clinical Statistics', path: '/api/ward/stats' },
    { name: 'Clinical Appointments & Telehealth', path: '/api/appointments' },
    { name: 'Pharmacy Formulary & Inventory', path: '/api/pharmacy/medicines' },
    { name: 'Electronic Prescriptions', path: '/api/pharmacy/prescriptions' },
    { name: 'Diagnostic Laboratory Assays (18 Tests)', path: '/api/lab/tests' },
    { name: 'Diagnostic Laboratory Orders (18 Orders)', path: '/api/lab/orders' },
    { name: 'Billing & Inpatient Tax Invoices', path: '/api/billing/invoices' },
    { name: 'Critical Emergency Alerts', path: '/api/alerts' },
    { name: 'HIPAA Security Audit Logs', path: '/api/audit-logs' },
    { name: 'Patient-Doctor Telechat Thread (pat-1)', path: '/api/messages/pat-1' },
    { name: 'Doctor Master Telechat Queue', path: '/api/doctor/messages' },
    { name: 'Nurse 5-Right MAR Records', path: '/api/nurse/mar' },
    { name: 'Nurse SBAR Shift Handoff Notes', path: '/api/nurse/sbar' },
    { name: 'Doctor Clinical Orders Queue', path: '/api/doctor-orders' },
    { name: 'Insurance Claims Service (pat-1)', path: '/api/billing/claims/pat-1' },
    { name: 'Clinical Nutrition & Meal Logger (pat-1)', path: '/api/meals/pat-1' },
    { name: 'Vaccination Passport Records (pat-1)', path: '/api/immunizations/pat-1' }
  ];

  let passed = 0;
  for (const ep of endpoints) {
    const res = await checkEndpoint(ep.name, ep.path);
    const symbol = res.success ? '✓' : '✗';
    console.log(`${symbol} [${res.status}] ${ep.name.padEnd(42)} ${ep.path.padEnd(32)} -> ${res.count}`);
    if (res.success) passed++;
  }

  console.log(`\nAudit Complete: ${passed} / ${endpoints.length} modules verified operational.`);
}

audit().catch(console.error);


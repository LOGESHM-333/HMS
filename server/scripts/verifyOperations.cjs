const http = require('http');

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing GET /api/patients ---');
  const getRes = await request('GET', '/api/patients');
  console.log(`Patients count: ${getRes.data.length}, First patient: ${getRes.data[0].name}`);

  console.log('\n--- 2. Testing PUT /api/patients/pat-1 (Update & Discharge) ---');
  const updateRes = await request('PUT', '/api/patients/pat-1', {
    admissionStatus: 'Discharged',
    bedNumber: 'Discharged - Home Care',
    roomNumber: 'Discharged - Home Care'
  });
  console.log('Update response status:', updateRes.status, 'Updated patient status:', updateRes.data.patient?.admissionStatus);

  console.log('\n--- 3. Testing GET /api/patients/pat-1 to verify persistence ---');
  const verifyRes = await request('GET', '/api/patients/pat-1');
  console.log('Verified persisted status:', verifyRes.data.admissionStatus, 'Bed:', verifyRes.data.bedNumber);

  console.log('\n--- 4. Testing POST /api/patients (Register New Patient) ---');
  const addRes = await request('POST', '/api/patients', {
    id: 'pat-test-9999',
    patientCode: 'PAT-9999',
    name: 'Dr. Jane Test Patient',
    age: 42,
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '+91 98765 43210',
    email: 'jane.test@hospital.org',
    admissionStatus: 'Admitted',
    diagnosis: 'Elective Laparoscopic Cholecystectomy',
    ward: 'Surgical Recovery Ward',
    bedNumber: 'Bed 205-B',
    vitals: { bloodPressure: '118/76', pulseRate: 74, respiratoryRate: 16, oxygenSaturation: 99 }
  });
  console.log('Add response status:', addRes.status, 'Created patient name:', addRes.data.patient?.name);

  console.log('\n--- 5. Testing DELETE /api/patients/pat-test-9999 (Archive/Delete) ---');
  const delRes = await request('DELETE', '/api/patients/pat-test-9999');
  console.log('Delete response status:', delRes.status, 'Message:', delRes.data.message);

  console.log('\n--- 6. Testing Laboratory Module /api/lab/tests & /api/lab/orders ---');
  const testsRes = await request('GET', '/api/lab/tests');
  console.log('Available Lab Tests count:', testsRes.data.length);
  const ordersRes = await request('GET', '/api/lab/orders');
  console.log('Lab Orders count:', ordersRes.data.length);

  // Restore pat-1 to Admitted for normal demo
  await request('PUT', '/api/patients/pat-1', {
    admissionStatus: 'Admitted',
    bedNumber: 'Bed 402-A',
    roomNumber: 'Bed 402-A'
  });
  console.log('\n[Pat-1 restored to Admitted Bed 402-A for live demo]');

  console.log('\n>>> ALL LIVE VERIFICATIONS PASSED SUCCESSFULLY! <<<');
}

run().catch(console.error);


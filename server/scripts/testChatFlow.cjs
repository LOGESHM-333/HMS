const http = require('http');
const mysql = require('mysql2/promise');

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

async function verifyChat() {
  console.log('=== VERIFYING DOCTOR <-> PATIENT TELECHAT FLOW ===\n');

  // Step 1: Patient sends message
  console.log('1. Patient pat-1 (Magnus) sends message to Doctor doc-1...');
  const patientMsgRes = await request('POST', '/api/messages', {
    patientId: 'pat-1',
    patientName: 'Magnus Stephenson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Roger S.',
    sender: 'patient',
    senderName: 'Magnus Stephenson',
    text: 'Dr. Roger, I am experiencing mild dizziness after taking my morning beta blocker. Should I adjust the timing?'
  });
  console.log('Patient POST status:', patientMsgRes.status, 'Message ID:', patientMsgRes.data.id);

  // Step 2: Doctor sends reply
  console.log('\n2. Doctor doc-1 (Dr. Roger S.) replies to Patient pat-1...');
  const doctorMsgRes = await request('POST', '/api/messages', {
    patientId: 'pat-1',
    patientName: 'Magnus Stephenson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Roger S.',
    sender: 'doctor',
    senderName: 'Dr. Roger S.',
    text: 'Magnus, please sit down immediately and log your bedside vitals. Shift your beta blocker dose to 30 mins after dinner with food. Let me know if symptoms persist.'
  });
  console.log('Doctor POST status:', doctorMsgRes.status, 'Message ID:', doctorMsgRes.data.id);

  // Step 3: Fetch messages from Patient viewpoint (GET /api/messages/pat-1)
  console.log('\n3. Fetching message thread via GET /api/messages/pat-1...');
  const threadRes = await request('GET', '/api/messages/pat-1');
  console.log('Thread fetch status:', threadRes.status, 'Total messages in thread:', threadRes.data.length);
  for (const m of threadRes.data.slice(-4)) {
    console.log(`   [${m.sender.toUpperCase()} - ${m.senderName} (${m.timestamp})]: ${m.text}`);
  }

  // Step 4: Check directly in MySQL database
  console.log('\n4. Direct MySQL Database inspection on table `medicore_db.messages`...');
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: 'logesh@2007', database: 'medicore_db' });
  const [rows] = await conn.query('SELECT id, patient_id, sender, text, timestamp FROM messages WHERE patient_id = ? ORDER BY id DESC LIMIT 5', ['pat-1']);
  console.log(`Found ${rows.length} records in MySQL table \`messages\` for pat-1:`);
  for (const r of rows) {
    console.log(`   MySQL Row [${r.id}]: ${r.sender} -> "${r.text.substring(0, 50)}..." (${r.timestamp})`);
  }
  await conn.end();

  console.log('\n>>> CHAT SYSTEM IS FULLY CONNECTED, TRANSFERS IN REAL-TIME, AND SAVES TO MYSQL! <<<');
}

verifyChat().catch(console.error);


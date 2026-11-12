/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore AI Assistant — RAG Hospital Knowledge Base & Semantic Retriever
 */

import { fallbackStore } from '../db.js';
import { AiPortalRole, AiRagCitation } from './types.js';
import { ROLE_POLICIES, RagDomain, normalizePortalRole } from './rbac.js';

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  domain: RagDomain;
  tags: string[];
  content: string;
}

const STATIC_HOSPITAL_KB: KnowledgeDoc[] = [
  {
    id: 'kb-mews-triage',
    title: 'MEWS (Modified Early Warning Score) Clinical Triage Protocol',
    category: 'Clinical Protocol',
    domain: 'triage',
    tags: ['mews', 'triage', 'vitals', 'spo2', 'blood pressure', 'pulse', 'respiratory', 'escalation', 'nurse', 'icu'],
    content: `MediCore MEWS Acuity Scoring & Escalation Rules:
- Parameters assessed: Systolic BP, Heart Rate (bpm), Respiratory Rate (/min), Temperature (°C), SpO2 (%).
- Score 0-2 (Low Risk): Routine 4-hourly bedside vital monitoring.
- Score 3-4 (Moderate Risk / Early Deterioration): Increase observations to hourly; Head Nurse notifies attending physician (Dr. Roger S.) for bedside assessment.
- Score >= 5 or SpO2 < 92% or SBP < 90 mmHg (Critical Red Flag): Trigger Rapid Response / Critical Code alert immediately, initiate supplemental O2 if SpO2 < 94%, prepare ICU-Pod transfer.`,
  },
  {
    id: 'kb-code-blue',
    title: 'Code Blue ACLS & Emergency Resuscitation SOP',
    category: 'Emergency Protocol',
    domain: 'clinical',
    tags: ['code blue', 'emergency', 'sos', 'arrest', 'resuscitation', 'defibrillator', 'crash cart', 'critical'],
    content: `MediCore Code Blue Emergency Standard Operating Procedure:
- Immediate activation via Critical Code Alerts (Doctor Portal) or Rapid Response SOS (Nurse/Patient Portal).
- Crash cart & Defibrillator Alpha stationed in Ward 4 Central Corridor and ICU Bay 01.
- Response Target: Crash team arrival < 90 seconds; document ROSC timing and ACLS drug administration (Epinephrine 1mg IV q3-5min) directly into MAR.`,
  },
  {
    id: 'kb-sepsis-bundle',
    title: 'Sepsis 1-Hour Clinical Bundle & Hemodynamic Monitoring',
    category: 'Clinical Protocol',
    domain: 'clinical',
    tags: ['sepsis', 'lactate', 'antibiotic', 'blood culture', 'fever', 'infection', 'wbc', 'hypotension'],
    content: `MediCore Surviving Sepsis 1-Hour Bundle:
1. Measure serum lactate level (order STAT from Laboratory).
2. Obtain blood cultures prior to administering broad-spectrum antibiotics.
3. Administer broad-spectrum empiric IV antibiotics (e.g. Piperacillin-Tazobactam / Ceftriaxone per allergy check — verify Penicillin allergy first!).
4. Begin rapid administration of 30 mL/kg crystalloid for hypotension or lactate >= 4 mmol/L.
5. Apply vasopressors (Norepinephrine bitartrate IV titration) if hypotensive during/after fluid resuscitation.`,
  },
  {
    id: 'kb-immunization-governance',
    title: 'Hospital Policy: Staff-Only Patient Registration & Certified Immunizations',
    category: 'Governance Policy',
    domain: 'governance',
    tags: ['vaccine', 'immunization', 'register', 'registration', 'password', 'email', 'patient portal', 'policy', 'who'],
    content: `MediCore Clinical Governance on Patient Accounts & Immunizations:
- Patient Portal Registration: Patients CANNOT self-register online. Only authorized attending Doctors and Nurses register patient accounts using the patient's verified Email ID and issue portal credentials.
- Immunization Governance: Patients cannot self-log or self-book vaccinations inside the Patient Portal. Only certified Doctors and Nurses may administer, verify lot numbers, and certify immunizations (WHO Smart Health Card QR format).
- Clinical Record Access: Patient medical records are accessible strictly on a role-authorized basis to Nurses, Doctors, Hospital Admins, and Super Admins.`,
  },
  {
    id: 'kb-nutrition-dash',
    title: 'Clinical Nutrition, Cardiac DASH Diet & Physician Directives',
    category: 'Nutrition Policy',
    domain: 'nutrition',
    tags: ['nutrition', 'diet', 'meal', 'calories', 'sodium', 'dash', 'food', 'cholesterol', 'diabetes', 'hba1c'],
    content: `MediCore Clinical Nutrition Standards (#NUT-8942):
- Diet Prescription Authority: Only attending Physicians (Doctors) can prescribe or modify a patient's therapeutic nutrition plan. Patients have read-only visibility in their Nutrition & Diet tab.
- Standard Cardiac & Hypertensive DASH Regimen: 2,000 kcal/day energy target, strict sodium cap < 1,500 mg/day, lean poultry/fish, steamed green vegetables, whole grains, and elimination of processed trans fats/sugars.
- Diabetic / Renal Diet: Glycemic load balanced for HbA1c < 6.5% target; potassium/phosphorus adjusted per renal panel (BUN/Creatinine).`,
  },
  {
    id: 'kb-pharmacy-safety',
    title: 'Hospital Pharmacy Formulary & High-Alert Medication Safety',
    category: 'Pharmacy Safety',
    domain: 'pharmacy',
    tags: ['pharmacy', 'medication', 'drug', 'allergy', 'penicillin', 'sulfa', 'inhaler', 'albuterol', 'stock', 'mar'],
    content: `MediCore Formulary & Medication Administration Safety Rules:
- Always cross-check patient documented allergies (e.g., Penicillin, Sulfa Drugs) before ordering beta-lactams or sulfonamides.
- Bronchodilators (Albuterol Sulfate 2.5mg/3mL nebulization): Monitor tachycardia and tremor; optimal post-dose SpO2 improvement expected within 15 minutes.
- MAR Verification: Nurses verify 5 Rights (Right Patient, Drug, Dose, Route, Time) before marking a dose as "Given". Doses with clinical contraindications must be marked "Held" with reason.`,
  },
  {
    id: 'kb-ward-bed-sla',
    title: 'Ward Operations, Bed Capacity & Discharge Turnover SLA',
    category: 'Operations SLA',
    domain: 'operations',
    tags: ['ward', 'bed', 'icu', 'discharge', 'admit', 'admission', 'cleaning', 'occupancy', 'capacity', 'transfer'],
    content: `MediCore Ward Operations & Bed Flow SLAs:
- Bed Status Lifecycle: Occupied -> Cleaning (Triggered automatically upon patient Discharge/Release) -> Available -> Occupied (Admit/Transfer).
- Target Cleaning Turnaround SLA: General Ward beds <= 30 mins; ICU Pod terminal sterilization <= 45 mins.
- Surge Threshold Alert: Ward occupancy >= 85% or ICU >= 90% triggers Executive & Super Admin surge balancing notification across facility nodes.
- Discharging a patient automatically releases their bed to Cleaning and archives their historical discharge record while decrementing active census.`,
  },
  {
    id: 'kb-billing-inr',
    title: 'Hospital Billing (₹ INR), Insurance Claims & Payment Schedules',
    category: 'Billing & Finance',
    domain: 'billing',
    tags: ['bill', 'billing', 'invoice', 'payment', 'insurance', 'claim', 'rupee', 'inr', 'fee', 'cost', 'price'],
    content: `MediCore Billing & Revenue Cycle Standards (All currency in Indian Rupees ₹):
- All consultation fees, lab diagnostic assays, pharmacy charges, bed tariffs, and insurance claims are denominated in INR (₹).
- Patients can view itemized invoices, pay pending balances digitally, and submit insurance claims directly from the Billing & Insurance tab.
- Lab assays range typically from ₹350 (Urinalysis / Blood Glucose) up to ₹3,800 (Thoracic High-Resolution CT & 3D Volumetry).`,
  },
  {
    id: 'kb-lab-guide',
    title: 'Laboratory Diagnostics Catalog & Reference Guide',
    category: 'Laboratory Reference',
    domain: 'laboratory',
    tags: ['lab', 'test', 'cbc', 'hemoglobin', 'hba1c', 'lipid', 'cholesterol', 'troponin', 'ct', 'xray', 'crp', 'renal', 'liver'],
    content: `MediCore Clinical Laboratory Guidance:
- Turnaround Times: STAT Cardiac Troponin-I (< 1 hr), CBC Complete Blood Count (1-2 hrs), Comprehensive Metabolic / Hepatic / Renal Panels (2-4 hrs), High-Resolution Thoracic CT (4-6 hrs).
- Key Adult Reference Ranges:
  • Hemoglobin: 13.5–17.5 g/dL (M), 12.0–15.5 g/dL (F)
  • WBC: 4,500–11,000 /µL
  • HbA1c: Normal < 5.7%, Prediabetes 5.7–6.4%, Diabetes >= 6.5%
  • Total Cholesterol: Desirable < 200 mg/dL; LDL Optimal < 100 mg/dL
  • SpO2 (Room Air): 95–100%.`,
  },
  {
    id: 'kb-patient-guide',
    title: 'Patient Portal Care Guide & Self-Service Features',
    category: 'Patient Support',
    domain: 'patient-care',
    tags: ['appointment', 'summary', 'vitals', 'doctor chat', 'emergency', 'passport', 'download', 'report', 'help'],
    content: `MediCore Patient Portal Capabilities:
- Health Summary & Vitals: View real-time Blood Pressure, Heart Rate, HbA1c, SpO2, and Risk Telemetry.
- Appointments: Book or view upcoming clinical & telehealth visits.
- Lab Reports & Prescriptions: Inspect verified test interpretations, print official reports, or request medication refills.
- Doctor Chat: Secure real-time messaging synchronized directly with Dr. Roger S.'s Clinical Station.
- Emergency SOS: One-tap urgent distress alert dispatch to hospital emergency command.`,
  },
  {
    id: 'kb-security-architecture',
    title: 'Enterprise Security Architecture, RBAC Matrix & Dual SQL Database',
    category: 'Security & Architecture',
    domain: 'security',
    tags: ['security', 'rbac', 'audit', 'mysql', 'postgresql', 'postgres', 'database', 'encryption', 'hipaa', 'mfa', 'lockdown'],
    content: `MediCore Enterprise Security & Infrastructure Standards:
- Encryption: AES-256-GCM at rest, TLS 1.3 in transit, FIPS 140-3 compliant audit logging.
- Database Engine: Dual PostgreSQL (Port 5432) and MySQL 8.0 (Port 3306, database "medicore_db") persistence with live phpMyAdmin / Web DB Explorer (/database) and automatic resilient fallback.
- Strict Role Isolation: 5 dedicated portals (Super Admin, Hospital Admin & Wards, Doctor, Head Nurse, Patient) enforced at both UI and REST API/AI tool layers.`,
  },
  {
    id: 'kb-sbar-handover',
    title: 'Nursing SBAR Shift Handover & Doctor Order Execution Standard',
    category: 'Nursing Protocol',
    domain: 'triage',
    tags: ['sbar', 'handover', 'shift', 'nursing', 'orders', 'stat', 'nurse', 'situation', 'assessment', 'recommendation'],
    content: `MediCore Structured SBAR Shift Handover Protocol:
- S (Situation): Patient name, bed number, active acute complaint or STAT change.
- B (Background): Primary diagnosis, recent surgeries, allergies, key baseline trends.
- A (Assessment): Latest vital signs, MEWS score, SpO2 trend, physical exam notes.
- R (Recommendation): Pending STAT doctor orders, MAR medications due next shift, physician notification triggers.`,
  },
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'was', 'were',
  'what', 'which', 'who', 'how', 'when', 'where', 'why', 'can', 'could', 'would', 'should',
  'show', 'tell', 'give', 'check', 'get', 'find', 'list', 'please', 'all', 'any', 'about',
  'into', 'your', 'our', 'his', 'her', 'their', 'has', 'had', 'not', 'but', 'only',
]);

const CLINICAL_SYNONYMS: Record<string, string[]> = {
  bp: ['blood', 'pressure', 'hypertension', 'hypotension', 'sbp'],
  sugar: ['glucose', 'hba1c', 'diabetes', 'diabetic'],
  heart: ['cardiac', 'cardiovascular', 'troponin', 'ecg', 'pulse', 'arrhythmia'],
  lungs: ['thoracic', 'pulmonary', 'spo2', 'oxygen', 'respiratory', 'asthma'],
  meds: ['medication', 'prescription', 'pharmacy', 'drug', 'mar'],
  medicine: ['medication', 'prescription', 'pharmacy', 'drug', 'mar'],
  shot: ['vaccine', 'immunization', 'vaccination'],
  food: ['nutrition', 'diet', 'meal', 'sodium', 'calories'],
  money: ['billing', 'invoice', 'payment', 'rupee', 'inr', 'claim'],
  bill: ['billing', 'invoice', 'payment', 'rupee', 'inr', 'claim'],
  room: ['bed', 'ward', 'icu', 'occupancy'],
  db: ['database', 'mysql', 'postgresql', 'audit', 'health'],
  security: ['rbac', 'audit', 'mfa', 'hipaa', 'lockdown', 'privacy'],
  handover: ['sbar', 'shift', 'nurse', 'orders'],
};

function tokenize(text: string): string[] {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9₹/.\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  const expanded = new Set<string>(base);
  for (const token of base) {
    const syns = CLINICAL_SYNONYMS[token];
    if (syns) syns.forEach((s) => expanded.add(s));
  }
  return Array.from(expanded);
}

function getDynamicCatalogDocs(): KnowledgeDoc[] {
  const docs: KnowledgeDoc[] = [];

  if (Array.isArray(fallbackStore.labTests) && fallbackStore.labTests.length > 0) {
    const testLines = fallbackStore.labTests.slice(0, 18).map((t: any) => {
      const name = t.testName || t.test_name || t.name;
      const range = t.normalRange || t.normal_range || 'Normal';
      const unit = t.unit || '';
      const price = Number(t.price || t.cost || 500);
      const tat = Number(t.durationHours || t.duration_hours || 2);
      return `• ${name} [${t.category || 'Lab'}]: Normal ${range} ${unit} | TAT: ${tat}h | Fee: ₹${price}`;
    });
    docs.push({
      id: 'kb-live-lab-catalog',
      title: 'MediCore Live Laboratory Test Directory & INR Fee Schedule',
      category: 'Live Catalog (RAG)',
      domain: 'laboratory',
      tags: ['lab', 'test', 'catalog', 'panel', 'cbc', 'thyroid', 'ct', 'troponin', 'fee', 'price', 'range'],
      content: `Live Diagnostic Assays Available in MediCore Laboratory (${fallbackStore.labTests.length} assays):\n${testLines.join('\n')}`,
    });
  }

  if (Array.isArray(fallbackStore.medicines) && fallbackStore.medicines.length > 0) {
    const medLines = fallbackStore.medicines.map((m: any) => {
      return `• ${m.name} (${m.genericName || 'Formulary'}): ${m.stock} ${m.unit || 'units'} in stock (Min: ${m.minThreshold}) — Status: ${m.status} | ₹${m.unitPrice || 120}`;
    });
    docs.push({
      id: 'kb-live-pharmacy-formulary',
      title: 'Live Hospital Pharmacy Formulary & Stock Thresholds',
      category: 'Live Formulary (RAG)',
      domain: 'pharmacy',
      tags: ['pharmacy', 'medicine', 'stock', 'formulary', 'low', 'inventory', 'drug', 'antibiotic', 'inhaler'],
      content: `Active Pharmacy Inventory Items:\n${medLines.join('\n')}`,
    });
  }

  return docs;
}

export function retrieveHospitalKnowledge(
  query: string,
  portalRole: AiPortalRole,
  activeTab?: string,
  topK: number = 4
): { citations: AiRagCitation[]; contextText: string } {
  const role = normalizePortalRole(portalRole);
  const allowedDomains = new Set<RagDomain>(ROLE_POLICIES[role].allowedRagDomains);

  const queryTokens = tokenize(query);
  const tabTokens = new Set(tokenize(activeTab || ''));

  const candidateDocs = [...STATIC_HOSPITAL_KB, ...getDynamicCatalogDocs()].filter((d) =>
    allowedDomains.has(d.domain)
  );

  const scored = candidateDocs.map((doc) => {
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const tagSet = new Set(doc.tags.map((t) => t.toLowerCase()));

    let score = 0;
    for (const q of queryTokens) {
      if (tagSet.has(q)) score += 4.5;
      if (titleLower.includes(q)) score += 3;
      if (contentLower.includes(q)) score += 1.5;
    }

    // Mild tiebreaker boost from active UI section
    for (const t of tabTokens) {
      if (tagSet.has(t)) score += 0.5;
    }

    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected = scored.filter((s) => s.score >= 2).slice(0, topK);

  const citations: AiRagCitation[] = selected.map(({ doc, score }) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    snippet: doc.content.split('\n').slice(0, 3).join(' ').slice(0, 220) + '...',
    score: Number(score.toFixed(1)),
  }));

  const contextText = selected
    .map(({ doc }) => `--- [SOURCE: ${doc.title} (${doc.category})] ---\n${doc.content}`)
    .join('\n\n');

  return { citations, contextText };
}

export function getKnowledgeBaseStats(): number {
  return STATIC_HOSPITAL_KB.length + getDynamicCatalogDocs().length;
}


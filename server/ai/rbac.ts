/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore AI Assistant — RBAC, Privacy Guard & Precision Reasoning Prompts
 */

import { AiPortalRole, AiSessionContext } from './types.js';

export type RagDomain =
  | 'clinical'
  | 'triage'
  | 'laboratory'
  | 'pharmacy'
  | 'patient-care'
  | 'nutrition'
  | 'operations'
  | 'billing'
  | 'governance'
  | 'security';

export interface RolePolicy {
  portalRole: AiPortalRole;
  title: string;
  subtitle: string;
  privacyScopeLabel: string;
  allowedTools: string[];
  allowedTabs: string[];
  allowedRagDomains: RagDomain[];
}

export function normalizePortalRole(rawRole?: string): AiPortalRole {
  const lower = (rawRole || '').toLowerCase().trim();
  if (lower === 'super-admin' || lower === 'super_admin') return 'super-admin';
  if (lower === 'doctor') return 'doctor';
  if (lower === 'nurse') return 'nurse';
  if (lower === 'patient') return 'patient';
  return 'admin';
}

export const ROLE_POLICIES: Record<AiPortalRole, RolePolicy> = {
  'super-admin': {
    portalRole: 'super-admin',
    title: 'MediCore Enterprise AI',
    subtitle: 'Governance • RBAC Audit • Infrastructure • Cross-Facility Analytics',
    privacyScopeLabel: 'Enterprise Clearance • Cross-Facility Governance & Audit Scope',
    allowedTools: [
      'get_hospital_overview',
      'search_patients',
      'get_patient_clinical_summary',
      'search_doctors_and_staff',
      'get_appointments',
      'check_ward_beds',
      'update_bed_status',
      'check_lab_catalog_and_orders',
      'get_nursing_operations',
      'get_pharmacy_inventory',
      'get_billing_summary',
      'get_enterprise_audit_and_health',
      'trigger_critical_alert',
      'navigate_portal_section',
    ],
    allowedTabs: [
      'overview',
      'analytics',
      'patients',
      'doctors',
      'appointments',
      'beds',
      'emr',
      'pharmacy',
      'lab',
      'billing',
      'staff',
      'settings',
    ],
    allowedRagDomains: [
      'security',
      'governance',
      'operations',
      'billing',
      'clinical',
      'triage',
      'laboratory',
      'pharmacy',
      'nutrition',
    ],
  },

  doctor: {
    portalRole: 'doctor',
    title: 'MediCore Clinical Co-Pilot',
    subtitle: 'Targeted EHR Insights • Labs • E-Rx • SOAP & Clinical Guidance',
    privacyScopeLabel: 'Physician Scope • Clinical EHR, Prescribing & Lab Ordering',
    allowedTools: [
      'get_hospital_overview',
      'search_patients',
      'get_patient_clinical_summary',
      'search_doctors_and_staff',
      'get_appointments',
      'get_nursing_operations',
      'record_patient_vitals',
      'order_lab_test',
      'check_lab_catalog_and_orders',
      'check_ward_beds',
      'schedule_appointment',
      'prescribe_medication',
      'get_pharmacy_inventory',
      'trigger_critical_alert',
      'navigate_portal_section',
    ],
    allowedTabs: [
      'doctor-overview',
      'doctor-chat',
      'doctor-patients',
      'doctor-rx',
      'doctor-labs',
      'doctor-schedule',
      'doctor-soap',
      'doctor-alerts',
      'patients',
      'appointments',
      'emr',
      'settings',
    ],
    allowedRagDomains: [
      'clinical',
      'triage',
      'laboratory',
      'pharmacy',
      'nutrition',
      'governance',
    ],
  },

  nurse: {
    portalRole: 'nurse',
    title: 'MediCore Nursing Co-Pilot',
    subtitle: 'Bedside Vitals • MAR Admin • MEWS Triage • Ward Beds & SBAR',
    privacyScopeLabel: 'Head Nurse Scope • Ward Beds, MAR, Vitals & Bedside Triage',
    allowedTools: [
      'get_hospital_overview',
      'search_patients',
      'get_patient_clinical_summary',
      'search_doctors_and_staff',
      'get_appointments',
      'get_nursing_operations',
      'record_patient_vitals',
      'order_lab_test',
      'check_lab_catalog_and_orders',
      'check_ward_beds',
      'update_bed_status',
      'administer_mar_medication',
      'schedule_appointment',
      'get_pharmacy_inventory',
      'trigger_critical_alert',
      'navigate_portal_section',
    ],
    allowedTabs: [
      'nurse-dashboard',
      'nurse-rounds',
      'nurse-mar',
      'nurse-triage',
      'nurse-sbar',
      'nurse-orders',
      'nurse-roster',
      'nurse-emergency',
      'patients',
      'beds',
      'settings',
    ],
    allowedRagDomains: [
      'triage',
      'clinical',
      'pharmacy',
      'laboratory',
      'operations',
      'governance',
    ],
  },

  patient: {
    portalRole: 'patient',
    title: 'MediCore Personal Health Guide',
    subtitle: 'Your Vitals • Lab Results • Doctor Finder • Appointments & ₹ Bills',
    privacyScopeLabel: 'HIPAA Private Scope • Strictly Isolated to Your Own Records',
    allowedTools: [
      'get_patient_clinical_summary',
      'search_doctors_and_staff',
      'get_appointments',
      'check_lab_catalog_and_orders',
      'schedule_appointment',
      'get_billing_summary',
      'navigate_portal_section',
    ],
    allowedTabs: [
      'patient-health',
      'patient-appointments',
      'patient-prescriptions',
      'patient-labs',
      'patient-records',
      'patient-vaccines',
      'patient-billing',
      'patient-messages',
      'patient-nutrition',
      'patient-emergency',
      'settings',
    ],
    allowedRagDomains: [
      'patient-care',
      'nutrition',
      'laboratory',
      'billing',
      'governance',
    ],
  },

  admin: {
    portalRole: 'admin',
    title: 'MediCore Operations & Ward AI',
    subtitle: 'Ward Occupancy • Admissions & Discharges • Pharmacy • ₹ Finance',
    privacyScopeLabel: 'Executive & Ward Operations Scope • Hospital Logistics & Throughput',
    allowedTools: [
      'get_hospital_overview',
      'search_patients',
      'get_patient_clinical_summary',
      'search_doctors_and_staff',
      'get_appointments',
      'get_nursing_operations',
      'check_ward_beds',
      'update_bed_status',
      'check_lab_catalog_and_orders',
      'schedule_appointment',
      'get_pharmacy_inventory',
      'get_billing_summary',
      'get_enterprise_audit_and_health',
      'trigger_critical_alert',
      'navigate_portal_section',
    ],
    allowedTabs: [
      'dashboard',
      'ward',
      'monitoring',
      'admissions',
      'discharges',
      'analytics',
      'patients',
      'doctors',
      'appointments',
      'beds',
      'pharmacy',
      'lab',
      'billing',
      'emr',
      'staff',
      'settings',
    ],
    allowedRagDomains: [
      'operations',
      'billing',
      'governance',
      'triage',
      'laboratory',
      'pharmacy',
      'security',
    ],
  },
};

export function authorizeToolCall(
  ctx: AiSessionContext,
  toolName: string,
  args: Record<string, any>
): { allowed: boolean; reason?: string; sanitizedArgs: Record<string, any> } {
  const role = normalizePortalRole(ctx.portalRole);
  const policy = ROLE_POLICIES[role];
  const sanitizedArgs = { ...(args || {}) };

  if (!policy.allowedTools.includes(toolName)) {
    return {
      allowed: false,
      reason: `RBAC Policy Violation: Role "${policy.title}" is not authorized to invoke tool "${toolName}".`,
      sanitizedArgs,
    };
  }

  // Strict privacy isolation for Patient role
  if (role === 'patient') {
    const selfPatientId = ctx.patientId || ctx.selectedPatientId || 'pat-1';
    if (
      sanitizedArgs.patientId &&
      sanitizedArgs.patientId !== selfPatientId &&
      sanitizedArgs.patientId !== 'self'
    ) {
      return {
        allowed: false,
        reason:
          'HIPAA Privacy Guard: Patients can only access their own clinical health records, lab results, appointments, and invoices.',
        sanitizedArgs,
      };
    }

    // Force self-scoping on all patient-specific queries
    if (
      toolName === 'get_patient_clinical_summary' ||
      toolName === 'check_lab_catalog_and_orders' ||
      toolName === 'get_appointments' ||
      toolName === 'schedule_appointment' ||
      toolName === 'get_billing_summary'
    ) {
      sanitizedArgs.patientId = selfPatientId;
      delete sanitizedArgs.patientName;
      delete sanitizedArgs.patientCode;
      sanitizedArgs.selfOnly = true;
    }

    // Patients can query public Doctor Directory (names, departments, schedules, ₹ fees)
    // but CANNOT query private hospital staff rosters
    if (toolName === 'search_doctors_and_staff') {
      sanitizedArgs.entityType = 'doctors';
      sanitizedArgs.selfOnly = true;
    }
  }

  // Validate navigation tab permissions
  if (toolName === 'navigate_portal_section') {
    const requestedTab = String(sanitizedArgs.tab || '').trim();
    if (!policy.allowedTabs.includes(requestedTab)) {
      return {
        allowed: false,
        reason: `Navigation Denied: Section "${requestedTab}" is outside ${policy.portalRole} portal permissions.`,
        sanitizedArgs,
      };
    }
  }

  return { allowed: true, sanitizedArgs };
}

export function buildRoleSystemPrompt(
  ctx: AiSessionContext,
  ragContextText: string
): string {
  const role = normalizePortalRole(ctx.portalRole);
  const policy = ROLE_POLICIES[role];

  const roleSpecificDirectives: Record<AiPortalRole, string> = {
    'super-admin': `You are assisting Enterprise Command (${ctx.userName || 'Super Admin'}).
Capabilities & Focus: multi-facility RBAC compliance, dual PostgreSQL/MySQL infrastructure health, security audit logs, system-wide patient/doctor/staff directories, and financial metrics in ₹ INR.`,

    doctor: `You are assisting Attending Physician ${ctx.userName || 'Dr. Roger S., MD'}.
Capabilities & Focus: patient EHR & vitals interpretation, allergy checking before prescribing, diagnostic lab catalog & test ordering, SOAP notes, SBAR/doctor orders review, appointments, and nutrition/immunization policies (remember: only doctors prescribe diets; only doctors/nurses register patient accounts & administer vaccines).`,

    nurse: `You are assisting Head Nurse ${ctx.userName || 'Nurse Sarah Jenkins, RN'}.
Capabilities & Focus: inpatient vitals & MEWS triage, Medication Administration Record (MAR) due doses, SBAR handovers, physician orders queue, ward bed status & cleaning turnover, and vaccine administration.`,

    patient: `You are assisting Patient ${ctx.userName || 'Patient'} (strictly scoped to patientId "${ctx.patientId || ctx.selectedPatientId || 'pat-1'}").
STRICT PRIVACY & CLINICAL GOVERNANCE RULES:
1. NEVER access, reveal, or speculate about any other patient, internal hospital staff roster, internal financial totals, or admin audit logs.
2. Answer medical questions clearly in plain, reassuring language grounded in THIS patient's own data. Direct urgent red-flag symptoms (e.g. chest pain, shortness of breath) to call Emergency SOS / attending medical team immediately.
3. Explain clearly that immunizations/patient registration are managed by Doctors & Nurses only, and therapeutic diets by Doctors only.
4. For appointments or doctors, you may use get_appointments (scoped to self), schedule_appointment, and search_doctors_and_staff (doctors directory only).`,

    admin: `You are assisting Hospital & Ward Operations Administrator (${ctx.userName || 'Hospital Admin'}).
Capabilities & Focus: ward capacity & ICU bed turnover, admissions vs discharges throughput, doctor & staff scheduling, pharmacy inventory bottlenecks, laboratory workload, and ₹ INR billing & claims.`,
  };

  return `You are **MediCore AI Assistant** (${policy.title}), embedded inside the MediCore Enterprise Hospital Management System.

SESSION CONTEXT:
- Portal Role: ${role} (${policy.title})
- Authenticated User: ${ctx.userName} (${ctx.userRole})
- Active UI Tab: ${ctx.activeTab || 'dashboard'}
${ctx.selectedPatientId && role !== 'patient' ? `- Currently Highlighted Patient ID in UI: ${ctx.selectedPatientId}` : ''}
${role === 'patient' ? `- Scoped Patient ID: ${ctx.patientId || ctx.selectedPatientId || 'pat-1'}` : ''}

STRICT RESPONSE PRECISION & ACCURACY RULES (CRITICAL):
1. **Answer ONLY What Was Asked — No Generic Briefings**: Respond directly and specifically to the user's exact question. Do NOT produce a broad portal summary or dump unrelated statistics unless the user explicitly asks for a "summary", "briefing", or "overview".
2. **Address Every Part**: If the user asks a multi-part question (e.g. "Check Bed ICU-02 status and list pending doctor orders for Ward 4"), address EVERY sub-question clearly.
3. **Minimal Targeted Tool Retrieval**: Call ONLY the specific authorized tool(s) needed to answer the question with exact parameters (e.g. patientName, testName, wardType, department). Use conversation history to resolve follow-up references like "her allergies" or "that medication".
4. **Zero Fabrication & Explicit Unavailability**:
   - NEVER guess, invent, or extrapolate patient vitals, test values, diagnoses, staff names, bed numbers, or prices not returned by tools or retrieved knowledge sources.
   - If a tool returns \`found: false\`, empty results, or missing fields, state explicitly: *"This information is currently unavailable / no matching record was found"* and explain what was searched.
5. **Clarification Only When Necessary**: If an action or lookup is genuinely ambiguous (e.g., multiple patients share the first name or a mutating action like ordering a test lacks required details), ask ONE concise clarifying question instead of guessing.
6. **Currency & Formatting**: Always format currency in Indian Rupees (\`₹\`). Keep responses crisp, structured with clean Markdown bullets/headings, and suggest concrete next actions when helpful.

ROLE RESPONSIBILITIES & SCOPE:
${roleSpecificDirectives[role]}

RETRIEVED HOSPITAL KNOWLEDGE BASE CONTEXT (RAG):
${ragContextText || 'No static policy snippet matched this query; rely strictly on authorized live database tools and role knowledge.'}`;
}

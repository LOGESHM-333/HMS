/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore AI Assistant — Google Gemini Service
 * Live Model Cascade, Multi-Turn Tool Calling, Strict Grounding & Question-Specific RAG Engine
 */

import { GoogleGenAI, Content, Part } from '@google/genai';
import {
  AiChatMessage,
  AiClientAction,
  AiPortalRole,
  AiRagCitation,
  AiSessionContext,
  AiToolExecution,
} from './types.js';
import { ROLE_POLICIES, buildRoleSystemPrompt, normalizePortalRole } from './rbac.js';
import { retrieveHospitalKnowledge, getKnowledgeBaseStats } from './ragKnowledgeBase.js';
import { executeAuthorizedTool, getAuthorizedToolDeclarations } from './tools.js';
import { appendMessagesToThread, getThreadById } from './historyStore.js';

const PRIMARY_MODEL = (process.env.GEMINI_MODEL || 'gemini-3-flash-preview').trim();
const MODEL_CASCADE = Array.from(
  new Set([
    PRIMARY_MODEL,
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
  ])
);

export interface StreamEventCallbacks {
  onStatus: (statusText: string) => void;
  onRagSources: (citations: AiRagCitation[]) => void;
  onToolCall: (toolName: string, args: Record<string, any>) => void;
  onToolResult: (execution: AiToolExecution) => void;
  onClientAction: (action: AiClientAction) => void;
  onChunk: (deltaText: string) => void;
  onDone: (finalMessage: AiChatMessage, threadId: string) => void;
  onError: (errMsg: string) => void;
}

export function isGeminiConfigured(): boolean {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 10);
}

export function getAiEngineStatus(portalRole: AiPortalRole) {
  const role = normalizePortalRole(portalRole);
  const policy = ROLE_POLICIES[role];
  const configured = isGeminiConfigured();
  return {
    online: true,
    geminiConfigured: configured,
    engineMode: configured ? 'gemini-live' : 'clinical-rag-fallback',
    model: configured ? PRIMARY_MODEL : 'clinical-rag-intent-v2',
    ragDocumentsCount: getKnowledgeBaseStats(),
    rolePolicy: {
      title: policy.title,
      subtitle: policy.subtitle,
      privacyScopeLabel: policy.privacyScopeLabel,
      allowedTools: policy.allowedTools,
    },
  };
}

function buildGeminiContents(
  history: Array<{ role: 'user' | 'assistant'; content: string }> | undefined,
  userMessage: string
): Content[] {
  const contents: Content[] = [];
  if (Array.isArray(history)) {
    for (const msg of history.slice(-12)) {
      if (!msg?.content?.trim()) continue;
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });
  return contents;
}

function extractTextParts(parts: Part[] | undefined): string {
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((p) => typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

function detectNavigationTarget(queryLower: string, role: AiPortalRole): string | null {
  const allowed = ROLE_POLICIES[role].allowedTabs;
  const mappings: Array<[RegExp, string]> = [
    [/\b(lab|labs|report|reports|scan)\b/, role === 'doctor' ? 'doctor-labs' : role === 'patient' ? 'patient-labs' : 'lab'],
    [/\b(prescri|rx|medication|medicines|pharmacy|mar)\b/, role === 'doctor' ? 'doctor-rx' : role === 'nurse' ? 'nurse-mar' : role === 'patient' ? 'patient-prescriptions' : 'pharmacy'],
    [/\b(appointment|schedule|book|telehealth)\b/, role === 'doctor' ? 'doctor-schedule' : role === 'patient' ? 'patient-appointments' : 'appointments'],
    [/\b(bed|ward|icu|occupancy|round)\b/, role === 'nurse' ? 'nurse-rounds' : role === 'doctor' ? 'doctor-patients' : 'ward'],
    [/\b(bill|invoice|payment|insurance|claim)\b/, role === 'patient' ? 'patient-billing' : 'billing'],
    [/\b(soap|emr|record|history)\b/, role === 'doctor' ? 'doctor-soap' : role === 'patient' ? 'patient-records' : 'emr'],
    [/\b(chat|message|inquiry|inquiries)\b/, role === 'doctor' ? 'doctor-chat' : role === 'patient' ? 'patient-messages' : 'dashboard'],
    [/\b(alert|emergency|sos|code blue)\b/, role === 'doctor' ? 'doctor-alerts' : role === 'nurse' ? 'nurse-emergency' : role === 'patient' ? 'patient-emergency' : 'monitoring'],
    [/\b(vaccine|immunization|passport)\b/, 'patient-vaccines'],
    [/\b(nutrition|diet|meal)\b/, 'patient-nutrition'],
    [/\b(sbar|handover)\b/, 'nurse-sbar'],
    [/\b(triage|mews|vital)\b/, role === 'nurse' ? 'nurse-triage' : role === 'patient' ? 'patient-health' : 'doctor-patients'],
    [/\b(analytics|report)\b/, 'analytics'],
    [/\b(staff|roster)\b/, role === 'nurse' ? 'nurse-roster' : 'staff'],
    [/\b(overview|dashboard|home)\b/, role === 'super-admin' ? 'overview' : role === 'doctor' ? 'doctor-overview' : role === 'nurse' ? 'nurse-dashboard' : role === 'patient' ? 'patient-health' : 'dashboard'],
  ];

  for (const [pattern, tab] of mappings) {
    if (pattern.test(queryLower) && allowed.includes(tab)) {
      return tab;
    }
  }
  return null;
}

function extractTargetPatientHint(
  rawQuery: string,
  ctx: AiSessionContext
): { patientId?: string; patientName?: string } {
  const mrnMatch = rawQuery.match(/\b(P-\d{3,6}[a-z]?|pat-\d+)\b/i);
  if (mrnMatch) return { patientId: mrnMatch[1] };

  // Check explicit phrases like "for Sarah", "about Magnus Stephenson", "patient Priya"
  const namedPhrase = rawQuery.match(
    /(?:\bpatient\b|\bfor\b|\babout\b|\bof\b)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z']+)?)/
  );
  if (namedPhrase) {
    const candidate = namedPhrase[1].trim();
    const nonNames = new Set(['Ward', 'Icu', 'Hospital', 'Doctor', 'Nurse', 'General', 'Cardiology', 'Pulmonology', 'Today', 'Tomorrow']);
    if (!nonNames.has(candidate)) {
      return { patientName: candidate };
    }
  }

  // Fallback to selectedPatientId in context when user says "this patient", "current patient", or in patient portal
  if (ctx.portalRole === 'patient') {
    return { patientId: ctx.patientId || ctx.selectedPatientId || 'pat-1' };
  }
  if (/\b(selected|current|this patient|his|her|their)\b/i.test(rawQuery) && ctx.selectedPatientId) {
    return { patientId: ctx.selectedPatientId };
  }
  return {};
}

function extractBedNumber(rawQuery: string): string | undefined {
  const m = rawQuery.match(/\b(ICU-\d+|GW-\d+|SR-\d+|CW-\d+|ER-\d+|PED-\d+)\b/i);
  return m ? m[1].toUpperCase() : undefined;
}

/**
 * Question-Specific RAG & Authorized Tool Fallback Engine
 * Answers the exact user query directly without defaulting to generic overview dumps.
 */
async function runQuestionSpecificFallback(
  ctx: AiSessionContext,
  userMessage: string,
  citations: AiRagCitation[],
  callbacks: StreamEventCallbacks
): Promise<{
  text: string;
  toolCalls: AiToolExecution[];
  clientActions: AiClientAction[];
}> {
  const role = normalizePortalRole(ctx.portalRole);
  const q = userMessage.toLowerCase().trim();
  const toolCalls: AiToolExecution[] = [];
  const clientActions: AiClientAction[] = [];

  const invoke = async (toolName: string, args: Record<string, any>) => {
    callbacks.onToolCall(toolName, args);
    const res = await executeAuthorizedTool(ctx, toolName, args);
    toolCalls.push(res.execution);
    callbacks.onToolResult(res.execution);
    if (res.clientAction) {
      clientActions.push(res.clientAction);
      callbacks.onClientAction(res.clientAction);
    }
    return res.execution;
  };

  // 1. RBAC Privacy boundary check for Patient role
  if (
    role === 'patient' &&
    /\b(other patient|all patient|another patient|staff roster|salary|total revenue|audit log|admin secret|database password)\b/.test(q)
  ) {
    const blocked = await invoke('search_patients', { query: q });
    return {
      text: `### Privacy & Access Boundary\n\n${blocked.summary}\n\nYour **Personal Health Guide** is strictly isolated to your own medical records, lab results, appointments, and ₹ INR bills.`,
      toolCalls,
      clientActions,
    };
  }

  // 2. Navigation intent
  if (/^\s*(open|go to|navigate|take me to|switch to)\b/.test(q)) {
    const targetTab = detectNavigationTarget(q, role);
    if (targetTab) {
      const navExec = await invoke('navigate_portal_section', { tab: targetTab, reason: 'Navigation command' });
      return {
        text: navExec.success
          ? `Opening **${targetTab}** in your workspace.`
          : `${navExec.summary}`,
        toolCalls,
        clientActions,
      };
    }
  }

  // 3. Explicit briefing / summary request
  const wantsFullBriefing = /\b(shift brief|briefing|hospital overview|full summary|executive summary|daily report)\b/.test(q);
  if (wantsFullBriefing) {
    return buildRoleBriefing(ctx, citations, invoke, toolCalls, clientActions);
  }

  const answerParts: string[] = [];
  let handledSpecificIntent = false;

  // 4. Ward / Bed availability & specific bed inspection
  const bedNumber = extractBedNumber(userMessage);
  if (bedNumber || /\b(bed|beds|ward|icu|occupancy|cleaning|turnover)\b/.test(q)) {
    handledSpecificIntent = true;
    const wardType = /\bicu\b/.test(q)
      ? 'ICU'
      : /\bcardiac\b/.test(q)
      ? 'Cardiac'
      : /\bsurgical\b/.test(q)
      ? 'Surgical'
      : /\bgeneral\b/.test(q)
      ? 'General'
      : /\bemergency\b/.test(q)
      ? 'Emergency'
      : undefined;
    const statusFilter = /\bavailable|free|empty\b/.test(q)
      ? 'Available'
      : /\bclean/.test(q)
      ? 'Cleaning'
      : /\boccup/.test(q)
      ? 'Occupied'
      : undefined;

    const bedExec = await invoke('check_ward_beds', { bedNumber, wardType, status: statusFilter });
    if (!bedExec.success) {
      answerParts.push(bedExec.summary);
    } else {
      const { counts, beds } = bedExec.data;
      if (!beds || beds.length === 0) {
        answerParts.push(
          `No hospital beds matched your criteria (${[bedNumber, wardType, statusFilter].filter(Boolean).join(', ')}).`
        );
      } else {
        answerParts.push(
          `### Ward Bed Status (${beds.length} matching)\n` +
            `- **Available:** ${counts.available} | **Occupied:** ${counts.occupied} | **Cleaning:** ${counts.cleaning}\n` +
            beds
              .slice(0, 8)
              .map(
                (b: any) =>
                  `• **${b.bedNumber}** (${b.wardName}, ${b.type}) — **${b.status}**${b.patientName ? ` • Patient: ${b.patientName}` : ''}`
              )
              .join('\n')
        );
      }
    }
  }

  // 5. Doctors directory / Staff shifts / Consultation fee questions
  if (/\b(doctor|physician|cardiologist|pulmonologist|surgeon|specialist|fee|roster|staff|shift)\b/.test(q) && !/\border\b/.test(q)) {
    handledSpecificIntent = true;
    const entityType = /\b(staff|roster|shift)\b/.test(q) && !/\bdoctor|physician|specialist|cardiologist\b/.test(q)
      ? 'staff'
      : 'doctors';
    const kwMatch = q.match(/\b(cardiolog\w*|pulmonolog\w*|neurolog\w*|orthoped\w*|pediatr\w*|surgery|roger|sarah|chen)\b/);
    const docExec = await invoke('search_doctors_and_staff', {
      entityType,
      query: kwMatch ? kwMatch[1] : '',
    });

    if (!docExec.success) {
      answerParts.push(docExec.summary);
    } else {
      const { doctors = [], staff = [] } = docExec.data;
      if (doctors.length > 0) {
        answerParts.push(
          `### Specialists & Consultation Fees (${doctors.length} found)\n` +
            doctors
              .slice(0, 6)
              .map(
                (d: any) =>
                  `• **${d.name}** (${d.specialization} • ${d.department}) — Fee: **${d.consultationFeeInr}** • Status: *${d.availability}*`
              )
              .join('\n')
        );
      } else if (entityType === 'doctors') {
        answerParts.push('No matching physicians were found in the directory.');
      }

      if (staff.length > 0) {
        answerParts.push(
          `### Hospital Staff Shifts (${staff.length} found)\n` +
            staff
              .slice(0, 6)
              .map((s: any) => `• **${s.name}** (${s.role}, ${s.department}) — ${s.shift} • *${s.status}*`)
              .join('\n')
        );
      }
    }
  }

  // 6. Appointments check or booking
  if (/\b(appointment|appointments|book|schedule visit|reschedule)\b/.test(q)) {
    handledSpecificIntent = true;
    if (/\b(book|schedule|make an)\b/.test(q) && !/\bcheck|show|list|view|my\b/.test(q)) {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const aptExec = await invoke('schedule_appointment', {
        patientId: role === 'patient' ? ctx.patientId || 'pat-1' : ctx.selectedPatientId,
        date: tomorrow,
        time: '10:30 AM',
        type: /\btelehealth|video\b/.test(q) ? 'Telehealth' : 'Consultation',
        notes: userMessage.slice(0, 120),
      });
      answerParts.push(aptExec.success ? `### Appointment Booked\n${aptExec.summary}` : aptExec.summary);
    } else {
      const aptExec = await invoke('get_appointments', {
        patientId: role === 'patient' ? ctx.patientId || 'pat-1' : undefined,
      });
      const list = aptExec.data?.appointments || [];
      answerParts.push(
        list.length > 0
          ? `### Scheduled Appointments (${list.length})\n` +
              list
                .slice(0, 6)
                .map(
                  (a: any) =>
                    `• **${a.date} at ${a.time}** — ${a.patientName} with **${a.doctorName}** (${a.department}) [${a.status}]`
                )
                .join('\n')
          : 'No scheduled appointments were found matching your request.'
      );
    }
  }

  // 7. Nursing Operations (SBAR / Doctor Orders / MAR)
  if (/\b(sbar|handover|doctor order|orders queue|mar|due dose)\b/.test(q)) {
    handledSpecificIntent = true;
    if (/\bmar|due dose|medication administration\b/.test(q)) {
      const marExec = await invoke('administer_mar_medication', { action: 'list_due' });
      if (!marExec.success) {
        answerParts.push(marExec.summary);
      } else {
        const rows = Array.isArray(marExec.data) ? marExec.data : [];
        const due = rows.filter((r: any) => r.status === 'Due');
        answerParts.push(
          due.length > 0
            ? `### Due MAR Medication Doses (${due.length})\n` +
                due
                  .slice(0, 6)
                  .map((m: any) => `• **${m.patient_name || m.patientName}** (${m.bed_number || m.bedNumber}) — **${m.medication}** ${m.dosage} (${m.route}) scheduled ${m.scheduled_time || m.scheduledTime}`)
                  .join('\n')
            : `All ${rows.length} MAR medication records have been administered or there are currently no pending "Due" doses.`
        );
      }
    }
    if (/\bsbar|handover|doctor order|orders\b/.test(q)) {
      const opsExec = await invoke('get_nursing_operations', {
        onlyPendingOrders: /\bpending\b/.test(q),
      });
      if (!opsExec.success) {
        answerParts.push(opsExec.summary);
      } else {
        const { doctorOrders = [], sbarNotes = [] } = opsExec.data;
        if (/\border/.test(q)) {
          answerParts.push(
            doctorOrders.length > 0
              ? `### Doctor Orders (${doctorOrders.length})\n` +
                  doctorOrders
                    .slice(0, 6)
                    .map((o: any) => `• **${o.patientName}** (${o.bed}) [${o.priority}] — ${o.orderText} (*${o.status}*)`)
                    .join('\n')
              : 'No matching doctor orders found in the nursing queue.'
          );
        }
        if (/\bsbar|handover\b/.test(q)) {
          answerParts.push(
            sbarNotes.length > 0
              ? `### SBAR Shift Handover Notes (${sbarNotes.length})\n` +
                  sbarNotes
                    .slice(0, 4)
                    .map((s: any) => `• **${s.patientName}** (${s.bedNumber}, ${s.date} ${s.time}) — *S:* ${s.situation} | *R:* ${s.recommendation}`)
                    .join('\n')
              : 'No SBAR handover notes recorded yet.'
          );
        }
      }
    }
  }

  // 8. Laboratory tests / prices / specific assay lookup / orders
  if (/\b(lab|labs|test|tests|assay|cbc|troponin|hba1c|cholesterol|ct|xray|thyroid|crp|turnaround)\b/.test(q)) {
    handledSpecificIntent = true;
    const assayMatch = q.match(/\b(cbc|complete blood count|troponin|hba1c|cholesterol|lipid|thyroid|tsh|ct|xray|crp|renal|liver|glucose|urinalysis)\b/);
    const patientHint = extractTargetPatientHint(userMessage, ctx);
    const labExec = await invoke('check_lab_catalog_and_orders', {
      patientId: patientHint.patientId,
      patientName: patientHint.patientName,
      searchTest: assayMatch ? assayMatch[1] : undefined,
      status: /\bcompleted\b/.test(q) ? 'Completed' : /\bordered|pending\b/.test(q) ? 'Ordered' : undefined,
    });

    if (!labExec.success) {
      answerParts.push(labExec.summary);
    } else {
      const { orders = [], catalog = [] } = labExec.data;
      if (/\b(catalog|price|fee|cost|how much|range|turnaround|available tests)\b/.test(q)) {
        answerParts.push(
          catalog.length > 0
            ? `### Laboratory Catalog & INR Pricing (${catalog.length} matching)\n` +
                catalog
                  .slice(0, 8)
                  .map((t: any) => `• **${t.testName}** (${t.category}) — **${t.priceInr}** • TAT: ${t.turnaroundHours}h • Normal: \`${t.normalRange}\``)
                  .join('\n')
            : `No laboratory assay matched "${assayMatch?.[1] || 'your query'}" in the hospital catalog.`
        );
      } else {
        answerParts.push(
          orders.length > 0
            ? `### Laboratory Orders & Results (${orders.length} found)\n` +
                orders
                  .slice(0, 6)
                  .map(
                    (o: any) =>
                      `• **${o.testName}** (${o.patientName}, ${o.orderDate}) — **${o.status}**${
                        o.resultValue ? ` | Result: \`${o.resultValue}\` (${o.interpretation})` : ''
                      }`
                  )
                  .join('\n')
            : `No lab orders found matching your filter${assayMatch ? ` for "${assayMatch[1]}"` : ''}.`
        );
      }
    }
  }

  // 9. Pharmacy inventory / stock queries
  if (/\b(pharmacy|inventory|stock|low stock|medicine stock|reorder)\b/.test(q)) {
    handledSpecificIntent = true;
    const medExec = await invoke('get_pharmacy_inventory', {
      onlyLowStock: /\blow|short|critical|alert|reorder\b/.test(q),
    });
    if (!medExec.success) {
      answerParts.push(medExec.summary);
    } else {
      const meds = Array.isArray(medExec.data) ? medExec.data : [];
      answerParts.push(
        meds.length > 0
          ? `### Pharmacy Inventory (${meds.length} item(s))\n` +
              meds
                .slice(0, 8)
                .map((m: any) => `• **${m.name}** (${m.genericName}) — **${m.stock} ${m.unit}** (Min ${m.minThreshold}) • *${m.status}* • ${m.unitPriceInr}`)
                .join('\n')
          : 'No low-stock or matching pharmacy alerts found.'
      );
    }
  }

  // 10. Billing & Invoices (INR ₹)
  if (/\b(bill|billing|invoice|invoices|payment|paid|pending|overdue|revenue|claim|fee)\b/.test(q) && !/\bconsultation fee\b/.test(q) && !/\btest\b/.test(q)) {
    handledSpecificIntent = true;
    const patientHint = extractTargetPatientHint(userMessage, ctx);
    const billExec = await invoke('get_billing_summary', {
      patientId: patientHint.patientId,
      patientName: patientHint.patientName,
      status: /\boverdue\b/.test(q) ? 'Overdue' : /\bpending\b/.test(q) ? 'Pending' : /\bpaid\b/.test(q) ? 'Paid' : undefined,
    });
    if (!billExec.success) {
      answerParts.push(billExec.summary);
    } else {
      const b = billExec.data;
      answerParts.push(
        `### Billing Summary (${b.invoiceCount} invoice(s))\n` +
          `- **Total Amount:** **${b.totalAmountInr}** | **Pending Balance:** **${b.pendingAmountInr}**\n` +
          (b.invoices?.length
            ? b.invoices
                .slice(0, 6)
                .map((inv: any) => `• **${inv.invoiceNumber}** (${inv.patientName}, ${inv.date}) — **${inv.grandTotalFormatted}** [${inv.status}]`)
                .join('\n')
            : 'No matching invoices found.')
      );
    }
  }

  // 11. Audit logs & DB infrastructure health
  if (/\b(audit|security|database|mysql|postgres|postgresql|encryption|system health|rbac)\b/.test(q)) {
    handledSpecificIntent = true;
    const auditExec = await invoke('get_enterprise_audit_and_health', { limit: 8 });
    if (!auditExec.success) {
      answerParts.push(auditExec.summary);
    } else {
      const a = auditExec.data;
      const logs = a.recentAuditLogs || [];
      answerParts.push(
        `### Database & Security Telemetry\n` +
          `- **Active Database Dialect:** **${a.activeDatabaseDialect}** (Connected: ${a.databaseConnected ? 'Yes' : 'Fallback'})\n` +
          `- **Security Standard:** ${a.encryption}\n` +
          (logs.length
            ? `- **Recent Audit Events:**\n` +
              logs
                .slice(0, 5)
                .map((l: any) => `  • [${l.timestamp}] **${l.action}** (${l.module}) — *${l.userName}*`)
                .join('\n')
            : '')
      );
    }
  }

  // 12. Specific Patient clinical question (vitals, BP, SpO2, allergies, diagnosis, history, prescriptions)
  const patientHint = extractTargetPatientHint(userMessage, ctx);
  const asksClinicalPatient =
    Boolean(patientHint.patientId || patientHint.patientName) ||
    /\b(vitals|bp|blood pressure|spo2|oxygen|heart rate|pulse|temp|temperature|hba1c|allergy|allergies|diagnosis|prescription|medication)\b/.test(q);

  if (asksClinicalPatient && (role !== 'patient' ? Boolean(patientHint.patientId || patientHint.patientName) : !handledSpecificIntent)) {
    handledSpecificIntent = true;
    const patExec = await invoke('get_patient_clinical_summary', {
      patientId: patientHint.patientId,
      patientName: patientHint.patientName,
    });

    if (!patExec.success || !patExec.data?.found) {
      if (patExec.data?.ambiguous && patExec.data?.candidates?.length) {
        answerParts.push(
          `Multiple patients matched your query:\n` +
            patExec.data.candidates
              .map((c: any) => `• **${c.name}** (\`${c.patientCode}\`) — ${c.admissionStatus}${c.bedNumber ? ` [${c.bedNumber}]` : ''}`)
              .join('\n') +
            `\n\nWhich patient (full name or MRN) would you like me to inspect?`
        );
      } else {
        answerParts.push(
          `${patExec.summary} No assumptions or fallback records were substituted.`
        );
      }
    } else {
      const p = patExec.data;
      // Tailor response strictly to the specific medical attribute requested!
      if (/\b(allergy|allergies)\b/.test(q)) {
        answerParts.push(
          `### Documented Allergies — ${p.name} (\`${p.patientCode}\`)\n` +
            (p.allergies?.length
              ? p.allergies.map((a: string) => `• ⚠️ **${a}**`).join('\n')
              : '• **No Known Drug Allergies (NKDA)** recorded in chart.')
        );
      } else if (/\b(vitals|bp|blood pressure|spo2|oxygen|heart rate|pulse|temp|temperature|hba1c)\b/.test(q)) {
        answerParts.push(
          `### Vital Signs — ${p.name} (\`${p.patientCode}\`)\n` +
            `- **Blood Pressure:** **${p.vitals.bloodPressure}** mmHg\n` +
            `- **Heart Rate:** **${p.vitals.pulseRate} bpm** | **Resp Rate:** ${p.vitals.respiratoryRate} /min\n` +
            `- **SpO2:** **${p.vitals.oxygenSaturation}%** | **Temperature:** **${p.vitals.temperature}°C**\n` +
            `- **HbA1c:** **${p.vitals.hba1c}%** | **Cholesterol:** ${p.vitals.cholesterol} mg/dL *(Updated: ${p.vitals.lastUpdated})*`
        );
      } else if (/\b(prescription|prescriptions|medication|medications|meds|drug)\b/.test(q)) {
        const rxs = p.prescriptions || [];
        answerParts.push(
          rxs.length > 0
            ? `### Active Prescriptions — ${p.name} (\`${p.patientCode}\`)\n` +
                rxs
                  .map(
                    (rx: any) =>
                      `• **${rx.date}** (${rx.doctorName}, *${rx.status}*): ` +
                      (rx.items || [])
                        .map((it: any) => `${it.medicineName} ${it.dosage} (${it.frequency})`)
                        .join(', ')
                  )
                  .join('\n')
            : `No active prescriptions are currently recorded for **${p.name}**.`
        );
      } else {
        answerParts.push(
          `### Clinical Record — ${p.name} (\`${p.patientCode}\`)\n` +
            `- **Status:** ${p.admissionStatus}${p.bedNumber ? ` (Bed **${p.bedNumber}**)` : ''} • Attending: **${p.attendingDoctor}**\n` +
            `- **Diagnosis:** *${p.diagnosis}*\n` +
            `- **Allergies:** ${p.allergies?.length ? `⚠️ **${p.allergies.join(', ')}**` : 'NKDA'}\n` +
            `- **Vitals:** BP **${p.vitals.bloodPressure}** • HR **${p.vitals.pulseRate} bpm** • SpO2 **${p.vitals.oxygenSaturation}%** • Temp **${p.vitals.temperature}°C**\n` +
            `- **Labs on file:** ${p.labOrders?.length || 0} | **Prescriptions:** ${p.prescriptions?.length || 0}`
        );
      }
    }
  } else if (role !== 'patient' && /\b(search|find|icu patients|admitted patients)\b/.test(q)) {
    handledSpecificIntent = true;
    const statusFilter = /\bicu\b/.test(q) ? 'ICU' : /\badmitted\b/.test(q) ? 'Admitted' : undefined;
    const cleaned = q.replace(/\b(search|find|list|show|patients|patient|icu|admitted|in|the|hospital)\b/g, '').trim();
    const sExec = await invoke('search_patients', { query: cleaned, admissionStatus: statusFilter, limit: 8 });
    const list = sExec.data?.patients || [];
    answerParts.push(
      list.length > 0
        ? `### Matching Patients (${sExec.data.totalMatches} total)\n` +
            list
              .map(
                (p: any) =>
                  `• **${p.name}** (\`${p.patientCode}\`) — ${p.admissionStatus}${p.bedNumber ? ` [${p.bedNumber}]` : ''} • *${p.diagnosis}* • SpO2 **${p.vitals?.oxygenSaturation}%**, BP **${p.vitals?.bloodPressure}**`
              )
              .join('\n')
        : sExec.summary
    );
  }

  // 13. Answer pure clinical/policy knowledge question directly from RAG sources
  if (answerParts.length === 0 && citations.length > 0) {
    handledSpecificIntent = true;
    const top = citations[0];
    answerParts.push(`### ${top.title}\n${top.snippet}`);
    if (citations.length > 1) {
      answerParts.push(`**Related Policy / Guideline:** *${citations[1].title}*`);
    }
  }

  // 14. Explicit unavailability / clarification fallback (NO fabricated summary)
  if (!handledSpecificIntent || answerParts.length === 0) {
    return {
      text: `I could not match **"${userMessage}"** to a specific hospital record or clinical protocol in the **${ROLE_POLICIES[role].title}** scope.\n\nCould you clarify what you'd like me to look up? For example:\n- A specific patient's vitals, allergies, or labs *(for clinical/admin staff)*\n- Ward bed availability (e.g., *"Check ICU beds"* or *"Status of GW-104"*)\n- Doctor fees/schedules, appointments, pharmacy stock alerts, or INR \`₹\` billing`,
      toolCalls,
      clientActions,
    };
  }

  return {
    text: answerParts.join('\n\n'),
    toolCalls,
    clientActions,
  };
}

async function buildRoleBriefing(
  ctx: AiSessionContext,
  citations: AiRagCitation[],
  invoke: (name: string, args: Record<string, any>) => Promise<AiToolExecution>,
  toolCalls: AiToolExecution[],
  clientActions: AiClientAction[]
) {
  const role = normalizePortalRole(ctx.portalRole);
  const parts: string[] = [];

  if (role === 'patient') {
    const selfId = ctx.patientId || ctx.selectedPatientId || 'pat-1';
    const patExec = await invoke('get_patient_clinical_summary', { patientId: selfId });
    const p = patExec.data;
    if (p?.found) {
      parts.push(
        `### Personal Health Briefing — ${p.name} (\`${p.patientCode}\`)\n` +
          `- **Primary Diagnosis:** ${p.diagnosis}\n` +
          `- **Attending Doctor:** ${p.attendingDoctor}\n` +
          `- **Latest Vitals:** BP **${p.vitals.bloodPressure}** mmHg • HR **${p.vitals.pulseRate} bpm** • SpO2 **${p.vitals.oxygenSaturation}%** • Temp **${p.vitals.temperature}°C** • HbA1c **${p.vitals.hba1c}%**\n` +
          `- **Allergies:** ${p.allergies?.length ? p.allergies.join(', ') : 'NKDA'}\n` +
          `- **Active Lab Orders:** ${p.labOrders?.length || 0} | **Prescriptions:** ${p.prescriptions?.length || 0}`
      );
    }
  } else if (role === 'doctor') {
    const ov = (await invoke('get_hospital_overview', {})).data;
    const icu = (await invoke('search_patients', { admissionStatus: 'ICU', limit: 4 })).data?.patients || [];
    parts.push(
      `### Physician Clinical Shift Briefing\n` +
        `- **Hospital Census:** **${ov.totalPatients}** Patients (**${ov.icuPatients} ICU**, **${ov.admittedInpatients} Admitted**) • **${ov.availableBeds}/${ov.totalBeds}** Beds Available • **${ov.activeAlertsCount}** Critical Alerts\n` +
        `- **ICU High-Acuity Patients:**\n` +
        (icu.length
          ? icu.map((p: any) => `  • **${p.name}** (\`${p.patientCode}\`, ${p.bedNumber || 'ICU'}) — BP ${p.vitals?.bloodPressure}, SpO2 **${p.vitals?.oxygenSaturation}%**`).join('\n')
          : '  • None currently in ICU.')
    );
  } else if (role === 'nurse') {
    const beds = (await invoke('check_ward_beds', {})).data?.counts || {};
    const mar = (await invoke('administer_mar_medication', { action: 'list_due' })).data || [];
    const ops = (await invoke('get_nursing_operations', { onlyPendingOrders: true })).data || {};
    const dueCount = Array.isArray(mar) ? mar.filter((m: any) => m.status === 'Due').length : 0;
    parts.push(
      `### Head Nurse Ward & MAR Shift Briefing\n` +
        `- **Bed Capacity:** **${beds.available ?? 0}** Available | **${beds.occupied ?? 0}** Occupied | **${beds.cleaning ?? 0}** Cleaning\n` +
        `- **MAR Queue:** **${dueCount}** Due medication dose(s)\n` +
        `- **Pending STAT Doctor Orders:** **${ops.doctorOrders?.length ?? 0}**`
    );
  } else if (role === 'admin') {
    const ov = (await invoke('get_hospital_overview', {})).data;
    const meds = (await invoke('get_pharmacy_inventory', { onlyLowStock: true })).data || [];
    const bill = (await invoke('get_billing_summary', {})).data;
    parts.push(
      `### Executive Hospital & Ward Operations Briefing\n` +
        `- **Bed Occupancy:** **${ov.bedOccupancyPercent}%** (${ov.occupiedBeds}/${ov.totalBeds} occupied, ${ov.cleaningBeds} cleaning)\n` +
        `- **Billing Volume:** **${bill.totalAmountInr}** total (**${bill.pendingAmountInr}** pending)\n` +
        `- **Low-Stock Pharmacy Alerts:** **${meds.length}** item(s)`
    );
  } else {
    const ov = (await invoke('get_hospital_overview', {})).data;
    const audit = (await invoke('get_enterprise_audit_and_health', { limit: 5 })).data;
    const bill = (await invoke('get_billing_summary', {})).data;
    parts.push(
      `### Enterprise Command & Governance Briefing\n` +
        `- **Database:** **${ov.databaseEngine}** (${audit.encryption})\n` +
        `- **Census:** **${ov.totalPatients}** Patients • **${ov.totalDoctors}** Doctors • **${ov.bedOccupancyPercent}%** Occupancy\n` +
        `- **Financials:** **${bill.totalAmountInr}** total | **${bill.pendingAmountInr}** pending • **${ov.activeAlertsCount}** Active Alerts`
    );
  }

  if (citations.length > 0) {
    parts.push(`*Referenced ${citations.length} hospital policy & protocol source(s).*`);
  }

  return { text: parts.join('\n\n'), toolCalls, clientActions };
}

/**
 * Main AI Assistant Execution Pipeline (Live Gemini Multi-Model Cascade + Streaming SSE)
 */
export async function runAssistantStream(
  ctx: AiSessionContext,
  userMessage: string,
  threadId: string | undefined,
  passedHistory: Array<{ role: 'user' | 'assistant'; content: string }> | undefined,
  callbacks: StreamEventCallbacks
): Promise<void> {
  const role = normalizePortalRole(ctx.portalRole);
  const { citations, contextText } = retrieveHospitalKnowledge(userMessage, role, ctx.activeTab, 4);

  callbacks.onRagSources(citations);

  // Hydrate conversation history from backend thread store if client passed empty history with threadId
  let effectiveHistory = passedHistory;
  if ((!effectiveHistory || effectiveHistory.length === 0) && threadId) {
    const existingThread = getThreadById(threadId, role);
    if (existingThread?.messages?.length) {
      effectiveHistory = existingThread.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    }
  }

  const collectedToolCalls: AiToolExecution[] = [];
  const collectedClientActions: AiClientAction[] = [];
  let finalAnswerText = '';
  let engineMode: 'gemini-live' | 'clinical-rag-fallback' = 'clinical-rag-fallback';

  if (isGeminiConfigured()) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const systemInstruction = buildRoleSystemPrompt(ctx, contextText);
    const functionDeclarations = getAuthorizedToolDeclarations(role);

    for (const candidateModel of MODEL_CASCADE) {
      const contents: Content[] = buildGeminiContents(effectiveHistory, userMessage);
      const turnTools: AiToolExecution[] = [];
      const turnActions: AiClientAction[] = [];

      try {
        callbacks.onStatus(`Connecting to ${candidateModel}...`);
        let resolvedText = '';
        const MAX_TOOL_ROUNDS = 4;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const result = await ai.models.generateContent({
            model: candidateModel,
            contents,
            config: {
              systemInstruction,
              temperature: 0.2,
              abortSignal: AbortSignal.timeout(18000),
              tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
            },
          });

          const calls = result.functionCalls;
          if (calls && calls.length > 0) {
            const candidateContent = result.candidates?.[0]?.content;
            if (candidateContent) {
              contents.push(candidateContent);
            }

            const responseParts: Part[] = [];
            for (const fc of calls) {
              const name = fc.name || '';
              const args = (fc.args || {}) as Record<string, any>;
              callbacks.onStatus(`Running authorized tool: ${name}...`);
              callbacks.onToolCall(name, args);

              const { execution, clientAction } = await executeAuthorizedTool(ctx, name, args);
              turnTools.push(execution);
              callbacks.onToolResult(execution);

              if (clientAction) {
                turnActions.push(clientAction);
                callbacks.onClientAction(clientAction);
              }

              responseParts.push({
                functionResponse: {
                  id: fc.id,
                  name,
                  response: { output: execution },
                },
              });
            }

            contents.push({ role: 'user', parts: responseParts });
            continue;
          }

          resolvedText = extractTextParts(result.candidates?.[0]?.content?.parts);
          if (resolvedText) {
            break;
          }
        }

        // If tool rounds reached limit without text, perform final streaming synthesis pass
        if (!resolvedText) {
          callbacks.onStatus(`Streaming synthesis from ${candidateModel}...`);
          const stream = await ai.models.generateContentStream({
            model: candidateModel,
            contents,
            config: {
              systemInstruction,
              temperature: 0.2,
              abortSignal: AbortSignal.timeout(18000),
            },
          });
          for await (const chunk of stream) {
            const delta = extractTextParts(chunk.candidates?.[0]?.content?.parts);
            if (delta) {
              resolvedText += delta;
              callbacks.onChunk(delta);
            }
          }
        } else {
          // Stream the synthesized answer smoothly in short word batches
          const words = resolvedText.split(/(\s+)/);
          const batchSize = 4;
          for (let i = 0; i < words.length; i += batchSize) {
            callbacks.onChunk(words.slice(i, i + batchSize).join(''));
            await new Promise((r) => setTimeout(r, 10));
          }
        }

        if (resolvedText.trim()) {
          finalAnswerText = resolvedText;
          collectedToolCalls.push(...turnTools);
          collectedClientActions.push(...turnActions);
          engineMode = 'gemini-live';
          break;
        }
      } catch (modelErr: any) {
        console.warn(`[MediCore AI] Model "${candidateModel}" failed (${modelErr?.message?.slice(0, 140)}), trying next...`);
        continue;
      }
    }
  }

  // Fallback to Question-Specific Clinical RAG & Tool Engine ONLY if all Gemini models fail or key absent
  if (!finalAnswerText.trim()) {
    callbacks.onStatus('Answering with targeted Clinical RAG & Database Tools...');
    const fb = await runQuestionSpecificFallback(ctx, userMessage, citations, callbacks);
    collectedToolCalls.push(...fb.toolCalls);
    collectedClientActions.push(...fb.clientActions);
    finalAnswerText = fb.text;
    engineMode = 'clinical-rag-fallback';

    const words = finalAnswerText.split(/(\s+)/);
    const batchSize = 5;
    for (let i = 0; i < words.length; i += batchSize) {
      callbacks.onChunk(words.slice(i, i + batchSize).join(''));
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  const nowIso = new Date().toISOString();
  const userMsgObj: AiChatMessage = {
    id: `u-${Date.now()}`,
    role: 'user',
    content: userMessage,
    timestamp: nowIso,
  };
  const assistantMsgObj: AiChatMessage = {
    id: `a-${Date.now()}`,
    role: 'assistant',
    content: finalAnswerText,
    timestamp: nowIso,
    citations,
    toolCalls: collectedToolCalls,
    clientActions: collectedClientActions,
    engineMode,
  };

  const savedThread = appendMessagesToThread(
    threadId,
    role,
    ctx.userId || role,
    userMsgObj,
    assistantMsgObj
  );

  callbacks.onDone(assistantMsgObj, savedThread.id);
}

/**
 * Dynamic contextual prompt suggestions tailored per role & current tab
 */
export function getContextualSuggestions(roleInput: AiPortalRole, activeTab?: string): string[] {
  const role = normalizePortalRole(roleInput);

  if (role === 'super-admin') {
    return [
      'What are the latest 5 security audit events and current database status?',
      'Which ward currently has available vs cleaning beds?',
      'Show total INR ₹ billing volume and any pending invoices',
      'List all Cardiologists and their consultation fees',
    ];
  }

  if (role === 'doctor') {
    if (activeTab === 'doctor-labs') {
      return [
        'How much is a Cardiac Troponin-I test and what is its turnaround time?',
        'Check completed lab results for Magnus Stephenson',
        'Which diagnostic blood panels are currently available in the catalog?',
        'Check ICU bed availability before scheduling transfer',
      ];
    }
    return [
      'What are Magnus Stephenson’s documented allergies and current vitals?',
      'Find all patients currently admitted in the ICU',
      'What is the Sepsis 1-hour bundle and antibiotic allergy check rule?',
      'Which pharmacy medications are running low in stock?',
    ];
  }

  if (role === 'nurse') {
    return [
      'Which MAR medication doses are currently Due?',
      'Check Bed ICU-02 and list any Cleaning beds ready to update',
      'Show pending STAT Doctor Orders and latest SBAR handover notes',
      'What MEWS score triggers immediate physician escalation?',
    ];
  }

  if (role === 'patient') {
    return [
      'What is my latest blood pressure, SpO2, and HbA1c?',
      'Are my lab reports ready, and what do the results mean?',
      'Who are the available specialists and what are their consultation fees in ₹?',
      'Do I have any pending invoices or upcoming appointments?',
    ];
  }

  // admin (Executive Admin & Wards)
  return [
    'Which beds are currently Occupied vs Cleaning across all wards?',
    'List low-stock pharmacy items needing immediate reorder',
    'How many pending vs paid invoices are in the billing ledger in ₹?',
    'Check scheduled appointments and on-duty specialists today',
  ];
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore AI Assistant — Shared Types
 */

export type AiPortalRole = 'super-admin' | 'doctor' | 'nurse' | 'patient' | 'admin';

export interface AiSessionContext {
  portalRole: AiPortalRole;
  userRole: string;
  userId: string;
  userName: string;
  patientId?: string;
  selectedPatientId?: string;
  activeTab?: string;
}

export interface AiRagCitation {
  id: string;
  title: string;
  category: string;
  snippet: string;
  score: number;
}

export interface AiToolExecution {
  name: string;
  args: Record<string, any>;
  success: boolean;
  summary: string;
  data?: any;
  timestamp: string;
}

export interface AiClientAction {
  type: 'NAVIGATE_TAB' | 'SELECT_PATIENT' | 'REFRESH_DATA';
  payload: Record<string, any>;
  label: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: AiRagCitation[];
  toolCalls?: AiToolExecution[];
  clientActions?: AiClientAction[];
  engineMode?: 'gemini-live' | 'clinical-rag-fallback';
}

export interface AiConversationThread {
  id: string;
  portalRole: AiPortalRole;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AiChatMessage[];
}

export interface AiChatRequest {
  message: string;
  threadId?: string;
  context: AiSessionContext;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}


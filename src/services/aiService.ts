/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore AI Assistant — Frontend API & SSE Streaming Client
 */

export function resolveAiApiBase(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('medicore_api_url');
    if (saved) return saved.replace(/\/$/, '') + '/api';

    if ((window as any).__MEDICORE_API_URL__) return (window as any).__MEDICORE_API_URL__;

    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api';

    // Use same-origin /api for both localhost (Vite proxy -> :5000) and Vercel serverless (/api/index)
    return '/api';
  }
  return 'http://localhost:5000/api';
}

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

export interface AiStatusResponse {
  online: boolean;
  geminiConfigured: boolean;
  engineMode: 'gemini-live' | 'clinical-rag-fallback';
  model: string;
  ragDocumentsCount: number;
  rolePolicy: {
    title: string;
    subtitle: string;
    privacyScopeLabel: string;
    allowedTools: string[];
  };
}

export interface StreamHandlers {
  onStatus?: (text: string) => void;
  onRagSources?: (citations: AiRagCitation[]) => void;
  onToolCall?: (name: string, args: Record<string, any>) => void;
  onToolResult?: (execution: AiToolExecution) => void;
  onClientAction?: (action: AiClientAction) => void;
  onChunk?: (delta: string) => void;
  onDone?: (finalMessage: AiChatMessage, threadId: string) => void;
  onError?: (error: string) => void;
}

export function mapHeaderPortalModeToAiRole(portalMode: string): AiPortalRole {
  const lower = (portalMode || '').toLowerCase();
  if (lower === 'super-admin') return 'super-admin';
  if (lower === 'doctor') return 'doctor';
  if (lower === 'nurse') return 'nurse';
  if (lower === 'patient') return 'patient';
  return 'admin';
}

export const aiService = {
  async getStatus(portalRole: AiPortalRole): Promise<AiStatusResponse> {
    const base = resolveAiApiBase();
    const res = await fetch(`${base}/ai/status?portalRole=${encodeURIComponent(portalRole)}`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
    });
    if (!res.ok) throw new Error(`AI Status Error ${res.status}`);
    return res.json();
  },

  async getSuggestions(portalRole: AiPortalRole, activeTab?: string): Promise<string[]> {
    const base = resolveAiApiBase();
    const params = new URLSearchParams({ portalRole });
    if (activeTab) params.set('activeTab', activeTab);
    const res = await fetch(`${base}/ai/suggestions?${params.toString()}`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
    });
    if (!res.ok) throw new Error(`AI Suggestions Error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.suggestions) ? data.suggestions : [];
  },

  async getHistory(portalRole: AiPortalRole, userId?: string): Promise<AiConversationThread[]> {
    const base = resolveAiApiBase();
    const params = new URLSearchParams({ portalRole });
    if (userId) params.set('userId', userId);
    const res = await fetch(`${base}/ai/history?${params.toString()}`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
    });
    if (!res.ok) throw new Error(`AI History Error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.threads) ? data.threads : [];
  },

  async deleteThread(threadId: string, portalRole: AiPortalRole): Promise<void> {
    const base = resolveAiApiBase();
    await fetch(`${base}/ai/history/${encodeURIComponent(threadId)}?portalRole=${encodeURIComponent(portalRole)}`, {
      method: 'DELETE',
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
    });
  },

  async clearHistory(portalRole: AiPortalRole): Promise<void> {
    const base = resolveAiApiBase();
    await fetch(`${base}/ai/history?portalRole=${encodeURIComponent(portalRole)}`, {
      method: 'DELETE',
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
    });
  },

  async generateSummary(
    context: AiSessionContext,
    threadId?: string
  ): Promise<{ threadId: string; message: AiChatMessage }> {
    const base = resolveAiApiBase();
    const res = await fetch(`${base}/ai/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({ context, threadId }),
    });
    if (!res.ok) throw new Error(`AI Summary Error ${res.status}`);
    return res.json();
  },

  async streamChat(
    params: {
      message: string;
      threadId?: string;
      context: AiSessionContext;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      signal?: AbortSignal;
    },
    handlers: StreamHandlers
  ): Promise<void> {
    const base = resolveAiApiBase();
    const res = await fetch(`${base}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({
        message: params.message,
        threadId: params.threadId,
        context: params.context,
        history: params.history,
      }),
      signal: params.signal,
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(errText || `Streaming HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const processEventBlock = (rawBlock: string) => {
      const lines = rawBlock.split(/\r?\n/);
      let eventType = 'message';
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (dataLines.length === 0) return;
      const jsonStr = dataLines.join('\n');
      let payload: any;
      try {
        payload = JSON.parse(jsonStr);
      } catch {
        return;
      }

      switch (eventType) {
        case 'status':
          handlers.onStatus?.(payload.text || '');
          break;
        case 'rag_sources':
          handlers.onRagSources?.(payload.citations || []);
          break;
        case 'tool_call':
          handlers.onToolCall?.(payload.name, payload.args || {});
          break;
        case 'tool_result':
          if (payload.execution) handlers.onToolResult?.(payload.execution);
          break;
        case 'client_action':
          if (payload.action) handlers.onClientAction?.(payload.action);
          break;
        case 'chunk':
          if (typeof payload.delta === 'string') handlers.onChunk?.(payload.delta);
          break;
        case 'done':
          if (payload.message) handlers.onDone?.(payload.message, payload.threadId || '');
          break;
        case 'error':
          handlers.onError?.(payload.error || 'Unknown streaming error');
          break;
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let splitIdx: number;
      while ((splitIdx = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, splitIdx);
        buffer = buffer.slice(splitIdx + 2);
        if (block.trim()) {
          processEventBlock(block);
        }
      }
    }

    if (buffer.trim()) {
      processEventBlock(buffer);
    }
  },
};


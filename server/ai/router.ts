/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore AI Assistant — Isolated Express Router (/api/ai)
 */

import { Router, Request, Response } from 'express';
import { AiChatRequest, AiPortalRole, AiSessionContext } from './types.js';
import { normalizePortalRole } from './rbac.js';
import {
  getAiEngineStatus,
  getContextualSuggestions,
  runAssistantStream,
} from './geminiService.js';
import {
  clearThreadsForRole,
  deleteThread,
  getThreadsForRole,
} from './historyStore.js';

const aiRouter = Router();

function buildSafeContext(rawCtx: any, fallbackRole?: string): AiSessionContext {
  const portalRole: AiPortalRole = normalizePortalRole(rawCtx?.portalRole || fallbackRole);
  return {
    portalRole,
    userRole: String(rawCtx?.userRole || portalRole.toUpperCase()),
    userId: String(rawCtx?.userId || portalRole),
    userName: String(rawCtx?.userName || 'Authenticated User'),
    patientId: rawCtx?.patientId ? String(rawCtx.patientId) : undefined,
    selectedPatientId: rawCtx?.selectedPatientId ? String(rawCtx.selectedPatientId) : undefined,
    activeTab: rawCtx?.activeTab ? String(rawCtx.activeTab) : undefined,
  };
}

function writeSseEvent(res: Response, event: string, data: any) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// GET /api/ai/status?portalRole=doctor
aiRouter.get('/status', (req: Request, res: Response) => {
  try {
    const portalRole = normalizePortalRole(String(req.query.portalRole || 'admin'));
    res.json(getAiEngineStatus(portalRole));
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to retrieve AI status' });
  }
});

// GET /api/ai/suggestions?portalRole=doctor&activeTab=doctor-labs
aiRouter.get('/suggestions', (req: Request, res: Response) => {
  try {
    const portalRole = normalizePortalRole(String(req.query.portalRole || 'admin'));
    const activeTab = req.query.activeTab ? String(req.query.activeTab) : undefined;
    res.json({
      portalRole,
      suggestions: getContextualSuggestions(portalRole, activeTab),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load AI suggestions' });
  }
});

// GET /api/ai/history?portalRole=doctor&userId=doctor
aiRouter.get('/history', (req: Request, res: Response) => {
  try {
    const portalRole = normalizePortalRole(String(req.query.portalRole || 'admin'));
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    res.json({
      portalRole,
      threads: getThreadsForRole(portalRole, userId),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch AI conversation history' });
  }
});

// DELETE /api/ai/history?portalRole=doctor
aiRouter.delete('/history', (req: Request, res: Response) => {
  try {
    const portalRole = normalizePortalRole(String(req.query.portalRole || req.body?.portalRole || 'admin'));
    const cleared = clearThreadsForRole(portalRole);
    res.json({ success: true, cleared });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear history' });
  }
});

// DELETE /api/ai/history/:threadId?portalRole=doctor
aiRouter.delete('/history/:threadId', (req: Request, res: Response) => {
  try {
    const portalRole = normalizePortalRole(String(req.query.portalRole || 'admin'));
    const deleted = deleteThread(req.params.threadId, portalRole);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete conversation thread' });
  }
});

// POST /api/ai/chat (Non-streaming JSON endpoint)
aiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const body = req.body as AiChatRequest;
    const message = String(body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const ctx = buildSafeContext(body.context);
    let finalMsg: any = null;
    let outThreadId = body.threadId || '';

    await runAssistantStream(ctx, message, body.threadId, body.history, {
      onStatus: () => {},
      onRagSources: () => {},
      onToolCall: () => {},
      onToolResult: () => {},
      onClientAction: () => {},
      onChunk: () => {},
      onDone: (msg, tId) => {
        finalMsg = msg;
        outThreadId = tId;
      },
      onError: (errMsg) => {
        throw new Error(errMsg);
      },
    });

    res.json({
      threadId: outThreadId,
      message: finalMsg,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'AI chat processing error' });
  }
});

// POST /api/ai/chat/stream (Server-Sent Events streaming endpoint)
aiRouter.post('/chat/stream', async (req: Request, res: Response) => {
  const body = req.body as AiChatRequest;
  const message = String(body?.message || '').trim();
  if (!message) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const ctx = buildSafeContext(body.context);

  try {
    await runAssistantStream(ctx, message, body.threadId, body.history, {
      onStatus: (text) => writeSseEvent(res, 'status', { text }),
      onRagSources: (citations) => writeSseEvent(res, 'rag_sources', { citations }),
      onToolCall: (name, args) => writeSseEvent(res, 'tool_call', { name, args }),
      onToolResult: (execution) => writeSseEvent(res, 'tool_result', { execution }),
      onClientAction: (action) => writeSseEvent(res, 'client_action', { action }),
      onChunk: (delta) => writeSseEvent(res, 'chunk', { delta }),
      onDone: (finalMessage, threadId) => {
        writeSseEvent(res, 'done', { threadId, message: finalMessage });
        if (!res.writableEnded) res.end();
      },
      onError: (error) => {
        writeSseEvent(res, 'error', { error });
        if (!res.writableEnded) res.end();
      },
    });
  } catch (err: any) {
    writeSseEvent(res, 'error', { error: err?.message || 'Streaming failure' });
    if (!res.writableEnded) res.end();
  }
});

// POST /api/ai/summary (Role-Specific Intelligent Briefing)
aiRouter.post('/summary', async (req: Request, res: Response) => {
  try {
    const ctx = buildSafeContext(req.body?.context);
    const summaryPrompts: Record<AiPortalRole, string> = {
      'super-admin': 'Provide a concise executive Super Admin briefing on database telemetry, hospital occupancy, billing volume in ₹ INR, and recent security audit logs.',
      doctor: 'Provide a concise Doctor shift clinical briefing summarizing active patient vitals, allergy alerts, hospital ICU census, and pending laboratory insights.',
      nurse: 'Provide a concise Head Nurse shift handover briefing covering bed availability, cleaning turnover, due MAR doses, and ICU/high-acuity patients.',
      patient: 'Provide a reassuring plain-language summary of my current health vitals, allergies, active prescriptions, and upcoming lab/appointment status.',
      admin: 'Provide an executive Hospital & Ward Operations summary covering bed occupancy, ICU capacity, low-stock pharmacy alerts, and INR ₹ billing status.',
    };

    const prompt = summaryPrompts[ctx.portalRole];
    let finalMsg: any = null;
    let outThreadId = '';

    await runAssistantStream(ctx, prompt, req.body?.threadId, undefined, {
      onStatus: () => {},
      onRagSources: () => {},
      onToolCall: () => {},
      onToolResult: () => {},
      onClientAction: () => {},
      onChunk: () => {},
      onDone: (msg, tId) => {
        finalMsg = msg;
        outThreadId = tId;
      },
      onError: (errMsg) => {
        throw new Error(errMsg);
      },
    });

    res.json({
      threadId: outThreadId,
      message: finalMsg,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate briefing summary' });
  }
});

export default aiRouter;


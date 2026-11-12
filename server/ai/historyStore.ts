/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore AI Assistant — Isolated Conversation History Store
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AiChatMessage, AiConversationThread, AiPortalRole } from './types.js';
import { normalizePortalRole } from './rbac.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_FILE = path.resolve(__dirname, '..', 'data', 'ai_conversations.json');

let threadsCache: AiConversationThread[] = [];
let loaded = false;

function loadThreads() {
  if (loaded) return;
  loaded = true;
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        threadsCache = parsed;
      }
    }
  } catch {
    threadsCache = [];
  }
}

function saveThreads() {
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(threadsCache.slice(0, 120), null, 2), 'utf8');
  } catch {
    // Graceful no-op on read-only serverless file systems (Vercel)
  }
}

export function getThreadsForRole(portalRole: AiPortalRole, userId?: string): AiConversationThread[] {
  loadThreads();
  const role = normalizePortalRole(portalRole);
  return threadsCache
    .filter((t) => t.portalRole === role && (!userId || t.userId === userId))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getThreadById(
  threadId: string,
  portalRole: AiPortalRole
): AiConversationThread | undefined {
  loadThreads();
  const role = normalizePortalRole(portalRole);
  return threadsCache.find((t) => t.id === threadId && t.portalRole === role);
}

export function appendMessagesToThread(
  threadId: string | undefined,
  portalRole: AiPortalRole,
  userId: string,
  userMsg: AiChatMessage,
  assistantMsg: AiChatMessage
): AiConversationThread {
  loadThreads();
  const role = normalizePortalRole(portalRole);
  const now = new Date().toISOString();

  let thread = threadId ? threadsCache.find((t) => t.id === threadId && t.portalRole === role) : undefined;

  if (!thread) {
    const titleSeed = userMsg.content.replace(/\s+/g, ' ').trim();
    const title = titleSeed.length > 46 ? titleSeed.slice(0, 43) + '...' : titleSeed || 'New Conversation';
    thread = {
      id: threadId || `thread-${role}-${Date.now()}`,
      portalRole: role,
      userId: userId || role,
      title,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    threadsCache.unshift(thread);
  }

  thread.messages.push(userMsg, assistantMsg);
  if (thread.messages.length > 50) {
    thread.messages = thread.messages.slice(-50);
  }
  thread.updatedAt = now;

  // Move updated thread to front
  threadsCache = [thread, ...threadsCache.filter((t) => t.id !== thread!.id)];
  saveThreads();
  return thread;
}

export function deleteThread(threadId: string, portalRole: AiPortalRole): boolean {
  loadThreads();
  const role = normalizePortalRole(portalRole);
  const before = threadsCache.length;
  threadsCache = threadsCache.filter((t) => !(t.id === threadId && t.portalRole === role));
  if (threadsCache.length !== before) {
    saveThreads();
    return true;
  }
  return false;
}

export function clearThreadsForRole(portalRole: AiPortalRole): number {
  loadThreads();
  const role = normalizePortalRole(portalRole);
  const before = threadsCache.length;
  threadsCache = threadsCache.filter((t) => t.portalRole !== role);
  const removed = before - threadsCache.length;
  if (removed > 0) saveThreads();
  return removed;
}


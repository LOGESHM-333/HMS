/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore AI Assistant — Role-Aware Floating Co-Pilot Interface
 * Consistent with MediCore Steel-Slate Executive UI (#3B4E6A / #485E83).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  History,
  Trash2,
  Plus,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Stethoscope,
  Activity,
  Heart,
  Building2,
  BookOpen,
  Wrench,
  Volume2,
  Square,
  ChevronRight,
  ChevronDown,
  Lock,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Patient, ThemeMode, UserRole } from '../../types';
import { sound } from '../../services/audioService';
import {
  AiChatMessage,
  AiClientAction,
  AiConversationThread,
  AiPortalRole,
  AiStatusResponse,
  aiService,
  mapHeaderPortalModeToAiRole,
} from '../../services/aiService';

interface MediCoreAssistantProps {
  portalMode: string;
  currentRole: UserRole;
  currentTab: string;
  userName: string;
  selectedPatient?: Patient | null;
  theme?: ThemeMode;
  onNavigateTab: (tab: string) => void;
  onDataMutated?: () => void;
}

const ROLE_META: Record<
  AiPortalRole,
  {
    title: string;
    shortBadge: string;
    subtitle: string;
    privacyLabel: string;
    summaryButtonLabel: string;
    icon: React.ElementType;
    welcomeText: string;
  }
> = {
  'super-admin': {
    title: 'MediCore Enterprise AI',
    shortBadge: 'Enterprise Command',
    subtitle: 'Governance • RBAC Security • DB Telemetry • Audit Logs',
    privacyLabel: 'Enterprise Clearance • Cross-Facility Governance Scope',
    summaryButtonLabel: 'Enterprise Briefing',
    icon: ShieldCheck,
    welcomeText:
      'Enterprise AI Command online. Ask me to audit recent security events, inspect MySQL/PostgreSQL health, check hospital-wide ₹ INR revenue, or detect surge risks.',
  },
  doctor: {
    title: 'MediCore Clinical Co-Pilot',
    shortBadge: 'Physician Co-Pilot',
    subtitle: 'Clinical Summaries • Lab Ordering • E-Rx • Allergy Guard',
    privacyLabel: 'Physician Scope • Authorized EHR, Lab Ordering & E-Prescribing',
    summaryButtonLabel: 'Clinical Shift Brief',
    icon: Stethoscope,
    welcomeText:
      'Clinical Co-Pilot ready. Select any patient or ask me to summarize vitals, cross-check allergies, review lab results, look up assays, or order tests directly.',
  },
  nurse: {
    title: 'MediCore Nursing Co-Pilot',
    shortBadge: 'Head Nurse AI',
    subtitle: 'MAR Verification • MEWS Triage • Bed Flow • SBAR Handover',
    privacyLabel: 'Head Nurse Scope • Ward Beds, MAR, Vitals & Bedside Triage',
    summaryButtonLabel: 'Ward & MAR Brief',
    icon: Activity,
    welcomeText:
      'Head Nurse Assistant ready. Ask about due MAR medications, ward bed cleaning turnover, ICU high-acuity patients, or MEWS escalation protocols.',
  },
  patient: {
    title: 'MediCore Personal Health Guide',
    shortBadge: 'Health Guide',
    subtitle: 'Your Vitals • Lab Explanations • Appointments • ₹ Billing',
    privacyLabel: 'HIPAA Private Mode • Scoped Exclusively to Your Records',
    summaryButtonLabel: 'My Health Summary',
    icon: Heart,
    welcomeText:
      'Hello! I am your MediCore Personal Health Guide. I can explain your latest vitals and lab reports in plain language, check your ₹ billing statements, or help book your appointments.',
  },
  admin: {
    title: 'MediCore Operations & Ward AI',
    shortBadge: 'Ward & Ops AI',
    subtitle: 'Bed Occupancy • Pharmacy Stock • Admissions • ₹ Finance',
    privacyLabel: 'Executive & Ward Operations Scope • Logistics & Capacity',
    summaryButtonLabel: 'Ward Ops Briefing',
    icon: Building2,
    welcomeText:
      'Hospital & Ward Operations AI online. Ask about live bed availability, discharge bottlenecks, low-stock pharmacy alerts, or total INR billing performance.',
  },
};

function renderInlineMarkdown(line: string): React.ReactNode {
  // Parse **bold** and `code` cleanly
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-[#3B4E6A]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function FormattedMarkdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed text-slate-700 break-words">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;

        if (line === '---') {
          return <hr key={idx} className="my-2 border-slate-200/80" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[13.5px] font-extrabold text-[#3B4E6A] pt-1">
              {renderInlineMarkdown(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm font-black text-[#2E3E55] pt-1">
              {renderInlineMarkdown(line.slice(3))}
            </h3>
          );
        }
        if (line.startsWith('> ')) {
          return (
            <div
              key={idx}
              className="pl-3 py-1.5 pr-2.5 my-1 rounded-r-xl border-l-2 border-[#3B4E6A] bg-[#3B4E6A]/5 text-xs text-slate-600"
            >
              {renderInlineMarkdown(line.slice(2))}
            </div>
          );
        }
        if (/^[-•*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
          const isOrdered = /^\d+\.\s+/.test(line);
          const clean = line.replace(/^([-•*]|\d+\.)\s+/, '');
          const prefix = isOrdered ? line.match(/^\d+\./)?.[0] : '•';
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[#485E83] font-bold shrink-0 mt-0.5 text-xs">{prefix}</span>
              <span className="flex-1">{renderInlineMarkdown(clean)}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

export const MediCoreAssistant: React.FC<MediCoreAssistantProps> = ({
  portalMode,
  currentRole,
  currentTab,
  userName,
  selectedPatient,
  onNavigateTab,
  onDataMutated,
}) => {
  const aiRole: AiPortalRole = useMemo(
    () => mapHeaderPortalModeToAiRole(portalMode),
    [portalMode]
  );
  const meta = ROLE_META[aiRole];
  const RoleIcon = meta.icon;

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined);
  const [threads, setThreads] = useState<AiConversationThread[]>([]);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);
  const [expandedCitationsMsgId, setExpandedCitationsMsgId] = useState<string | null>(null);

  // Voice Input & Speech Synthesis
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const sessionContext = useMemo(
    () => ({
      portalRole: aiRole,
      userRole: currentRole,
      userId: `${aiRole}:${userName}`,
      userName,
      patientId: aiRole === 'patient' ? selectedPatient?.id || 'pat-1' : undefined,
      selectedPatientId: selectedPatient?.id,
      activeTab: currentTab,
    }),
    [aiRole, currentRole, userName, selectedPatient?.id, currentTab]
  );

  // Keyboard shortcut Ctrl+Shift+A & Custom DOM launch event
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        sound.playClick();
        setIsOpen((prev) => !prev);
      }
    };
    const onCustomOpen = () => {
      sound.playClick();
      setIsOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('medicore:open-ai', onCustomOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('medicore:open-ai', onCustomOpen);
    };
  }, []);

  // Load AI status, dynamic suggestions, and role conversation history whenever role/tab changes
  useEffect(() => {
    let active = true;
    setShowHistoryDrawer(false);
    setExpandedCitationsMsgId(null);

    const localKey = `medicore_ai_threads_${aiRole}`;
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && active) {
          setThreads(parsed);
        }
      }
    } catch {}

    aiService
      .getStatus(aiRole)
      .then((st) => active && setAiStatus(st))
      .catch(() => {});

    aiService
      .getSuggestions(aiRole, currentTab)
      .then((s) => active && setSuggestions(s))
      .catch(() => {});

    aiService
      .getHistory(aiRole, `${aiRole}:${userName}`)
      .then((serverThreads) => {
        if (!active) return;
        if (serverThreads.length > 0) {
          setThreads(serverThreads);
          try {
            localStorage.setItem(localKey, JSON.stringify(serverThreads));
          } catch {}
        }
      })
      .catch(() => {});

    // Start fresh contextual welcome view when switching portal role
    setActiveThreadId(undefined);
    setMessages([]);

    return () => {
      active = false;
    };
  }, [aiRole, userName]);

  // Refresh suggestions smoothly on tab switches within same portal
  useEffect(() => {
    aiService
      .getSuggestions(aiRole, currentTab)
      .then((s) => setSuggestions(s))
      .catch(() => {});
  }, [aiRole, currentTab]);

  // Auto-scroll to bottom on new message / streamed chunks
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isStreaming]);

  // Save updated threads mirror in localStorage
  useEffect(() => {
    if (threads.length > 0) {
      try {
        localStorage.setItem(`medicore_ai_threads_${aiRole}`, JSON.stringify(threads));
      } catch {}
    }
  }, [threads, aiRole]);

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setStreamStatus(null);
  };

  const handleClientAction = (action: AiClientAction) => {
    sound.playClick();
    if (action.type === 'NAVIGATE_TAB' && action.payload?.tab) {
      onNavigateTab(String(action.payload.tab));
    } else if (action.type === 'REFRESH_DATA') {
      onDataMutated?.();
    }
  };

  const sendMessage = async (rawPrompt?: string) => {
    const text = (rawPrompt ?? inputText).trim();
    if (!text || isStreaming) return;

    sound.playClick();
    if (!rawPrompt) setInputText('');

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantPlaceholderId = `assistant-${Date.now()}`;
    const assistantPlaceholder: AiChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      citations: [],
      toolCalls: [],
      clientActions: [],
    };

    const priorHistory = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsStreaming(true);
    setStreamStatus('Retrieving hospital knowledge & checking permissions...');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await aiService.streamChat(
        {
          message: text,
          threadId: activeThreadId,
          context: sessionContext,
          history: priorHistory,
          signal: controller.signal,
        },
        {
          onStatus: (statusText) => setStreamStatus(statusText),
          onRagSources: (citations) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantPlaceholderId ? { ...m, citations } : m))
            );
          },
          onToolResult: (execution) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPlaceholderId
                  ? { ...m, toolCalls: [...(m.toolCalls || []), execution] }
                  : m
              )
            );
          },
          onClientAction: (action) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPlaceholderId
                  ? { ...m, clientActions: [...(m.clientActions || []), action] }
                  : m
              )
            );
            // Execute side-effect cleanly (navigation or data refresh)
            if (action.type === 'NAVIGATE_TAB' && action.payload?.tab) {
              onNavigateTab(String(action.payload.tab));
            } else if (action.type === 'REFRESH_DATA') {
              onDataMutated?.();
            }
          },
          onChunk: (delta) => {
            setStreamStatus(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPlaceholderId ? { ...m, content: m.content + delta } : m
              )
            );
          },
          onDone: (finalMessage, returnedThreadId) => {
            sound.playSuccess();
            if (returnedThreadId) setActiveThreadId(returnedThreadId);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantPlaceholderId ? finalMessage : m))
            );
            aiService
              .getHistory(aiRole, `${aiRole}:${userName}`)
              .then((t) => setThreads(t))
              .catch(() => {});
          },
          onError: (errMsg) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantPlaceholderId
                  ? {
                      ...m,
                      content: `⚠️ Assistant encountered an issue: ${errMsg}. Please try again.`,
                    }
                  : m
              )
            );
          },
        }
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantPlaceholderId
              ? {
                  ...m,
                  content: `⚠️ Connection to MediCore AI Backend failed (${err?.message || 'Network error'}). Ensure the backend API is running locally or deployed cleanly on /api.`,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamStatus(null);
      abortControllerRef.current = null;
    }
  };

  const handleGenerateBriefing = async () => {
    if (isStreaming) return;
    await sendMessage(
      aiRole === 'patient'
        ? 'Summarize my current health vitals, active prescriptions, and recent lab reports.'
        : aiRole === 'doctor'
        ? 'Generate my Physician clinical shift briefing and summarize the active patient record.'
        : aiRole === 'nurse'
        ? 'Generate my Head Nurse ward, bed capacity, ICU watchlist & due MAR briefing.'
        : aiRole === 'super-admin'
        ? 'Generate an Executive Super Admin briefing covering database status, occupancy, ₹ financials & audit logs.'
        : 'Generate an Executive Hospital & Ward Operations briefing with bed bottlenecks & ₹ revenue.'
    );
  };

  const toggleVoiceInput = () => {
    setVoiceError(null);
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceError('Voice dictation requires a Chromium/Edge/Safari browser with SpeechRecognition support.');
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        sound.playClick();
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (ev: any) => {
        setIsListening(false);
        setVoiceError(
          ev.error === 'not-allowed'
            ? 'Microphone permission denied. Please allow mic access in browser settings.'
            : `Voice recognition stopped (${ev.error}).`
        );
        setTimeout(() => setVoiceError(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError('Unable to initialize microphone.');
      setTimeout(() => setVoiceError(null), 3500);
    }
  };

  const toggleSpeakMessage = (msg: AiChatMessage) => {
    if (!('speechSynthesis' in window)) return;
    sound.playClick();
    if (speakingMsgId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = msg.content.replace(/[*#`>_]/g, '').replace(/---/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.02;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleLoadThread = (t: AiConversationThread) => {
    sound.playClick();
    setActiveThreadId(t.id);
    setMessages(t.messages || []);
    setShowHistoryDrawer(false);
  };

  const handleNewConversation = () => {
    sound.playClick();
    setActiveThreadId(undefined);
    setMessages([]);
    setShowHistoryDrawer(false);
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    sound.playClick();
    await aiService.deleteThread(threadId, aiRole).catch(() => {});
    const updated = threads.filter((t) => t.id !== threadId);
    setThreads(updated);
    try {
      localStorage.setItem(`medicore_ai_threads_${aiRole}`, JSON.stringify(updated));
    } catch {}
    if (activeThreadId === threadId) {
      setActiveThreadId(undefined);
      setMessages([]);
    }
  };

  const handleClearAllHistory = async () => {
    sound.playClick();
    await aiService.clearHistory(aiRole).catch(() => {});
    setThreads([]);
    setActiveThreadId(undefined);
    setMessages([]);
    try {
      localStorage.removeItem(`medicore_ai_threads_${aiRole}`);
    } catch {}
    setShowHistoryDrawer(false);
  };

  return (
    <>
      {/* FLOATING CHAT ACCESS LAUNCHER (Bottom Right) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            onClick={() => {
              sound.playClick();
              setIsOpen(true);
            }}
            aria-label="Open MediCore AI Assistant"
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3 pl-3.5 pr-4 py-3 rounded-full text-white shadow-2xl cursor-pointer group border border-white/25"
            style={{
              background: 'linear-gradient(135deg, #3B4E6A 0%, #485E83 65%, #506D9C 100%)',
              boxShadow: '0 12px 32px rgba(59, 78, 106, 0.48), inset 0 1px 0 rgba(255,255,255,0.28)',
            }}
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15 border border-white/20">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#3B4E6A] animate-pulse" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
                <span>MediCore AI</span>
              </div>
              <div className="text-[10px] text-slate-200/90 font-medium">{meta.shortBadge}</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* FLOATING SLIDE-OVER ASSISTANT PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col rounded-[28px] overflow-hidden border border-slate-200/90 shadow-2xl bg-white/95 backdrop-blur-xl transition-[width,height] duration-300 ${
              isExpanded
                ? 'w-[calc(100vw-2rem)] sm:w-[760px] h-[calc(100vh-3rem)] max-h-[840px]'
                : 'w-[calc(100vw-2rem)] sm:w-[445px] h-[min(680px,calc(100vh-3rem))]'
            }`}
            style={{
              boxShadow: '0 24px 64px -12px rgba(30, 41, 59, 0.35), 0 0 0 1px rgba(59, 78, 106, 0.12)',
            }}
          >
            {/* TOP GRADIENT HEADER */}
            <div
              className="px-4 py-3.5 text-white flex items-center justify-between gap-2 shrink-0 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #2E3E55 0%, #3B4E6A 55%, #485E83 100%)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-inner">
                  <RoleIcon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm tracking-tight truncate">{meta.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                        aiStatus?.geminiConfigured
                          ? 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30'
                          : 'bg-white/15 text-slate-100 border-white/25'
                      }`}
                    >
                      {aiStatus?.geminiConfigured ? 'Gemini Live' : 'Clinical RAG'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-200/90 truncate">{meta.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 relative z-10">
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowHistoryDrawer((p) => !p);
                  }}
                  title="Conversation History"
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    showHistoryDrawer ? 'bg-white/25 text-white' : 'hover:bg-white/15 text-slate-100'
                  }`}
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNewConversation}
                  title="New Chat"
                  className="p-2 rounded-xl hover:bg-white/15 text-slate-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsExpanded((p) => !p);
                  }}
                  title={isExpanded ? 'Compact View' : 'Expand Workspace'}
                  className="hidden sm:flex p-2 rounded-xl hover:bg-white/15 text-slate-100 transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsOpen(false);
                  }}
                  title="Close Assistant"
                  className="p-2 rounded-xl hover:bg-white/15 text-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ROLE PRIVACY & CONTEXT STRIP */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 text-[11px] shrink-0">
              <div className="flex items-center gap-1.5 text-[#3B4E6A] font-semibold truncate">
                <Lock className="w-3 h-3 text-[#485E83] shrink-0" />
                <span className="truncate">{meta.privacyLabel}</span>
              </div>
              <button
                onClick={handleGenerateBriefing}
                disabled={isStreaming}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1 shrink-0 cursor-pointer transition-transform active:scale-95 disabled:opacity-50 shadow-xs"
                style={{ background: 'linear-gradient(135deg, #3B4E6A, #485E83)' }}
              >
                <Sparkles className="w-3 h-3" />
                <span>{meta.summaryButtonLabel}</span>
              </button>
            </div>

            {/* MAIN CONTENT AREA (Conversation History Drawer OR Chat Feed) */}
            <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden bg-[#F8FAFC]">
              <AnimatePresence>
                {showHistoryDrawer && (
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 z-20 bg-white flex flex-col"
                  >
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800">
                          {meta.shortBadge} Conversation History
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {threads.length} saved session(s) isolated to this portal
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {threads.length > 0 && (
                          <button
                            onClick={handleClearAllHistory}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear All</span>
                          </button>
                        )}
                        <button
                          onClick={() => setShowHistoryDrawer(false)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {threads.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                          <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                          <p className="text-xs font-semibold text-slate-500">No saved conversations yet</p>
                          <p className="text-[11px] mt-1">
                            Start chatting below to automatically record your {meta.shortBadge.toLowerCase()} history.
                          </p>
                        </div>
                      ) : (
                        threads.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleLoadThread(t)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              activeThreadId === t.id
                                ? 'bg-[#3B4E6A]/5 border-[#3B4E6A]/40'
                                : 'bg-white border-slate-200/80 hover:border-[#3B4E6A]/30 hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{t.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>{t.messages?.length || 0} msgs</span>
                                <span>•</span>
                                <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteThread(e, t.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                              title="Delete thread"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MESSAGE FEED */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    {/* Role Welcome Card */}
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#3B4E6A]/10 text-[#3B4E6A] flex items-center justify-center">
                          <RoleIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          Ready in {meta.shortBadge} Mode
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{meta.welcomeText}</p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-semibold">
                          Tab: {currentTab}
                        </span>
                        {selectedPatient && aiRole !== 'patient' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-semibold">
                            Focus: {selectedPatient.name}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-semibold">
                          RAG Docs: {aiStatus?.ragDocumentsCount ?? 11}
                        </span>
                      </div>
                    </div>

                    {/* Smart Role Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 px-1">
                          Suggested Actions & Questions
                        </div>
                        <div className="space-y-1.5">
                          {suggestions.map((sug, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(sug)}
                              className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#3B4E6A]/5 border border-slate-200/80 hover:border-[#3B4E6A]/40 text-xs font-semibold text-slate-700 flex items-center justify-between gap-2 transition-all cursor-pointer group shadow-2xs"
                            >
                              <span className="line-clamp-2">{sug}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3B4E6A] shrink-0 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div
                          className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm text-white text-[13px] font-medium shadow-xs"
                          style={{
                            background: 'linear-gradient(135deg, #3B4E6A 0%, #485E83 100%)',
                          }}
                        >
                          {msg.content}
                        </div>
                      ) : (
                        <div className="w-full space-y-2">
                          {/* Tool Call Execution Badges */}
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.toolCalls.map((tc, i) => (
                                <span
                                  key={i}
                                  title={tc.summary}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    tc.success
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {tc.success ? (
                                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                  )}
                                  <Wrench className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                  <span>{tc.name}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Assistant Content Bubble */}
                          <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white border border-slate-200/90 shadow-2xs">
                            {msg.content ? (
                              <FormattedMarkdown content={msg.content} />
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3B4E6A]" />
                                <span>{streamStatus || 'Thinking...'}</span>
                              </div>
                            )}

                            {/* Actionable Client Directives */}
                            {msg.clientActions && msg.clientActions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                                {msg.clientActions.map((act, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleClientAction(act)}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#3B4E6A]/10 hover:bg-[#3B4E6A] text-[#3B4E6A] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <span>{act.label}</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Footer Metadata: TTS Readout & RAG Citations */}
                            {msg.content && (
                              <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                                <div className="flex items-center gap-2">
                                  {msg.citations && msg.citations.length > 0 && (
                                    <button
                                      onClick={() =>
                                        setExpandedCitationsMsgId((prev) =>
                                          prev === msg.id ? null : msg.id
                                        )
                                      }
                                      className="inline-flex items-center gap-1 font-bold text-[#485E83] hover:text-[#2E3E55] cursor-pointer"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      <span>{msg.citations.length} RAG Sources</span>
                                      <ChevronDown
                                        className={`w-3 h-3 transition-transform ${
                                          expandedCitationsMsgId === msg.id ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </button>
                                  )}
                                </div>
                                <button
                                  onClick={() => toggleSpeakMessage(msg)}
                                  className={`inline-flex items-center gap-1 font-semibold hover:text-slate-700 cursor-pointer ${
                                    speakingMsgId === msg.id ? 'text-[#3B4E6A] font-bold' : ''
                                  }`}
                                  title="Read aloud"
                                >
                                  {speakingMsgId === msg.id ? (
                                    <>
                                      <Square className="w-2.5 h-2.5 fill-current" />
                                      <span>Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3 h-3" />
                                      <span>Listen</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Expandable RAG Sources */}
                            {expandedCitationsMsgId === msg.id && msg.citations && (
                              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                                {msg.citations.map((c) => (
                                  <div
                                    key={c.id}
                                    className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px]"
                                  >
                                    <div className="font-bold text-[#3B4E6A] flex items-center justify-between gap-2">
                                      <span className="truncate">{c.title}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shrink-0">
                                        {c.category}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-slate-500 mt-0.5 line-clamp-2">
                                      {c.snippet}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isStreaming && streamStatus && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-[#3B4E6A] w-fit">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{streamStatus}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK FOLLOW-UP SUGGESTIONS BAR WHEN CHAT IS ACTIVE */}
              {messages.length > 0 && !isStreaming && suggestions.length > 0 && (
                <div className="px-3 py-1.5 border-t border-slate-200/70 bg-white/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {suggestions.slice(0, 3).map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(sug)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#3B4E6A] text-slate-700 hover:text-white text-[10.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border border-slate-200/70"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {/* VOICE ERROR OR LISTENING FEEDBACK */}
              {(voiceError || isListening) && (
                <div
                  className={`px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between shrink-0 ${
                    voiceError
                      ? 'bg-rose-50 text-rose-700 border-t border-rose-200'
                      : 'bg-teal-50 text-teal-800 border-t border-teal-200'
                  }`}
                >
                  <span>{voiceError || '🎙 Listening... speak your clinical or portal query clearly.'}</span>
                  {isListening && (
                    <button
                      onClick={toggleVoiceInput}
                      className="text-[10px] font-bold underline cursor-pointer"
                    >
                      Stop
                    </button>
                  )}
                </div>
              )}

              {/* COMPOSER FOOTER */}
              <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/90 focus-within:border-[#3B4E6A] focus-within:bg-white rounded-2xl p-2 transition-all">
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={isListening ? 'Stop voice dictation' : 'Voice input'}
                    className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-sm'
                        : 'text-slate-500 hover:text-[#3B4E6A] hover:bg-slate-200/60'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={`Ask ${meta.title}...`}
                    className="flex-1 bg-transparent resize-none border-0 outline-none text-[13px] text-slate-800 placeholder:text-slate-400 py-1.5 max-h-24"
                  />

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStopStreaming}
                      title="Stop generating"
                      className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shrink-0 transition-colors cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!inputText.trim()}
                      title="Send message"
                      className="p-2 rounded-xl text-white shrink-0 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      style={{
                        background: 'linear-gradient(135deg, #3B4E6A 0%, #485E83 100%)',
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="mt-1.5 px-1 flex items-center justify-between text-[9.5px] text-slate-400">
                  <span>Shortcut: Ctrl+Shift+A • Verify clinical decisions with attending MD</span>
                  <span>RBAC Protected</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


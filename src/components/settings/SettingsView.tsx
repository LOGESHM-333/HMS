/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLog, ThemeMode, UserRole } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  ShieldCheck, 
  Lock, 
  Settings, 
  History, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface SettingsViewProps {
  theme: ThemeMode;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [logs, setLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [activeTab, setActiveTab] = useState<'audit' | 'rbac' | 'facility'>('audit');

  const permissions = [
    { module: 'Interactive 3D Anatomy Visualizer', superAdmin: true, doctor: true, nurse: true, patient: true },
    { module: 'Electronic Medical Records (SOAP)', superAdmin: true, doctor: true, nurse: false, patient: false },
    { module: 'Pharmacy Prescription Dispensing', superAdmin: true, doctor: false, pharmacist: true, patient: false },
    { module: 'Laboratory Diagnostics Assays', superAdmin: true, doctor: true, labTech: true, patient: false },
    { module: 'Bed Allocation & ICU Transfers', superAdmin: true, doctor: true, nurse: true, patient: false },
    { module: 'Billing & Financial Transactions', superAdmin: true, accountant: true, doctor: false, patient: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Enterprise Hospital System Administration</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            HIPAA/GDPR security audit trail, cryptographic event logging, and Role-Based Access Control (RBAC)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Enforced 256-Bit Telemetry</span>
          </span>
        </div>
      </div>

      {/* TABS */}
      <div className={`p-4 rounded-3xl border flex items-center gap-2 ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('audit');
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
            activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Security Audit Logs ({logs.length})
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('rbac');
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
            activeTab === 'rbac' ? 'bg-blue-600 text-white shadow-md' : isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          RBAC Permissions Matrix
        </button>
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Authorized Identity</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Clinical Module</th>
                  <th className="pb-3 font-semibold">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-teal-50/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-slate-400">{log.timestamp}</td>
                    <td className="py-3 font-bold">{log.userName}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-blue-500">{log.action}</td>
                    <td className="py-3 text-slate-400">{log.module}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
        }`}>
          <h3 className="font-extrabold text-sm mb-4">Enterprise Role-Based Access Control (RBAC) Architecture</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">System Module</th>
                  <th className="pb-3 font-semibold text-center">Super Admin</th>
                  <th className="pb-3 font-semibold text-center">Doctor</th>
                  <th className="pb-3 font-semibold text-center">Head Nurse</th>
                  <th className="pb-3 font-semibold text-center">Patient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissions.map((p, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 font-bold">{p.module}</td>
                    <td className="py-3.5 text-center text-emerald-500 font-bold">✓ Full</td>
                    <td className="py-3.5 text-center">{p.doctor ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-slate-300">✕</span>}</td>
                    <td className="py-3.5 text-center">{p.nurse ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-slate-300">✕</span>}</td>
                    <td className="py-3.5 text-center">{p.patient ? <span className="text-emerald-500 font-bold">✓ Read</span> : <span className="text-slate-300">✕</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

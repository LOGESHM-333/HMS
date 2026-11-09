/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeMode, ManagedUser, FacilityNode, EnterpriseSecurityConfig, AuditLog } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import {
  ShieldCheck,
  Building2,
  Users,
  Server,
  Activity,
  Lock,
  Unlock,
  AlertTriangle,
  Download,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Radio,
  Sliders,
  IndianRupee,
  TrendingUp,
  Cpu,
  Database,
  Globe,
  HardDrive,
  KeyRound,
  UserPlus,
  LogOut,
  Stethoscope,
  Heart,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';

interface SuperAdminDashboardProps {
  theme: ThemeMode;
  onLogout?: () => void;
  onSwitchToAdminPortal?: () => void;
  onSwitchToDoctorPortal?: () => void;
  onSwitchToNursePortal?: () => void;
  onSwitchToPatientPortal?: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  theme,
  onLogout,
  onSwitchToAdminPortal,
  onSwitchToDoctorPortal,
  onSwitchToNursePortal,
  onSwitchToPatientPortal
}) => {
  const isDark = theme === 'dark';

  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'rbac' | 'audit' | 'infrastructure' | 'financials'>('overview');
  const [facilities, setFacilities] = useState<FacilityNode[]>(() => db.getFacilities());
  const [users, setUsers] = useState<ManagedUser[]>(() => db.getSystemUsers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => db.getAuditLogs());
  const [securityConfig, setSecurityConfig] = useState<EnterpriseSecurityConfig>(() => db.getSecurityConfig());

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setFacilities(db.getFacilities());
      setUsers(db.getSystemUsers());
      setAuditLogs(db.getAuditLogs());
      setSecurityConfig(db.getSecurityConfig());
    });
    return unsub;
  }, []);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals state
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [lockdownModalOpen, setLockdownModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'LAB_TECH' | 'ACCOUNTANT'>('HOSPITAL_ADMIN');
  const [newUserDept, setNewUserDept] = useState('Operations & Clinical Logistics');
  const [newUserFacility, setNewUserFacility] = useState('MediCore Central Hospital (Flagship)');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3800);
  };

  // Calculations
  const totalNetworkBeds = facilities.reduce((sum, f) => sum + f.totalBeds, 0);
  const totalOccupiedBeds = facilities.reduce((sum, f) => sum + f.occupiedBeds, 0);
  const totalPhysicians = facilities.reduce((sum, f) => sum + f.dutyPhysicians, 0);
  const networkOccupancyRate = Math.round((totalOccupiedBeds / totalNetworkBeds) * 100);

  // Handlers
  const handleToggleUserStatus = (id: string) => {
    sound.playClick();
    db.toggleUserStatus(id);
    setUsers(db.getSystemUsers());
    setAuditLogs(db.getAuditLogs());
    showToast('User security status updated.');
  };

  const handleToggleUserMfa = (id: string) => {
    sound.playClick();
    db.toggleUserMfa(id);
    setUsers(db.getSystemUsers());
    setAuditLogs(db.getAuditLogs());
    showToast('Multi-Factor Authentication policy updated.');
  };

  const handleResetCredentials = (id: string) => {
    sound.playClick();
    db.resetUserCredentials(id);
    setAuditLogs(db.getAuditLogs());
    showToast('Temporary security ticket issued and logged in audit trail.');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    sound.playClick();
    db.addSystemUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      department: newUserDept,
      facility: newUserFacility,
      mfaEnabled: true,
      status: 'Active'
    });

    setUsers(db.getSystemUsers());
    setAuditLogs(db.getAuditLogs());
    setNewUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    showToast(`Administrative account created for ${newUserName}`);
  };

  const handleTriggerBackup = () => {
    sound.playClick();
    const time = db.triggerSystemBackup();
    setSecurityConfig(db.getSecurityConfig());
    setAuditLogs(db.getAuditLogs());
    showToast(`Cold storage encrypted backup snapshot created (${time})`);
  };

  const handleToggleLockdown = () => {
    sound.playClick();
    db.triggerEmergencyLockdown('Super Admin Executive Protocol Override');
    setSecurityConfig(db.getSecurityConfig());
    setAuditLogs(db.getAuditLogs());
    setLockdownModalOpen(false);
    showToast(securityConfig.lockdownActive ? 'Facility lockdown cleared.' : '🚨 Multi-Facility Lockdown Protocol Engaged');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    sound.playClick();
    db.triggerBroadcastAlert(broadcastTitle.trim(), broadcastMessage.trim());
    setAuditLogs(db.getAuditLogs());
    setBroadcastModalOpen(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
    showToast('STAT Broadcast transmitted to all hospital nodes');
  };

  const handleExportAuditDossier = () => {
    sound.playClick();
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Timestamp,User,Role,Action,Module,IP,Details"]
      .concat(auditLogs.map(a => `"${a.id}","${a.timestamp}","${a.userName}","${a.userRole}","${a.action}","${a.module}","${a.ipAddress}","${a.details.replace(/"/g, '""')}"`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MediCore_HIPAA_Audit_Dossier_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('HIPAA Audit Dossier exported as CSV');
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.department.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Audit Logs
  const filteredAudits = auditLogs.filter(a => 
    a.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.module.toLowerCase().includes(auditSearch.toLowerCase()) ||
    a.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-xs font-bold border border-teal-400/40">
          <CheckCircle2 className="w-4 h-4 text-teal-200" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Emergency Lockdown Notice Banner if active */}
      {securityConfig.lockdownActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-600 text-white shadow-2xl border-2 border-rose-400 animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white text-rose-600 rounded-2xl animate-bounce shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-widest uppercase bg-rose-800 px-2.5 py-0.5 rounded-md">
                  FACILITY LOCKDOWN ACTIVE
                </span>
                <span className="font-mono font-bold text-xs">ROOT SECURITY ENGAGED</span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-0.5">
                All external facility perimeters locked • Access restricted to Super Admin & Trauma Critical Response
              </h3>
            </div>
          </div>
          <button
            onClick={handleToggleLockdown}
            className="px-5 py-2.5 rounded-2xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shadow-md transition-all cursor-pointer"
          >
            Disengage Lockdown Protocol ✓
          </button>
        </div>
      )}

      {/* DOCR SUPER ADMIN COMMAND HEADER */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0E2035] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#1E293B] shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#142C43] dark:bg-slate-800 border border-slate-700/60 flex items-center justify-center text-teal-400 font-bold shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">Dr. Eleanor Vance, MD, CISSP</h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  SUPER ADMIN • ROOT TIER 0
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  HIPAA Security Enforced
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>Enterprise: <strong className="text-slate-700 dark:text-slate-200">MediCore Global Health System</strong></span>
                <span>•</span>
                <span>Facilities: <strong className="text-teal-600 dark:text-teal-400">{facilities.length} Hospital Nodes</strong></span>
                <span>•</span>
                <span>Census: <strong className="text-slate-700 dark:text-slate-200">{totalOccupiedBeds} / {totalNetworkBeds} Beds ({networkOccupancyRate}%)</strong></span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setNewUserModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold glass-btn-teal flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Provision Admin</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setBroadcastModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-extrabold glass-btn-ruby flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>STAT Broadcast</span>
            </button>

            <button
              onClick={handleTriggerBackup}
              className="px-4 py-2 rounded-xl text-xs font-semibold glass-btn-neutral flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Database className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Backup Snapshot</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= ENTERPRISE NAVIGATION TABS ================= */}
      <div className={`p-2 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/60 backdrop-blur-md border-slate-800' : 'bg-white/80 backdrop-blur-md border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
          {[
            { id: 'overview', label: 'Multi-Hospital Network Telemetry', icon: Building2 },
            { id: 'rbac', label: 'Role-Based Access (RBAC) Governance', icon: Users },
            { id: 'audit', label: 'HIPAA & Compliance Audit Trail', icon: FileText },
            { id: 'infrastructure', label: 'API & Server Infrastructure', icon: Server },
            { id: 'financials', label: 'Enterprise Financial Intelligence', icon: IndianRupee },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TAB 1: MULTI-HOSPITAL NETWORK TELEMETRY ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Macro KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Enterprise Inpatient Census</span>
                <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{totalOccupiedBeds}</span>
                <span className="text-xs text-slate-400 font-bold">/ {totalNetworkBeds} Beds</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div style={{ width: `${networkOccupancyRate}%` }} className="h-full bg-teal-600 dark:bg-teal-500 rounded-full" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 block">
                {networkOccupancyRate}% Total Capacity Utilization
              </span>
            </div>

            <div className={`p-5 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Active Doctors On Duty</span>
                <Stethoscope className="w-4 h-4 text-teal-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{totalPhysicians}</span>
                <span className="text-xs text-slate-400 font-bold">Doctors across 4 branches</span>
              </div>
              <span className="text-[11px] text-emerald-500 font-bold mt-4 block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Shift Coverage Optimal
              </span>
            </div>

            <div className={`p-5 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">System High-Availability</span>
                <Server className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">99.98%</span>
                <span className="text-xs text-slate-400 font-bold">Uptime (30d)</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 block">
                Express REST API: 18ms avg latency
              </span>
            </div>

            <div className={`p-5 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Enterprise Revenue (YTD)</span>
                <IndianRupee className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹14.8 Cr</span>
                <span className="text-xs font-bold text-emerald-500">+12.4% vs LY</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 block">
                92.4% Medicare / Commercial reimbursement
              </span>
            </div>
          </div>

          {/* Facility Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Connected Multi-Facility Hospital Nodes</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">Live Telemetry Synchronized</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facilities.map(fac => {
                const occRate = Math.round((fac.occupiedBeds / fac.totalBeds) * 100);
                const icuRate = Math.round((fac.icusOccupied / fac.icusTotal) * 100);

                return (
                  <div
                    key={fac.id}
                    className={`p-6 rounded-3xl border transition-all ${
                      isDark ? 'bg-slate-900/75 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{fac.name}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            fac.status === 'Optimal' 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : fac.status === 'High Load'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}>
                            {fac.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{fac.city} • {fac.type}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-500 block">Doctors</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">{fac.dutyPhysicians} On Duty</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">Inpatient Beds:</span>
                          <strong className="text-slate-900 dark:text-white">{fac.occupiedBeds} / {fac.totalBeds} ({occRate}%)</strong>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div style={{ width: `${occRate}%` }} className={`h-full rounded-full ${occRate > 90 ? 'bg-rose-500' : 'bg-teal-500'}`} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">ICU Suites:</span>
                          <strong className="text-slate-900 dark:text-white">{fac.icusOccupied} / {fac.icusTotal} ({icuRate}%)</strong>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div style={{ width: `${icuRate}%` }} className={`h-full rounded-full ${icuRate > 90 ? 'bg-rose-500' : 'bg-slate-600 dark:bg-slate-400'}`} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <span>Medical Director: <strong className="text-slate-700 dark:text-slate-300">{fac.director}</strong></span>
                      <button
                        onClick={() => showToast(`Synchronized with ${fac.name} telemetry node.`)}
                        className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline transition-all"
                      >
                        Node Telemetry →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: RBAC & USER GOVERNANCE ================= */}
      {activeTab === 'rbac' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Enterprise Role-Based Access Control (RBAC) & Identity
              </h3>
              <p className="text-xs text-slate-400">
                Grant, review, or suspend security clearance tiers across all hospital personnel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user, email, department..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="HOSPITAL_ADMIN">Hospital Admin</option>
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="LAB_TECH">Lab Technologist</option>
                <option value="ACCOUNTANT">Accountant</option>
              </select>

              <button
                onClick={() => setNewUserModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          <div className={`rounded-3xl border overflow-hidden ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'border-slate-800 text-slate-400 bg-slate-800/40' : 'border-slate-100 text-slate-500 bg-slate-50'
                  }`}>
                    <th className="p-4">User Name & Identity</th>
                    <th className="p-4">Security Role</th>
                    <th className="p-4">Department & Facility</th>
                    <th className="p-4">MFA Policy</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : u.role === 'HOSPITAL_ADMIN'
                              ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                              : u.role === 'DOCTOR'
                                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
                                : 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{u.department}</div>
                        <div className="text-[10px] text-slate-400">{u.facility}</div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleUserMfa(u.id)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            u.mfaEnabled
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                          }`}
                        >
                          {u.mfaEnabled ? '✓ 2FA Enforced' : '✕ 2FA Disabled'}
                        </button>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleResetCredentials(u.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Generate new temporary security token"
                        >
                          Rotate Key
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            u.status === 'Active'
                              ? 'border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {u.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: HIPAA COMPLIANCE & AUDIT TRAIL ================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Immutable HIPAA Security Rule (§ 164.312) Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-400">
                Cryptographically tracked clinical access, role switches, and emergency overrides
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter audit events..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <button
                onClick={handleExportAuditDossier}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dossier (CSV)</span>
              </button>
            </div>
          </div>

          <div className={`rounded-3xl border overflow-hidden ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'border-slate-800 text-slate-400 bg-slate-800/40' : 'border-slate-100 text-slate-500 bg-slate-50'
                  }`}>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin User / Role</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Domain / Module</th>
                    <th className="p-4">Audit Details & Event Log</th>
                    <th className="p-4">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {filteredAudits.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-4 font-sans font-bold text-slate-900 dark:text-white">
                        <div>{log.userName}</div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">{log.userRole}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded font-black text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-sans text-teal-600 dark:text-teal-400 font-semibold">{log.module}</td>
                      <td className="p-4 font-sans text-slate-600 dark:text-slate-300 max-w-md">{log.details}</td>
                      <td className="p-4 text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: API & INFRASTRUCTURE TELEMETRY ================= */}
      {activeTab === 'infrastructure' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Express REST Backend</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  PORT 5000 ONLINE
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">http://localhost:5000/api</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Latency:</span>
                  <strong className="text-emerald-500">18 ms</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HTTP Success Rate:</span>
                  <strong className="text-slate-900 dark:text-white">99.98%</strong>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Database & Storage Engine</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  HEALTHY
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Persistence Engine:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">LocalStorage + REST Sync</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Encryption Standard:</span>
                  <strong className="text-slate-700 dark:text-slate-300">{securityConfig.encryptionStandard.split('/')[0]}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Cold Snapshot:</span>
                  <strong className="text-slate-700 dark:text-slate-300">{securityConfig.lastBackupTime}</strong>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-3xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Emergency Protocol Controls</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">
                  ROOT CLEARANCE
                </span>
              </div>
              <div className="space-y-3 pt-1">
                <button
                  onClick={() => setLockdownModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{securityConfig.lockdownActive ? 'Disengage Facility Lockdown' : 'Emergency Facility Lockdown'}</span>
                </button>
                <button
                  onClick={handleTriggerBackup}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Trigger Cold Vault Snapshot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: FINANCIALS & MACRO ANALYTICS ================= */}
      {activeTab === 'financials' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payer Mix Breakdown</h4>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1 font-semibold">
                    <span>Commercial Insurance (Aetna, BlueCross)</span>
                    <strong className="text-teal-500">46% (₹6.8 Cr)</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full w-[46%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-semibold">
                    <span>Medicare / Medicaid CMS</span>
                    <strong className="text-slate-700 dark:text-slate-300">42% (₹6.2 Cr)</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-700 dark:bg-slate-400 rounded-full w-[42%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-semibold">
                    <span>Private & Self-Pay</span>
                    <strong className="text-slate-500 dark:text-slate-400">12% (₹1.8 Cr)</strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full w-[12%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Operating EBITDA Margin</h4>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-black text-emerald-500">24.8%</span>
                <span className="text-xs text-slate-400 font-bold">Health System Margin</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Operating expenses tracked at ₹11.1 Cr with clinical pharmaceutical procurement optimized via central hospital formulary.
              </p>
            </div>

            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hospital Revenue Cycle</h4>
              <div className="space-y-2 text-xs pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Clean Claim Acceptance:</span>
                  <strong className="text-emerald-500">97.2%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Days in Accounts Receivable (A/R):</span>
                  <strong className="text-slate-900 dark:text-white">28.4 Days</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Denial Appeal Recovery:</span>
                  <strong className="text-teal-600">84.1%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PROVISION NEW ADMIN USER ================= */}
      {newUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-base">Provision New Administrative User</h3>
              </div>
              <button onClick={() => setNewUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Wright, MD"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Hospital Email / Login ID</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. arthur.w@medicore.org"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Security Role</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="HOSPITAL_ADMIN">Hospital Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="DOCTOR">Attending Doctor</option>
                    <option value="NURSE">Head Charge Nurse</option>
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="LAB_TECH">Lab Technologist</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Assigned Department</label>
                  <input
                    type="text"
                    required
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Primary Facility Node</label>
                <select
                  value={newUserFacility}
                  onChange={e => setNewUserFacility(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {facilities.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                  <option value="MediCore Enterprise Health Network (All Facilities)">Enterprise Health Network (All Facilities)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px]">
                ℹ️  <strong>HIPAA Security Notice:</strong> Account will be provisioned with mandatory 2FA enforcement and logged to the master audit dossier.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md cursor-pointer"
                >
                  Provision User ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EMERGENCY LOCKDOWN CONFIRMATION ================= */}
      {lockdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white border-2 border-rose-500">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              <h3 className="font-black text-lg">
                {securityConfig.lockdownActive ? 'Disengage Facility Lockdown?' : 'Engage Emergency Multi-Facility Lockdown?'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {securityConfig.lockdownActive
                ? 'Disengaging lockdown will re-open standard perimeter badge readers and restore standard patient visitation.'
                : 'Engaging lockdown will immediately seal electronic facility doors, restrict network traffic, and transmit emergency notifications to trauma teams.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLockdownModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleLockdown}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Confirm Protocol Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: STAT EMERGENCY BROADCAST ================= */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white border border-rose-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Radio className="w-5 h-5 animate-pulse" />
                <h3 className="font-extrabold text-base">STAT Enterprise Broadcast</h3>
              </div>
              <button onClick={() => setBroadcastModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold block mb-1">Broadcast Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surge Triage Protocol Activated"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Clinical Directive Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. All available surgical teams report to ICU Pavilion immediately."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Broadcast to All Terminals 📡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

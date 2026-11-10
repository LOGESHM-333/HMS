/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeMode, UserRole, Patient } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { PatientDirectory } from '../patients/PatientDirectory';
import { BedManagement } from '../beds/BedManagement';
import { AppointmentManager } from '../appointments/AppointmentManager';
import { DoctorDirectory } from '../doctors/DoctorDirectory';
import { MedicalRecords } from '../emr/MedicalRecords';
import { PharmacyManager } from '../pharmacy/PharmacyManager';
import { LabManager } from '../laboratory/LabManager';
import { BillingManager } from '../billing/BillingManager';
import { StaffManagement } from '../staff/StaffManagement';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Users,
  Bed,
  Activity,
  LogIn,
  LogOut,
  Calendar,
  Clock,
  Video,
  UserPlus,
  Search,
  Bell,
  RotateCw,
  Download,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Filter,
  FileText,
  Pill,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

interface WardOverviewProps {
  theme: ThemeMode;
  currentRole: UserRole;
  initialView?: string;
  onNavigateTab?: (tab: string) => void;
  onOpenSearch?: () => void;
  onToggleTheme?: () => void;
  onSelectPatientFor3D?: (p: Patient) => void;
}

export const WardOverview: React.FC<WardOverviewProps> = ({
  theme,
  currentRole,
  initialView = 'ward-overview',
  onNavigateTab,
  onOpenSearch,
  onToggleTheme,
  onSelectPatientFor3D
}) => {
  const isDark = theme === 'dark';

  // Navigation state inside ward overview
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>(initialView);
  const [selectedWard, setSelectedWard] = useState('Ward 4, Level 2');
  const [dateFilter, setDateFilter] = useState('Today');
  const [periodFilter, setPeriodFilter] = useState('vs Previous period');
  const [wardsScope, setWardsScope] = useState('All wards');
  const [lastUpdated, setLastUpdated] = useState('2 min ago');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    if (initialView) {
      setActiveSidebarItem(initialView);
    }
  }, [initialView]);

  useEffect(() => {
    const unsub = db.subscribe(() => setDbVersion(v => v + 1));
    return unsub;
  }, []);

  // Dynamic real counts from live database
  const patientsCount = db.getPatients().length;
  const bedsList = db.getBeds();
  const occupiedBeds = bedsList.filter(b => b.status === 'Occupied').length;
  const totalBeds = bedsList.length || 16;
  const appointmentsCount = db.getAppointments().length;
  const alertsCount = db.getAlerts().filter(a => a.severity === 'critical' || a.severity === 'high').length;

  const handleRefresh = () => {
    sound.playClick();
    setIsRefreshing(true);
    db.syncWithBackend();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('Just now');
      sound.playSuccess();
    }, 600);
  };

  const handleExport = () => {
    sound.playClick();
    setExportNotice('Clinical Ward 4 Report exported as PDF & CSV successfully');
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleSidebarClick = (itemId: string) => {
    sound.playClick();
    setActiveSidebarItem(itemId);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      {/* Toast Notice */}
      {exportNotice && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-teal-600 text-white shadow-xl animate-in slide-in-from-top-4 duration-200 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-teal-200" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* MAIN CONTAINER (UNIFIED CLINICAL CONSOLE) */}
      <div className={`rounded-[32px] overflow-hidden border transition-all duration-200 flex flex-col shadow-xl min-h-[820px] relative ${
        isDark 
          ? 'bg-[#0B1726] border-slate-800 text-white' 
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* ================= MAIN CONTENT VIEWPORT ================= */}
        <main className="flex-1 p-5 lg:p-8 space-y-6 overflow-x-hidden relative z-10">
          
          {/* HEADER STRIP WITH ACTIVE MODULE BREADCRUMB */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ward 4 Console
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {activeSidebarItem === 'ward-overview' ? 'Ward Overview' : activeSidebarItem.replace('-', ' ')}
              </span>
            </div>

            {/* QUICK ACTIONS & LIVE STATUS */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search shortcut */}
              <div 
                onClick={onOpenSearch}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 text-xs cursor-pointer hover:border-slate-300 transition-colors shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
                <kbd className="ml-2 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono text-slate-500">
                  ⌘K
                </kbd>
              </div>


              {/* Bell */}
              <button
                onClick={() => sound.playClick()}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors shadow-xs"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              </button>

              {/* Avatar circle ER */}
              <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                ER
              </div>

              {/* Updated status & refresh */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Updated {lastUpdated}</span>
                <button
                  onClick={handleRefresh}
                  className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all ${
                    isRefreshing ? 'animate-spin text-teal-600' : ''
                  }`}
                  title="Refresh vitals"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Export button */}
              <button
                onClick={handleExport}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* ================= CONDITIONAL MODULE RENDERING ================= */}

          {/* 1. WARD OVERVIEW (DEFAULT CLINICAL VITALS DASHBOARD) */}
          {activeSidebarItem === 'ward-overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
                <div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Ward overview
                    </h1>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Ward 4 · {occupiedBeds} of {totalBeds} beds
                    </span>
                  </div>

                  {/* DATE & WARD FILTER PILLS */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs">
                    <button
                      onClick={() => sound.playClick()}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1.5 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dateFilter}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </button>

                    <button
                      onClick={() => sound.playClick()}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1.5 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <span className="text-slate-400">vs</span>
                      <span>{periodFilter}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </button>

                    <button
                      onClick={() => sound.playClick()}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1.5 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <span>{wardsScope}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CRITICAL ESCALATION BANNER */}
              {!alertDismissed && (
                <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed">
                      <span className="font-bold underline decoration-rose-300">Ruben Sosa</span>, bed 12, MRN 40817: oxygen saturation <span className="font-bold text-rose-600 dark:text-rose-300">91%</span> for <span className="font-bold">18</span> minutes, below the escalation threshold of 92. Respiratory registrar paged at 09:44, not yet acknowledged.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setAlertDismissed(true);
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-semibold shrink-0 px-2 py-0.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              )}

              {/* CLINICAL VITALS MATRIX (6 CARDS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* 1. HEART RATE */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    HEART RATE
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      92
                    </span>
                    <span className="text-xs text-slate-400 font-medium">bpm</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">ref 60 to 100</div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    Normal
                  </span>
                </div>

                {/* 2. BLOOD PRESSURE */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    BLOOD PRESSURE
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      148/94
                    </span>
                    <span className="text-xs text-slate-400 font-medium">mmHg</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">ref under 130/80</div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                    Stage 2
                  </span>
                </div>

                {/* 3. SPO2 */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    SPO2
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
                      91
                    </span>
                    <span className="text-xs text-slate-400 font-medium">%</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">ref 95 to 100</div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                    Low
                  </span>
                </div>

                {/* 4. TEMPERATURE */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    TEMPERATURE
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      37.8
                    </span>
                    <span className="text-xs text-slate-400 font-medium">°C</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">ref 36.1 to 37.2</div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                    Raised
                  </span>
                </div>

                {/* 5. RESPIRATORY RATE */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    RESPIRATORY RATE
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      18
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/min</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">ref 12 to 20</div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    Normal
                  </span>
                </div>

                {/* 6. NEWS2 SCORE */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    NEWS2 SCORE
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
                      6
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">ref 0 to 4</div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                    Urgent review
                  </span>
                </div>
              </div>

              {/* CLINIC / OPERATIONAL SUMMARY (4 CARDS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span>PATIENTS IN CLINIC</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                    {patientsCount}
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span>IN THE WAITING ROOM</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                    11
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span>MEDIAN WAIT</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      12
                    </span>
                    <span className="text-xs text-slate-400 font-medium">min</span>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span>OPEN ESCALATIONS</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      {alertsCount || 3}
                    </span>
                    <span className="text-xs font-bold text-rose-500 flex items-center">
                      ▲ +1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PATIENTS DIRECTORY */}
          {activeSidebarItem === 'patients' && (
            <div className="animate-in fade-in duration-200">
              <PatientDirectory
                theme={theme}
                onSelectPatientFor3D={(p) => {
                  if (onSelectPatientFor3D) onSelectPatientFor3D(p);
                }}
              />
            </div>
          )}

          {/* 3. BEDS & INPATIENT MANAGEMENT */}
          {(activeSidebarItem === 'beds' || activeSidebarItem === 'admissions' || activeSidebarItem === 'discharges') && (
            <div className="animate-in fade-in duration-200">
              <BedManagement theme={theme} />
            </div>
          )}

          {/* 4. APPOINTMENTS */}
          {activeSidebarItem === 'appointments' && (
            <div className="animate-in fade-in duration-200">
              <AppointmentManager theme={theme} />
            </div>
          )}

          {/* 5. DOCTORS DIRECTORY */}
          {activeSidebarItem === 'doctors' && (
            <div className="animate-in fade-in duration-200">
              <DoctorDirectory theme={theme} />
            </div>
          )}

          {/* 6. EMR CLINICAL RECORDS */}
          {activeSidebarItem === 'emr' && (
            <div className="animate-in fade-in duration-200">
              <MedicalRecords
                theme={theme}
                onOpen3DAnatomy={(p) => {
                  if (onSelectPatientFor3D) onSelectPatientFor3D(p);
                }}
              />
            </div>
          )}

          {/* 7. PHARMACY FORMULARY */}
          {activeSidebarItem === 'pharmacy' && (
            <div className="animate-in fade-in duration-200">
              <PharmacyManager theme={theme} />
            </div>
          )}

          {/* 8. LABORATORY & SCANS */}
          {activeSidebarItem === 'laboratory' && (
            <div className="animate-in fade-in duration-200">
              <LabManager theme={theme} />
            </div>
          )}

          {/* 9. BILLING & INVOICES */}
          {activeSidebarItem === 'billing' && (
            <div className="animate-in fade-in duration-200">
              <BillingManager theme={theme} />
            </div>
          )}

          {/* 10. STAFF ROSTERS */}
          {activeSidebarItem === 'staff' && (
            <div className="animate-in fade-in duration-200">
              <StaffManagement theme={theme} />
            </div>
          )}

          {/* 11. MONITORING / CRITICAL TELEMETRY */}
          {activeSidebarItem === 'monitoring' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Continuous Telemetry & Alarms
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bedside vital signs monitors, arterial pulse ox, ECG leads, and rapid escalation triggers.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {alertsCount || 3} Priority Alerts
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {db.getAlerts().map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      alert.severity === 'critical'
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">{alert.department}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alert.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">{alert.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{alert.actionRequired}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{alert.time}</span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          db.acknowledgeAlert(alert.id);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-800 transition-colors"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

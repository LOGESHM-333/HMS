/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeMode, UserRole, Patient } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { downloadCsvFile, CsvCell } from '../../utils/exportUtils';
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

  // Dynamic real counts from live database (Hospital Admin Operational Scope)
  const patientsList = db.getPatients();
  const patientsCount = patientsList.length;
  const activeInpatients = patientsList.filter(p => p.admissionStatus === 'Admitted' || p.admissionStatus === 'ICU').length;
  const icuPatientsCount = patientsList.filter(p => p.admissionStatus === 'ICU').length;

  const allBedsList = db.getBeds();
  const scopedBeds = wardsScope === 'All wards'
    ? allBedsList
    : allBedsList.filter(b => b.type.toLowerCase() === wardsScope.toLowerCase() || b.wardName.toLowerCase().includes(wardsScope.toLowerCase()));
  const totalBeds = scopedBeds.length;
  const occupiedBeds = scopedBeds.filter(b => b.status === 'Occupied').length;
  const availableBeds = scopedBeds.filter(b => b.status === 'Available').length;
  const cleaningBeds = scopedBeds.filter(b => b.status === 'Cleaning').length;
  const maintenanceBeds = scopedBeds.filter(b => b.status === 'Maintenance').length;
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const doctorsList = db.getDoctors();
  const doctorsAvailable = doctorsList.filter(d => d.availability === 'Available').length;
  const staffList = db.getStaff();
  const onDutyStaff = staffList.filter(s => s.status === 'On Duty').length;

  const medicinesList = db.getMedicines();
  const lowStockMeds = medicinesList.filter(m => m.stock <= m.minThreshold || m.status === 'Low Stock' || m.stock === 0);

  const labOrdersList = db.getLabOrders();
  const pendingLabsCount = labOrdersList.filter(l => l.status !== 'Completed').length;

  const invoicesList = db.getInvoices();
  const totalRevenueInr = invoicesList.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const pendingInvoices = invoicesList.filter(inv => inv.status !== 'Paid');
  const pendingRevenueInr = pendingInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);

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
    const dateStamp = new Date().toISOString().slice(0, 10);
    const scopeSlug = wardsScope.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `MediCore_Hospital_Admin_${scopeSlug}_${dateStamp}.csv`;

    const rows: CsvCell[][] = [
      ['MediCore Hospital Administration - Ward & Operations Report'],
      ['Generated At', new Date().toLocaleString('en-IN')],
      ['Active View', activeSidebarItem],
      ['Ward Scope', wardsScope],
      ['Date Filter', dateFilter],
      ['Comparison Period', periodFilter],
      [],
      ['Operational KPI', 'Value', 'Unit / Notes'],
      ['Ward Bed Occupancy', `${occupancyPct}%`, `${occupiedBeds} of ${totalBeds} beds occupied (${availableBeds} available, ${cleaningBeds} cleaning, ${maintenanceBeds} maintenance)`],
      ['Available Beds Ready', availableBeds, `${cleaningBeds} cleaning / turnover`],
      ['Doctors Available', `${doctorsAvailable} / ${doctorsList.length}`, `${onDutyStaff} of ${staffList.length} clinical staff on duty`],
      ['Pharmacy Low-Stock Alerts', lowStockMeds.length, `${medicinesList.length} total formulary medicines`],
      ['Pending Lab Orders', pendingLabsCount, `${labOrdersList.length} total lab orders`],
      ['Total Hospital Revenue (INR)', totalRevenueInr.toFixed(2), `${invoicesList.length} total invoices`],
      ['Pending Receivables (INR)', pendingRevenueInr.toFixed(2), `${pendingInvoices.length} unpaid invoices`],
      ['Registered Patients', patientsCount, 'Total census database'],
      ['Active Inpatients / ICU', activeInpatients, `${icuPatientsCount} in Critical ICU`],
      ['Scheduled Visits', appointmentsCount, 'Appointments across departments'],
      ['Operational Alerts', alertsCount, 'High / critical priority alerts'],
      [],
      ['Bed Inventory Details'],
      ['Bed Number', 'Ward Name', 'Bed Type', 'Status', 'Assigned Patient', 'Admitted Date'],
      ...scopedBeds.map(bed => [
        bed.bedNumber,
        bed.wardName,
        bed.type,
        bed.status,
        bed.patientName || 'Unassigned',
        bed.admittedDate || '—'
      ]),
    ];

    if (lowStockMeds.length > 0) {
      rows.push(
        [],
        ['Pharmacy Low-Stock Alerts'],
        ['Medicine Name', 'Generic Name', 'Category', 'Current Stock', 'Min Threshold', 'Status'],
        ...lowStockMeds.map(med => [
          med.name,
          med.genericName,
          med.category,
          med.stock,
          med.minThreshold,
          med.status
        ])
      );
    }

    downloadCsvFile(filename, rows);
    db.logAudit('Report Exported', 'Hospital Admin Operations', `Exported ${filename} (${scopedBeds.length} beds, ${wardsScope})`);
    sound.playSuccess();
    setExportNotice(`Downloaded ${filename}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleSidebarClick = (itemId: string) => {
    sound.playClick();
    setActiveSidebarItem(itemId);
  };

  const wardScopes = ['All wards', 'ICU', 'General', 'Surgical', 'Cardiac', 'Emergency'];

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      {/* Toast Notice */}
      {exportNotice && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-teal-600 text-white shadow-xl animate-in slide-in-from-top-4 duration-200 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-teal-200" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* MAIN CONTAINER (HOSPITAL ADMIN OPERATIONS CONSOLE) */}
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
                Hospital Admin Operations
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {activeSidebarItem === 'ward-overview' ? 'Ward & Facility Overview' : activeSidebarItem.replace('-', ' ')}
              </span>
            </div>

            {/* QUICK ACTIONS & LIVE STATUS */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search shortcut */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (onOpenSearch) {
                    onOpenSearch();
                  } else {
                    window.dispatchEvent(new CustomEvent('medicore:open-search'));
                  }
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 text-xs cursor-pointer hover:border-slate-300 transition-colors shadow-xs"
                title="Open Global Search (Ctrl+K / Cmd+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
                <kbd className="ml-2 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono text-slate-500">
                  ⌘K
                </kbd>
              </button>


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
                type="button"
                onClick={handleExport}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* ================= CONDITIONAL MODULE RENDERING ================= */}

          {/* 1. WARD OVERVIEW (HOSPITAL ADMIN OPERATIONS & CAPACITY TELEMETRY) */}
          {activeSidebarItem === 'ward-overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
                <div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Ward overview
                    </h1>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {wardsScope} · {occupiedBeds} of {totalBeds} beds occupied
                    </span>
                  </div>

                  {/* DATE & WARD FILTER PILLS */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setDateFilter(prev => prev === 'Today' ? 'Last 7 Days' : prev === 'Last 7 Days' ? 'This Month' : 'Today');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1.5 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dateFilter}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setPeriodFilter(prev => prev === 'vs Previous period' ? 'vs Last Week' : 'vs Previous period');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1.5 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-400">vs</span>
                      <span>{periodFilter}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </button>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-700 dark:text-slate-200 font-medium shadow-xs">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={wardsScope}
                        onChange={(e) => {
                          sound.playClick();
                          setWardsScope(e.target.value);
                        }}
                        className="bg-transparent outline-none cursor-pointer text-xs font-semibold pr-1"
                        aria-label="Filter Ward Scope"
                      >
                        {wardScopes.map(scope => (
                          <option key={scope} value={scope} className="text-slate-900">
                            {scope}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* HOSPITAL ADMIN OPERATIONAL CAPACITY & LOGISTICS BANNER */}
              {!alertDismissed && (
                <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-200 ${
                  lowStockMeds.length > 0 || occupancyPct >= 80
                    ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    : 'bg-slate-50/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                      lowStockMeds.length > 0 || occupancyPct >= 80 ? 'text-amber-600' : 'text-[#3B4E6A]'
                    }`} />
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      <span className="font-bold">Hospital Operations & Ward Capacity Notice:</span>{' '}
                      Currently <span className="font-bold">{occupiedBeds} of {totalBeds}</span> beds in <span className="font-semibold">{wardsScope}</span> are occupied ({occupancyPct}% utilization), with{' '}
                      <span className="font-bold text-emerald-700">{availableBeds} available</span> and{' '}
                      <span className="font-bold text-amber-700">{cleaningBeds} in housekeeping turnover</span>.{' '}
                      {lowStockMeds.length > 0 && (
                        <span>
                          Pharmacy inventory alert: <span className="font-bold text-rose-600">{lowStockMeds.length} medication(s)</span> below minimum stock threshold.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        sound.playClick();
                        if (onNavigateTab) onNavigateTab('beds');
                        else setActiveSidebarItem('beds');
                      }}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Manage Beds
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setAlertDismissed(true);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded-md hover:bg-white/70 transition-colors cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              )}

              {/* HOSPITAL ADMIN OPERATIONS MATRIX (6 EXECUTIVE KPI CARDS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* 1. WARD BED OCCUPANCY */}
                <div
                  onClick={() => (onNavigateTab ? onNavigateTab('beds') : handleSidebarClick('beds'))}
                  className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer hover:border-[#3B4E6A]/40 ${
                    isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>WARD BED OCCUPANCY</span>
                    <Bed className="w-4 h-4 text-[#3B4E6A]" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                      occupancyPct >= 85 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                    }`}>
                      {occupancyPct}%
                    </span>
                    <span className="text-xs text-slate-400 font-medium">capacity</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">{occupiedBeds} of {totalBeds} beds occupied</div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                    occupancyPct >= 85
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : occupancyPct >= 65
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {occupancyPct >= 85 ? 'Surge Load' : occupancyPct >= 65 ? 'Moderate Load' : 'Optimal Capacity'}
                  </span>
                </div>

                {/* 2. AVAILABLE BEDS & TURNOVER */}
                <div
                  onClick={() => (onNavigateTab ? onNavigateTab('beds') : handleSidebarClick('beds'))}
                  className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer hover:border-[#3B4E6A]/40 ${
                    isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>AVAILABLE BEDS READY</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {availableBeds}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">beds open</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    Cleaning: {cleaningBeds} • Maintenance: {maintenanceBeds}
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                    availableBeds === 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {availableBeds === 0 ? 'No Open Beds' : 'Ready for Admission'}
                  </span>
                </div>

                {/* 3. ON-DUTY DOCTORS & STAFF */}
                <div
                  onClick={() => (onNavigateTab ? onNavigateTab('staff') : handleSidebarClick('staff'))}
                  className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer hover:border-[#3B4E6A]/40 ${
                    isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>CLINICAL STAFF & DOCTORS</span>
                    <Stethoscope className="w-4 h-4 text-[#3B4E6A]" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {doctorsAvailable + onDutyStaff}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">active on shift</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    {doctorsAvailable}/{doctorsList.length} Physicians • {onDutyStaff}/{staffList.length} Staff On Duty
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Shift Staffed
                  </span>
                </div>

                {/* 4. PHARMACY INVENTORY ALERTS */}
                <div
                  onClick={() => (onNavigateTab ? onNavigateTab('pharmacy') : handleSidebarClick('pharmacy'))}
                  className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer hover:border-[#3B4E6A]/40 ${
                    isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>PHARMACY LOW-STOCK ALERTS</span>
                    <Pill className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                      lowStockMeds.length > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                    }`}>
                      {lowStockMeds.length}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">items flagged</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3 truncate">
                    {lowStockMeds.length > 0
                      ? `Lowest: ${lowStockMeds[0].name} (${lowStockMeds[0].stock} left)`
                      : `All ${medicinesList.length} formulary items healthy`}
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                    lowStockMeds.length > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {lowStockMeds.length > 0 ? 'Reorder Required' : 'Stock Healthy'}
                  </span>
                </div>

                {/* 5. DIAGNOSTIC LAB QUEUE */}
                <div
                  onClick={() => (onNavigateTab ? onNavigateTab('lab') : handleSidebarClick('laboratory'))}
                  className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer hover:border-[#3B4E6A]/40 ${
                    isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>LAB WORKLOAD QUEUE</span>
                    <Activity className="w-4 h-4 text-[#3B4E6A]" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {pendingLabsCount}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">pending assays</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    Total lab orders tracked: {labOrdersList.length}
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-[#3B4E6A] border border-slate-200">
                    Active Queue
                  </span>
                </div>

                {/* 6. HOSPITAL BILLING & REVENUE (INR ₹) */}
                <div
                  onClick={() => (onNavigateTab ? onNavigateTab('billing') : handleSidebarClick('billing'))}
                  className={`p-5 rounded-2xl border transition-all shadow-xs cursor-pointer hover:border-[#3B4E6A]/40 ${
                    isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>BILLING & REVENUE (INR ₹)</span>
                    <CreditCard className="w-4 h-4 text-[#3B4E6A]" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      ₹{totalRevenueInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    Pending Settlement: ₹{pendingRevenueInr.toLocaleString('en-IN')}
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                    pendingInvoices.length > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {pendingInvoices.length} Pending Invoice(s)
                  </span>
                </div>
              </div>

              {/* HOSPITAL ADMIN OPERATIONAL SUMMARY (4 CARDS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span>REGISTERED PATIENTS</span>
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
                    <span>ACTIVE INPATIENTS / ICU</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      {activeInpatients}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      (ICU: {icuPatientsCount})
                    </span>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span>SCHEDULED VISITS</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      {appointmentsCount}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">active</span>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#0E1A2A]/85 backdrop-blur-md border-slate-800 shadow-sm' : 'bg-white/90 backdrop-blur-md border-slate-200/90 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span>OPERATIONAL ALERTS</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      {alertsCount}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Priority
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
                    Hospital Operations & Escalation Monitor
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ward capacity alerts, department staffing escalations, supply shortages, and operational dispatches.
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Patient, 
  ThemeMode, 
  UserRole 
} from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  TrendingUp, 
  Users, 
  Bed, 
  Calendar, 
  UserPlus, 
  Heart, 
  Activity, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  ArrowUpRight, 
  Sparkles,
  Sliders,
  CheckCircle2,
  Building2,
  Stethoscope,
  Layers,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface AdminDashboardProps {
  theme: ThemeMode;
  currentRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onSelectPatient?: (pat: Patient) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  theme,
  currentRole,
  onNavigateTab,
  onSelectPatient
}) => {
  const isDark = theme === 'dark';
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setDbVersion(v => v + 1));
    return unsub;
  }, []);

  const alerts = db.getAlerts();
  const allPatients = db.getPatients();
  const totalPatientsCount = allPatients.length;
  const activeInpatientsCount = allPatients.filter(p => p.admissionStatus === 'Admitted' || p.admissionStatus === 'ICU').length;
  const dischargedCount = allPatients.filter(p => p.admissionStatus === 'Discharged').length;
  const allBeds = db.getBeds();
  const availableBeds = allBeds.filter(b => b.status === 'Available').length;
  const allDoctors = db.getDoctors();

  // Interactive symptoms selector state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Chest Pain', 'Fatigue', 'Dizziness'
  ]);
  const [severityLevel, setSeverityLevel] = useState<string>('Mild');
  const [trendFilter, setTrendFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [selectedDay, setSelectedDay] = useState<string>('Tue');

  const symptomsList = [
    'Dizziness', 'Chest Pain', 'Back Pain', 'Fever', 'Nausea', 'Swelling', 'Fatigue', 'Dyspnea'
  ];

  const toggleSymptom = (sym: string) => {
    sound.playClick();
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const daysData = [
    { day: 'Sun', admissions: 180 },
    { day: 'Mon', admissions: 220 },
    { day: 'Tue', admissions: 215, highlighted: true },
    { day: 'Wed', admissions: 290 },
    { day: 'Thu', admissions: 310 },
    { day: 'Fri', admissions: 260 },
    { day: 'Sat', admissions: 275 },
  ];

  // Hospital Department Capacity & Occupancy
  const departments = [
    { name: 'Intensive Care Unit (ICU)', occupied: 12, total: 14, percent: 86, status: 'High Acuity', note: '2 Ventilators Active', color: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/10' },
    { name: 'Emergency & Trauma Center', occupied: 18, total: 20, percent: 90, status: 'Inflow Active', note: '4 in triage queue', color: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Surgical Recovery (Post-Op)', occupied: 24, total: 28, percent: 86, status: 'Post-Op Rounds', note: '6 OR Handovers today', color: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-500/10' },
    { name: 'Cardiology & CCU Pavilion', occupied: 10, total: 12, percent: 83, status: 'Telemetry Active', note: 'All vitals monitored', color: 'bg-sky-400', text: 'text-sky-600', bg: 'bg-sky-500/10' },
    { name: 'General Medicine Wards', occupied: 36, total: 48, percent: 75, status: 'Normal Flow', note: '12 Beds Ready for Admission', color: 'bg-sky-600', text: 'text-sky-700', bg: 'bg-sky-500/10' },
    { name: 'Pediatrics & Maternity Wing', occupied: 12, total: 18, percent: 67, status: 'Stable Flow', note: '6 Beds Available', color: 'bg-purple-500', text: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-12">
      {/* DOCR DASHBOARD HEADER */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0E2035] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#1E293B] shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Hello, {db.getRoleName(currentRole).split(' ')[0]}
              </h1>
              <span className="p-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time hospital operations, multi-ward bed occupancy, and enterprise clinical metrics.
            </p>
          </div>

          {/* Quick action triggers */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                sound.playClick();
                onNavigateTab('patients');
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-100 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Admit Patient</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNavigateTab('appointments');
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[#3B4E6A] hover:bg-[#2E3E55] text-white shadow-xs transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Consultation</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION: HOSPITAL OPERATIONS MONITOR (ALTERNATIVE TO 3D ANATOMY) & PRIMARY KPI GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Enterprise Hospital Operations & Departmental Census */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base tracking-tight">Hospital Facility Operations & Ward Census</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Real-time departmental capacity and bed occupancy across CityCare Central</p>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onNavigateTab('beds');
                }}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-center"
              >
                <span>Bed Manager</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {departments.map((dept, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    sound.playClick();
                    onNavigateTab('beds');
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:border-sky-500/40 ${
                    isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs truncate pr-2">{dept.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${dept.bg} ${dept.text}`}>
                      {dept.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-slate-400">
                      Occupancy: <strong className="text-slate-700 dark:text-slate-200">{dept.occupied} / {dept.total} Beds</strong>
                    </span>
                    <span className="font-black text-xs">{dept.percent}%</span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div className={`h-full rounded-full ${dept.color}`} style={{ width: `${dept.percent}%` }} />
                  </div>

                  <div className="text-[10px] text-slate-400">{dept.note}</div>
                </div>
              ))}
            </div>

            {/* Facility Highlights Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Operating Theaters</span>
                <span className="font-black text-sm text-sky-600">4 / 6 Active</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">ER Wait Time</span>
                <span className="font-black text-sm text-sky-600">14 min avg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Blood Bank</span>
                <span className="font-black text-sm text-blue-600">100% Stock</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Pharmacy Stock</span>
                <span className="font-black text-sm text-purple-600">98.6% Ready</span>
              </div>
            </div>
          </div>

          {/* Recovery, Bed, and Care Efficiency Sub-Card */}
          <div className={`p-5 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#0E2035]/80 border-slate-800 text-white' 
              : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
              {/* Patient Recovery */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Overall Patient Recovery Rate
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-sky-600">86</span>
                  <span className="text-xs text-slate-400">/ 100%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-400 to-sky-600 h-full rounded-full w-[86%]" />
                </div>
              </div>

              {/* Bed Utilization */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Hospital Bed Utilization
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-amber-500">86</span>
                  <span className="text-xs text-slate-400">/ 100%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full w-[86%]" />
                </div>
              </div>

              {/* Care Efficiency Circle Badge */}
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full border-4 border-sky-500/25 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-black text-sky-600 dark:text-sky-400">92%</span>
                </div>
                <div className="text-xs">
                  <span className="font-bold block">Care Efficiency</span>
                  <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                    <div>Initial Care: 28%</div>
                    <div>Active Care: 34%</div>
                    <div>Follow-up: 30%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): 4 KPI Metric Cards + Admission Trend Graph */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 4 KPI Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Patients */}
            <div 
              onClick={() => { sound.playClick(); onNavigateTab('patients'); }}
              className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Patients</span>
                <Users className="w-4 h-4 text-sky-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight">{totalPatientsCount}</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/10 text-sky-600 flex items-center gap-0.5">
                  {activeInpatientsCount} Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">{activeInpatientsCount} Active Inpatients • {totalPatientsCount - activeInpatientsCount} Outpatients</p>
            </div>

            {/* Available Beds */}
            <div 
              onClick={() => { sound.playClick(); onNavigateTab('beds'); }}
              className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Available Beds</span>
                <Bed className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight">{availableBeds}</span>
                <span className="text-[10px] text-slate-400">/ {allBeds.length || 240} Total</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full" style={{ width: `${Math.round((availableBeds / (allBeds.length || 1)) * 100)}%` }} />
              </div>
            </div>

            {/* Duty Doctor */}
            <div 
              onClick={() => { sound.playClick(); onNavigateTab('staff'); }}
              className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Duty Doctors</span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight">{allDoctors.length}</span>
                <span className="text-[10px] text-emerald-500 font-semibold">● 100% Shift</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Active Clinical Specialists</p>
            </div>

            {/* Appointments */}
            <div 
              onClick={() => { sound.playClick(); onNavigateTab('appointments'); }}
              className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
                isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Appointments</span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight">612</span>
                <span className="text-[10px] text-blue-500 font-semibold">Today</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Avg wait time: 14 mins</p>
            </div>
          </div>

          {/* Patient Admission Trend Graph */}
          <div className={`p-5 rounded-3xl border transition-all flex-1 flex flex-col justify-between ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm">Patient Admission Trend</h3>
                <span className="text-[11px] text-slate-400">Weekly intake & discharge curve</span>
              </div>

              {/* Time filter toggle pills */}
              <div className={`flex items-center gap-1 p-1 rounded-full border text-[11px] ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                {(['Daily', 'Weekly', 'Monthly'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      sound.playClick();
                      setTrendFilter(mode);
                    }}
                    className={`px-2.5 py-0.5 rounded-full font-medium transition-all ${
                      trendFilter === mode
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Interactive Spline Chart */}
            <div className="relative h-44 w-full flex items-end justify-between px-2 pt-6">
              {/* Highlight badge for active day */}
              <div className="absolute top-0 left-[34%] -translate-x-1/2 px-2.5 py-1 rounded-full bg-[#142C43] text-white text-[11px] font-bold shadow-lg flex items-center gap-1 z-10 border border-slate-700">
                <span>Tue: 215</span>
              </div>

              {/* SVG Area spline */}
              <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="admissionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 5,60 Q 20,45 35,48 T 65,30 T 95,35 L 95,90 L 5,90 Z"
                  fill="url(#admissionGrad)"
                />
                <path
                  d="M 5,60 Q 20,45 35,48 T 65,30 T 95,35"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
              </svg>

              {/* Bar markers and interactive columns */}
              {daysData.map((d) => (
                <div
                  key={d.day}
                  onClick={() => {
                    sound.playClick();
                    setSelectedDay(d.day);
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer z-10"
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 transition-transform duration-300 group-hover:scale-125 ${
                    d.day === selectedDay 
                      ? 'bg-blue-600 border-white ring-4 ring-blue-500/20' 
                      : 'bg-white border-blue-400 dark:bg-slate-900'
                  }`} />
                  <span className={`text-[11px] font-semibold ${
                    d.day === selectedDay ? 'text-blue-600 font-bold' : 'text-slate-400'
                  }`}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HOSPITAL CLINICAL QUALITY & SAFETY GOVERNANCE INDEX */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Hospital Clinical Quality & Patient Safety Index</h3>
              <p className="text-xs text-slate-400">
                NABH & JCI quality governance metrics, infection control compliance, and care outcomes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Hospital Accreditation Score:</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>NABH Level 5 (94.8% Optimal)</span>
            </span>
          </div>
        </div>

        {/* 3 Hospital Operational Metric Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Average Length of Stay */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600">
                  -0.4 Days
                </span>
                <span className="text-xs font-semibold text-slate-400">Avg Length of Stay (ALOS)</span>
              </div>
              <div className="text-3xl font-extrabold mt-1">
                3.8 <span className="text-xs font-normal text-slate-400">days</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Hospital Target: &lt; 4.2 days</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Key Areas of Concern */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
          }`}>
            <span className="text-xs font-semibold text-slate-400">Clinical Safety Benchmark</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Infection Rate</span>
                <div className="text-xs font-bold mt-0.5 text-sky-600">0.12%</div>
                <span className="text-[9px] text-slate-400">Benchmark &lt; 0.5%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Med. Errors</span>
                <div className="text-xs font-bold mt-0.5 text-sky-600">0.00%</div>
                <span className="text-[9px] text-sky-600 font-semibold">Zero Target</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Readmissions</span>
                <div className="text-xs font-bold mt-0.5 text-blue-500">2.4%</div>
                <span className="text-[9px] text-slate-400">Optimal Range</span>
              </div>
            </div>
          </div>

          {/* Patient Satisfaction */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Patient Satisfaction (NPS)</span>
              <div className="text-3xl font-black mt-1 text-sky-600 dark:text-sky-400">
                +78 <span className="text-xs font-normal text-slate-400">NPS</span>
              </div>
              <span className="text-[10px] text-sky-500 font-semibold">96.2% Positive Feedback</span>
            </div>

            <div className="space-y-1 text-right">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 block">
                Discharge: 42m
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 block">
                Quality: Excellent
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTRASTING DIAGNOSTIC PANEL */}
      <div className="rounded-3xl p-6 bg-[#07111E] text-white border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
              Department Operations & Patient Symptom Triage Center
            </h3>
          </div>
          <span className="text-xs text-slate-400">Live Hospital Floor Status</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1 (4 cols): Patient Symptoms selector & Severity Slider */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Patients Symptoms</span>
              <span className="text-[11px] text-sky-400">Interactive Triage</span>
            </div>

            {/* Clickable Symptom Pills */}
            <div className="flex flex-wrap gap-2">
              {symptomsList.map((sym) => {
                const active = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {sym} {active && '×'}
                  </button>
                );
              })}
            </div>

            {/* Severity Level Slider */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Severity Level:</span>
                <span className={`font-bold ${
                  severityLevel === 'Severe' ? 'text-rose-500' : severityLevel === 'Moderate' ? 'text-amber-500' : 'text-sky-400'
                }`}>
                  {severityLevel}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                value={severityLevel === 'Mild' ? 1 : severityLevel === 'Moderate' ? 2 : 3}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSeverityLevel(val === 1 ? 'Mild' : val === 2 ? 'Moderate' : 'Severe');
                }}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Column 2 (5 cols): Dept. Performance - 3 Glowing Neon Cards */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Dept. Performance</span>
            <div className="grid grid-cols-3 gap-3">
              {/* Neurology - Neon Green */}
              <div className="p-3.5 rounded-2xl bg-[#0B1725] glow-card-green transition-transform hover:scale-105 cursor-pointer">
                <span className="text-[11px] font-bold text-lime-400 block">Neurology</span>
                <div className="text-2xl font-black text-lime-400 mt-2">97%</div>
                <div className="mt-2 text-[10px] text-slate-300 space-y-0.5">
                  <div>👥 72 patient</div>
                  <div>⏱ 14 min wait</div>
                </div>
              </div>

              {/* Pediatric - Neon Orange */}
              <div className="p-3.5 rounded-2xl bg-[#0B1725] glow-card-orange transition-transform hover:scale-105 cursor-pointer">
                <span className="text-[11px] font-bold text-orange-400 block">Pediatric</span>
                <div className="text-2xl font-black text-orange-400 mt-2">91%</div>
                <div className="mt-2 text-[10px] text-slate-300 space-y-0.5">
                  <div>👥 58 patient</div>
                  <div>⏱ 13 min wait</div>
                </div>
              </div>

              {/* Cardiology - Neon Cyan */}
              <div className="p-3.5 rounded-2xl bg-[#0B1725] glow-card-cyan transition-transform hover:scale-105 cursor-pointer">
                <span className="text-[11px] font-bold text-cyan-400 block">Cardiology</span>
                <div className="text-2xl font-black text-cyan-400 mt-2">95%</div>
                <div className="mt-2 text-[10px] text-slate-300 space-y-0.5">
                  <div>👥 87 patient</div>
                  <div>⏱ 12 min wait</div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 (3 cols): Critical Alerts Stream */}
          <div className="lg:col-span-3 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Critical Alerts</span>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alt) => (
                <div
                  key={alt.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <span className="text-amber-400 font-bold mr-1.5">|</span>
                    <span className="text-slate-200">{alt.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{alt.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

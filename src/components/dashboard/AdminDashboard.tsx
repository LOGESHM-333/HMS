/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Patient, 
  ThemeMode, 
  UserRole 
} from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { AnatomyViewer } from '../3d/AnatomyViewer';
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
  CheckCircle2
} from 'lucide-react';

interface AdminDashboardProps {
  theme: ThemeMode;
  currentRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onSelectPatient: (pat: Patient) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  theme,
  currentRole,
  onNavigateTab,
  onSelectPatient
}) => {
  const isDark = theme === 'dark';
  const selectedPatient = db.getSelectedPatient();
  const alerts = db.getAlerts();

  // Interactive symptoms selector state (from video 1)
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-12">
      {/* WELCOME BANNER & QUICK STATS HEADER */}
      <div className={`p-6 lg:p-8 rounded-[36px] border transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-[#0B1726] border-slate-800 text-white shadow-2xl' 
          : 'bg-white border-slate-200/80 text-[#142C43] shadow-xl'
      }`}>
        {/* Background Image of MediCore Wellness Hospital - Bright, Transparent & Well Aligned */}
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none select-none z-0 transition-all duration-300"
          style={{ 
            backgroundImage: `url('/assets/medicore-wellness-bg.jpg')`,
            backgroundPosition: 'center 25%',
            opacity: isDark ? 0.65 : 0.78,
            filter: 'brightness(1.22) contrast(1.08) saturate(1.12)',
          }}
        />
        <div className={`absolute inset-0 pointer-events-none z-0 transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-b from-[#0A1829]/40 via-transparent to-[#0A1829]/50' 
            : 'bg-gradient-to-b from-white/30 via-transparent to-white/35'
        }`} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hello! {db.getRoleName(currentRole).split(' ')[0]}
              </h1>
              <span className="p-1 rounded-full bg-teal-500/15 backdrop-blur-md text-teal-600 dark:text-teal-400">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              There is latest clinical and operational telemetry update for the last 7 days. Check now!
            </p>
          </div>

          {/* Quick action triggers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onNavigateTab('patients');
              }}
              className="px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs bg-teal-500/15 hover:bg-teal-500/25 backdrop-blur-md text-[#0C4E44] dark:text-teal-300 border border-teal-500/30"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Admit Patient</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNavigateTab('appointments');
              }}
              className="px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 bg-teal-600/90 hover:bg-teal-700 backdrop-blur-md text-white shadow-md shadow-teal-500/20 active:scale-95 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Consultation</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION: 3D ANATOMY ENGINE & PRIMARY KPI GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Interactive 3D Anatomy Visualizer */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative rounded-3xl overflow-hidden shadow-sm">
            <AnatomyViewer 
              patient={selectedPatient} 
              theme={theme} 
              initialSystem="thoracic"
            />
          </div>

          {/* Recovery, Bed, and Care Efficiency Sub-Card (from Video 1) */}
          <div className={`p-5 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#0E2035]/80 border-slate-800 text-white' 
              : 'bg-white border-teal-100/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
              {/* Patient Recovery */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Patient Recovery
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-500">86</span>
                  <span className="text-xs text-slate-400">/ 100%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full w-[86%]" />
                </div>
              </div>

              {/* Bed Utilization */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Bed Utilization
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
                <div className="relative w-14 h-14 rounded-full border-4 border-teal-500/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-black text-teal-600 dark:text-teal-400">92%</span>
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
            <div className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Patients</span>
                <Users className="w-4 h-4 text-teal-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight">1,223</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-0.5">
                  ▲ 4.3%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Active clinic & in-patient census</p>
            </div>

            {/* Available Beds */}
            <div className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Available Beds</span>
                <Bed className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight">128</span>
                <span className="text-[10px] text-slate-400">/ 240 Total</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[53%]" />
              </div>
            </div>

            {/* Duty Doctor */}
            <div className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Duty Doctor</span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight">74</span>
                <span className="text-[10px] text-emerald-500 font-semibold">● 100% Shift Coverage</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">12 surgical suites active</p>
            </div>

            {/* Appointments */}
            <div className={`p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
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

          {/* Patient Admission Trend Graph (Direct Recreation of Video 1 Chart) */}
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

      {/* CARDIOVASCULAR & BIOMARKER DETAILED REPORT (Direct recreation of Video 2) */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-teal-100/80 text-[#142C43] shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Heart className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Cardiovascular System Clinical Index</h3>
              <p className="text-xs text-slate-400">
                Risk score projection & circulatory aging algorithm
              </p>
            </div>
          </div>

          {/* Risk Score bar */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-400">Risk Score:</span>
            <div className="w-48 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 w-[30%]" />
              <div className="bg-amber-500 w-[40%]" />
              <div className="bg-rose-500 w-[30%]" />
            </div>
            <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
              ▲ High 35.4%
            </span>
          </div>
        </div>

        {/* 3 Metric Summary Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Heart age vs Chronological age */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-teal-50/40 border-teal-100/60'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-500">
                  +4 yrs
                </span>
                <span className="text-xs font-semibold text-slate-400">Heart age</span>
              </div>
              <div className="text-3xl font-extrabold mt-1">
                48 <span className="text-xs font-normal text-slate-400">yrs</span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400" />

            <div>
              <span className="text-xs font-semibold text-slate-400 block">Chronological</span>
              <div className="text-3xl font-extrabold mt-1 text-slate-600 dark:text-slate-300">
                40 <span className="text-xs font-normal text-slate-400">yrs</span>
              </div>
            </div>
          </div>

          {/* Key Areas of Concern */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-teal-50/40 border-teal-100/60'
          }`}>
            <span className="text-xs font-semibold text-slate-400">Key Areas of Concern</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                <div className="text-xs font-bold mt-0.5">110/80</div>
                <span className="text-[9px] text-emerald-500 font-semibold">Normal</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">HbA1c</span>
                <div className="text-xs font-bold mt-0.5">5.1%</div>
                <span className="text-[9px] text-teal-500 font-semibold">Optimal</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Cholesterol</span>
                <div className="text-xs font-bold mt-0.5">190 mg/dL</div>
                <span className="text-[9px] text-amber-500 font-semibold">Borderline High</span>
              </div>
            </div>
          </div>

          {/* Pulse Rate Circular Gauge */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-teal-50/40 border-teal-100/60'
          }`}>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Pulse Rate</span>
              <div className="text-3xl font-black mt-1 text-teal-600 dark:text-teal-400">
                54 <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <span className="text-[10px] text-slate-400">08:12 AM Telemetry</span>
            </div>

            <div className="space-y-1 text-right">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 block">
                Stress: Mild
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 block">
                Sleep: Good
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTRASTING DIAGNOSTIC PANEL (DIRECT RECREATION OF VIDEO 1 DARK BOTTOM BAR) */}
      <div className="rounded-3xl p-6 bg-[#07111E] text-white border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
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
              <span className="text-[11px] text-teal-400">Interactive Triage</span>
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
                  severityLevel === 'Severe' ? 'text-rose-500' : severityLevel === 'Moderate' ? 'text-amber-500' : 'text-teal-400'
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
                className="w-full accent-teal-500 cursor-pointer"
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
                  <div>⏱️ 14 min wait</div>
                </div>
              </div>

              {/* Pediatric - Neon Orange */}
              <div className="p-3.5 rounded-2xl bg-[#0B1725] glow-card-orange transition-transform hover:scale-105 cursor-pointer">
                <span className="text-[11px] font-bold text-orange-400 block">Pediatric</span>
                <div className="text-2xl font-black text-orange-400 mt-2">91%</div>
                <div className="mt-2 text-[10px] text-slate-300 space-y-0.5">
                  <div>👥 58 patient</div>
                  <div>⏱️ 13 min wait</div>
                </div>
              </div>

              {/* Cardiology - Neon Cyan */}
              <div className="p-3.5 rounded-2xl bg-[#0B1725] glow-card-cyan transition-transform hover:scale-105 cursor-pointer">
                <span className="text-[11px] font-bold text-cyan-400 block">Cardiology</span>
                <div className="text-2xl font-black text-cyan-400 mt-2">95%</div>
                <div className="mt-2 text-[10px] text-slate-300 space-y-0.5">
                  <div>👥 87 patient</div>
                  <div>⏱️ 12 min wait</div>
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

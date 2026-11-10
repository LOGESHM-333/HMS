/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Patient, ThemeMode, UserRole } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  MoreHorizontal, 
  ChevronUp, 
  ChevronDown, 
  Edit3, 
  Activity,
  Heart,
  LayoutGrid
} from 'lucide-react';

interface CityCareDashboardProps {
  theme: ThemeMode;
  currentRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onSelectPatient: (pat: Patient) => void;
  onSwitchToMediFlex?: () => void;
}

export const CityCareDashboard: React.FC<CityCareDashboardProps> = ({
  theme,
  currentRole,
  onNavigateTab,
  onSelectPatient,
  onSwitchToMediFlex
}) => {
  const isDark = theme === 'dark';
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    const unsub = db.subscribe(() => setDbVersion(v => v + 1));
    return unsub;
  }, []);

  const allPatients = db.getPatients();
  const totalPatientsCount = allPatients.length;
  const activeInpatientsCount = allPatients.filter(p => p.admissionStatus === 'Admitted' || p.admissionStatus === 'ICU').length;
  const dischargedCount = allPatients.filter(p => p.admissionStatus === 'Discharged').length;
  const allBeds = db.getBeds();
  const availableBeds = allBeds.filter(b => b.status === 'Available').length;

  const selectedPatient = db.getSelectedPatient();
  const alerts = db.getAlerts();

  // Interactive symptoms state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Dizziness', 'Chest Pain', 'Back Pain', 'Fever', 'Nausea', 'Swelling', 'Fatigue'
  ]);
  const [severity, setSeverity] = useState<number>(1); // 1: Mild, 2: Moderate, 3: Severe
  const [trendTime, setTrendTime] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [selectedDay, setSelectedDay] = useState<string>('Tue');
  const [bottomDrawerExpanded, setBottomDrawerExpanded] = useState<boolean>(true);

  const toggleSymptom = (sym: string) => {
    sound.playClick();
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const daysData = [
    { day: 'Sun', admissions: 180, x: 8, y: 70 },
    { day: 'Mon', admissions: 220, x: 22, y: 55 },
    { day: 'Tue', admissions: 215, x: 36, y: 48, active: true },
    { day: 'Wed', admissions: 290, x: 50, y: 35 },
    { day: 'Thu', admissions: 310, x: 64, y: 28 },
    { day: 'Fri', admissions: 260, x: 78, y: 45 },
    { day: 'Sat', admissions: 275, x: 92, y: 40 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CITYCARE WHITE/LIGHT CARD CONTAINER (MATCHING ATTACHED SCREENSHOT) */}
      <div className={`rounded-[36px] p-6 lg:p-8 transition-all relative overflow-hidden ${
        isDark 
          ? 'bg-[#0B1726] border border-slate-800 text-white shadow-2xl' 
          : 'bg-white border border-slate-200/80 text-[#142C43] shadow-xl'
      }`}>
        {/* Background Image of MediCore Wellness Hospital - Bright, Transparent & Well Aligned */}
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none select-none z-0 transition-all duration-300"
          style={{ 
            backgroundImage: `url('/assets/medicore-wellness-bg.jpg')`,
            backgroundPosition: 'right 20%',
            opacity: isDark ? 0.76 : 0.90,
            filter: 'brightness(1.36) contrast(1.06) saturate(1.20)',
          }}
        />
        {/* Subtle, crystal-clear gradient sheen that preserves image detail without blur */}
        <div className={`absolute inset-0 pointer-events-none z-0 transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-b from-[#0A1829]/25 via-transparent to-[#0A1829]/35' 
            : 'bg-gradient-to-b from-white/10 via-transparent to-white/15'
        }`} />

        <div className="relative z-10">
          {/* SUB-HEADER SWITCHER BAR (Management Suite Access) */}
        <div className="flex flex-wrap items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hospital Executive Live Operating System
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-500/15 backdrop-blur-md text-sky-700 dark:text-sky-300 border border-sky-500/30 shadow-xs">
              Holographic Diagnostic Active
            </span>

            <button
              onClick={() => {
                sound.playClick();
                onNavigateTab('ward');
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-500/15 hover:bg-sky-500/25 backdrop-blur-md text-sky-800 dark:text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Ward Overview (Scrub)</span>
            </button>

            {onSwitchToMediFlex && (
              <button
                onClick={() => {
                  sound.playClick();
                  onSwitchToMediFlex();
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 hover:bg-blue-500/25 backdrop-blur-md text-[#1E3A8A] dark:text-blue-300 border border-blue-500/30 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Heart className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>MediFlex Clinical View</span>
              </button>
            )}
          </div>
        </div>

        {/* TOP SECTION: LEFT ARTISTIC PROFILE & RIGHT 2X2 CARDS + CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SECTION (5.5 cols): HELLO ALEXANDRO + ANATOMICAL ART + EFFICIENCY CARD */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Hello! Alexandro
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 mb-6">
                there is latest update for the last 7 days check now!
              </p>
            </div>

            {/* HOLOGRAPHIC ANATOMY CARD (USER UPLOADED BACKGROUND, NO DISTRACTING ANIMATIONS) */}
            <div className="relative w-full rounded-[32px] min-h-[460px] flex flex-col justify-between p-6 overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-xl bg-[#091524]">
              {/* Motion Video Anatomy Background */}
              <video 
                src="/assets/aistudio/gemini_generated_video_c57b0b74_4bf96156.mp4" 
                poster="/assets/aistudio/image_9cc16e1f.png"
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none"
              />
              
              {/* Subtle ambient gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060D17]/95 via-[#060D17]/20 to-[#060D17]/75 pointer-events-none" />

              {/* TOP METRIC OVERLAYS: PATIENT RECOVERY ARC & BED UTILIZATION LINE */}
              <div className="relative z-10 flex items-start justify-between gap-4">
                {/* Patient Recovery Double Arc Gauge */}
                <div className="px-3.5 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 shadow-lg text-white">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Patient Recovery
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative w-9 h-9 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          stroke="#506D9C"
                          strokeWidth="3.5"
                          strokeDasharray="100"
                          strokeDashoffset="14"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="text-xl font-black text-white">
                      86<span className="text-xs font-normal text-slate-300">/100%</span>
                    </div>
                  </div>
                </div>

                {/* Bed Utilization Horizontal Indicator */}
                <div className="px-3.5 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 shadow-lg text-right text-white">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Bed Utilization
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-black text-white">
                      86<span className="text-xs font-normal text-slate-300">/100%</span>
                    </div>
                    <div className="w-24 relative pt-1">
                      <div className="absolute -top-1.5 right-3 text-orange-400 text-[10px] leading-none">
                        ▲
                      </div>
                      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full w-[86%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER SPACER - SHOWCASING THE CRISP HOLOGRAPHIC SCAN */}
              <div className="relative z-10 flex-1 my-8 flex items-center justify-between pointer-events-none px-2">
                <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-sky-500/30 text-[10px] font-mono text-sky-300">
                  SYS: NEURO-SKELETAL CENSUS
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-sky-500/30 text-[10px] font-mono text-sky-300">
                  VITALS: 118 / 64 mmHg
                </div>
              </div>

              {/* FLOATING GLASS CARD OVER LOWER SECTION: CARE EFFICIENCY EQUALIZER */}
              <div className="relative z-10 mt-2 rounded-2xl p-4 bg-black/60 dark:bg-slate-900/90 backdrop-blur-md border border-white/15 dark:border-slate-700 shadow-2xl text-white">
                {/* 92% Care Efficiency Rising Circular Badge */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[#0B1725] border-2 border-dashed border-sky-400 flex flex-col items-center justify-center shadow-lg text-white">
                    <span className="text-xs font-black text-white">92%</span>
                    <span className="text-[7px] font-bold text-sky-400 uppercase tracking-tighter">Care</span>
                  </div>
                </div>

                {/* Equalizer Waveform Bars Columns */}
                <div className="grid grid-cols-3 gap-3 pt-3 text-center">
                  {/* Initial Care */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Initial Care:: 28%
                    </span>
                    <div className="flex items-end justify-center gap-0.5 h-6">
                      {[40, 70, 50, 90, 60, 80, 45].map((h, i) => (
                        <span 
                          key={i} 
                          style={{ height: `${h}%` }} 
                          className="w-1 bg-slate-400 rounded-full" 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Active Care */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Active Care: 34%
                    </span>
                    <div className="flex items-end justify-center gap-0.5 h-6">
                      {[60, 95, 80, 100, 75, 90, 85].map((h, i) => (
                        <span 
                          key={i} 
                          style={{ height: `${h}%` }} 
                          className="w-1 bg-cyan-400 rounded-full" 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Follow-up Care */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Follow-up Care: 30%
                    </span>
                    <div className="flex items-end justify-center gap-0.5 h-6">
                      {[30, 60, 45, 75, 50, 70, 40].map((h, i) => (
                        <span 
                          key={i} 
                          style={{ height: `${h}%` }} 
                          className="w-1 bg-slate-400 rounded-full" 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION (6.5 cols): 4 KPI CARDS (2X2) + PATIENT ADMISSION TREND GRAPH */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-6">
            {/* 4 KPI CARDS IN 2X2 GRID */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: Total Patients */}
              <div 
                onClick={() => { sound.playClick(); onNavigateTab('patients'); }}
                className={`p-5 rounded-3xl border transition-all hover:shadow-md cursor-pointer ${
                  isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Total Patients</span>
                  <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                    {activeInpatientsCount} Active
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {totalPatientsCount}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-sky-500/10 text-sky-600">
                    Live in SQL
                  </span>
                </div>
              </div>

              {/* Card 2: Available Beds */}
              <div 
                onClick={() => { sound.playClick(); onNavigateTab('beds'); }}
                className={`p-5 rounded-3xl border transition-all hover:shadow-md cursor-pointer ${
                  isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Available Beds</span>
                  <button className="text-slate-400 hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {availableBeds}
                  </span>
                  {/* Subtle curved waveform with 3 dots */}
                  <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
                    <path
                      d="M 2 16 Q 16 4 32 12 T 62 14"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    <circle cx="16" cy="9" r="2.5" fill="#475569" />
                    <circle cx="48" cy="13" r="3" fill="#0F172A" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Duty Doctor */}
              <div className={`p-5 rounded-3xl border transition-all hover:shadow-md ${
                isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
              }`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Duty Doctor</span>
                  <button className="text-slate-400 hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    74
                  </span>
                  {/* Curved orange arch from dashed line */}
                  <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
                    <path
                      d="M 2 20 L 24 20 Q 42 2 58 18"
                      stroke="#F97316"
                      strokeWidth="1.5"
                    />
                    <circle cx="2" cy="20" r="2" fill="#CBD5E1" />
                    <circle cx="24" cy="20" r="2" fill="#CBD5E1" />
                    <circle cx="58" cy="18" r="3" fill="#0F172A" />
                  </svg>
                </div>
              </div>

              {/* Card 4: Appointments */}
              <div className={`p-5 rounded-3xl border transition-all hover:shadow-md ${
                isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
              }`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Appointments</span>
                  <button className="text-slate-400 hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    612
                  </span>
                  {/* Curved blue dotted arch */}
                  <svg width="64" height="24" viewBox="0 0 64 24" fill="none">
                    <path
                      d="M 2 20 L 24 20 Q 42 4 60 18"
                      stroke="#3B82F6"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    <circle cx="2" cy="20" r="2" fill="#CBD5E1" />
                    <circle cx="24" cy="20" r="2" fill="#CBD5E1" />
                    <circle cx="60" cy="18" r="3" fill="#0F172A" />
                  </svg>
                </div>
              </div>
            </div>

            {/* PATIENT ADMISSION TREND AREA CHART (EXACT TO ATTACHED IMAGE) */}
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/50 backdrop-blur-md border-slate-800/80 shadow-xs' : 'bg-white/65 backdrop-blur-md border-white/80 shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                  Patient Admission Trend
                </h3>

                {/* Filter toggle pills: Daily, Weekly, Daily/Monthly */}
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-xs">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setTrendTime('Daily');
                    }}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      trendTime === 'Daily' ? 'bg-black/90 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setTrendTime('Weekly');
                    }}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      trendTime === 'Weekly' ? 'bg-black/90 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setTrendTime('Monthly');
                    }}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      trendTime === 'Monthly' ? 'bg-black/90 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Area spline chart container */}
              <div className="relative h-56 w-full flex">
                {/* Y-Axis numbers (400, 300, 200, 100, 0) */}
                <div className="w-8 flex flex-col justify-between text-[11px] text-slate-400 font-medium pb-6 select-none">
                  <span>400</span>
                  <span>300</span>
                  <span>200</span>
                  <span>100</span>
                  <span>0</span>
                </div>

                {/* Chart plotting viewport */}
                <div className="relative flex-1 h-full pb-6">
                  {/* Grid background lines */}
                  <div className="absolute inset-x-0 bottom-6 top-2 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-slate-100 dark:border-slate-800 w-full" />
                    <div className="border-b border-slate-100 dark:border-slate-800 w-full" />
                    <div className="border-b border-slate-100 dark:border-slate-800 w-full" />
                    <div className="border-b border-slate-100 dark:border-slate-800 w-full" />
                    <div className="border-b border-slate-200 dark:border-slate-700 w-full" />
                  </div>

                  {/* SVG Chart Graphic */}
                  <svg className="w-full h-[calc(100%-24px)] overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cityCareAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <stop offset="60%" stopColor="#60A5FA" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.0" />
                      </linearGradient>
                      {/* Vertical highlight pillar for Tue */}
                      <linearGradient id="tueColumnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Glowing highlight column for Tue (x=36) */}
                    <rect x="33" y="25" width="6" height="75" fill="url(#tueColumnGrad)" rx="3" />

                    {/* Area fill */}
                    <path
                      d="M 5,65 Q 18,50 36,45 T 64,25 T 95,30 L 95,100 L 5,100 Z"
                      fill="url(#cityCareAreaGrad)"
                    />
                    {/* Upper Blue Stroke */}
                    <path
                      d="M 5,65 Q 18,50 36,45 T 64,25 T 95,30"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                    />
                    {/* Secondary dotted baseline curve */}
                    <path
                      d="M 5,72 Q 22,60 36,58 T 64,48 T 95,45"
                      fill="none"
                      stroke="#93C5FD"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />

                    {/* Marker at Tue */}
                    <circle cx="36" cy="45" r="3.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                  </svg>

                  {/* Floating tooltip badge: "215" on Tuesday */}
                  <div className="absolute top-[28%] left-[36%] -translate-x-1/2 -translate-y-full px-3 py-1 rounded-full bg-black text-white text-[11px] font-bold shadow-xl border border-slate-800 z-10 flex items-center justify-center">
                    215
                  </div>

                  {/* X-Axis Day Labels */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-xs font-semibold text-slate-500">
                    {daysData.map(d => (
                      <button
                        key={d.day}
                        onClick={() => {
                          sound.playClick();
                          setSelectedDay(d.day);
                        }}
                        className={`transition-colors ${
                          d.day === selectedDay 
                            ? 'text-black dark:text-white font-black' 
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {d.day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: HIGH CONTRAST SLEEK DARK CONTAINER (MATCHING ATTACHED SCREENSHOT) */}
        <div className="relative mt-8 rounded-[32px] bg-[#060D17] text-white p-6 sm:p-8 shadow-2xl border border-slate-800/80">
          {/* TOP CENTER EXPAND/COLLAPSE NOTCH */}
          <button
            onClick={() => {
              sound.playClick();
              setBottomDrawerExpanded(prev => !prev);
            }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-[#060D17] border border-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1 shadow-md"
          >
            {bottomDrawerExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {bottomDrawerExpanded && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
              {/* COLUMN 1 (4 cols): PATIENTS SYMPTOMS */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold tracking-tight text-slate-200">
                    Patients Symptoms
                  </h4>
                </div>

                {/* Symptom chips with x */}
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-[#111C2B] hover:bg-[#1A2A40] text-slate-300 border border-slate-800/80 transition-all flex items-center gap-1.5"
                    >
                      <span>{sym}</span>
                      <span className="text-slate-400 text-sm leading-none">×</span>
                    </button>
                  ))}
                </div>

                {/* Severity Level with orange knob slider */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Severity Level: <strong className="text-white">{severity === 1 ? 'Mild' : severity === 2 ? 'Moderate' : 'Severe'}</strong></span>
                  </div>
                  <div className="relative w-full flex items-center">
                    <div className="w-full h-1 bg-slate-800 rounded-full" />
                    <input
                      type="range"
                      min="1"
                      max="3"
                      value={severity}
                      onChange={(e) => {
                        sound.playClick();
                        setSeverity(parseInt(e.target.value));
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    {/* Orange Indicator Knob */}
                    <div 
                      style={{ left: severity === 1 ? '30%' : severity === 2 ? '60%' : '90%' }}
                      className="absolute -translate-x-1/2 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md pointer-events-none transition-all"
                    />
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="flex items-center gap-3 pt-3">
                  <button 
                    onClick={() => {
                      sound.playClick();
                      onNavigateTab('patients');
                    }}
                    className="px-6 py-2 rounded-full text-xs font-bold bg-[#111C2B] hover:bg-[#1C2D44] text-white border border-slate-700 transition-all shadow-xs"
                  >
                    Continue
                  </button>
                  <button 
                    onClick={() => sound.playClick()}
                    className="w-8 h-8 rounded-full bg-[#111C2B] hover:bg-[#1C2D44] text-slate-300 border border-slate-700 flex items-center justify-center transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* COLUMN 2 (5 cols): DEPT. PERFORMANCE (3 NEON CARDS) */}
              <div className="lg:col-span-5 space-y-3">
                <h4 className="text-sm font-bold tracking-tight text-slate-200">
                  Dept. Performance
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  {/* Card 1: Neurology (Neon Lime) */}
                  <div className="p-4 rounded-2xl bg-[#091524] glow-card-green transition-transform hover:scale-105 cursor-pointer">
                    <span className="text-xs font-bold text-lime-400 block">Neurology</span>
                    <div className="text-3xl font-black text-lime-400 mt-3">97%</div>
                    <div className="mt-3 text-[11px] text-slate-300 space-y-1 font-medium">
                      <div>👤 72 patient</div>
                      <div>⏱ 14 min wait</div>
                    </div>
                  </div>

                  {/* Card 2: Pediatric (Neon Orange) */}
                  <div className="p-4 rounded-2xl bg-[#091524] glow-card-orange transition-transform hover:scale-105 cursor-pointer">
                    <span className="text-xs font-bold text-orange-400 block">Pediatric</span>
                    <div className="text-3xl font-black text-orange-400 mt-3">91%</div>
                    <div className="mt-3 text-[11px] text-slate-300 space-y-1 font-medium">
                      <div>👤 58 patient</div>
                      <div>⏱ 13 min wait</div>
                    </div>
                  </div>

                  {/* Card 3: Cardiology (Neon Cyan) */}
                  <div className="p-4 rounded-2xl bg-[#091524] glow-card-cyan transition-transform hover:scale-105 cursor-pointer">
                    <span className="text-xs font-bold text-cyan-400 block">Cardiology</span>
                    <div className="text-3xl font-black text-cyan-400 mt-3">95%</div>
                    <div className="mt-3 text-[11px] text-slate-300 space-y-1 font-medium">
                      <div>👤 87 patient</div>
                      <div>⏱ 12 min wait</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 3 (3 cols): CRITICAL ALERTS */}
              <div className="lg:col-span-3 space-y-3">
                <h4 className="text-sm font-bold tracking-tight text-slate-200">
                  Critical Alerts
                </h4>

                <div className="space-y-2">
                  {[
                    { text: 'ICU Beds Below 10%', time: '05 min ago' },
                    { text: 'Ventilator Maintenance Due', time: '15 min ago' },
                    { text: 'Blood Bank-Low', time: '18 min ago' },
                    { text: 'MRI Machine Scheduled Service', time: '35 min ago' }
                  ].map((alert, i) => (
                    <div 
                      key={i}
                      className="px-3.5 py-2.5 rounded-xl bg-[#111C2B] border border-slate-800/80 text-xs flex items-center justify-between text-slate-300"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-amber-500 font-extrabold text-sm leading-none">|</span>
                        <span className="truncate font-medium">{alert.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Patient, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Heart, 
  Activity, 
  Sun, 
  Dumbbell, 
  Coffee, 
  ChevronRight, 
  Maximize2, 
  Plus, 
  Minus,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';

interface MediFlexViewProps {
  theme: ThemeMode;
  onOpenDetails?: () => void;
}

export const MediFlexView: React.FC<MediFlexViewProps> = ({ theme, onOpenDetails }) => {
  const isDark = theme === 'dark';
  const selectedPatient = db.getSelectedPatient();
  const [activePlanTime, setActivePlanTime] = useState<'NOW' | '6AM' | '12PM' | '6PM'>('NOW');
  const [pulseRate, setPulseRate] = useState<number>(54);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOP HEADER SUMMARY BAR */}
      <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-sky-100/80 text-[#142C43] shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight">MediFlex Clinical Health Intelligence</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                Live 3D Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive Organ Physiology & Circadian Biomarker Diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Patient: <strong className="text-slate-700 dark:text-slate-200">{selectedPatient.name}</strong></span>
          <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-slate-700">
            {selectedPatient.patientCode}
          </span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT MATCHING DRIBBLE MEDIFLEX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 3D ORGAN SYSTEM (DIGESTIVE / STOMACH) & CARDIO REPORT (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main 3D Card: Stomach Function in Digestion */}
          <div className={`rounded-3xl border overflow-hidden p-6 relative transition-all ${
            isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="max-w-md mb-4">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Stomach Function in Digestion
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                The stomach helps in digestion by mixing food with acids and enzymes that break it down into a soft semi-liquid form.
              </p>
              <button 
                onClick={() => {
                  sound.playClick();
                  onOpenDetails?.();
                }}
                className="mt-3 px-4 py-2 rounded-full text-xs font-bold bg-[#E2F0FE] hover:bg-[#CFE5FD] text-[#1E3A8A] transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>View details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Holographic Anatomy Display with User Background Image */}
            <div className="relative rounded-2xl overflow-hidden mt-4 border border-slate-200 dark:border-slate-800 min-h-[380px] flex flex-col justify-between p-6 bg-[#081220] shadow-inner">
              {/* Motion Video Anatomy Background */}
              <video 
                src="/assets/aistudio/gemini_generated_video_c57b0b74_4bf96156.mp4" 
                poster="/assets/aistudio/image_9cc16e1f.png"
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060D17]/90 via-[#060D17]/20 to-[#060D17]/70 pointer-events-none" />

              {/* Floating Anatomy Hotspots & Readouts */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white text-xs font-mono">
                  <span className="text-cyan-400 font-bold mr-1.5">●</span>
                  DIGESTIVE & CARDIOVASCULAR SCAN
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono">
                    HR: 118 bpm
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-sky-300 text-[11px] font-mono">
                    BP: 64 mmHg
                  </span>
                </div>
              </div>

              {/* Interactive Organ Hotspot Badges */}
              <div className="relative z-10 flex flex-wrap gap-2 pt-24 pb-4">
                <div className="px-3 py-1 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs font-semibold shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Stomach & Gastric Acid: Normal</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-sky-950/80 backdrop-blur-md border border-sky-400/40 text-sky-200 text-xs font-semibold shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span>Thoracic Spine: Aligned</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-950/80 backdrop-blur-md border border-blue-400/40 text-blue-200 text-xs font-semibold shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Intestinal Motility: Optimal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cardiovascular System Report Card */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <h4 className="font-extrabold text-sm tracking-tight">Cardiovascular System Report</h4>
              </div>
              <span className="text-xs text-slate-400">Cardio Risk Metric</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 items-center">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Risk Score</span>
                <div className="text-4xl font-black mt-1 text-slate-900 dark:text-white">
                  18.4 <span className="text-sm font-normal text-slate-400">/ 100</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-amber-500">Moderate Risk</span>
                    <span className="text-slate-400">Range: 10 - 25</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 w-[20%]" />
                    <div className="bg-amber-400 w-[30%]" />
                    <div className="bg-rose-500 w-[50%]" />
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#F0F7FD] border-sky-100/60'
              }`}>
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Clinical Assessment</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Cardiovascular arterial elasticity indicates mild left-ventricular strain. Regular aerobic activity and dietary sodium reduction are advised.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CARDIO METRICS, KEY AREAS OF CONCERN, CIRCADIAN HEALTH PLAN & PULSE (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Cardiovascular Header with Heart Age & Beating Visual */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-extrabold text-sm tracking-tight">Cardiovascular System</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">High</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500">
                  35.4%
                </span>
              </div>
            </div>

            {/* Heart Age Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#F0F7FD] border-sky-100/60'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-500">
                    +4 yrs
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">Heart age</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  48 <span className="text-xs font-normal text-slate-400">yrs</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-[#F0F7FD] border-sky-100/60'
              }`}>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Chronological</span>
                <div className="text-3xl font-extrabold text-slate-600 dark:text-slate-300">
                  40 <span className="text-xs font-normal text-slate-400">yrs</span>
                </div>
              </div>
            </div>

            {/* Beating Heart Crystal Banner */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-between shadow-md shadow-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Heart className="w-6 h-6 fill-white text-white animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-extrabold">Ejection Fraction: 62%</div>
                  <div className="text-[10px] text-white/80">Normal systolic function verified</div>
                </div>
              </div>
              <button 
                onClick={() => sound.playClick()}
                className="px-3 py-1.5 rounded-full bg-white text-blue-700 text-xs font-bold hover:bg-blue-50 transition-all shadow-xs"
              >
                View report
              </button>
            </div>
          </div>

          {/* Key Areas of Concern (3 cards: Blood Pressure, HbA1c, Cholesterol) */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Key Areas of Concern
            </span>
            <div className="grid grid-cols-3 gap-3">
              {/* Card 1: Blood Pressure */}
              <div className={`p-4 rounded-2xl border transition-all hover:scale-105 cursor-pointer ${
                isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <span className="text-[10px] font-semibold text-slate-400 block">Blood Pressure</span>
                <div className="text-base font-extrabold mt-1 text-slate-900 dark:text-white">110/80</div>
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Normal</span>
                </div>
              </div>

              {/* Card 2: HbA1c */}
              <div className={`p-4 rounded-2xl border transition-all hover:scale-105 cursor-pointer ${
                isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <span className="text-[10px] font-semibold text-slate-400 block">HbA1c</span>
                <div className="text-base font-extrabold mt-1 text-slate-900 dark:text-white">5.1%</div>
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">Optimal</span>
                </div>
              </div>

              {/* Card 3: Cholesterol */}
              <div className={`p-4 rounded-2xl border transition-all hover:scale-105 cursor-pointer ${
                isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
              }`}>
                <span className="text-[10px] font-semibold text-slate-400 block">Cholesterol</span>
                <div className="text-base font-extrabold mt-1 text-slate-900 dark:text-white">190 mg/dL</div>
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Borderline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Plan Card with ECG Spline */}
          <div className={`p-5 rounded-3xl border transition-all ${
            isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-extrabold text-sm tracking-tight">Circadian Health Plan</h4>
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <Dumbbell className="w-3.5 h-3.5 text-cyan-500" />
                <Coffee className="w-3.5 h-3.5 text-orange-500" />
              </div>
            </div>

            {/* ECG Red Line Graph Simulation */}
            <div className="relative h-24 w-full bg-slate-50 dark:bg-slate-900/60 rounded-2xl overflow-hidden p-2 flex items-center">
              <svg className="w-full h-full" viewBox="0 0 300 80">
                <path
                  d="M 0,40 L 40,40 L 50,20 L 60,60 L 70,30 L 80,45 L 90,40 L 150,40 L 160,10 L 170,70 L 180,25 L 190,50 L 200,40 L 250,40 L 260,15 L 270,65 L 280,35 L 300,40"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute right-4 top-3 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold">
                127 bpm Now
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Min: <strong className="text-slate-700 dark:text-slate-300">80 bpm</strong></span>
              <span>Avg: <strong className="text-slate-700 dark:text-slate-300">94 bpm</strong></span>
              <span>Max: <strong className="text-slate-700 dark:text-slate-300">142 bpm</strong></span>
            </div>
          </div>

          {/* Pulse Rate Rainbow Dotted Gauge Card */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Pulse Rate Radial Sensor</span>
                <span className="text-[11px] text-slate-400">08:12 AM Sync</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
                Optimal
              </span>
            </div>

            <div className="flex items-center justify-between gap-6">
              {/* Rainbow multi-color dotted circular arc */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                    strokeDasharray="4 6"
                    className="dark:stroke-slate-800"
                  />
                  {/* Colored active arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#rainbowGradient)"
                    strokeWidth="8"
                    strokeDasharray="4 6"
                    strokeDashoffset="60"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14B8A6" />
                      <stop offset="50%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{pulseRate}</span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase">bpm</span>
                </div>
              </div>

              {/* Stress & Sleep Impact Pills */}
              <div className="space-y-2 flex-1">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-slate-400">Stress Indicator:</span>
                  <span className="font-bold text-amber-500">Mild</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-slate-400">Sleep Quality Impact:</span>
                  <span className="font-bold text-emerald-500">Good (8.2 hrs)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

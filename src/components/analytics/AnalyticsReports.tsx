/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeMode } from '../../types';
import { sound } from '../../services/audioService';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Activity, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

interface AnalyticsReportsProps {
  theme: ThemeMode;
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = () => {
    sound.playClick();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const deptMetrics = [
    { name: 'Cardiology', efficiency: 95, patients: 87, bedTurnaround: '1.8 hrs' },
    { name: 'Neurology', efficiency: 97, patients: 72, bedTurnaround: '2.1 hrs' },
    { name: 'Pediatrics', efficiency: 91, patients: 58, bedTurnaround: '1.4 hrs' },
    { name: 'Orthopedics & Spine', efficiency: 89, patients: 64, bedTurnaround: '2.6 hrs' },
    { name: 'Critical Care ICU', efficiency: 94, patients: 22, bedTurnaround: '3.8 hrs' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Hospital Clinical Analytics & KPI Reporting</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise performance metrics, length of stay (ALOS), and hospital quality accreditation indices
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{downloadSuccess ? 'Exporting CSV...' : 'Export Annual Quality Report'}</span>
        </button>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'}`}>
          <span className="text-xs text-slate-400 font-semibold">Average Length of Stay</span>
          <div className="text-2xl font-black mt-1 text-teal-600 dark:text-teal-400">3.8 days</div>
          <span className="text-[10px] text-emerald-500 font-bold">▼ 0.4 days vs Benchmark</span>
        </div>

        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'}`}>
          <span className="text-xs text-slate-400 font-semibold">30-Day Readmission</span>
          <div className="text-2xl font-black mt-1 text-blue-500">3.2%</div>
          <span className="text-[10px] text-emerald-500 font-bold">Top 5% Nationally</span>
        </div>

        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'}`}>
          <span className="text-xs text-slate-400 font-semibold">Bed Occupancy Rate</span>
          <div className="text-2xl font-black mt-1 text-amber-500">86.4%</div>
          <span className="text-[10px] text-slate-400">Optimal clinical buffer</span>
        </div>

        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'}`}>
          <span className="text-xs text-slate-400 font-semibold">Patient Satisfaction (HCAHPS)</span>
          <div className="text-2xl font-black mt-1 text-emerald-500">4.92 / 5.0</div>
          <span className="text-[10px] text-emerald-500 font-bold">98% Positive Feedback</span>
        </div>
      </div>

      {/* DEPARTMENT TABLE */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
      }`}>
        <h3 className="font-extrabold text-sm mb-4">Departmental Throughput & Quality Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Care Efficiency</th>
                <th className="pb-3 font-semibold">Active Inpatients</th>
                <th className="pb-3 font-semibold">Avg Sanitation Turnaround</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deptMetrics.map(dept => (
                <tr key={dept.name} className="hover:bg-teal-50/20 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 font-bold">{dept.name}</td>
                  <td className="py-3.5">
                    <span className="font-bold text-teal-600 dark:text-teal-400">{dept.efficiency}%</span>
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">{dept.patients} patients</td>
                  <td className="py-3.5 font-mono text-slate-400">{dept.bedTurnaround}</td>
                  <td className="py-3.5 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      Accredited
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

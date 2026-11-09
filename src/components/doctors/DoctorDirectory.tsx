/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Doctor, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Stethoscope, 
  Star, 
  Calendar, 
  Clock, 
  Users, 
  Award, 
  Filter, 
  Search, 
  CheckCircle2
} from 'lucide-react';

interface DoctorDirectoryProps {
  theme: ThemeMode;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const doctors = db.getDoctors();
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const departments = ['All', 'Pulmonology', 'Cardiology', 'Orthopedics', 'Critical Care', 'Pediatrics'];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.qualification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Medical Staff & Attending Doctors</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Certified consultants, department heads, and surgical specialists
          </p>
        </div>

        {/* Total Active count pill */}
        <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
          isDark ? 'bg-slate-900 border-slate-800 text-teal-400' : 'bg-white border-slate-200 text-teal-700 shadow-xs'
        }`}>
          <Stethoscope className="w-4 h-4" />
          <span>74 Specialists Active On-Shift</span>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by specialist name, sub-specialty, fellowship..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-2xl text-xs border outline-none ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
            }`}
          />
        </div>

        {/* Dept pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => {
                sound.playClick();
                setSelectedDept(dept);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDept === dept
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* DOCTORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-500/30"
                  />
                  <div>
                    <h3 className="font-bold text-base">{doc.name}</h3>
                    <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 block">
                      {doc.department}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span className="font-bold">{doc.rating}</span>
                      <span className="text-slate-400">({doc.patientsCount} patients)</span>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  doc.availability === 'Available'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : doc.availability === 'In Surgery'
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {doc.availability}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Specialization:</span>
                  <p className="font-medium text-slate-600 dark:text-slate-300">{doc.specialization}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Education / Fellowship:</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{doc.qualification}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Consultation Fee</span>
                <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                  ₹{doc.consultationFee} <span className="text-[10px] font-normal text-slate-400">/ session</span>
                </span>
              </div>

              <button
                onClick={() => sound.playClick()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-xs active:scale-95 transition-all"
              >
                Schedule Visit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

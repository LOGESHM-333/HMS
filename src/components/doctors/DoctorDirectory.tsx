/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  UserPlus,
  X
} from 'lucide-react';

interface DoctorDirectoryProps {
  theme: ThemeMode;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [doctors, setDoctors] = useState<Doctor[]>(() => db.getDoctors());
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const DOCS_PER_PAGE = 8;

  // New doctor form
  const [newDoc, setNewDoc] = useState({
    name: '',
    title: 'Senior Consultant',
    department: 'Cardiology',
    specialization: '',
    qualification: 'MBBS, MD',
    consultationFee: 500,
    experienceYears: 8,
  });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setDoctors(db.getDoctors());
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name.trim()) return;
    sound.playSuccess();

    const created = db.addDoctor({
      name: newDoc.name.startsWith('Dr.') ? newDoc.name : `Dr. ${newDoc.name}`,
      title: newDoc.title,
      department: newDoc.department,
      specialization: newDoc.specialization || `${newDoc.department} Specialist`,
      qualification: newDoc.qualification,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      consultationFee: Number(newDoc.consultationFee) || 500,
      experienceYears: Number(newDoc.experienceYears) || 5,
      rating: 4.9,
      patientsCount: 0,
      availability: 'Available',
      schedule: [{ day: 'Mon - Fri', hours: '09:00 - 17:00' }],
    });

    setDoctors(db.getDoctors());
    setIsAddOpen(false);
    setNewDoc({
      name: '',
      title: 'Senior Consultant',
      department: 'Cardiology',
      specialization: '',
      qualification: 'MBBS, MD',
      consultationFee: 500,
      experienceYears: 8,
    });
    showToast(`Added ${created.name} (${created.department}) to clinical roster. Stored in SQL.`);
  };

  const departments = ['All', ...Array.from(new Set(doctors.map(d => d.department))).slice(0, 7)];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.qualification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const totalPages = Math.ceil(filteredDoctors.length / DOCS_PER_PAGE) || 1;
  const paginatedDoctors = filteredDoctors.slice((currentPage - 1) * DOCS_PER_PAGE, currentPage * DOCS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-xs font-bold border border-teal-400/40">
          <CheckCircle2 className="w-4 h-4 text-teal-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Medical Staff & Attending Doctors</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Certified consultants, department heads, and surgical specialists
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Total Active count pill */}
          <div className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            isDark ? 'bg-slate-900 border-slate-800 text-teal-400' : 'bg-white border-slate-200 text-teal-700 shadow-xs'
          }`}>
            <Stethoscope className="w-4 h-4" />
            <span>{doctors.length} Specialists Active</span>
          </div>

          <button
            onClick={() => { sound.playClick(); setIsAddOpen(true); }}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Doctor</span>
          </button>
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
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
        {paginatedDoctors.map((doc) => (
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

      {/* ADD DOCTOR MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-500" />
                <h3 className="font-extrabold text-base">Register Attending Specialist / Doctor</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4 mt-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border outline-none bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Department *</label>
                  <select
                    value={newDoc.department}
                    onChange={(e) => setNewDoc({ ...newDoc, department: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border outline-none bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Emergency Medicine">Emergency Medicine</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Interventional Cardiology"
                    value={newDoc.specialization}
                    onChange={(e) => setNewDoc({ ...newDoc, specialization: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border outline-none bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Qualification</label>
                  <input
                    type="text"
                    value={newDoc.qualification}
                    onChange={(e) => setNewDoc({ ...newDoc, qualification: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border outline-none bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    value={newDoc.experienceYears}
                    onChange={(e) => setNewDoc({ ...newDoc, experienceYears: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border outline-none bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={newDoc.consultationFee}
                    onChange={(e) => setNewDoc({ ...newDoc, consultationFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border outline-none bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

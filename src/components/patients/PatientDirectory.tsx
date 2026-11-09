/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Patient, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { AnatomyViewer } from '../3d/AnatomyViewer';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Heart, 
  Activity, 
  Calendar, 
  FileText, 
  ChevronRight, 
  AlertCircle, 
  ShieldAlert, 
  X, 
  Check, 
  Clock, 
  Stethoscope, 
  Sparkles,
  Phone,
  Mail,
  Droplet,
  CreditCard,
  Printer
} from 'lucide-react';
import { DigitalHealthCardModal } from '../export';

interface PatientDirectoryProps {
  theme: ThemeMode;
  onSelectPatientFor3D: (pat: Patient) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  theme,
  onSelectPatientFor3D
}) => {
  const isDark = theme === 'dark';
  const [patients, setPatients] = useState<Patient[]>(db.getPatients());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | '3d_anatomy' | 'history'>('overview');
  const [isHealthCardOpen, setIsHealthCardOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PATIENTS_PER_PAGE = 10;

  // New patient form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: 35,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    diagnosis: '',
    symptoms: 'Fatigue, Headache',
    allergies: 'None',
    primaryDoctorId: 'doc-1',
    primaryDoctorName: 'Dr. Roger S.',
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const created = db.addPatient({
      name: newPatient.name,
      age: Number(newPatient.age),
      gender: newPatient.gender,
      bloodGroup: newPatient.bloodGroup,
      phone: newPatient.phone || '+1 (555) 000-0000',
      email: newPatient.email || `${newPatient.name.toLowerCase().replace(/\s+/g, '.')}@patient.org`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      admissionStatus: 'Outpatient',
      primaryDoctorId: newPatient.primaryDoctorId,
      primaryDoctorName: newPatient.primaryDoctorName,
      diagnosis: newPatient.diagnosis || 'General Clinical Observation',
      heartAge: Number(newPatient.age) + 2,
      chronologicalAge: Number(newPatient.age),
      riskScore: 24.5,
      vitals: {
        bloodPressure: '120/80',
        pulseRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 99,
        temperature: 36.8,
        hba1c: 5.2,
        cholesterol: 170,
        stressLevel: 'Mild',
        sleepQuality: 'Good',
        lastUpdated: 'Just now',
      },
      symptoms: newPatient.symptoms.split(',').map(s => s.trim()),
      allergies: newPatient.allergies.split(',').map(a => a.trim()),
      medicalHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          event: 'Initial Clinical Registration & Assessment',
          doctor: newPatient.primaryDoctorName,
          facility: 'MediCore Central Facility',
          notes: 'Patient onboarded successfully.',
        }
      ],
    });

    setPatients(db.getPatients());
    setSelectedPatient(created);
    setIsRegisterOpen(false);
  };

  const filteredPatients = patients.filter((pat) => {
    const matchesSearch = 
      pat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pat.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pat.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || pat.admissionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* DIRECTORY HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Patient Clinical Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive Electronic Health Records (EHR) & 3D Anatomical Diagnostics
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsRegisterOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md shadow-teal-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, MRN code, diagnosis..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className={`w-full pl-10 pr-4 py-2 rounded-2xl text-xs border outline-none transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-700 text-white focus:border-teal-400' 
                : 'bg-slate-50 border-slate-200 text-[#142C43] focus:border-teal-500'
            }`}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Outpatient', 'Admitted', 'ICU', 'Discharged'].map((status) => (
            <button
              key={status}
              onClick={() => {
                sound.playClick();
                setStatusFilter(status);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-teal-500 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* SPLIT VIEW: PATIENT LIST + DETAILED DOSSIER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredPatients.map((pat) => {
            const isSelected = selectedPatient?.id === pat.id;
            return (
              <div
                key={pat.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedPatient(pat);
                  db.setSelectedPatient(pat.id);
                  onSelectPatientFor3D(pat);
                }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer hover:scale-[1.01] ${
                  isSelected
                    ? isDark
                      ? 'bg-blue-950/70 border-teal-500/50 shadow-lg ring-1 ring-teal-500/30'
                      : 'bg-teal-50/80 border-teal-300 shadow-md ring-1 ring-teal-400/30'
                    : isDark
                    ? 'bg-[#0E2035]/60 border-slate-800 hover:bg-slate-800/50 text-white'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50 text-[#142C43] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={pat.avatar}
                      alt={pat.name}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-teal-500/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">{pat.name}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          pat.admissionStatus === 'ICU'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : pat.admissionStatus === 'Admitted'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          {pat.admissionStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        MRN: <span className="font-mono text-teal-600 dark:text-teal-400">{pat.patientCode}</span> • {pat.age} yrs • {pat.gender} • {pat.bloodGroup}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                {/* Primary Diagnosis & Vitals preview */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="truncate max-w-[240px] text-slate-500 dark:text-slate-400 font-medium">
                    {pat.diagnosis}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      {pat.vitals.pulseRate} bpm
                    </span>
                    <span className="text-slate-400">{pat.vitals.bloodPressure}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Details Column (7 cols): Full EHR Dossier */}
        <div className="lg:col-span-7">
          {selectedPatient ? (
            <div className={`p-6 rounded-3xl border transition-all space-y-6 ${
              isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-md'
            }`}>
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedPatient.avatar}
                    alt={selectedPatient.name}
                    className="w-16 h-16 rounded-3xl object-cover ring-4 ring-teal-500/20 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold">{selectedPatient.name}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">
                        {selectedPatient.patientCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span>Age: {selectedPatient.age}</span>
                      <span>•</span>
                      <span>Blood: <strong className="text-rose-500">{selectedPatient.bloodGroup}</strong></span>
                      <span>•</span>
                      <span>Doctor: {selectedPatient.primaryDoctorName}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-tab pills */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsHealthCardOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-2xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    title="View & Print Official Patient Smart Health ID Card"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Smart Health ID Card</span>
                  </button>
                  <div className={`flex items-center gap-1 p-1 rounded-2xl border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('overview');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                      activeTab === 'overview' ? 'bg-teal-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Clinical Overview
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('3d_anatomy');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                      activeTab === '3d_anatomy' ? 'bg-teal-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>3D Anatomy</span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('history');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                      activeTab === 'history' ? 'bg-teal-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Medical Timeline
                  </button>
                </div>
              </div>
              </div>

              {/* TAB 1: OVERVIEW & VITALS */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Primary Diagnosis Alert */}
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-teal-50/60 border-teal-200'
                  }`}>
                    <Stethoscope className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                        Active Working Diagnosis
                      </span>
                      <p className="font-bold text-sm mt-0.5">{selectedPatient.diagnosis}</p>
                    </div>
                  </div>

                  {/* Vitals Telemetry Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Current Telemetry Vitals
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                        <div className="text-lg font-mono font-bold mt-1">{selectedPatient.vitals.bloodPressure}</div>
                        <span className="text-[9px] text-emerald-500 font-semibold">mmHg</span>
                      </div>
                      <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block">Pulse Rate</span>
                        <div className="text-lg font-mono font-bold mt-1 text-teal-600 dark:text-teal-400">
                          {selectedPatient.vitals.pulseRate}
                        </div>
                        <span className="text-[9px] text-slate-400">bpm</span>
                      </div>
                      <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block">SpO2 Oxygen</span>
                        <div className="text-lg font-mono font-bold mt-1 text-blue-500">
                          {selectedPatient.vitals.oxygenSaturation}%
                        </div>
                        <span className="text-[9px] text-emerald-500 font-semibold">Optimal</span>
                      </div>
                      <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block">Body Temp</span>
                        <div className="text-lg font-mono font-bold mt-1">
                          {selectedPatient.vitals.temperature}°C
                        </div>
                        <span className="text-[9px] text-slate-400">Axillary</span>
                      </div>
                    </div>
                  </div>

                  {/* Symptoms & Known Allergies */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block mb-2">Reported Symptoms</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPatient.symptoms.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 block mb-2">Known Drug Allergies</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPatient.allergies.map((a, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            ⚠️ {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DEDICATED 3D ANATOMICAL INSPECTION */}
              {activeTab === '3d_anatomy' && (
                <div className="animate-in fade-in duration-300">
                  <AnatomyViewer 
                    patient={selectedPatient} 
                    theme={theme}
                    initialSystem="thoracic"
                  />
                </div>
              )}

              {/* TAB 3: MEDICAL HISTORY TIMELINE */}
              {activeTab === 'history' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Chronological Clinical Interventions
                  </h4>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-500/30">
                    {selectedPatient.medicalHistory.map((hist, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold">{hist.event}</span>
                          <span className="text-[11px] font-mono text-slate-400">{hist.date}</span>
                        </div>
                        <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                          {hist.doctor} • {hist.facility}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {hist.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-3xl border border-dashed flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <span>Select a patient from the directory to inspect records</span>
            </div>
          )}
        </div>
      </div>

      {/* NEW PATIENT REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border transition-all ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-500" />
                <h3 className="font-extrabold text-base">Register New Inpatient / Outpatient</h3>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || 30 })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Blood Group</label>
                  <select
                    value={newPatient.bloodGroup}
                    onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Primary Diagnosis / Chief Complaint</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute bronchitis & chest congestion"
                  value={newPatient.diagnosis}
                  onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Symptoms (comma separated)</label>
                  <input
                    type="text"
                    value={newPatient.symptoms}
                    onChange={(e) => setNewPatient({ ...newPatient, symptoms: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Allergies</label>
                  <input
                    type="text"
                    value={newPatient.allergies}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md active:scale-95 transition-all"
                >
                  Confirm & Generate MRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

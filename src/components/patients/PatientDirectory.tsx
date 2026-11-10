/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Printer,
  Edit3,
  Trash2,
  CheckCircle2,
  UserCheck,
  Users,
  LogOut
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
  const [patients, setPatients] = useState<Patient[]>(() => db.getPatients());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => db.getPatients()[0] || null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | '3d_anatomy' | 'history'>('overview');
  const [isHealthCardOpen, setIsHealthCardOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PATIENTS_PER_PAGE = 10;

  // Subscribe to live database updates across all portals
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      const all = db.getPatients();
      setPatients(all);
      if (selectedPatient) {
        const refreshed = all.find(p => p.id === selectedPatient.id);
        if (refreshed) setSelectedPatient(refreshed);
      }
    });
    return unsubscribe;
  }, [selectedPatient?.id]);

  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Edit patient form state
  const [editForm, setEditForm] = useState({
    name: '',
    age: 0,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'O+',
    phone: '',
    diagnosis: '',
    admissionStatus: 'Outpatient' as Patient['admissionStatus'],
    bloodPressure: '120/80',
    pulseRate: 72,
    oxygenSaturation: 98,
  });

  const handleOpenEdit = (p: Patient) => {
    sound.playClick();
    setEditForm({
      name: p.name,
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      phone: p.phone,
      diagnosis: p.diagnosis,
      admissionStatus: p.admissionStatus,
      bloodPressure: p.vitals?.bloodPressure || '120/80',
      pulseRate: p.vitals?.pulseRate || 72,
      oxygenSaturation: p.vitals?.oxygenSaturation || 98,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    sound.playSuccess();

    const updated = db.updatePatient(selectedPatient.id, {
      name: editForm.name,
      age: Number(editForm.age),
      gender: editForm.gender,
      bloodGroup: editForm.bloodGroup,
      phone: editForm.phone,
      diagnosis: editForm.diagnosis,
      admissionStatus: editForm.admissionStatus,
      vitals: {
        ...selectedPatient.vitals,
        bloodPressure: editForm.bloodPressure,
        pulseRate: Number(editForm.pulseRate),
        oxygenSaturation: Number(editForm.oxygenSaturation),
        lastUpdated: 'Just now'
      }
    });

    if (updated) setSelectedPatient(updated);
    setPatients(db.getPatients());
    setIsEditOpen(false);
    showToast(`Updated clinical record for ${editForm.name}. Saved to SQL.`);
  };

  const handleDischargeSelected = () => {
    if (!selectedPatient) return;
    const confirm = window.confirm(
      `Discharge and remove ${selectedPatient.name} (${selectedPatient.patientCode})?\n\n• Patient will be discharged from hospital.\n• Bed ${selectedPatient.bedNumber || 'Inpatient Bed'} will be released for sanitization.\n• Total active records will decrease from ${patients.length} to ${patients.length - 1} in Web and PostgreSQL Database.`
    );
    if (!confirm) return;

    sound.playClick();
    const name = selectedPatient.name;
    db.dischargePatient(selectedPatient.id);
    const refreshed = db.getPatients();
    setPatients(refreshed);
    setSelectedPatient(refreshed[0] || null);
    showToast(`Discharged & removed ${name}. Bed released. Database count updated to ${refreshed.length}.`);
  };

  const handleAdmitSelected = () => {
    if (!selectedPatient) return;
    sound.playClick();
    const updated = db.admitPatient(selectedPatient.id, 'General Medicine Ward');
    const refreshed = db.getPatients();
    setPatients(refreshed);
    if (updated) setSelectedPatient(updated);
    const newActive = refreshed.filter(p => p.admissionStatus === 'Admitted' || p.admissionStatus === 'ICU').length;
    showToast(`Admitted ${selectedPatient.name} to Inpatient Ward. Active inpatients census is now ${newActive}.`);
  };

  const handleDeleteSelected = () => {
    if (!selectedPatient) return;
    const confirm = window.confirm(`Permanently archive and delete record for ${selectedPatient.name} (${selectedPatient.patientCode})? Total patients will decrease from ${patients.length} to ${patients.length - 1}.`);
    if (!confirm) return;
    sound.playClick();
    const id = selectedPatient.id;
    db.deletePatient(id);
    const remaining = db.getPatients();
    setPatients(remaining);
    setSelectedPatient(remaining[0] || null);
    showToast(`Archived and removed ${selectedPatient.name}. Total registered records is now ${remaining.length}.`);
  };

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
    showToast(`Registered new patient ${created.name} (${created.patientCode}).`);
  };

  const totalCount = patients.length;
  const admittedCount = patients.filter(p => p.admissionStatus === 'Admitted').length;
  const icuCount = patients.filter(p => p.admissionStatus === 'ICU').length;
  const activeInpatientsCount = admittedCount + icuCount;
  const outpatientCount = patients.filter(p => p.admissionStatus === 'Outpatient').length;
  const dischargedCount = patients.filter(p => p.admissionStatus === 'Discharged').length;

  const filteredPatients = patients.filter((pat) => {
    const matchesSearch = 
      pat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pat.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pat.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'All' ? true :
      statusFilter === 'Active' ? (pat.admissionStatus === 'Admitted' || pat.admissionStatus === 'ICU') :
      pat.admissionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE) || 1;
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * PATIENTS_PER_PAGE, currentPage * PATIENTS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-sky-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-xs font-bold border border-sky-400/40">
          <CheckCircle2 className="w-4 h-4 text-sky-200" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md shadow-sky-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* EXECUTIVE CLINICAL CENSUS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Registered */}
        <div
          onClick={() => { sound.playClick(); setStatusFilter('All'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
            statusFilter === 'All'
              ? 'ring-2 ring-sky-500 bg-sky-500/10 border-sky-500/40'
              : isDark ? 'bg-[#0E2035]/70 border-slate-800 hover:bg-slate-800/40' : 'bg-white border-slate-200/80 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold">Total Registered Records</span>
            <Users className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{totalCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Live in SQL</span>
          </div>
        </div>

        {/* Admitted Inpatients */}
        <div
          onClick={() => { sound.playClick(); setStatusFilter('Admitted'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
            statusFilter === 'Admitted'
              ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500/40'
              : isDark ? 'bg-[#0E2035]/70 border-slate-800 hover:bg-slate-800/40' : 'bg-white border-slate-200/80 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold text-amber-500">General Ward Inpatients</span>
            <Activity className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">{admittedCount}</span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400 font-semibold">Occupying Beds</span>
          </div>
        </div>

        {/* ICU Critical Care */}
        <div
          onClick={() => { sound.playClick(); setStatusFilter('ICU'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
            statusFilter === 'ICU'
              ? 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500/40'
              : isDark ? 'bg-[#0E2035]/70 border-slate-800 hover:bg-slate-800/40' : 'bg-white border-slate-200/80 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold text-rose-500">Critical Care (ICU)</span>
            <Heart className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-500">{icuCount}</span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400 font-semibold">High Acuity</span>
          </div>
        </div>

        {/* Outpatients */}
        <div
          onClick={() => { sound.playClick(); setStatusFilter('Outpatient'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
            statusFilter === 'Outpatient'
              ? 'ring-2 ring-sky-500 bg-sky-500/10 border-sky-500/40'
              : isDark ? 'bg-[#0E2035]/70 border-slate-800 hover:bg-slate-800/40' : 'bg-white border-slate-200/80 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold text-sky-600">Outpatient Consults</span>
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-600">{outpatientCount}</span>
            <span className="text-[10px] text-sky-600/80 dark:text-sky-400 font-semibold">Clinic Visits</span>
          </div>
        </div>
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
                ? 'bg-slate-900 border-slate-700 text-white focus:border-sky-400' 
                : 'bg-slate-50 border-slate-200 text-[#142C43] focus:border-sky-500'
            }`}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { key: 'All', label: 'All Records', count: totalCount },
            { key: 'Active', label: 'All Inpatients', count: activeInpatientsCount },
            { key: 'Admitted', label: 'Admitted', count: admittedCount },
            { key: 'ICU', label: 'Critical ICU', count: icuCount },
            { key: 'Outpatient', label: 'Outpatient', count: outpatientCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                sound.playClick();
                setStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-sky-500 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                statusFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SPLIT VIEW: PATIENT LIST + DETAILED DOSSIER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {paginatedPatients.map((pat) => {
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
                      ? 'bg-blue-950/70 border-sky-500/50 shadow-lg ring-1 ring-sky-500/30'
                      : 'bg-sky-50/80 border-sky-300 shadow-md ring-1 ring-sky-400/30'
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
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-sky-500/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">{pat.name}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          pat.admissionStatus === 'ICU'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : pat.admissionStatus === 'Admitted'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : pat.admissionStatus === 'Discharged'
                            ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                            : 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                        }`}>
                          {pat.admissionStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        MRN: <span className="font-mono text-sky-600 dark:text-sky-400">{pat.patientCode}</span> • {pat.age} yrs • {pat.gender} • {pat.bloodGroup}
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
                    <span className="text-sky-600 dark:text-sky-400 font-bold">
                      {pat.vitals.pulseRate} bpm
                    </span>
                    <span className="text-slate-400">{pat.vitals.bloodPressure}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {filteredPatients.length > PATIENTS_PER_PAGE && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-[#0E2035]/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <span className="text-[11px] text-slate-400">
                Page {currentPage} of {totalPages} ({filteredPatients.length} records)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => { sound.playClick(); setCurrentPage(p => Math.max(1, p - 1)); }}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sky-50 dark:hover:bg-slate-800 transition-all font-semibold"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => { sound.playClick(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sky-50 dark:hover:bg-slate-800 transition-all font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                    className="w-16 h-16 rounded-3xl object-cover ring-4 ring-sky-500/20 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold">{selectedPatient.name}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
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
                    className="px-3 py-1.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
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
                      activeTab === 'overview' ? 'bg-sky-500 text-white' : 'text-slate-400'
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
                      activeTab === '3d_anatomy' ? 'bg-sky-500 text-white' : 'text-slate-400'
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
                      activeTab === 'history' ? 'bg-sky-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    Medical Timeline
                  </button>
                </div>
              </div>
              </div>

              {/* Executive Clinical Actions Bar: Status, Discharge & Edit */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold text-[11px]">Admission Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedPatient.admissionStatus === 'ICU'
                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      : selectedPatient.admissionStatus === 'Admitted'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : selectedPatient.admissionStatus === 'Discharged'
                      ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                      : 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                  }`}>
                    {selectedPatient.admissionStatus}
                  </span>
                  {selectedPatient.bedNumber && (
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      • Bed: {selectedPatient.bedNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedPatient.admissionStatus === 'Admitted' || selectedPatient.admissionStatus === 'ICU' ? (
                    <button
                      onClick={handleDischargeSelected}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Discharge Patient & Release Inpatient Bed"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Discharge Patient</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleAdmitSelected}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-sky-500/10 text-sky-600 hover:bg-sky-600 hover:text-white border border-sky-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Admit Patient to Ward"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Admit to Inpatient</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(selectedPatient)}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs glass-btn-neutral flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Edit Patient Clinical Profile & Vitals"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-500" />
                    <span>Edit Chart</span>
                  </button>

                  <button
                    onClick={handleDeleteSelected}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Archive / Delete Patient"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TAB 1: OVERVIEW & VITALS */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Primary Diagnosis Alert */}
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-sky-50/60 border-sky-200'
                  }`}>
                    <Stethoscope className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
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
                        <span className="text-[9px] text-sky-600 font-semibold">mmHg</span>
                      </div>
                      <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block">Pulse Rate</span>
                        <div className="text-lg font-mono font-bold mt-1 text-sky-600 dark:text-sky-400">
                          {selectedPatient.vitals.pulseRate}
                        </div>
                        <span className="text-[9px] text-slate-400">bpm</span>
                      </div>
                      <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block">SpO2 Oxygen</span>
                        <div className="text-lg font-mono font-bold mt-1 text-blue-500">
                          {selectedPatient.vitals.oxygenSaturation}%
                        </div>
                        <span className="text-[9px] text-sky-600 font-semibold">Optimal</span>
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
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-500/30">
                    {selectedPatient.medicalHistory.map((hist, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold">{hist.event}</span>
                          <span className="text-[11px] font-mono text-slate-400">{hist.date}</span>
                        </div>
                        <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
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
                <UserPlus className="w-5 h-5 text-sky-500" />
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Patient Gmail / Email</label>
                  <input
                    type="email"
                    placeholder="patient@gmail.com"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-[11px] flex items-center justify-between text-sky-800 dark:text-sky-300">
                <span>🔑 <strong>Patient Portal Login:</strong> Gmail / Patient Code</span>
                <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-700 font-bold">Pass: patient123</span>
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-md active:scale-95 transition-all"
                >
                  Confirm & Generate MRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT PATIENT MODAL */}
      {isEditOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border transition-all ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-500" />
                <h3 className="font-extrabold text-base">Edit Patient Profile & Vitals</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
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
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 30 })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Admission Status</label>
                  <select
                    value={editForm.admissionStatus}
                    onChange={(e) => setEditForm({ ...editForm, admissionStatus: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-bold ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                    }`}
                  >
                    <option value="Outpatient">Outpatient</option>
                    <option value="Admitted">Admitted</option>
                    <option value="ICU">ICU Critical</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Blood Group</label>
                  <select
                    value={editForm.bloodGroup}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
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
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Primary Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={editForm.diagnosis}
                  onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                />
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={editForm.bloodPressure}
                    onChange={(e) => setEditForm({ ...editForm, bloodPressure: e.target.value })}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={editForm.pulseRate}
                    onChange={(e) => setEditForm({ ...editForm, pulseRate: parseInt(e.target.value) || 72 })}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={editForm.oxygenSaturation}
                    onChange={(e) => setEditForm({ ...editForm, oxygenSaturation: parseInt(e.target.value) || 98 })}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold glass-btn-teal shadow-md cursor-pointer"
                >
                  Save Changes to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

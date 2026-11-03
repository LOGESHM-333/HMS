/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MedicalRecord, Patient, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  FileText, 
  Stethoscope, 
  Activity, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface MedicalRecordsProps {
  theme: ThemeMode;
  onOpen3DAnatomy: (patient: Patient) => void;
}

export const MedicalRecords: React.FC<MedicalRecordsProps> = ({ theme, onOpen3DAnatomy }) => {
  const isDark = theme === 'dark';
  const patients = db.getPatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0]);
  const [soapNotes, setSoapNotes] = useState({
    subjective: 'Patient reports progressive dyspnea upon moderate exertion and localized retrosternal thoracic discomfort over the past 48 hours.',
    objective: `BP: ${selectedPatient.vitals.bloodPressure} mmHg, Pulse: ${selectedPatient.vitals.pulseRate} bpm, SpO2: ${selectedPatient.vitals.oxygenSaturation}%, Temp: ${selectedPatient.vitals.temperature}°C. Bilateral vesicular breath sounds with faint wheeze at left base.`,
    assessment: selectedPatient.diagnosis,
    plan: '1. High-resolution thoracic 3D volume reconstruction.\n2. Albuterol nebulization 2.5mg TID.\n3. Daily telemetry vitals log and cardiology cross-consultation.',
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    db.logAudit('EMR Updated', 'EMR', `Updated SOAP clinical consultation chart for ${selectedPatient.name}`);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Electronic Medical Records (EMR / EHR)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Standardized SOAP clinical encounters, ICD-10 diagnostic coding, and multidisciplinary treatment notes
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onOpen3DAnatomy(selectedPatient);
          }}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Patient 3D Anatomy</span>
        </button>
      </div>

      {/* PATIENT SELECTOR BAR */}
      <div className={`p-4 rounded-3xl border flex items-center gap-3 overflow-x-auto ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <span className="text-xs font-bold text-slate-400 whitespace-nowrap pl-2">Select Chart:</span>
        {patients.map(p => {
          const isSelected = selectedPatient.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                sound.playClick();
                setSelectedPatient(p);
                setSoapNotes({
                  subjective: `Patient reports active symptoms including: ${p.symptoms.join(', ')}.`,
                  objective: `BP: ${p.vitals.bloodPressure} mmHg, Pulse: ${p.vitals.pulseRate} bpm, SpO2: ${p.vitals.oxygenSaturation}%, Temp: ${p.vitals.temperature}°C.`,
                  assessment: p.diagnosis,
                  plan: `1. Continuous vitals monitoring.\n2. Prescribed targeted pharmacological therapy.\n3. Follow up with ${p.primaryDoctorName}.`,
                });
              }}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
              }`}
            >
              <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN SOAP CONSOLE */}
      <form onSubmit={handleSaveNotes} className={`p-6 rounded-3xl border space-y-6 ${
        isDark ? 'bg-[#0E2035]/90 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-md'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">
              Clinical Documentation • Form SOAP-2026
            </span>
            <h3 className="text-xl font-extrabold mt-0.5">{selectedPatient.name} ({selectedPatient.patientCode})</h3>
            <span className="text-xs text-slate-400">Attending: {selectedPatient.primaryDoctorName} • Ward: {selectedPatient.ward || 'Outpatient'}</span>
          </div>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                Chart Saved & Synced
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md active:scale-95 transition-all"
            >
              Sign & Commit EMR
            </button>
          </div>
        </div>

        {/* 4 SOAP Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subjective */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>S</span> • Subjective (Patient Chief Complaint & History)
            </label>
            <textarea
              rows={4}
              value={soapNotes.subjective}
              onChange={(e) => setSoapNotes({ ...soapNotes, subjective: e.target.value })}
              className={`w-full p-3 rounded-2xl text-xs border outline-none leading-relaxed ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
              }`}
            />
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-teal-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>O</span> • Objective (Physical Examination & Vitals)
            </label>
            <textarea
              rows={4}
              value={soapNotes.objective}
              onChange={(e) => setSoapNotes({ ...soapNotes, objective: e.target.value })}
              className={`w-full p-3 rounded-2xl text-xs border outline-none leading-relaxed font-mono ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
              }`}
            />
          </div>

          {/* Assessment */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>A</span> • Assessment & ICD-10 Differential Diagnosis
            </label>
            <textarea
              rows={4}
              value={soapNotes.assessment}
              onChange={(e) => setSoapNotes({ ...soapNotes, assessment: e.target.value })}
              className={`w-full p-3 rounded-2xl text-xs border outline-none leading-relaxed ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
              }`}
            />
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>P</span> • Plan (Medication, Diagnostics & Follow-up)
            </label>
            <textarea
              rows={4}
              value={soapNotes.plan}
              onChange={(e) => setSoapNotes({ ...soapNotes, plan: e.target.value })}
              className={`w-full p-3 rounded-2xl text-xs border outline-none leading-relaxed ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
              }`}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

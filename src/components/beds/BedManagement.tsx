/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bed, Patient, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Bed as BedIcon, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  UserPlus, 
  LogOut, 
  Filter,
  ShieldAlert
} from 'lucide-react';

interface BedManagementProps {
  theme: ThemeMode;
}

export const BedManagement: React.FC<BedManagementProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [beds, setBeds] = useState<Bed[]>(db.getBeds());
  const patients = db.getPatients();
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [admitModalBed, setAdmitModalBed] = useState<Bed | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');

  const wards = ['All', 'Intensive Care Unit', 'Cardiology Ward 3', 'Surgical Recovery'];

  const filteredBeds = beds.filter((b) => {
    return selectedWard === 'All' || b.wardName === selectedWard;
  });

  const totalCount = beds.length;
  const availableCount = beds.filter(b => b.status === 'Available').length;
  const occupiedCount = beds.filter(b => b.status === 'Occupied').length;
  const cleaningCount = beds.filter(b => b.status === 'Cleaning').length;

  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitModalBed) return;
    sound.playClick();
    const pat = patients.find(p => p.id === selectedPatientId);
    if (pat) {
      db.allocateBed(admitModalBed.id, pat.id, pat.name);
      setBeds([...db.getBeds()]);
      setAdmitModalBed(null);
    }
  };

  const handleDischarge = (bedId: string) => {
    sound.playClick();
    db.dischargeBed(bedId);
    setBeds([...db.getBeds()]);
  };

  const handleCleanFinished = (bedId: string) => {
    sound.playClick();
    const bed = beds.find(b => b.id === bedId);
    if (bed) {
      bed.status = 'Available';
      setBeds([...beds]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Ward Infrastructure & Bed Allocation</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry of ICU, telemetry units, post-operative beds and turn-around cleaning queues
          </p>
        </div>

        {/* Capacity summary pill */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {availableCount} Available
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {occupiedCount} Occupied
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            {cleaningCount} In Sanitation
          </span>
        </div>
      </div>

      {/* WARD FILTER TABS */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between gap-4 ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          {wards.map((w) => (
            <button
              key={w}
              onClick={() => {
                sound.playClick();
                setSelectedWard(w);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedWard === w
                  ? 'bg-blue-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 hidden sm:block">
          Hospital Occupancy: <strong className="text-teal-600 dark:text-teal-400">{Math.round((occupiedCount / totalCount) * 100)}%</strong>
        </span>
      </div>

      {/* BEDS VISUAL GRID MAP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === 'Occupied';
          const isAvailable = bed.status === 'Available';
          const isCleaning = bed.status === 'Cleaning';

          return (
            <div
              key={bed.id}
              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                isOccupied
                  ? isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
                  : isAvailable
                  ? isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
                  : isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50/50 border-blue-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${
                      isOccupied ? 'bg-amber-500/20 text-amber-500' : isAvailable ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      <BedIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-mono font-black text-sm">{bed.bedNumber}</h4>
                      <span className="text-[10px] text-slate-400">{bed.wardName}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                    isOccupied ? 'bg-amber-500 text-white' : isAvailable ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {bed.status}
                  </span>
                </div>

                {isOccupied && (
                  <div className="mt-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">Current Patient</span>
                    <div className="font-bold text-sm mt-0.5">{bed.patientName}</div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Admitted: {bed.admittedDate}</span>
                  </div>
                )}

                {isCleaning && (
                  <div className="mt-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Sanitation Protocol In Progress (UV-C Sterilization)
                  </div>
                )}

                {isAvailable && (
                  <div className="mt-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Ready for Clinical Admission
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-end gap-2">
                {isAvailable && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setAdmitModalBed(bed);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs"
                  >
                    Allocate Bed
                  </button>
                )}

                {isOccupied && (
                  <button
                    onClick={() => handleDischarge(bed.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                  >
                    Discharge & Sanitize
                  </button>
                )}

                {isCleaning && (
                  <button
                    onClick={() => handleCleanFinished(bed.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  >
                    Mark Cleaned
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ALLOCATE BED MODAL */}
      {admitModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <h3 className="font-extrabold text-base mb-2">
              Allocate Bed {admitModalBed.bedNumber} ({admitModalBed.wardName})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Assign an admitted patient to this sterile ward bay
            </p>

            <form onSubmit={handleAdmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-[#142C43]'
                  }`}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.patientCode}) - {p.diagnosis}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdmitModalBed(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-md"
                >
                  Confirm Bed Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

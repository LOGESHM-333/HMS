/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bed as BedIcon, 
  Users, 
  Activity, 
  Bell, 
  BellOff, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  Wrench, 
  Map, 
  LayoutGrid, 
  UserPlus, 
  LogOut, 
  Clock, 
  Check, 
  Heart, 
  ShieldCheck, 
  Zap, 
  Filter, 
  Search,
  X,
  Building2,
  Stethoscope
} from 'lucide-react';
import { Bed, Patient, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';

export interface InteractiveWardFloorplanProps {
  theme: ThemeMode;
  onSelectPatient?: (patient: Patient) => void;
  onNavigateTab?: (tab: string) => void;
  portalRole?: 'nurse' | 'admin';
}

export const InteractiveWardFloorplan: React.FC<InteractiveWardFloorplanProps> = ({
  theme,
  onSelectPatient,
  onNavigateTab,
  portalRole = 'nurse'
}) => {
  const isDark = theme === 'dark';

  // Live state
  const [beds, setBeds] = useState<Bed[]>(() => db.getBeds());
  const patients = useMemo(() => db.getPatients(), [beds]);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setBeds([...db.getBeds()]);
    });
    return unsub;
  }, []);

  // View mode: 'floorplan' (architectural spatial map) vs 'grid' (acuity matrix)
  const [viewMode, setViewMode] = useState<'floorplan' | 'grid'>('floorplan');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Bed Modal & Quick Actions
  const [activeBedModal, setActiveBedModal] = useState<Bed | null>(null);
  const [admitModalBed, setAdmitModalBed] = useState<Bed | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [callBells, setCallBells] = useState<Record<string, boolean>>({
    'ICU-02': true
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Toggle call bell
  const toggleCallBell = (bedNumber: string) => {
    sound.playAlert();
    setCallBells(prev => ({
      ...prev,
      [bedNumber]: !prev[bedNumber]
    }));
    showToast(`Call light ${!callBells[bedNumber] ? 'ACTIVATED' : 'DISENGAGED'} for Bed ${bedNumber}`);
  };

  // Allocate bed
  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitModalBed) return;
    sound.playClick();
    const pat = patients.find(p => p.id === selectedPatientId);
    if (pat) {
      db.allocateBed(admitModalBed.id, pat.id, pat.name);
      setBeds([...db.getBeds()]);
      setAdmitModalBed(null);
      showToast(`Admitted ${pat.name} to ${admitModalBed.bedNumber} (${admitModalBed.wardName})`);
    }
  };

  // Discharge patient from bed
  const handleDischarge = (bedId: string) => {
    sound.playClick();
    db.dischargeBed(bedId);
    setBeds([...db.getBeds()]);
    setActiveBedModal(null);
    showToast(`Discharged bed #${bedId}. Queued for UV-C sanitation protocol.`);
  };

  // Mark sanitation complete
  const handleCleanFinished = (bedId: string) => {
    sound.playSuccess();
    const target = beds.find(b => b.id === bedId);
    if (target) {
      target.status = 'Available';
      target.patientName = undefined;
      target.patientId = undefined;
      setBeds([...beds]);
      setActiveBedModal(null);
      showToast(`Bed ${target.bedNumber} sanitized and marked ready for admission.`);
    }
  };

  // Spatial Zone Definitions (matching architectural wing layout)
  const ZONES: { id: string; label: string; filter: (b: Bed) => boolean }[] = [
    { id: 'All', label: 'Entire Floor', filter: () => true },
    { id: 'ICU', label: 'West: ICU Critical Suites', filter: (b: Bed) => b.type === 'ICU' || b.wardName.includes('Intensive') },
    { id: 'Cardiac', label: 'North: Cardiology Telemetry', filter: (b: Bed) => b.type === 'Cardiac' || b.wardName.includes('Cardio') },
    { id: 'Surgical', label: 'East: Surgical Recovery Bay', filter: (b: Bed) => b.type === 'Surgical' || b.wardName.includes('Surg') },
    { id: 'General', label: 'South: General & Emergency', filter: (b: Bed) => b.type === 'General' || b.type === 'Emergency' }
  ];

  // Filtering
  const filteredBeds = useMemo(() => {
    return beds.filter(b => {
      const matchSearch = !searchQuery.trim() || 
        b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.patientName && b.patientName.toLowerCase().includes(searchQuery.toLowerCase()));

      const zoneDef = ZONES.find(z => z.id === selectedZone);
      const matchZone = !zoneDef || selectedZone === 'All' || (zoneDef.filter ? zoneDef.filter(b) : true);

      return matchSearch && matchZone;
    });
  }, [beds, selectedZone, searchQuery]);

  // Aggregate Metrics
  const totalCount = beds.length;
  const occupiedCount = beds.filter(b => b.status === 'Occupied').length;
  const availableCount = beds.filter(b => b.status === 'Available').length;
  const cleaningCount = beds.filter(b => b.status === 'Cleaning' || b.status === 'Maintenance').length;
  const activeCallBellsCount = Object.values(callBells).filter(Boolean).length;
  const occupancyPercent = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-teal-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200 text-sm font-semibold border border-teal-400/40">
          <CheckCircle2 className="w-5 h-5 text-teal-200 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER CONTROLS & CAPACITY BAR */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isDark ? 'bg-[#0E2035] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#142C43] shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Interactive Ward 4 & Critical Care Floorplan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Spatial hospital matrix with real-time occupancy, bedside call lights & micro-telemetry
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Total:</span>
              <span className="font-mono text-slate-900 dark:text-white">{totalCount} Beds</span>
              <span className="text-teal-600 dark:text-teal-400 font-mono">({occupancyPercent}%)</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{availableCount} Available</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span>{occupiedCount} Occupied</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{cleaningCount} In Sanitation</span>
            </div>

            {activeCallBellsCount > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
                <Bell className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                <span>{activeCallBellsCount} Call Light Active</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLS ROW: View Switcher, Zone Pills, Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Dual View Mode Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold w-fit">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('floorplan');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'floorplan'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Architectural Floorplan</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setViewMode('grid');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Acuity Bed Matrix</span>
            </button>
          </div>

          {/* Zone Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {ZONES.map(z => {
              const isSelected = selectedZone === z.id;
              return (
                <button
                  key={z.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedZone(z.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-teal-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {z.label}
                </button>
              );
            })}
          </div>

          {/* Search filter */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search bed # or patient..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* ================= VIEW MODE 1: ARCHITECTURAL SPATIAL FLOORPLAN ================= */}
      {viewMode === 'floorplan' && (
        <div className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-[#0B1725] border-slate-800' : 'bg-slate-50/80 border-slate-200/90 shadow-xs'
        }`}>
          {/* Spatial Blueprint Container */}
          <div className="space-y-6">
            {/* North Wing: Cardiology & Telemetry */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    North Wing • Cardiology Telemetry Unit (CW-300s)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Continuous EKG Monitoring</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {beds.filter(b => b.type === 'Cardiac' || b.wardName.includes('Cardio')).map(bed => (
                  <FloorplanBedCell
                    key={bed.id}
                    bed={bed}
                    isDark={isDark}
                    hasCallBell={!!callBells[bed.bedNumber]}
                    onToggleCallBell={toggleCallBell}
                    onClick={() => bed.status === 'Available' ? setAdmitModalBed(bed) : setActiveBedModal(bed)}
                  />
                ))}
              </div>
            </div>

            {/* Central Corridor & Nurse Station Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* West Wing: ICU Suites (5 cols) */}
              <div className="lg:col-span-5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      West Wing • ICU Critical Suites
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-500">Level 1 Trauma</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {beds.filter(b => b.type === 'ICU' || b.wardName.includes('Intensive')).map(bed => (
                    <FloorplanBedCell
                      key={bed.id}
                      bed={bed}
                      isDark={isDark}
                      hasCallBell={!!callBells[bed.bedNumber]}
                      onToggleCallBell={toggleCallBell}
                      onClick={() => bed.status === 'Available' ? setAdmitModalBed(bed) : setActiveBedModal(bed)}
                    />
                  ))}
                </div>
              </div>

              {/* Central Hub: Nurse Command Desk & Crash Cart (2 cols) */}
              <div className="lg:col-span-2 p-4 rounded-2xl border border-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 flex flex-col justify-between items-center text-center shadow-xs">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Nurse Station 4</h4>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-0.5">Central Command</p>
                </div>

                <div className="my-3 space-y-1 text-[10px] text-slate-500 dark:text-slate-400 w-full py-2 border-y border-teal-500/10">
                  <div>Charge Nurse: <strong>Sarah Jenkins, RN</strong></div>
                  <div>Shift: <strong>07:00 - 15:00</strong></div>
                  <div className="text-emerald-500 font-bold">Defibrillator: Ready ✓</div>
                </div>

                <button
                  onClick={() => showToast('Crash Cart & Defibrillator Alpha inspected: 100% Operational.')}
                  className="w-full py-1.5 rounded-xl text-[10px] font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all cursor-pointer"
                >
                  Verify Cart
                </button>
              </div>

              {/* East Wing: Surgical Recovery Bay (5 cols) */}
              <div className="lg:col-span-5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      East Wing • Surgical Recovery (PACU)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Post-Op Vital Monitoring</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {beds.filter(b => b.type === 'Surgical' || b.wardName.includes('Surg')).map(bed => (
                    <FloorplanBedCell
                      key={bed.id}
                      bed={bed}
                      isDark={isDark}
                      hasCallBell={!!callBells[bed.bedNumber]}
                      onToggleCallBell={toggleCallBell}
                      onClick={() => bed.status === 'Available' ? setAdmitModalBed(bed) : setActiveBedModal(bed)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW MODE 2: ACUITY BED MATRIX (TACTICAL GRID) ================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBeds.map(bed => {
            const isOccupied = bed.status === 'Occupied';
            const isAvailable = bed.status === 'Available';
            const isCleaning = bed.status === 'Cleaning' || bed.status === 'Maintenance';
            const hasCallBell = !!callBells[bed.bedNumber];

            return (
              <div
                key={bed.id}
                className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  hasCallBell
                    ? 'border-rose-500 shadow-lg shadow-rose-500/20 bg-rose-500/10'
                    : isOccupied
                      ? isDark ? 'bg-slate-900/80 border-slate-700/80 shadow-xs hover:border-teal-500/50' : 'bg-white border-slate-200 shadow-xs hover:border-teal-500/50'
                      : isAvailable
                        ? isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
                        : isDark ? 'bg-slate-900/40 border-amber-500/30' : 'bg-amber-50/40 border-amber-200'
                }`}
                onClick={() => isAvailable ? setAdmitModalBed(bed) : setActiveBedModal(bed)}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${
                        hasCallBell
                          ? 'bg-rose-600 text-white animate-bounce'
                          : isOccupied
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                            : isAvailable
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        <BedIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          {bed.bedNumber}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">{bed.wardName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20'
                          : isAvailable
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {bed.status}
                      </span>

                      {isOccupied && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCallBell(bed.bedNumber);
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            hasCallBell
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500'
                          }`}
                          title="Toggle Call Light"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isOccupied && (
                    <div className="space-y-1.5 text-xs">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {bed.patientName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>Admitted: {bed.admittedDate || '2026-04-01'}</span>
                        <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{bed.type} Unit</span>
                      </div>
                    </div>
                  )}

                  {isAvailable && (
                    <div className="py-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Clean & Ready for Patient</span>
                    </div>
                  )}

                  {isCleaning && (
                    <div className="py-2 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4 shrink-0 animate-spin" />
                      <span>UV-C Sanitization in Progress</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {isAvailable ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdmitModalBed(bed);
                      }}
                      className="w-full py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Allocate Bed</span>
                    </button>
                  ) : isCleaning ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCleanFinished(bed.id);
                      }}
                      className="w-full py-1.5 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Ready</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between text-[11px] text-teal-600 dark:text-teal-400 font-bold">
                      <span>Click to view telemetry</span>
                      <span>→</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: BEDSIDE PATIENT TELEMETRY ================= */}
      {activeBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <BedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Bed {activeBedModal.bedNumber} Station</h3>
                  <span className="text-xs text-slate-400">{activeBedModal.wardName} • {activeBedModal.type} Unit</span>
                </div>
              </div>
              <button
                onClick={() => setActiveBedModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {activeBedModal.patientName ? (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Current Occupant</span>
                    <div className="text-base font-black text-slate-900 dark:text-white">{activeBedModal.patientName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Admitted on: {activeBedModal.admittedDate || '2026-04-01'}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                      <span className="text-[10px] uppercase font-bold block text-slate-400">Telemetry Channel</span>
                      <strong className="text-sm font-mono">CH-04 (Ward 4 Hub)</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold block text-slate-400">Call Light Status</span>
                      <strong className={callBells[activeBedModal.bedNumber] ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                        {callBells[activeBedModal.bedNumber] ? 'Active (Signal Sent)' : 'Normal (Idle)'}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-center py-6">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-sm">Bed is clean and ready for admission</p>
                  <p className="text-xs text-slate-400 mt-1">No active patient currently assigned to {activeBedModal.bedNumber}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              {activeBedModal.patientName ? (
                <>
                  <button
                    onClick={() => toggleCallBell(activeBedModal.bedNumber)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{callBells[activeBedModal.bedNumber] ? 'Clear Call Light' : 'Trigger Call Light'}</span>
                  </button>

                  <button
                    onClick={() => handleDischarge(activeBedModal.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Discharge & Clean</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    const bed = activeBedModal;
                    setActiveBedModal(null);
                    setAdmitModalBed(bed);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Allocate Patient to this Bed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ALLOCATE BED ================= */}
      {admitModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <h3 className="font-extrabold text-base mb-1">Allocate Bed {admitModalBed.bedNumber}</h3>
            <p className="text-xs text-slate-400 mb-4">{admitModalBed.wardName} • {admitModalBed.type} Unit</p>

            <form onSubmit={handleAdmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Select Inpatient for Admission</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientCode}) - {p.diagnosis}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdmitModalBed(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Individual Bed Cell in the Floorplan Blueprint
const FloorplanBedCell: React.FC<{
  bed: Bed;
  isDark: boolean;
  hasCallBell: boolean;
  onToggleCallBell: (bedNum: string) => void;
  onClick: () => void;
}> = ({ bed, isDark, hasCallBell, onToggleCallBell, onClick }) => {
  const isOccupied = bed.status === 'Occupied';
  const isAvailable = bed.status === 'Available';
  const isCleaning = bed.status === 'Cleaning' || bed.status === 'Maintenance';

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
        hasCallBell
          ? 'border-rose-500 bg-rose-500/15 shadow-md shadow-rose-500/20 animate-pulse'
          : isOccupied
            ? isDark
              ? 'bg-slate-800/80 border-teal-500/30 hover:border-teal-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-teal-500 shadow-xs'
            : isAvailable
              ? isDark
                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400'
                : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
              : isDark
                ? 'bg-amber-950/20 border-amber-500/30'
                : 'bg-amber-50/50 border-amber-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-black text-xs text-slate-900 dark:text-white flex items-center gap-1">
          <BedIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          {bed.bedNumber}
        </span>

        <span className={`w-2 h-2 rounded-full ${
          hasCallBell ? 'bg-rose-500 animate-ping' : isOccupied ? 'bg-teal-500' : isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />
      </div>

      <div className="min-h-[38px] flex flex-col justify-center">
        {isOccupied ? (
          <div>
            <div className="font-extrabold text-[11px] truncate text-slate-900 dark:text-white">
              {bed.patientName}
            </div>
            <div className="text-[9px] text-teal-600 dark:text-teal-400 font-mono">
              Telemetry Active
            </div>
          </div>
        ) : isAvailable ? (
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            Vacant (Ready)
          </div>
        ) : (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
            Sanitizing
          </div>
        )}
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[9px] text-slate-400">
        <span>{bed.type}</span>
        {isOccupied && hasCallBell && (
          <span className="text-rose-500 font-bold animate-pulse">CALL LIGHT!</span>
        )}
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserRole, 
  ThemeMode, 
  CriticalAlert 
} from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ChevronDown, 
  Check, 
  Sparkles,
  Settings,
  Building2,
  User,
  Heart,
  Activity,
  FileText,
  Calendar,
  Users,
  Bed,
  Pill,
  CreditCard,
  Layers,
  LogOut,
  Stethoscope
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  portalMode: 'management' | 'doctor' | 'patient';
  onPortalModeChange: (mode: 'management' | 'doctor' | 'patient') => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  portalMode,
  onPortalModeChange,
  currentRole,
  onRoleChange,
  theme,
  onToggleTheme,
  onOpenSearch
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const alerts = db.getAlerts();

  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  // Primary tabs for Management mode
  const managementPrimaryTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'ward', label: 'Ward Overview' },
    { id: 'analytics', label: 'Analytics' },
  ];

  // Comprehensive Patient Portal tabs
  const patientTabs = [
    { id: 'patient-health', label: 'My Health & 3D' },
    { id: 'patient-appointments', label: 'Appointments' },
    { id: 'patient-prescriptions', label: 'Prescriptions' },
    { id: 'patient-labs', label: 'Lab Reports' },
    { id: 'patient-records', label: 'Medical History' },
    { id: 'patient-vaccines', label: 'Vaccine Passport' },
    { id: 'patient-billing', label: 'Billing & Insurance' },
    { id: 'patient-messages', label: 'Doctor Chat' },
    { id: 'patient-nutrition', label: 'Nutrition' },
    { id: 'patient-emergency', label: 'Emergency SOS' },
  ];

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Hospital Chief & Full Access' },
    { role: 'HOSPITAL_ADMIN', label: 'Hospital Admin', desc: 'Operations & Bed Resources' },
    { role: 'DOCTOR', label: 'Attending Physician', desc: 'Clinical Orders & SOAP Notes' },
    { role: 'NURSE', label: 'Head Nurse', desc: 'Ward Vitals & Patient Bed Flow' },
    { role: 'PATIENT', label: 'Patient View', desc: 'Essential Personal Health Records' },
  ];

  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 w-full transition-colors duration-300 border-b backdrop-blur-xl ${
      isDark 
        ? 'bg-[#0B1725]/90 border-slate-800 text-white' 
        : 'bg-[#F3FAF8]/90 border-teal-100/80 text-[#142C43]'
    }`}>
      {/* TOP STATUS / PORTAL SWITCHER BAR */}
      <div className={`px-4 lg:px-8 py-2 border-b text-xs flex items-center justify-between ${
        isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-100/70 border-slate-200/60'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline">
            Active Workspace:
          </span>
          <span className="font-bold text-teal-600 dark:text-teal-400">
            {portalMode === 'management' 
              ? 'Hospital Enterprise Management' 
              : portalMode === 'doctor'
                ? 'Physician Consultation & Tele-Chat'
                : 'Patient Self-Service'}
          </span>
        </div>

        {/* PROMINENT TRIPLE PORTAL SWITCHER PILL */}
        <div className="flex items-center p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => {
              sound.playClick();
              onPortalModeChange('management');
              if (currentTab.startsWith('patient-') || currentTab === 'doctor-consult') {
                setCurrentTab('dashboard');
              }
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              portalMode === 'management'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Management Portal</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onPortalModeChange('doctor');
              setCurrentTab('doctor-consult');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              portalMode === 'doctor'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Portal</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onPortalModeChange('patient');
              setCurrentTab('patient-health');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              portalMode === 'patient'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient Portal</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-slate-500">
          <button
            onClick={toggleMute}
            className="p-1 rounded-lg hover:text-teal-600 transition-colors"
            title={isMuted ? 'Unmute Audio Vitals' : 'Mute Audio Vitals'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-teal-600" />}
          </button>
          <span>•</span>
          <button
            onClick={onToggleTheme}
            className="p-1 rounded-lg hover:text-teal-600 transition-colors"
            title="Toggle Light / Dark theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR (MATCHING ATTACHED SCREENSHOT) */}
      <div className="max-w-[1720px] mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* BRAND LOGO: CIRCLE CRESCENT + "CityCare" */}
        <div 
          onClick={() => {
            sound.playClick();
            if (portalMode === 'management') {
              setCurrentTab('dashboard');
            } else {
              setCurrentTab('patient-health');
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
        >
          {/* MediCore Logo Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tight text-teal-600 dark:text-teal-400">
            Medi<span className="text-cyan-600 dark:text-cyan-300">Core</span>
          </span>
        </div>

        {/* PILL NAVIGATION CONTAINER (EXACT TO ATTACHED IMAGE) */}
        <nav className="flex items-center gap-1.5 p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          {portalMode === 'management' ? (
            <>
              {managementPrimaryTabs.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sound.playClick();
                      setCurrentTab(item.id);
                    }}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-black text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

            </>
          ) : (
            <>
              {/* PATIENT PORTAL TABS: ESSENTIAL ONLY */}
              {patientTabs.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sound.playClick();
                      setCurrentTab(item.id);
                    }}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-black text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </>
          )}
        </nav>

        {/* RIGHT CIRCULAR BUTTONS (BELL, SETTINGS, AVATAR - MATCHING SCREENSHOT) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Search Icon Button */}
          {onOpenSearch && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenSearch();
              }}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-xs"
              title="Global Search (Cmd+K)"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                sound.playClick();
                setNotifOpen(!notifOpen);
              }}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all relative shadow-xs"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            {/* Notification Drawer */}
            {notifOpen && (
              <div className={`absolute right-0 mt-2 w-80 rounded-2xl p-3 border shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-xs">Live Telemetry Alerts</span>
                  <span className="text-[10px] text-teal-500 font-bold">{alerts.length} active</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto mt-2">
                  {alerts.map((al) => (
                    <div key={al.id} className="py-2 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{al.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{al.department} • {al.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Gear */}
          <button
            onClick={() => {
              sound.playClick();
              if (portalMode === 'management') {
                setCurrentTab('settings');
              } else {
                setRoleMenuOpen(!roleMenuOpen);
              }
            }}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-xs"
            title="System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Profile Avatar with Role Selector */}
          <div className="relative">
            <button
              onClick={() => {
                sound.playClick();
                setRoleMenuOpen(!roleMenuOpen);
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-0.5 overflow-hidden flex items-center justify-center ring-2 ring-transparent hover:ring-teal-500 transition-all shadow-xs"
            >
              <img
                src={portalMode === 'management' ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256"}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            </button>

            {/* Role Switcher Menu */}
            {roleMenuOpen && (
              <div className={`absolute right-0 mt-2 w-72 rounded-2xl p-2 border shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
              }`}>
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-xs">
                    {portalMode === 'management' ? 'Alexandro Vance' : 'Magnus Stephenson'}
                  </div>
                  <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                    {portalMode === 'management' ? 'Hospital Chief Administrator' : 'Verified Patient #PT-88412'}
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Security Context
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        sound.playClick();
                        onRoleChange(r.role);
                        if (r.role === 'DOCTOR') {
                          onPortalModeChange('doctor');
                        }
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                        currentRole === r.role
                          ? 'bg-teal-500 text-white font-bold'
                          : isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-teal-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{r.label}</div>
                        <div className="text-[10px] opacity-75">{r.desc}</div>
                      </div>
                      {currentRole === r.role && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

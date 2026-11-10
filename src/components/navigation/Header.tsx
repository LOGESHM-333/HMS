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

export type HeaderPortalMode = 'super-admin' | 'admin' | 'management' | 'doctor' | 'nurse' | 'patient';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  portalMode: HeaderPortalMode;
  onPortalModeChange: (mode: HeaderPortalMode) => void;
  onSwitchPortal?: (mode: HeaderPortalMode) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onOpenSearch?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  portalMode,
  onPortalModeChange,
  onSwitchPortal,
  currentRole,
  onRoleChange,
  theme,
  onToggleTheme,
  onOpenSearch,
  onLogout
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

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Hospital Chief & Full Access' },
    { role: 'HOSPITAL_ADMIN', label: 'Hospital Admin', desc: 'Operations & Bed Resources' },
    { role: 'DOCTOR', label: 'Attending Doctor', desc: 'Clinical Orders & SOAP Notes' },
    { role: 'NURSE', label: 'Head Nurse', desc: 'Ward Vitals & Patient Bed Flow' },
    { role: 'PATIENT', label: 'Patient View', desc: 'Essential Personal Health Records' },
  ];

  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 w-full transition-colors duration-300 border-b backdrop-blur-xl ${
      isDark 
        ? 'bg-[#0B1725]/90 border-slate-800 text-white' 
        : 'bg-[#F0F7FD]/90 border-sky-100/80 text-[#142C43]'
    }`}>
      {/* TOP STATUS / PORTAL SWITCHER BAR */}
      <div className={`px-4 lg:px-8 py-2 border-b text-xs flex items-center justify-between ${
        isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-100/70 border-slate-200/60'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline">
            Active Workspace:
          </span>
          <span className="font-bold text-sky-600 dark:text-sky-400">
            {portalMode === 'super-admin'
              ? 'Enterprise Super Admin Governance Command'
              : (portalMode === 'admin' || portalMode === 'management')
                ? 'Hospital Enterprise Operations' 
                : portalMode === 'doctor'
                  ? 'Doctor Consultation & Tele-Chat'
                  : portalMode === 'nurse'
                    ? 'Head Nurse Clinical Station'
                    : 'Patient Self-Service'}
          </span>

          {/* Quick Portal Switch Buttons (Instant Signout + Route to Login) */}
          <div className="flex items-center gap-1.5 ml-1 sm:ml-3">
            <span className="text-[10px] text-slate-400 hidden lg:inline">Switch Portal:</span>
            {portalMode !== 'super-admin' && (
              <button
                onClick={() => {
                  sound.playClick();
                  if (onSwitchPortal) onSwitchPortal('super-admin');
                  else onPortalModeChange('super-admin');
                }}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-400/30 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Switch & Login to Enterprise Super Admin Command"
              >
                <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                <span>Super Admin</span>
              </button>
            )}
            {portalMode !== 'admin' && portalMode !== 'management' && (
              <button
                onClick={() => {
                  sound.playClick();
                  if (onSwitchPortal) onSwitchPortal('admin');
                  else onPortalModeChange('admin');
                }}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/20 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Switch & Login to Hospital Admin Portal"
              >
                <Building2 className="w-2.5 h-2.5 text-sky-500" />
                <span>Hospital Admin</span>
              </button>
            )}
            {portalMode !== 'doctor' && (
              <button
                onClick={() => {
                  sound.playClick();
                  if (onSwitchPortal) onSwitchPortal('doctor');
                  else onPortalModeChange('doctor');
                }}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Switch & Login to Doctor Portal"
              >
                <Stethoscope className="w-2.5 h-2.5" />
                <span>Doctor</span>
              </button>
            )}
            {portalMode !== 'nurse' && (
              <button
                onClick={() => {
                  sound.playClick();
                  if (onSwitchPortal) onSwitchPortal('nurse');
                  else onPortalModeChange('nurse');
                }}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Switch & Login to Head Nurse Station"
              >
                <Activity className="w-2.5 h-2.5" />
                <span>Head Nurse</span>
              </button>
            )}
            {portalMode !== 'patient' && (
              <button
                onClick={() => {
                  sound.playClick();
                  if (onSwitchPortal) onSwitchPortal('patient');
                  else onPortalModeChange('patient');
                }}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-500/20 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Switch & Login to Patient Portal"
              >
                <Heart className="w-2.5 h-2.5 text-pink-500" />
                <span>Patient</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <button
            onClick={toggleMute}
            className="p-1 rounded-lg hover:text-sky-600 transition-colors"
            title={isMuted ? 'Unmute Audio Vitals' : 'Mute Audio Vitals'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-sky-600" />}
          </button>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR (MATCHING ATTACHED SCREENSHOT) */}
      <div className="max-w-[1720px] mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* BRAND LOGO: CIRCLE CRESCENT + "CityCare" */}
        <div 
          onClick={() => {
            sound.playClick();
            if (portalMode === 'super-admin') {
              setCurrentTab('overview');
            } else if (portalMode === 'admin' || portalMode === 'management') {
              setCurrentTab('dashboard');
            } else {
              setCurrentTab('patient-health');
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
        >
          {/* MediCore Logo Icon */}
          <img
            src="/assets/medicore-logo.png"
            alt="MediCore Logo"
            className="w-9 h-9 rounded-xl object-contain shadow-md group-hover:scale-105 transition-transform flex-shrink-0"
          />
          <span className="font-black text-2xl tracking-tight text-sky-600 dark:text-sky-400">
            Medi<span className="text-cyan-600 dark:text-cyan-300">Core</span>
          </span>
        </div>

        {/* SUPER ADMIN STATUS BADGE */}
        {portalMode === 'super-admin' && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-blue-500/15 border border-purple-500/30 text-xs font-bold text-purple-600 dark:text-purple-300 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Enterprise Multi-Node Governance • Dr. Eleanor Vance, CISSP</span>
          </div>
        )}

        {/* MANAGEMENT / ADMIN PRIMARY TABS (Only shown in management or admin mode) */}
        {(portalMode === 'admin' || portalMode === 'management') && (
          <nav className="flex items-center gap-1.5 p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
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
          </nav>
        )}

        {portalMode === 'doctor' && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-600 dark:text-cyan-400">
            <Stethoscope className="w-4 h-4 text-cyan-500" />
            <span>Doctor Clinical Station • Dr. Roger S., MD</span>
          </div>
        )}

        {portalMode === 'nurse' && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Head Nurse Station • Nurse Sarah Jenkins, RN, BSN</span>
          </div>
        )}

        {portalMode === 'patient' && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-bold text-sky-600 dark:text-sky-400">
            <User className="w-4 h-4 text-sky-500" />
            <span>Patient Telehealth & Health Portal • Magnus Stephenson</span>
          </div>
        )}

        {/* RIGHT CIRCULAR BUTTONS (BELL, SETTINGS, AVATAR - MATCHING SCREENSHOT) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Command Palette (Ctrl+K) */}
          {onOpenSearch && (
            <>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenSearch();
                }}
                className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full glass-btn-neutral text-xs cursor-pointer shadow-xs transition-all"
                title="Global Search (Ctrl+K / Cmd+K)"
              >
                <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Search patients, beds, doctors...</span>
                <kbd className="ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/80 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-500/20 shadow-2xs">Ctrl+K</kbd>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenSearch();
                }}
                className="md:hidden w-10 h-10 rounded-full glass-btn-neutral flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all shadow-xs cursor-pointer"
                title="Global Search (Ctrl+K / Cmd+K)"
              >
                <Search className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </button>
            </>
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
                  <span className="text-[10px] text-sky-500 font-bold">{alerts.length} active</span>
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

          {/* Profile Avatar with Role & Portal Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                sound.playClick();
                setRoleMenuOpen(!roleMenuOpen);
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 p-0.5 overflow-hidden flex items-center justify-center ring-2 ring-transparent hover:ring-sky-500 transition-all shadow-xs"
            >
              <img
                src={portalMode === 'super-admin'
                  ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"
                  : portalMode === 'patient' 
                    ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256"
                    : portalMode === 'doctor'
                      ? "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256"
                      : portalMode === 'nurse'
                        ? "https://images.unsplash.com/photo-1594824813571-638f02614d3f?auto=format&fit=crop&q=80&w=256"
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            </button>

            {/* Role & Portal Switcher Menu (Matches Uploaded Screenshot) */}
            {roleMenuOpen && (
              <div className={`absolute right-0 mt-3 w-80 rounded-[28px] p-4 border shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
              }`}>
                {/* Active User Header */}
                <div className="pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {portalMode === 'super-admin'
                      ? 'Dr. Eleanor Vance, MD, CISSP'
                      : portalMode === 'patient' 
                        ? 'Magnus Stephenson' 
                        : portalMode === 'doctor' 
                          ? 'Dr. Roger S., MD' 
                          : portalMode === 'nurse'
                            ? 'Nurse Sarah Jenkins, RN, BSN'
                            : 'Marcus Vance, MHA'}
                  </div>
                  <div className="text-xs text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                    {portalMode === 'super-admin'
                      ? 'Enterprise Super Admin • Level 5 Root'
                      : portalMode === 'patient' 
                        ? 'Verified Patient #PT-88412' 
                        : portalMode === 'doctor' 
                          ? 'Attending Doctor #DOC-402' 
                          : portalMode === 'nurse'
                            ? 'Head Charge Nurse • ICU Station'
                            : 'Hospital Operations Administrator'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    SWITCH SECURITY CONTEXT
                  </div>
                  {roles.map((r) => {
                    const isSelected = 
                      (portalMode === 'super-admin' && r.role === 'SUPER_ADMIN') ||
                      ((portalMode === 'admin' || portalMode === 'management') && r.role === 'HOSPITAL_ADMIN') ||
                      (portalMode === 'patient' && r.role === 'PATIENT') ||
                      (portalMode === 'doctor' && r.role === 'DOCTOR') ||
                      (portalMode === 'nurse' && r.role === 'NURSE');

                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          sound.playClick();
                          setRoleMenuOpen(false);

                          if (r.role === 'SUPER_ADMIN') {
                            if (portalMode !== 'super-admin' && onSwitchPortal) {
                              onSwitchPortal('super-admin');
                            } else {
                              onRoleChange('SUPER_ADMIN');
                              onPortalModeChange('super-admin');
                              setCurrentTab('overview');
                            }
                          } else if (r.role === 'HOSPITAL_ADMIN') {
                            if (portalMode !== 'admin' && portalMode !== 'management' && onSwitchPortal) {
                              onSwitchPortal('admin');
                            } else {
                              onRoleChange('HOSPITAL_ADMIN');
                              onPortalModeChange('admin');
                              setCurrentTab('dashboard');
                            }
                          } else if (r.role === 'PATIENT') {
                            if (portalMode !== 'patient' && onSwitchPortal) {
                              onSwitchPortal('patient');
                            } else {
                              onRoleChange('PATIENT');
                              onPortalModeChange('patient');
                              setCurrentTab('patient-health');
                            }
                          } else if (r.role === 'DOCTOR') {
                            if (portalMode !== 'doctor' && onSwitchPortal) {
                              onSwitchPortal('doctor');
                            } else {
                              onRoleChange('DOCTOR');
                              onPortalModeChange('doctor');
                              setCurrentTab('doctor-consult');
                            }
                          } else if (r.role === 'NURSE') {
                            if (portalMode !== 'nurse' && onSwitchPortal) {
                              onSwitchPortal('nurse');
                            } else {
                              onRoleChange('NURSE');
                              onPortalModeChange('nurse');
                              setCurrentTab('nurse-rounds');
                            }
                          } else {
                            if (onSwitchPortal && portalMode !== 'management' && portalMode !== 'admin') {
                              onSwitchPortal('admin');
                            } else {
                              onRoleChange(r.role);
                              onPortalModeChange('admin');
                              setCurrentTab('dashboard');
                            }
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-[#00A887] text-white font-bold shadow-md'
                            : isDark 
                              ? 'hover:bg-slate-800 text-slate-300' 
                              : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className={`font-extrabold text-xs ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                            {r.label}
                          </div>
                          <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                            {r.desc}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}

                  {onLogout && (
                    <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setRoleMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Hospital System</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

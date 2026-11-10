/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuditLog, ThemeMode, UserRole, Patient } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import {
  ShieldCheck,
  Lock,
  History,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Building,
  Key,
  Bell,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Laptop,
  LogOut,
  RefreshCw,
  Save,
  Camera,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Check,
  X,
  Smartphone,
  Activity,
  Heart,
  Calendar,
  Pill,
  FileText,
  BadgeAlert,
  Sparkles
} from 'lucide-react';

export interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  roleTitle: string;
  department: string;
  identifier: string; // Patient Code / Doctor License / Nurse ID / Admin ID
  emergencyContact: string;
  bloodGroup?: string;
  avatar: string;
  bio: string;
  twoFactorEnabled: boolean;
  autoLockMinutes: number;
  notifications: {
    criticalAlerts: boolean;
    patientInquiries: boolean;
    labResults: boolean;
    shiftHandover: boolean;
  };
}

interface SettingsViewProps {
  theme: ThemeMode;
  onThemeToggle?: () => void;
  portalMode?: 'super-admin' | 'admin' | 'management' | 'doctor' | 'nurse' | 'patient';
  currentRole?: UserRole;
  selectedPatient?: Patient;
  onLogout?: () => void;
  onProfileUpdate?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeToggle,
  portalMode = 'doctor',
  currentRole,
  selectedPatient,
  onLogout,
  onProfileUpdate
}) => {
  const isDark = theme === 'dark';

  // Active Tab: 'profile' | 'session' | 'security' | 'preferences' | 'audit' | 'rbac'
  const [activeTab, setActiveTab] = useState<'profile' | 'session' | 'security' | 'preferences' | 'audit' | 'rbac'>('profile');

  // Default Profiles generator per portal mode
  const getDefaultProfile = (): UserProfileData => {
    switch (portalMode) {
      case 'patient':
        return {
          name: selectedPatient?.name || 'Magnus Stephenson',
          email: selectedPatient?.email || 'patient@medicore.in',
          phone: selectedPatient?.phone || '+91 98765 43210',
          roleTitle: 'Registered Inpatient / Pulmonology Wing',
          department: 'Ward 4 - Bed ICU-04',
          identifier: selectedPatient?.patientCode || 'P-12563',
          emergencyContact: 'Elena Stephenson (Spouse) - +91 98765 09876',
          bloodGroup: selectedPatient?.bloodGroup || 'O+',
          avatar: selectedPatient?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
          bio: 'Admitted for acute respiratory distress management and lipid profile maintenance under Dr. Roger S.',
          twoFactorEnabled: true,
          autoLockMinutes: 15,
          notifications: {
            criticalAlerts: true,
            patientInquiries: true,
            labResults: true,
            shiftHandover: false
          }
        };
      case 'doctor':
        return {
          name: 'Dr. Roger S., MD',
          email: 'roger.s@medicore.in',
          phone: '+91 98450 12345',
          roleTitle: 'Lead Pulmonologist & Critical Care Specialist',
          department: 'Ward 4 Pulmonology & Resuscitation Center',
          identifier: 'MCI-2018-88921',
          emergencyContact: 'Hospital Control Dispatch - +91 98450 00099',
          bloodGroup: 'A+',
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
          bio: 'Chief of Pulmonology specializing in 3D bronchoscopic reconstruction, critical trauma care, and inpatient rounding.',
          twoFactorEnabled: true,
          autoLockMinutes: 30,
          notifications: {
            criticalAlerts: true,
            patientInquiries: true,
            labResults: true,
            shiftHandover: true
          }
        };
      case 'nurse':
        return {
          name: 'Nurse Sarah Jenkins, RN',
          email: 'sarah.jenkins@medicore.in',
          phone: '+91 98450 67890',
          roleTitle: 'Head Charge Nurse (BSN, CCRN)',
          department: 'ICU & Surgical Wing Floor 3',
          identifier: 'NC-RN-88492',
          emergencyContact: 'Floor 3 Nursing Station - +91 98450 00022',
          bloodGroup: 'B+',
          avatar: 'https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80',
          bio: 'Head charge nurse responsible for ICU triage, Medication Administration Records (MAR), and code blue emergency response.',
          twoFactorEnabled: true,
          autoLockMinutes: 15,
          notifications: {
            criticalAlerts: true,
            patientInquiries: true,
            labResults: true,
            shiftHandover: true
          }
        };
      case 'super-admin':
        return {
          name: 'Enterprise Director Harrison Cole',
          email: 'superadmin@medicore.in',
          phone: '+91 98450 00000',
          roleTitle: 'Enterprise Healthcare Governor & CTO',
          department: 'Enterprise Multi-Facility Informatics',
          identifier: 'ROOT-GOV-001',
          emergencyContact: 'Cybersecurity SOC Dispatch - +91 98450 00911',
          bloodGroup: 'O+',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          bio: 'Multi-facility hospital system director overseeing nationwide facility synchronization and cryptographic audit logs.',
          twoFactorEnabled: true,
          autoLockMinutes: 15,
          notifications: {
            criticalAlerts: true,
            patientInquiries: false,
            labResults: true,
            shiftHandover: true
          }
        };
      case 'admin':
      case 'management':
      default:
        return {
          name: 'Chief Administrator David Vance',
          email: 'admin@medicore.in',
          phone: '+91 98450 00001',
          roleTitle: 'Chief Hospital Operations Administrator',
          department: 'Executive Administration Suite',
          identifier: 'ADMIN-EXEC-004',
          emergencyContact: 'Executive Board Secretariat - +91 98450 00010',
          bloodGroup: 'AB+',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bio: 'Hospital operations executive overseeing bed allocations, staffing rosters, pharmacy procurement, and compliance.',
          twoFactorEnabled: true,
          autoLockMinutes: 30,
          notifications: {
            criticalAlerts: true,
            patientInquiries: false,
            labResults: true,
            shiftHandover: true
          }
        };
    }
  };

  // Profile State
  const [profile, setProfile] = useState<UserProfileData>(() => {
    try {
      const saved = localStorage.getItem(`medicore_user_profile_${portalMode}`);
      if (saved) return { ...getDefaultProfile(), ...JSON.parse(saved) };
    } catch {}
    return getDefaultProfile();
  });

  // Keep synced if portalMode switches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`medicore_user_profile_${portalMode}`);
      if (saved) {
        setProfile({ ...getDefaultProfile(), ...JSON.parse(saved) });
        return;
      }
    } catch {}
    setProfile(getDefaultProfile());
  }, [portalMode]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    sound.playSuccess();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Logout modal state
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Sound Muted state
  const [isAudioMuted, setIsAudioMuted] = useState(sound.getMuted());

  // Preset Avatars for quick selection
  const avatarPresets = [
    { label: 'Doctor', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
    { label: 'Nurse', url: 'https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80' },
    { label: 'Patient', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256' },
    { label: 'Admin', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { label: 'Executive', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
  ];

  // Save Profile Handler
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playClick();

    localStorage.setItem(`medicore_user_profile_${portalMode}`, JSON.stringify(profile));
    db.logAudit('Profile Updated', 'Settings', `User ${profile.name} (${portalMode}) updated personal details`);
    showToast('Personal details and profile updated successfully!');
    if (onProfileUpdate) onProfileUpdate();
  };

  // Reset Profile Handler
  const handleResetProfile = () => {
    sound.playClick();
    const defaults = getDefaultProfile();
    setProfile(defaults);
    localStorage.setItem(`medicore_user_profile_${portalMode}`, JSON.stringify(defaults));
    showToast('Profile reset to original facility defaults.');
    if (onProfileUpdate) onProfileUpdate();
  };

  // Change Password Handler
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (!currentPassword) {
      sound.playWarning();
      setPwError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      sound.playWarning();
      setPwError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      sound.playWarning();
      setPwError('New password and confirm password do not match.');
      return;
    }

    sound.playSuccess();
    db.logAudit('Security Credential Change', 'Auth', `Password successfully rotated for ${profile.email}`);
    showToast('Password changed successfully! Session credentials rotated.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Calculate password strength
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: 'None', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2: return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3: return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4: return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
      default: return { score: 10, label: 'Very Weak', color: 'bg-rose-500' };
    }
  };

  const pwStrength = getPasswordStrength(newPassword);

  // RBAC Table data
  const permissions = [
    { module: 'Interactive 3D Anatomy Visualizer', superAdmin: true, doctor: true, nurse: true, patient: true },
    { module: 'Electronic Medical Records (SOAP)', superAdmin: true, doctor: true, nurse: false, patient: false },
    { module: 'Pharmacy Prescription Dispensing', superAdmin: true, doctor: false, pharmacist: true, patient: false },
    { module: 'Laboratory Diagnostics Assays', superAdmin: true, doctor: true, labTech: true, patient: false },
    { module: 'Bed Allocation & ICU Transfers', superAdmin: true, doctor: true, nurse: true, patient: false },
    { module: 'Billing & Financial Transactions', superAdmin: true, accountant: true, doctor: false, patient: false },
  ];

  const logs = db.getAuditLogs();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 text-white font-bold text-xs shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 uppercase tracking-wider">
              {portalMode.replace('-', ' ')} Portal Settings
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Session Verified
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Account & System Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal profile details, authentication credentials, active session telemetry, and portal preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={() => {
                sound.playClick();
                setLogoutModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto no-scrollbar ${
        isDark ? 'bg-[#0E2035]/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <button
          onClick={() => { sound.playClick(); setActiveTab('profile'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-teal-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Personal Details</span>
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveTab('session'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'session'
              ? 'bg-teal-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Login, Logout & Sessions</span>
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveTab('security'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-teal-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{portalMode === 'patient' ? 'Security & Access' : 'Security & Password'}</span>
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveTab('preferences'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'preferences'
              ? 'bg-teal-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Preferences & Audio</span>
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveTab('audit'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-teal-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>HIPAA Audit Trail ({logs.length})</span>
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveTab('rbac'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'rbac'
              ? 'bg-teal-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RBAC Matrix</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE & PERSONAL DETAILS (EDITABLE)                              */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* PROFILE SUMMARY HERO CARD */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark ? 'bg-[#0E2035] border-slate-800 text-white shadow-lg' : 'bg-white border-slate-200 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-teal-500/20 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black">{profile.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {profile.identifier}
                    </span>
                    {profile.bloodGroup && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        Blood: {profile.bloodGroup}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">{profile.roleTitle}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5" />
                    <span>{profile.department}</span>
                    <span>•</span>
                    <Mail className="w-3.5 h-3.5" />
                    <span>{profile.email}</span>
                  </p>
                </div>
              </div>

              {/* Quick Preset Selector */}
              <div className="border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preset Avatars</p>
                <div className="flex items-center gap-2">
                  {avatarPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setProfile(p => ({ ...p, avatar: preset.url }));
                      }}
                      title={preset.label}
                      className={`relative rounded-xl p-0.5 border-2 transition-all cursor-pointer ${
                        profile.avatar === preset.url ? 'border-teal-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-9 h-9 rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* EDIT PERSONAL DETAILS FORM */}
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h4 className="font-extrabold text-base">Edit Personal & Professional Details</h4>
                <p className="text-xs text-slate-400">Update your account information, hospital assignment, and emergency contact details.</p>
              </div>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-bold bg-teal-500/10 px-3 py-1 rounded-xl">
                Live Edit Mode
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Professional Title / Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Role / Clinical Title</label>
                  <div className="relative">
                    <Activity className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profile.roleTitle}
                      onChange={e => setProfile({ ...profile, roleTitle: e.target.value })}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Department / Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Department / Hospital Unit</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profile.department}
                      onChange={e => setProfile({ ...profile, department: e.target.value })}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Identifier / ID Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Employee / Patient Code</label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profile.identifier}
                      onChange={e => setProfile({ ...profile, identifier: e.target.value })}
                      required
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Emergency Contact Details</label>
                  <div className="relative">
                    <AlertTriangle className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profile.emergencyContact}
                      onChange={e => setProfile({ ...profile, emergencyContact: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Avatar Image URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Custom Avatar URL</label>
                  <div className="relative">
                    <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={profile.avatar}
                      onChange={e => setProfile({ ...profile, avatar: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Bio / Clinical Note */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Professional Bio / Clinical Notes</label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  className={`w-full p-3 rounded-xl text-xs font-semibold border outline-none transition-all resize-none ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetProfile}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LOGIN, LOGOUT & ACTIVE SESSIONS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'session' && (
        <div className="space-y-6">
          {/* CURRENT SESSION CARD */}
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h4 className="font-extrabold text-base">Current Active Session Telemetry</h4>
                <p className="text-xs text-slate-400">Authenticated device details, network location, and live token security metrics.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Session Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Login Timestamp</div>
                <div className="font-extrabold text-sm">Today, 08:30 AM</div>
                <div className="text-[11px] text-teal-600 mt-1">Authenticated via Unified Portal</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Duration</div>
                <div className="font-extrabold text-sm">2h 45m 12s</div>
                <div className="text-[11px] text-emerald-500 mt-1">Zero dropped packets</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client Device</div>
                <div className="font-extrabold text-sm">Chrome 122 · Windows</div>
                <div className="text-[11px] text-slate-400 mt-1">Localhost (127.0.0.1:3000)</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Security Token</div>
                <div className="font-extrabold text-sm">SHA-256 JWT</div>
                <div className="text-[11px] text-teal-600 mt-1">HIPAA Encrypted (TLS 1.3)</div>
              </div>
            </div>

            {/* Session Detail Row */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">Authenticated User Identity:</span>
                <span className="font-bold">{profile.name} ({profile.email})</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">Assigned Portal Scope:</span>
                <span className="font-bold uppercase tracking-wider text-teal-600">{portalMode} Portal</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">Internal Hospital IP:</span>
                <span className="font-mono font-bold">192.168.1.104 (Subnet: Ward 4 / ICU Station)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400">Session Token Lifetime:</span>
                <span className="font-bold text-emerald-500">Valid for next 7h 15m (Auto-renewal enabled)</span>
              </div>
            </div>

            {/* Logout Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="font-extrabold text-sm">Session Termination & Logout</h5>
                <p className="text-xs text-slate-400">Ending your session securely destroys local decryption keys and logs the audit event.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    showToast('Terminated all background sessions. Only this device remains active.');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Terminate Other Sessions
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setLogoutModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Confirm Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RECENT LOGIN AUDIT LOG */}
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <h4 className="font-extrabold text-base mb-1">Recent Login & Authorization History</h4>
            <p className="text-xs text-slate-400 mb-4">Review recent sign-ins, IP addresses, and authorization timestamps across this hospital terminal.</p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Windows Chrome (127.0.0.1:3000)</div>
                    <div className="text-[11px] text-slate-400">IP: 192.168.1.104 • Chennai Central Facility</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">Active Now</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Today, 08:30 AM</div>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Hospital iOS Mobile EMR Station</div>
                    <div className="text-[11px] text-slate-400">IP: 10.42.18.22 • Ward 4 Bedside Unit</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">Expired</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Yesterday, 17:40 PM</div>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Critical Care Central Terminal #02</div>
                    <div className="text-[11px] text-slate-400">IP: 10.42.0.14 • Emergency Trauma Wing</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">Terminated</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">2 days ago, 09:15 AM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SECURITY & PASSWORD (EDITABLE)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {portalMode === 'patient' ? (
            /* HOSPITAL GOVERNANCE CARD FOR PATIENTS (NO PASSWORD CHANGE FORM) */
            <div className={`lg:col-span-7 p-6 rounded-3xl border ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base">Centrally Managed Patient Credentials</h4>
                  <p className="text-xs text-slate-400">Maintained and secured by Hospital Management & Medical Records Department</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Patient account credentials and session access logs are centrally maintained by the Hospital Administration & Medical Records Department (MRD) to guarantee continuity of care, attending doctor access, and HIPAA/NABH compliance.
                </p>

                <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account Governance:</span>
                    <span className="font-bold text-teal-600">MediCore Enterprise Hospital Administration</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Patient Identifier:</span>
                    <span className="font-mono font-bold">{profile.identifier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Session Audit Level:</span>
                    <span className="font-bold text-emerald-500">Continuous 256-Bit Telemetry Logged</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Credential Assistance:</span>
                    <span className="font-semibold">MRD Central Desk (Ext: 104) / reception@medicore.in</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                  <span>Password changes are handled centrally by the hospital; no manual rotation is required.</span>
                </div>
              </div>
            </div>
          ) : (
            /* CHANGE PASSWORD (7 Cols) FOR STAFF PORTALS */
            <div className={`lg:col-span-7 p-6 rounded-3xl border ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <h4 className="font-extrabold text-base">Rotate & Change Security Password</h4>
                <p className="text-xs text-slate-400">Passwords must adhere to HIPAA/SOC-2 256-bit entropy requirements.</p>
              </div>

              {pwError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Current Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters with numbers & symbols"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Password Strength:</span>
                        <span className="font-bold">{pwStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${pwStrength.color} transition-all duration-300`} style={{ width: `${pwStrength.score}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold border outline-none transition-all ${
                        isDark ? 'bg-slate-900/60 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Update Password & Re-Encrypt Keys</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TWO FACTOR & SECURITY CONTROLS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 2FA Card */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-base">Two-Factor Authentication</h4>
                <ShieldCheck className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Require OTP challenge verification during doctor or nurse login from unrecognized hospital terminals.
              </p>

              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-teal-600" />
                  <div>
                    <div className="text-xs font-bold">2FA Multi-Factor Challenge</div>
                    <div className="text-[11px] text-slate-400">
                      {profile.twoFactorEnabled ? 'Enabled (Recommended)' : 'Disabled'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setProfile(p => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled }));
                    showToast(`Two-Factor authentication ${!profile.twoFactorEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    profile.twoFactorEnabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      profile.twoFactorEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Auto Lock Screen */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-extrabold text-base">Inactivity Screen Lock</h4>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Automatically masks patient health records if no tactile interaction is registered.
              </p>

              <select
                value={profile.autoLockMinutes}
                onChange={e => {
                  sound.playClick();
                  setProfile({ ...profile, autoLockMinutes: Number(e.target.value) });
                  showToast(`Auto-lock timeout set to ${e.target.value} minutes.`);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value={15}>After 15 minutes of inactivity (HIPAA Standard)</option>
                <option value={30}>After 30 minutes of inactivity</option>
                <option value={60}>After 1 hour of inactivity</option>
                <option value={0}>Never auto-lock (Restricted Ward Stations only)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PREFERENCES & AUDIO CONTROLS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* THEME & APPEARANCE */}
          <div className="p-6 rounded-3xl border bg-white border-slate-200/80 text-[#142C43] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-extrabold text-base">Interface Theme</h4>
                <p className="text-xs text-slate-400">Standard clinical daylight white mode interface.</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600">
                <Sun className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="p-4 rounded-2xl border flex items-center justify-between bg-slate-50 border-slate-200">
                <div>
                  <div className="text-xs font-bold">Current Visual Theme</div>
                  <div className="text-[11px] text-teal-600 font-semibold">MediCore Daylight (White Mode Active)</div>
                </div>
                <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200/70 text-slate-700 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Permanent White Mode</span>
                </div>
              </div>
            </div>
          </div>

          {/* AUDIO SOUND EFFECTS */}
          <div className={`p-6 rounded-3xl border ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-extrabold text-base">Tactile Web Audio Engine</h4>
                <p className="text-xs text-slate-400">Zero-asset procedural synthesizers for tactile feedbacks and alarms.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const muted = sound.toggleMute();
                  setIsAudioMuted(muted);
                  showToast(`Tactile audio feedback ${muted ? 'muted' : 'unmuted'}.`);
                }}
                className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                  isAudioMuted ? 'bg-rose-500/10 text-rose-600' : 'bg-teal-500/10 text-teal-600'
                }`}
              >
                {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div className="text-xs font-bold text-slate-400 mb-2">Test Synthesizer Audio Presets:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => sound.playClick()}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
                >
                  Tactile Click
                </button>
                <button
                  type="button"
                  onClick={() => sound.playSuccess()}
                  className="px-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-xs font-bold hover:bg-emerald-500/20 transition-all cursor-pointer text-center"
                >
                  Success Chime
                </button>
                <button
                  type="button"
                  onClick={() => sound.playScanBeep()}
                  className="px-3 py-2 rounded-xl border border-teal-500/30 text-teal-600 bg-teal-500/10 text-xs font-bold hover:bg-teal-500/20 transition-all cursor-pointer text-center"
                >
                  Diagnostic Ping
                </button>
                <button
                  type="button"
                  onClick={() => sound.playHeartBeat()}
                  className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-600 bg-rose-500/10 text-xs font-bold hover:bg-rose-500/20 transition-all cursor-pointer text-center"
                >
                  Cardiac Pulse
                </button>
              </div>
            </div>
          </div>

          {/* CLINICAL NOTIFICATION CHANNELS */}
          <div className={`md:col-span-2 p-6 rounded-3xl border ${
            isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43] shadow-xs'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h4 className="font-extrabold text-base">Clinical Notification Subscriptions</h4>
                <p className="text-xs text-slate-400">Configure alert priorities received on your workstation screen.</p>
              </div>
              <Bell className="w-5 h-5 text-teal-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-xs font-bold">Code Blue & Critical Resuscitation Alerts</div>
                  <div className="text-[11px] text-slate-400">Audible siren for Ward 4 crash cart dispatch</div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.notifications.criticalAlerts}
                  onChange={e => setProfile({
                    ...profile,
                    notifications: { ...profile.notifications, criticalAlerts: e.target.checked }
                  })}
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                />
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-xs font-bold">Patient Inquiries & Video Tele-Chat</div>
                  <div className="text-[11px] text-slate-400">Inbound telehealth calls and chats</div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.notifications.patientInquiries}
                  onChange={e => setProfile({
                    ...profile,
                    notifications: { ...profile.notifications, patientInquiries: e.target.checked }
                  })}
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                />
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-xs font-bold">Lab & Diagnostic Scans Ready</div>
                  <div className="text-[11px] text-slate-400">Notifies when pathology uploads signed results</div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.notifications.labResults}
                  onChange={e => setProfile({
                    ...profile,
                    notifications: { ...profile.notifications, labResults: e.target.checked }
                  })}
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                />
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="text-xs font-bold">Shift Handover & SBAR Notifications</div>
                  <div className="text-[11px] text-slate-400">Receives bedside nursing shift debriefs</div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.notifications.shiftHandover}
                  onChange={e => setProfile({
                    ...profile,
                    notifications: { ...profile.notifications, shiftHandover: e.target.checked }
                  })}
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HIPAA AUDIT TRAIL                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h4 className="font-extrabold text-base">Cryptographic HIPAA & GDPR Audit Logs</h4>
              <p className="text-xs text-slate-400">Immutable 256-bit hashed chronological trail of all clinical actions across the enterprise.</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>256-Bit Telemetry</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Authorized Identity</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Clinical Module</th>
                  <th className="pb-3 font-semibold">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-teal-50/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-slate-400">{log.timestamp}</td>
                    <td className="py-3 font-bold">{log.userName}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-teal-600 dark:text-teal-400">{log.action}</td>
                    <td className="py-3 text-slate-400">{log.module}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RBAC PERMISSIONS MATRIX                                            */}
      {/* ========================================================================= */}
      {activeTab === 'rbac' && (
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0E2035]/80 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-[#142C43]'
        }`}>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h4 className="font-extrabold text-base">Enterprise Role-Based Access Control (RBAC) Architecture</h4>
            <p className="text-xs text-slate-400">Fine-grained permission boundaries across Super Admin, Doctor, Head Nurse, and Patient scopes.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">System Module</th>
                  <th className="pb-3 font-semibold text-center">Super Admin</th>
                  <th className="pb-3 font-semibold text-center">Doctor</th>
                  <th className="pb-3 font-semibold text-center">Head Nurse</th>
                  <th className="pb-3 font-semibold text-center">Patient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissions.map((p, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 font-bold">{p.module}</td>
                    <td className="py-3.5 text-center text-emerald-500 font-bold">✓ Full</td>
                    <td className="py-3.5 text-center">{p.doctor ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-slate-300">✕</span>}</td>
                    <td className="py-3.5 text-center">{p.nurse ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-slate-300">✕</span>}</td>
                    <td className="py-3.5 text-center">{p.patient ? <span className="text-emerald-500 font-bold">✓ Read</span> : <span className="text-slate-300">✕</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION LOGOUT MODAL                                                 */}
      {/* ========================================================================= */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0E2035] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6" />
            </div>

            <h4 className="text-lg font-black tracking-tight">Confirm Sign Out?</h4>
            <p className="text-xs text-slate-400 mt-1">
              You are currently signed in as <strong className="text-slate-200">{profile.name}</strong> ({profile.email}). Logging out will close your active clinical session on this terminal.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setLogoutModalOpen(false);
                  if (onLogout) onLogout();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

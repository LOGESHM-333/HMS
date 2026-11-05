/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserRole, ThemeMode, Patient, Doctor } from './types';
import { db } from './services/mockDatabase';
import { sound } from './services/audioService';
import { Header } from './components/navigation/Header';
import { UnifiedPortalAuth } from './components/auth/UnifiedPortalAuth';
import { CityCareDashboard } from './components/dashboard/CityCareDashboard';
import { WardOverview } from './components/ward/WardOverview';
import { MediFlexView } from './components/dashboard/MediFlexView';
import { PatientDirectory } from './components/patients/PatientDirectory';
import { AppointmentManager } from './components/appointments/AppointmentManager';
import { DoctorDirectory } from './components/doctors/DoctorDirectory';
import { BedManagement } from './components/beds/BedManagement';
import { PharmacyManager } from './components/pharmacy/PharmacyManager';
import { LabManager } from './components/laboratory/LabManager';
import { BillingManager } from './components/billing/BillingManager';
import { MedicalRecords } from './components/emr/MedicalRecords';
import { StaffManagement } from './components/staff/StaffManagement';
import { AnalyticsReports } from './components/analytics/AnalyticsReports';
import { PatientPortal } from './components/patient-portal/PatientPortal';
import { DoctorPortal } from './components/doctor-portal/DoctorPortal';
import { HeadNursePortal } from './components/nurse-portal/HeadNursePortal';
import { SettingsView } from './components/settings/SettingsView';
import { 
  Search, 
  X, 
  Sparkles, 
  Activity, 
  Command, 
  ShieldCheck, 
  Heart, 
  Calendar, 
  FileText, 
  Pill, 
  Bed as BedIcon 
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('medicore_authenticated'));
  });

  const [portalMode, setPortalMode] = useState<'management' | 'doctor' | 'nurse' | 'patient'>(() => {
    const saved = localStorage.getItem('medicore_portal_mode') as 'management' | 'doctor' | 'nurse' | 'patient';
    return saved || 'patient';
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const saved = localStorage.getItem('medicore_portal_mode');
    if (saved === 'patient') return 'patient-health';
    if (saved === 'doctor') return 'doctor-consult';
    if (saved === 'nurse') return 'nurse-rounds';
    return 'dashboard';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('medicore_portal_mode');
    if (saved === 'patient') return 'PATIENT';
    if (saved === 'doctor') return 'DOCTOR';
    if (saved === 'nurse') return 'NURSE';
    return db.getRole();
  });

  const [theme, setTheme] = useState<ThemeMode>(db.getTheme());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize theme with html body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#07111E';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F0F4F8';
    }
  }, [theme]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        sound.playClick();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRoleChange = (role: UserRole) => {
    db.setRole(role);
    setCurrentRole(role);
    if (role === 'PATIENT') {
      setPortalMode('patient');
      localStorage.setItem('medicore_portal_mode', 'patient');
      setCurrentTab('patient-health');
    } else if (role === 'DOCTOR') {
      setPortalMode('doctor');
      localStorage.setItem('medicore_portal_mode', 'doctor');
      setCurrentTab('doctor-consult');
    } else if (role === 'NURSE') {
      setPortalMode('nurse');
      localStorage.setItem('medicore_portal_mode', 'nurse');
      setCurrentTab('nurse-rounds');
    } else {
      setPortalMode('management');
      localStorage.setItem('medicore_portal_mode', 'management');
      setCurrentTab('dashboard');
    }
  };

  const handlePortalModeChange = (mode: 'management' | 'doctor' | 'nurse' | 'patient') => {
    setPortalMode(mode);
    localStorage.setItem('medicore_portal_mode', mode);
    if (mode === 'patient') {
      setCurrentRole('PATIENT');
      db.setRole('PATIENT');
      setCurrentTab('patient-health');
    } else if (mode === 'doctor') {
      setCurrentRole('DOCTOR');
      db.setRole('DOCTOR');
      setCurrentTab('doctor-consult');
    } else if (mode === 'nurse') {
      setCurrentRole('NURSE');
      db.setRole('NURSE');
      setCurrentTab('nurse-rounds');
    } else {
      setCurrentRole('SUPER_ADMIN');
      db.setRole('SUPER_ADMIN');
      setCurrentTab('dashboard');
    }
  };

  const handleToggleTheme = () => {
    const newTheme: ThemeMode = theme === 'mint' ? 'dark' : 'mint';
    db.setTheme(newTheme);
    setTheme(newTheme);
  };

  const handleSelectPatientFor3D = (patient: Patient) => {
    db.setSelectedPatient(patient.id);
  };

  const handleLogout = () => {
    sound.playClick();
    localStorage.removeItem('medicore_authenticated');
    localStorage.removeItem('medicore_portal_mode');
    localStorage.removeItem('medicore_patient_auth');
    localStorage.removeItem('medicore_patient_id');
    localStorage.removeItem('medicore_doctor_id');
    setIsAuthenticated(false);
  };

  // Quick command search items
  const quickSearchActions = [
    { label: 'Executive Hospital Command Dashboard', tab: 'dashboard', mode: 'management', icon: Sparkles },
    { label: 'Head Nurse Station - Ward Census & MAR', tab: 'nurse-rounds', mode: 'nurse', icon: Activity },
    { label: 'MediFlex 3D Organ & Clinical Intelligence', tab: 'mediflex', mode: 'management', icon: Heart },
    { label: 'Patient Directory & Health Records', tab: 'patients', mode: 'management', icon: FileText },
    { label: 'Schedule Doctor Consultation', tab: 'appointments', mode: 'management', icon: Calendar },
    { label: 'Hospital Ward Beds & ICU Status', tab: 'beds', mode: 'management', icon: BedIcon },
    { label: 'Pharmacy Inventory & Prescriptions', tab: 'pharmacy', mode: 'management', icon: Pill },
    { label: 'Laboratory Diagnostics & CT Scans', tab: 'laboratory', mode: 'management', icon: Activity },
    { label: 'Billing & Patient Invoices', tab: 'billing', mode: 'management', icon: ShieldCheck },
    { label: 'Patient Portal - Essential Health & 3D', tab: 'patient-health', mode: 'patient', icon: Activity },
    { label: 'Patient Portal - My Consultations', tab: 'patient-appointments', mode: 'patient', icon: Calendar },
    { label: 'Patient Portal - Active Prescriptions', tab: 'patient-prescriptions', mode: 'patient', icon: Pill },
    { label: 'Patient Portal - Lab Test Reports', tab: 'patient-labs', mode: 'patient', icon: FileText },
  ];

  const filteredSearch = quickSearchActions.filter(a =>
    a.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDark = theme === 'dark';

  // DIRECT ROOT ENTRY: If unauthenticated, show Unified Login/Signup page directly!
  if (!isAuthenticated) {
    return (
      <UnifiedPortalAuth
        theme={theme}
        onLoginPatient={(patient) => {
          localStorage.setItem('medicore_authenticated', 'true');
          localStorage.setItem('medicore_portal_mode', 'patient');
          localStorage.setItem('medicore_patient_auth', 'true');
          localStorage.setItem('medicore_patient_id', patient.id);
          setIsAuthenticated(true);
          setPortalMode('patient');
          setCurrentRole('PATIENT');
          db.setRole('PATIENT');
          setCurrentTab('patient-health');
        }}
        onLoginDoctor={(doctor) => {
          localStorage.setItem('medicore_authenticated', 'true');
          localStorage.setItem('medicore_portal_mode', 'doctor');
          if (doctor) {
            localStorage.setItem('medicore_doctor_id', doctor.id);
          }
          setIsAuthenticated(true);
          setPortalMode('doctor');
          setCurrentRole('DOCTOR');
          db.setRole('DOCTOR');
          setCurrentTab('doctor-consult');
        }}
        onLoginNurse={() => {
          localStorage.setItem('medicore_authenticated', 'true');
          localStorage.setItem('medicore_portal_mode', 'nurse');
          setIsAuthenticated(true);
          setPortalMode('nurse');
          setCurrentRole('NURSE');
          db.setRole('NURSE');
          setCurrentTab('nurse-rounds');
        }}
      />
    );
  }

  // Dynamic portal background tailored to each clinical domain
  const getPortalBackground = (mode: string) => {
    switch (mode) {
      case 'doctor':
        return {
          img: '/assets/medical-bg.jpg',
          pos: 'center 20%',
        };
      case 'nurse':
        return {
          img: '/assets/backgrounds/bg-option-5-smart-health.jpg',
          pos: 'center 40%',
        };
      case 'patient':
        return {
          img: '/assets/backgrounds/bg-option-2-warm-caring.jpg',
          pos: 'center 35%',
        };
      case 'management':
      default:
        return {
          img: '/assets/backgrounds/bg-option-4-wellness.jpg',
          pos: 'center 25%',
        };
    }
  };

  const currentBg = getPortalBackground(portalMode);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative ${
      isDark ? 'text-white' : 'text-[#142C43]'
    }`}>
      {/* GLOBAL BACKGROUND IMAGE WITH AMBIENT BACKDROP */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `url('${currentBg.img}')`,
          backgroundPosition: currentBg.pos,
          filter: 'brightness(1.30) contrast(1.05) saturate(1.15)',
        }}
      >
        <div className={`absolute inset-0 transition-colors duration-500 ${
          isDark 
            ? 'bg-[#07111E]/75 backdrop-blur-[1px]' 
            : 'bg-[#EDF2F7]/55 backdrop-blur-[1px]'
        }`} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* GLOBAL ENTERPRISE HEADER WITH BRANDING & PORTAL TOGGLE */}
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          portalMode={portalMode}
          onPortalModeChange={handlePortalModeChange}
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSearch={() => setIsSearchOpen(true)}
          onLogout={handleLogout}
        />

        {/* MAIN VIEWPORT CONTAINER */}
        <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
          {/* ================= MANAGEMENT PORTAL ROUTES ================= */}
          {portalMode === 'management' && (
            <>
              {currentTab === 'dashboard' && (
                <CityCareDashboard
                  theme={theme}
                  currentRole={currentRole}
                  onNavigateTab={setCurrentTab}
                  onSelectPatient={handleSelectPatientFor3D}
                  onSwitchToMediFlex={() => setCurrentTab('mediflex')}
                />
              )}

              {currentTab === 'ward' && (
                <WardOverview
                  theme={theme}
                  currentRole={currentRole}
                  onNavigateTab={setCurrentTab}
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onToggleTheme={handleToggleTheme}
                  onSelectPatientFor3D={(p) => {
                    handleSelectPatientFor3D(p);
                    setCurrentTab('mediflex');
                  }}
                />
              )}

              {currentTab === 'mediflex' && (
                <MediFlexView
                  theme={theme}
                  onOpenDetails={() => setCurrentTab('patients')}
                />
              )}

              {currentTab === 'patients' && (
                <PatientDirectory
                  theme={theme}
                  onSelectPatientFor3D={(p) => {
                    handleSelectPatientFor3D(p);
                    setCurrentTab('mediflex');
                  }}
                />
              )}

              {currentTab === 'appointments' && (
                <AppointmentManager theme={theme} />
              )}

              {currentTab === 'doctors' && (
                <DoctorDirectory theme={theme} />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsReports theme={theme} />
              )}

              {currentTab === 'beds' && (
                <BedManagement theme={theme} />
              )}

              {currentTab === 'emr' && (
                <MedicalRecords
                  theme={theme}
                  onOpen3DAnatomy={(pat) => {
                    handleSelectPatientFor3D(pat);
                    setCurrentTab('mediflex');
                  }}
                />
              )}

              {currentTab === 'pharmacy' && (
                <PharmacyManager theme={theme} />
              )}

              {currentTab === 'laboratory' && (
                <LabManager theme={theme} />
              )}

              {currentTab === 'billing' && (
                <BillingManager theme={theme} />
              )}

              {currentTab === 'staff' && (
                <StaffManagement theme={theme} />
              )}

              {currentTab === 'settings' && (
                <SettingsView theme={theme} />
              )}
            </>
          )}

          {/* ================= DOCTOR PORTAL ROUTES ================= */}
          {portalMode === 'doctor' && (
            <DoctorPortal 
              theme={theme}
              onSwitchToPatientPortal={() => handlePortalModeChange('patient')}
            />
          )}

          {/* ================= HEAD NURSE PORTAL ROUTES ================= */}
          {portalMode === 'nurse' && (
            <HeadNursePortal 
              theme={theme}
              onLogout={handleLogout}
              onSwitchToDoctorPortal={() => handlePortalModeChange('doctor')}
              onSwitchToPatientPortal={() => handlePortalModeChange('patient')}
            />
          )}

          {/* ================= PATIENT PORTAL ROUTES ================= */}
          {portalMode === 'patient' && (
            <PatientPortal 
              theme={theme} 
              activeSection={currentTab}
              onSelectSection={setCurrentTab}
              onSwitchToDoctorPortal={() => handlePortalModeChange('doctor')}
            />
          )}
        </main>

        {/* FOOTER */}
        <footer className={`py-6 border-t text-xs transition-colors duration-300 ${
          isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
        }`}>
          <div className="max-w-[1720px] mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-600 dark:text-teal-400">MediCore OS</span>
              <span>•</span>
              <span>Enterprise 3D Hospital Operating & Clinical Intelligence System</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Cmd</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">K</kbd> for Global Search</span>
              <span>•</span>
              <span>Protected Health System Station</span>
            </div>
          </div>
        </footer>
      </div>

      {/* GLOBAL SEARCH DIALOG (CMD+K) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`w-full max-w-xl rounded-3xl p-4 shadow-2xl border ${
            isDark ? 'bg-[#0E2035] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#142C43]'
          }`}>
            <div className="flex items-center gap-3 px-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-5 h-5 text-teal-500" />
              <input
                type="text"
                autoFocus
                placeholder="Search modules, patient records, clinical tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-transparent outline-none font-medium"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2 space-y-1">
              {filteredSearch.map((action, i) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      sound.playClick();
                      if (action.mode === 'patient') {
                        setPortalMode('patient');
                        setCurrentRole('PATIENT');
                        db.setRole('PATIENT');
                      } else if (action.mode === 'nurse') {
                        setPortalMode('nurse');
                        setCurrentRole('NURSE');
                        db.setRole('NURSE');
                      } else {
                        setPortalMode('management');
                      }
                      setCurrentTab(action.tab);
                      setIsSearchOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold text-left transition-all ${
                      isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-teal-50 text-slate-700 hover:text-teal-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span>{action.label}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {action.mode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

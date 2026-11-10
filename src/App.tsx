/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MediCore HMS — DocR-inspired Layout Shell
 * Complete rewrite preserving all original business logic and modules.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, ThemeMode, Patient, Doctor } from './types';
import { db } from './services/mockDatabase';
import { sound } from './services/audioService';
import { Sidebar, NavTab } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { UnifiedPortalAuth, AuthPortalCategory } from './components/auth/UnifiedPortalAuth';
import { CityCareDashboard } from './components/dashboard/CityCareDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { SuperAdminDashboard } from './components/super-admin/SuperAdminDashboard';
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
import { CommandPalette } from './components/navigation/CommandPalette';
import {
  Search,
  X,
  Sparkles,
  Activity,
  ShieldCheck,
  Heart,
  Calendar,
  FileText,
  Pill,
  Bed as BedIcon,
  Users,
  Stethoscope,
  FlaskConical,
  BarChart3,
  CreditCard,
  UserCog,
  Layers,
  LayoutDashboard,
} from 'lucide-react';

export type HeaderPortalMode = 'super-admin' | 'admin' | 'management' | 'doctor' | 'nurse' | 'patient';

// ============================================================
// PAGE TITLE MAP
// ============================================================
const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  overview: 'Enterprise Overview',
  ward: 'Ward Overview',
  monitoring: 'Continuous Telemetry & Monitoring',
  admissions: 'Inpatient Admissions',
  discharges: 'Patient Discharges',
  analytics: 'Analytics & Reports',
  patients: 'Patient Directory',
  doctors: 'Doctor Directory',
  appointments: 'Appointments',
  beds: 'Bed Management',
  pharmacy: 'Pharmacy',
  lab: 'Laboratory',
  billing: 'Billing & Finance',
  emr: 'Medical Records',
  staff: 'Staff Management',
  settings: 'Settings',
  'patient-health': 'Health Summary & 3D Anatomy',
  'patient-appointments': 'My Appointments & Telehealth',
  'patient-prescriptions': 'Active Prescriptions & Regimen',
  'patient-labs': 'Lab Reports & Diagnostic Scans',
  'patient-records': 'Clinical Journey & Medical Records',
  'patient-vaccines': 'Digital Immunization Passport',
  'patient-billing': 'Billing & Health Insurance',
  'patient-messages': 'Direct Doctor Communication',
  'patient-nutrition': 'Nutrition & Wellness Tracker',
  'patient-emergency': 'Emergency SOS Dispatch',
  'doctor-consult': 'Doctor Clinical Station',
  'doctor-chat': 'Patient Inquiries & Tele-Chat',
  'doctor-patients': 'Inpatient Rounds & Rosters',
  'doctor-rx': 'E-Prescriptions & Refills',
  'doctor-labs': 'Lab & Imaging Orders',
  'doctor-schedule': 'Clinic Schedule & Telehealth',
  'doctor-soap': 'SOAP Notes & EMR',
  'doctor-3d': '3D Organ Telemetry',
  'doctor-alerts': 'Critical Code Alerts',
  'nurse-rounds': 'Nursing Station',
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(localStorage.getItem('medicore_authenticated'))
  );

  const [portalMode, setPortalMode] = useState<HeaderPortalMode>(() => {
    const saved = localStorage.getItem('medicore_portal_mode') as HeaderPortalMode;
    return saved || 'patient';
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const saved = localStorage.getItem('medicore_portal_mode');
    if (saved === 'super-admin') return 'overview';
    if (saved === 'patient') return 'patient-health';
    if (saved === 'doctor') return 'doctor-overview';
    if (saved === 'nurse') return 'nurse-dashboard';
    return 'dashboard';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('medicore_portal_mode');
    if (saved === 'super-admin') return 'SUPER_ADMIN';
    if (saved === 'admin' || saved === 'management') return 'HOSPITAL_ADMIN';
    if (saved === 'patient') return 'PATIENT';
    if (saved === 'doctor') return 'DOCTOR';
    if (saved === 'nurse') return 'NURSE';
    return db.getRole();
  });

  const [theme] = useState<ThemeMode>('mint');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(db.getSelectedPatient());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auth init portal category
  const [initAuthCategory, setInitAuthCategory] = useState<AuthPortalCategory>(() => {
    const saved = localStorage.getItem('medicore_portal_mode');
    if (saved === 'super-admin') return 'super-admin';
    if (saved === 'admin' || saved === 'management') return 'admin';
    if (saved === 'patient') return 'patient';
    if (saved === 'doctor') return 'doctor';
    if (saved === 'nurse') return 'nurse';
    return 'admin';
  });

  // Permanently enforce white / daylight mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#F4F7F8';
    localStorage.setItem('medicore_theme', 'mint');
    db.setTheme('mint');
  }, []);

  // Cmd+K global search
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

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRoleChange = (role: UserRole) => {
    db.setRole(role);
    setCurrentRole(role);
    if (role === 'SUPER_ADMIN') {
      setPortalMode('super-admin');
      localStorage.setItem('medicore_portal_mode', 'super-admin');
      setCurrentTab('overview');
    } else if (role === 'HOSPITAL_ADMIN') {
      setPortalMode('admin');
      localStorage.setItem('medicore_portal_mode', 'admin');
      setCurrentTab('dashboard');
    } else if (role === 'PATIENT') {
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
    }
  };

  const handleLogout = () => {
    sound.playClick();
    setIsAuthenticated(false);
    localStorage.removeItem('medicore_authenticated');
    localStorage.removeItem('medicore_portal_mode');
    setPortalMode('admin');
    setCurrentTab('dashboard');
  };

  const handleSwitchPortal = (mode: HeaderPortalMode) => {
    sound.playClick();
    if (mode === 'doctor') {
      setPortalMode('doctor');
      setCurrentRole('DOCTOR');
      setCurrentTab('doctor-chat');
      localStorage.setItem('medicore_portal_mode', 'doctor');
      localStorage.setItem('medicore_authenticated', 'true');
      return;
    }
    if (mode === 'patient') {
      setPortalMode('patient');
      setCurrentRole('PATIENT');
      setCurrentTab('patient-messages');
      localStorage.setItem('medicore_portal_mode', 'patient');
      localStorage.setItem('medicore_authenticated', 'true');
      return;
    }
    setIsAuthenticated(false);
    setInitAuthCategory(mode as AuthPortalCategory);
    localStorage.removeItem('medicore_authenticated');
  };

  const handleTabChange = (tab: NavTab | string) => {
    sound.playClick();
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  const handleToggleTheme = () => {
    // Disabled - permanently in white mode
  };

  // User info from db
  const patients = db.getPatients();
  const doctors = db.getDoctors();
  const currentDoctor = doctors[0];

  const [profileVersion, setProfileVersion] = useState(0);

  const getProfile = () => {
    try {
      const saved = localStorage.getItem(`medicore_user_profile_${portalMode}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  };

  const getUserName = () => {
    const custom = getProfile();
    if (custom?.name) return custom.name;
    if (portalMode === 'doctor') return currentDoctor?.name || 'Dr. Roger S., MD';
    if (portalMode === 'patient') return selectedPatient?.name || patients[0]?.name || 'Magnus Stephenson';
    if (portalMode === 'super-admin') return 'Enterprise Director Harrison Cole';
    if (portalMode === 'nurse') return 'Nurse Sarah Jenkins, RN';
    return 'Chief Admin David Vance';
  };

  const getUserAvatar = () => {
    const custom = getProfile();
    if (custom?.avatar) return custom.avatar;
    if (portalMode === 'doctor') return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80';
    if (portalMode === 'patient') return selectedPatient?.avatar || patients[0]?.avatar;
    if (portalMode === 'super-admin') return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
    if (portalMode === 'nurse') return 'https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  };

  const isDark = false;

  // ============================================================
  // AUTH GATE
  // ============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-medical-grid" style={{ background: 'var(--color-bg)' }}>
        <UnifiedPortalAuth
          theme={theme}
          initialCategory={initAuthCategory}
          onLoginPatient={(patient: Patient) => {
            db.setSelectedPatient(patient.id);
            setSelectedPatient(patient);
            setPortalMode('patient');
            setCurrentRole('PATIENT');
            setCurrentTab('patient-health');
            localStorage.setItem('medicore_portal_mode', 'patient');
            localStorage.setItem('medicore_authenticated', 'true');
            localStorage.setItem('medicore_patient_id', patient.id);
            setIsAuthenticated(true);
            sound.playClick();
          }}
          onLoginDoctor={(doctor?: Doctor) => {
            setPortalMode('doctor');
            setCurrentRole('DOCTOR');
            setCurrentTab('doctor-overview');
            localStorage.setItem('medicore_portal_mode', 'doctor');
            localStorage.setItem('medicore_authenticated', 'true');
            setIsAuthenticated(true);
            sound.playClick();
          }}
          onLoginNurse={() => {
            setPortalMode('nurse');
            setCurrentRole('NURSE');
            setCurrentTab('nurse-dashboard');
            localStorage.setItem('medicore_portal_mode', 'nurse');
            localStorage.setItem('medicore_authenticated', 'true');
            setIsAuthenticated(true);
            sound.playClick();
          }}
          onLoginAdmin={() => {
            setPortalMode('admin');
            setCurrentRole('HOSPITAL_ADMIN');
            setCurrentTab('dashboard');
            localStorage.setItem('medicore_portal_mode', 'admin');
            localStorage.setItem('medicore_authenticated', 'true');
            setIsAuthenticated(true);
            sound.playClick();
          }}
          onLoginSuperAdmin={() => {
            setPortalMode('super-admin');
            setCurrentRole('SUPER_ADMIN');
            setCurrentTab('overview');
            localStorage.setItem('medicore_portal_mode', 'super-admin');
            localStorage.setItem('medicore_authenticated', 'true');
            setIsAuthenticated(true);
            sound.playClick();
          }}
        />
      </div>
    );
  }

  // ============================================================
  // AUTHENTICATED LAYOUT
  // ============================================================
  return (
    <div className={`docr-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

      {/* ===== SIDEBAR ===== */}
      <Sidebar
        currentTab={currentTab as NavTab}
        onTabChange={handleTabChange}
        portalMode={portalMode}
        currentRole={currentRole}
        theme={theme}
        onLogout={handleLogout}
        userName={getUserName()}
        userAvatar={getUserAvatar()}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="docr-main">

        {/* ===== TOP BAR ===== */}
        <TopBar
          currentRole={currentRole}
          portalMode={portalMode}
          theme={theme}
          onOpenSearch={() => setIsSearchOpen(true)}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          pageTitle={PAGE_TITLES[currentTab] || 'MediCore'}
          userName={getUserName()}
        />

        {/* ===== PAGE CONTENT ===== */}
        <main className="docr-content animate-fade-in" key={currentTab}>

          {/* =========== ADMIN / MANAGEMENT ROUTES =========== */}
          {(portalMode === 'admin' || portalMode === 'management') && (
            <>
              {currentTab === 'dashboard' && (
                <AdminDashboard
                  theme={theme}
                  currentRole={currentRole}
                  onNavigateTab={handleTabChange}
                  onSelectPatient={(p: Patient) => {
                    db.setSelectedPatient(p.id);
                    setSelectedPatient(p);
                    setCurrentTab('patients');
                  }}
                />
              )}
              {currentTab === 'ward' && (
                <WardOverview theme={theme} currentRole={currentRole} initialView="ward-overview" onNavigateTab={handleTabChange} />
              )}
              {currentTab === 'monitoring' && (
                <WardOverview theme={theme} currentRole={currentRole} initialView="monitoring" onNavigateTab={handleTabChange} />
              )}
              {currentTab === 'admissions' && (
                <WardOverview theme={theme} currentRole={currentRole} initialView="admissions" onNavigateTab={handleTabChange} />
              )}
              {currentTab === 'discharges' && (
                <WardOverview theme={theme} currentRole={currentRole} initialView="discharges" onNavigateTab={handleTabChange} />
              )}
              {currentTab === 'analytics' && (
                <AnalyticsReports theme={theme} />
              )}
              {currentTab === 'patients' && (
                <PatientDirectory theme={theme} onSelectPatientFor3D={(p: Patient) => {
                  db.setSelectedPatient(p.id);
                  setSelectedPatient(p);
                }} />
              )}
              {currentTab === 'doctors' && (
                <DoctorDirectory theme={theme} />
              )}
              {currentTab === 'appointments' && (
                <AppointmentManager theme={theme} />
              )}
              {currentTab === 'beds' && (
                <BedManagement theme={theme} />
              )}
              {currentTab === 'pharmacy' && (
                <PharmacyManager theme={theme} />
              )}
              {currentTab === 'lab' && (
                <LabManager theme={theme} />
              )}
              {currentTab === 'billing' && (
                <BillingManager theme={theme} />
              )}
              {currentTab === 'emr' && (
                <MedicalRecords
                  theme={theme}
                  onOpen3DAnatomy={(p: Patient) => {
                    db.setSelectedPatient(p.id);
                    setSelectedPatient(p);
                  }}
                />
              )}
              {currentTab === 'staff' && (
                <StaffManagement theme={theme} />
              )}
              {currentTab === 'settings' && (
                <SettingsView
                  theme={theme}
                  onThemeToggle={handleToggleTheme}
                  portalMode={portalMode}
                  currentRole={currentRole}
                  selectedPatient={selectedPatient || undefined}
                  onLogout={handleLogout}
                  onProfileUpdate={() => setProfileVersion(v => v + 1)}
                />
              )}
            </>
          )}

          {/* =========== SUPER ADMIN ROUTES =========== */}
          {portalMode === 'super-admin' && (
            <>
              {currentTab === 'overview' && (
                <SuperAdminDashboard
                  theme={theme}
                  onLogout={handleLogout}
                  onSwitchToAdminPortal={() => handleSwitchPortal('admin')}
                  onSwitchToDoctorPortal={() => handleSwitchPortal('doctor')}
                  onSwitchToNursePortal={() => handleSwitchPortal('nurse')}
                />
              )}
              {currentTab === 'patients' && <PatientDirectory theme={theme} onSelectPatientFor3D={(p: Patient) => { db.setSelectedPatient(p.id); setSelectedPatient(p); }} />}
              {currentTab === 'doctors' && <DoctorDirectory theme={theme} />}
              {currentTab === 'appointments' && <AppointmentManager theme={theme} />}
              {currentTab === 'beds' && <BedManagement theme={theme} />}
              {currentTab === 'pharmacy' && <PharmacyManager theme={theme} />}
              {currentTab === 'lab' && <LabManager theme={theme} />}
              {currentTab === 'billing' && <BillingManager theme={theme} />}
              {currentTab === 'emr' && <MedicalRecords theme={theme} onOpen3DAnatomy={(p: Patient) => { db.setSelectedPatient(p.id); setSelectedPatient(p); }} />}
              {currentTab === 'staff' && <StaffManagement theme={theme} />}
              {currentTab === 'analytics' && <AnalyticsReports theme={theme} />}
              {currentTab === 'settings' && (
                <SettingsView
                  theme={theme}
                  onThemeToggle={handleToggleTheme}
                  portalMode={portalMode}
                  currentRole={currentRole}
                  selectedPatient={selectedPatient || undefined}
                  onLogout={handleLogout}
                  onProfileUpdate={() => setProfileVersion(v => v + 1)}
                />
              )}
            </>
          )}

          {/* =========== DOCTOR PORTAL ROUTES =========== */}
          {portalMode === 'doctor' && (
            <>
              {currentTab !== 'settings' && (
                <DoctorPortal
                  theme={theme}
                  activeSection={currentTab}
                  onSelectSection={handleTabChange}
                  onSwitchToPatientPortal={() => handleSwitchPortal('patient')}
                  onSwitchToAdminPortal={() => handleSwitchPortal('admin')}
                  onSwitchToNursePortal={() => handleSwitchPortal('nurse')}
                  onLogout={handleLogout}
                />
              )}
              {currentTab === 'settings' && (
                <SettingsView
                  theme={theme}
                  onThemeToggle={handleToggleTheme}
                  portalMode={portalMode}
                  currentRole={currentRole}
                  selectedPatient={selectedPatient || undefined}
                  onLogout={handleLogout}
                  onProfileUpdate={() => setProfileVersion(v => v + 1)}
                />
              )}
            </>
          )}

          {/* =========== NURSE PORTAL ROUTES =========== */}
          {portalMode === 'nurse' && (
            <>
              {currentTab.startsWith('nurse-') && (
                <HeadNursePortal
                  theme={theme}
                  activeSection={currentTab}
                  onSelectSection={handleTabChange}
                  onSwitchToDoctorPortal={() => handleSwitchPortal('doctor')}
                  onSwitchToAdminPortal={() => handleSwitchPortal('admin')}
                  onLogout={handleLogout}
                />
              )}
              {currentTab === 'patients' && <PatientDirectory theme={theme} onSelectPatientFor3D={(p: Patient) => { db.setSelectedPatient(p.id); setSelectedPatient(p); }} />}
              {currentTab === 'beds' && <BedManagement theme={theme} />}
              {/* Ward Overview removed for nurse */}
              {currentTab === 'settings' && (
                <SettingsView
                  theme={theme}
                  onThemeToggle={handleToggleTheme}
                  portalMode={portalMode}
                  currentRole={currentRole}
                  selectedPatient={selectedPatient || undefined}
                  onLogout={handleLogout}
                  onProfileUpdate={() => setProfileVersion(v => v + 1)}
                />
              )}
            </>
          )}

          {/* =========== PATIENT PORTAL ROUTES =========== */}
          {portalMode === 'patient' && (
            <>
              {currentTab !== 'settings' && (
                <PatientPortal
                  theme={theme}
                  patient={selectedPatient || undefined}
                  activeSection={currentTab}
                  onSelectSection={handleTabChange}
                  onSwitchToDoctorPortal={() => handleSwitchPortal('doctor')}
                  onSwitchToNursePortal={() => handleSwitchPortal('nurse')}
                  onSwitchToAdminPortal={() => handleSwitchPortal('admin')}
                  onSwitchToSuperAdminPortal={() => handleSwitchPortal('super-admin')}
                  onLogout={handleLogout}
                />
              )}
              {currentTab === 'settings' && (
                <SettingsView
                  theme={theme}
                  onThemeToggle={handleToggleTheme}
                  portalMode={portalMode}
                  currentRole={currentRole}
                  selectedPatient={selectedPatient || undefined}
                  onLogout={handleLogout}
                  onProfileUpdate={() => setProfileVersion(v => v + 1)}
                />
              )}
            </>
          )}

        </main>

        {/* Footer */}
        <footer
          className="py-4 border-t text-xs flex items-center justify-between px-6 flex-shrink-0"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', background: 'var(--color-surface)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-brand-accent)', fontWeight: 700 }}>MediCore OS</span>
            <span>·</span>
            <span>Enterprise Hospital Operating & Clinical Intelligence System</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>K</kbd>
            <span>for Global Search</span>
          </div>
        </footer>
      </div>

      {/* ===== GLOBAL COMMAND PALETTE (CTRL+K / CMD+K) ===== */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        theme={theme}
        portalMode={portalMode}
        onSwitchPortal={handleSwitchPortal}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          const title = PAGE_TITLES[tab];
          if (title) document.title = `${title} | MediCore Healthcare`;
        }}
        onSelectPatient={(pat) => {
          setSelectedPatient(pat);
          db.setSelectedPatient(pat.id);
        }}
      />
    </div>
  );
}

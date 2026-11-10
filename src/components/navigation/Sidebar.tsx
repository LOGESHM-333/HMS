/**
 * DocR-inspired Sidebar Navigation
 * Fixed sidebar with collapsible support, role-based nav groups,
 * and smooth animations for the MediCore HMS.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  Bed,
  Pill,
  FlaskConical,
  CreditCard,
  FileText,
  UserCog,
  BarChart3,
  Settings,
  Heart,
  Activity,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  Syringe,
  ClipboardList,
  LogIn,
  LogOut,
  X,
  Menu,
  Database,
} from 'lucide-react';
import { UserRole, ThemeMode } from '../../types';
import { Avatar, Badge } from '../ui';
import { sound } from '../../services/audioService';

export type NavTab =
  | 'dashboard' | 'ward' | 'monitoring' | 'admissions' | 'discharges' | 'analytics' | 'overview'
  | 'patients' | 'doctors' | 'appointments' | 'beds'
  | 'pharmacy' | 'lab' | 'billing' | 'emr'
  | 'staff' | 'settings'
  | 'patient-health' | 'doctor-consult' | 'nurse-rounds'
  | 'patient-appointments' | 'patient-prescriptions' | 'patient-labs'
  | 'patient-records' | 'patient-vaccines' | 'patient-billing'
  | 'patient-messages' | 'patient-nutrition' | 'patient-emergency'
  | 'doctor-overview' | 'doctor-chat' | 'doctor-patients' | 'doctor-rx' | 'doctor-labs'
  | 'doctor-schedule' | 'doctor-soap' | 'doctor-3d' | 'doctor-alerts'
  | 'nurse-dashboard' | 'nurse-mar' | 'nurse-triage' | 'nurse-sbar' | 'nurse-orders' | 'nurse-roster' | 'nurse-emergency';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info';
  roles: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  roles: string[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    roles: ['super-admin', 'admin', 'management', 'doctor'],
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'management'] },
      { id: 'overview', label: 'Enterprise Overview', icon: Building2, roles: ['super-admin'] },
      { id: 'ward', label: 'Ward Overview', icon: Layers, roles: ['admin', 'management'] },
      { id: 'monitoring', label: 'Monitoring', icon: Activity, badge: '3', badgeVariant: 'danger', roles: ['admin', 'management'] },
      { id: 'admissions', label: 'Admissions', icon: LogIn, roles: ['admin', 'management'] },
      { id: 'discharges', label: 'Discharges', icon: LogOut, roles: ['admin', 'management'] },
      { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, roles: ['admin', 'management', 'super-admin'] },
    ],
  },
  {
    label: 'Clinical',
    roles: ['admin', 'management', 'doctor', 'nurse', 'super-admin'],
    items: [
      { id: 'patients', label: 'Patients', icon: Users, roles: ['admin', 'management', 'doctor', 'nurse', 'super-admin'] },
      { id: 'doctors', label: 'Doctors', icon: Stethoscope, roles: ['admin', 'management', 'super-admin'] },
      { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['admin', 'management', 'doctor', 'super-admin'] },
      { id: 'beds', label: 'Bed Management', icon: Bed, roles: ['admin', 'management', 'nurse', 'super-admin'] },
      { id: 'emr', label: 'Medical Records', icon: FileText, roles: ['admin', 'management', 'doctor', 'super-admin'] },
    ],
  },
  {
    label: 'Operations',
    roles: ['admin', 'management', 'super-admin'],
    items: [
      { id: 'pharmacy', label: 'Pharmacy', icon: Pill, roles: ['admin', 'management', 'super-admin'] },
      { id: 'lab', label: 'Laboratory', icon: FlaskConical, roles: ['admin', 'management', 'super-admin'] },
      { id: 'billing', label: 'Billing & Finance', icon: CreditCard, roles: ['admin', 'management', 'super-admin'] },
      { id: 'staff', label: 'Staff Management', icon: UserCog, roles: ['admin', 'management', 'super-admin'] },
    ],
  },
  {
    label: 'Portal',
    roles: ['doctor', 'nurse', 'patient'],
    items: [
      { id: 'doctor-overview', label: 'Doctor Overview', icon: LayoutDashboard, roles: ['doctor'] },
      { id: 'doctor-chat', label: 'Patient Inquiries & Tele-Chat', icon: Stethoscope, roles: ['doctor'], badge: 'Live', badgeVariant: 'info' },
      { id: 'doctor-patients', label: 'Inpatient Rounds & Rosters', icon: Bed, roles: ['doctor'], badge: '5' },
      { id: 'doctor-rx', label: 'E-Prescriptions & Refills', icon: Pill, roles: ['doctor'], badge: '2' },
      { id: 'doctor-labs', label: 'Lab & Imaging Orders', icon: FlaskConical, roles: ['doctor'], badge: '3' },
      { id: 'doctor-schedule', label: 'Clinic Schedule & Telehealth', icon: Calendar, roles: ['doctor'], badge: '6' },
      { id: 'doctor-soap', label: 'SOAP Notes & EMR', icon: ClipboardList, roles: ['doctor'] },
      { id: 'doctor-3d', label: '3D Organ Telemetry', icon: Heart, roles: ['doctor'] },
      { id: 'doctor-alerts', label: 'Critical Code Alerts', icon: ShieldCheck, roles: ['doctor'], badge: 'Alert', badgeVariant: 'danger' },
      { id: 'nurse-dashboard', label: 'Nurse Dashboard', icon: LayoutDashboard, roles: ['nurse'] },
      { id: 'nurse-rounds', label: 'Ward & Bed Rounds', icon: Bed, roles: ['nurse'] },
      { id: 'nurse-mar', label: 'MAR Medication Admin', icon: Pill, roles: ['nurse'], badge: '3' },
      { id: 'nurse-triage', label: 'Vitals & MEWS Triage', icon: Activity, roles: ['nurse'] },
      { id: 'nurse-sbar', label: 'SBAR Shift Handover', icon: ClipboardList, roles: ['nurse'] },
      { id: 'nurse-orders', label: 'Doctor Orders Queue', icon: FileText, roles: ['nurse'], badge: 'Pending', badgeVariant: 'warning' },
      { id: 'nurse-roster', label: 'Nurse Staff Roster', icon: Users, roles: ['nurse'] },
      { id: 'nurse-emergency', label: 'Rapid Response SOS', icon: ShieldCheck, roles: ['nurse'], badge: 'Alert', badgeVariant: 'danger' },
      { id: 'patient-health', label: 'Health Summary & 3D', icon: Heart, roles: ['patient'] },
      { id: 'patient-appointments', label: 'Appointments', icon: Calendar, roles: ['patient'] },
      { id: 'patient-prescriptions', label: 'Prescriptions', icon: Pill, roles: ['patient'] },
      { id: 'patient-labs', label: 'Lab Reports', icon: Activity, roles: ['patient'] },
      { id: 'patient-records', label: 'Medical History', icon: FileText, roles: ['patient'] },
      { id: 'patient-vaccines', label: 'Vaccine Passport', icon: ShieldCheck, roles: ['patient'] },
      { id: 'patient-billing', label: 'Billing & Insurance', icon: CreditCard, roles: ['patient'] },
      { id: 'patient-messages', label: 'Doctor Chat', icon: Users, roles: ['patient'], badge: 'Online', badgeVariant: 'info' },
      { id: 'patient-nutrition', label: 'Nutrition & Diet', icon: Layers, roles: ['patient'] },
      { id: 'patient-emergency', label: 'Emergency SOS', icon: Activity, roles: ['patient'] },
    ],
  },
  {
    label: 'System',
    roles: ['admin', 'management', 'super-admin', 'doctor', 'nurse', 'patient'],
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'management', 'super-admin', 'doctor', 'nurse', 'patient'] },
    ],
  },
];

interface SidebarProps {
  currentTab: NavTab | string;
  onTabChange: (tab: NavTab) => void;
  portalMode: string;
  currentRole: UserRole;
  theme: ThemeMode;
  onLogout?: () => void;
  userName?: string;
  userAvatar?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  portalMode,
  currentRole,
  theme,
  onLogout,
  userName = 'Admin User',
  userAvatar,
  mobileOpen = false,
  onMobileClose,
  collapsed: externalCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = () => {
    sound.playClick();
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };
  const isDark = theme === 'dark';

  // Filter groups & items by portal mode
  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(portalMode)),
  })).filter(group =>
    group.roles.includes(portalMode) && group.items.length > 0
  );

  const roleDisplays: Record<string, { label: string; color: string }> = {
    'super-admin': { label: 'Super Admin', color: 'badge-purple' },
    'admin': { label: 'Hospital Admin', color: 'badge-info' },
    'management': { label: 'Management', color: 'badge-info' },
    'doctor': { label: 'Doctor', color: 'badge-success' },
    'nurse': { label: 'Head Nurse', color: 'badge-warning' },
    'patient': { label: 'Patient', color: 'badge-neutral' },
  };

  const roleDisplay = roleDisplays[portalMode] || { label: 'User', color: 'badge-neutral' };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`docr-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Healthcare / Hospital Project-Related Visual Design: ECG Pulse Waves & Floating Clinical Crosses */}
        <div className="sidebar-medical-fx" aria-hidden="true">
          <svg className="med-ecg-svg top" viewBox="0 0 300 120" preserveAspectRatio="none">
            <path className="med-ecg-glow" d="M0,60 L40,60 L50,60 L55,40 L60,85 L68,15 L76,105 L82,50 L88,65 L94,60 L140,60 L148,60 L153,42 L158,82 L165,18 L173,102 L179,52 L185,64 L191,60 L240,60 L248,60 L253,44 L258,80 L265,22 L272,98 L278,54 L284,63 L290,60 L300,60" />
            <path className="med-ecg-line" d="M0,60 L40,60 L50,60 L55,40 L60,85 L68,15 L76,105 L82,50 L88,65 L94,60 L140,60 L148,60 L153,42 L158,82 L165,18 L173,102 L179,52 L185,64 L191,60 L240,60 L248,60 L253,44 L258,80 L265,22 L272,98 L278,54 L284,63 L290,60 L300,60" />
          </svg>
          <svg className="med-ecg-svg bottom" viewBox="0 0 300 120" preserveAspectRatio="none">
            <path className="med-ecg-glow" d="M0,60 L40,60 L50,60 L55,40 L60,85 L68,15 L76,105 L82,50 L88,65 L94,60 L140,60 L148,60 L153,42 L158,82 L165,18 L173,102 L179,52 L185,64 L191,60 L240,60 L248,60 L253,44 L258,80 L265,22 L272,98 L278,54 L284,63 L290,60 L300,60" />
            <path className="med-ecg-line" d="M0,60 L40,60 L50,60 L55,40 L60,85 L68,15 L76,105 L82,50 L88,65 L94,60 L140,60 L148,60 L153,42 L158,82 L165,18 L173,102 L179,52 L185,64 L191,60 L240,60 L248,60 L253,44 L258,80 L265,22 L272,98 L278,54 L284,63 L290,60 L300,60" />
          </svg>
          <span className="med-cross mc1">✚</span>
          <span className="med-cross mc2">✚</span>
          <span className="med-cross mc3">✚</span>
          <span className="med-cross mc4">✚</span>
        </div>

        {/* Header: Logo + Collapse */}
        <div
          className="flex items-center px-4 py-4 border-b flex-shrink-0 relative z-10"
          style={{ borderColor: 'var(--color-border)', minHeight: 'var(--header-height)' }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <img
                src="/assets/medicore-logo.png"
                alt="MediCore Logo"
                className="w-8 h-8 rounded-xl object-contain shadow-md flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-800 text-sm leading-tight truncate" style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>
                  MediCore
                </div>
                <div className="text-[10px] font-500" style={{ color: 'var(--color-text-muted)' }}>
                  Enterprise HMS
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <img
              src="/assets/medicore-logo.png"
              alt="MediCore Logo"
              className="w-8 h-8 rounded-xl object-contain shadow-md mx-auto"
            />
          )}

          {/* Close on mobile */}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="ml-auto p-1 rounded-lg md:hidden"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <X size={18} />
            </button>
          )}

          {/* Collapse toggle on desktop */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg transition-colors ml-auto cursor-pointer"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 relative z-10">
          {visibleGroups.map(group => (
            <div key={group.label} className="mb-2">
              {/* Group Label */}
              {!collapsed && (
                <div
                  className="px-2 py-1.5 text-[10px] font-700 uppercase tracking-widest mb-1"
                  style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}
                >
                  {group.label}
                </div>
              )}
              {collapsed && <div className="border-t my-2" style={{ borderColor: 'var(--color-border)' }} />}

              {/* Nav Items */}
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      if (onMobileClose) onMobileClose();
                    }}
                    className={`docr-sidebar-nav-item w-full ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="nav-icon flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`badge ${item.badgeVariant ? `badge-${item.badgeVariant}` : 'badge-info'} text-[10px] px-1.5 py-0.5 ml-1`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: User + Logout */}
        <div
          className="p-3 border-t flex-shrink-0 relative z-10"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <Avatar
                name={userName}
                src={userAvatar}
                size="sm"
                status="online"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-800 truncate" style={{ color: '#000000', fontWeight: 800 }}>
                  {userName}
                </div>
                <span className={`badge ${roleDisplay.color} text-[10px] px-1.5 py-0.5 font-bold`}>
                  {roleDisplay.label}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: '#000000' }}
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar name={userName} src={userAvatar} size="sm" status="online" />
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#000000' }}
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;


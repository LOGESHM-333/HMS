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
  LogOut,
  X,
  Menu,
} from 'lucide-react';
import { UserRole, ThemeMode } from '../../types';
import { Avatar, Badge } from '../ui';

export type NavTab =
  | 'dashboard' | 'ward' | 'analytics' | 'overview'
  | 'patients' | 'doctors' | 'appointments' | 'beds'
  | 'pharmacy' | 'lab' | 'billing' | 'emr'
  | 'staff' | 'settings'
  | 'patient-health' | 'doctor-consult' | 'nurse-rounds';

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
    roles: ['super-admin', 'admin', 'management', 'doctor', 'nurse'],
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'management'] },
      { id: 'overview', label: 'Enterprise Overview', icon: Building2, roles: ['super-admin'] },
      { id: 'ward', label: 'Ward Overview', icon: Layers, roles: ['admin', 'management', 'nurse'] },
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
      { id: 'doctor-consult', label: 'Consultation Desk', icon: ClipboardList, roles: ['doctor'] },
      { id: 'nurse-rounds', label: 'Nursing Station', icon: Syringe, roles: ['nurse'] },
      { id: 'patient-health', label: 'My Health', icon: Heart, roles: ['patient'] },
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
}) => {
  const [collapsed, setCollapsed] = useState(false);
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
    'doctor': { label: 'Physician', color: 'badge-success' },
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
        {/* Header: Logo + Collapse */}
        <div
          className="flex items-center px-4 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)', minHeight: 'var(--header-height)' }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent))',
                }}
              >
                <Activity size={16} color="white" />
              </div>
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
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto"
              style={{
                background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent))',
              }}
            >
              <Activity size={16} color="white" />
            </div>
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
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg transition-colors ml-auto"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
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
          className="p-3 border-t flex-shrink-0"
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
                <div className="text-xs font-600 truncate" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {userName}
                </div>
                <span className={`badge ${roleDisplay.color} text-[10px] px-1.5 py-0.5`}>
                  {roleDisplay.label}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: 'var(--color-text-muted)' }}
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
                  style={{ color: 'var(--color-text-muted)' }}
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


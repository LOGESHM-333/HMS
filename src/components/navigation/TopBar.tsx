/**
 * DocR-inspired Top Bar
 * Slim header with search, notifications, theme toggle, and portal info.
 */

import React, { useState } from 'react';
import {
  Search,
  Bell,
  Volume2,
  VolumeX,
  ChevronDown,
  Menu,
  ShieldCheck,
  Command,
} from 'lucide-react';
import { UserRole, ThemeMode, CriticalAlert } from '../../types';
import { Avatar, Badge, statusToBadge } from '../ui';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';

interface TopBarProps {
  currentRole: UserRole;
  portalMode: string;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onOpenSearch?: () => void;
  onMobileMenuOpen?: () => void;
  pageTitle?: string;
  userName?: string;
  userAvatar?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentRole,
  portalMode,
  theme,
  onToggleTheme,
  onOpenSearch,
  onMobileMenuOpen,
  pageTitle,
  userName = 'Admin User',
  userAvatar,
}) => {
  const isDark = theme === 'dark';
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const alerts = db.getAlerts();
  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  const severityBadge: Record<string, string> = {
    critical: 'badge-danger',
    high: 'badge-warning',
    medium: 'badge-info',
    low: 'badge-neutral',
  };

  return (
    <header className="docr-topbar">
      {/* Mobile Menu Toggle & Brand */}
      <div className="md:hidden flex items-center gap-2 flex-shrink-0">
        <button
          className="p-2 rounded-lg flex-shrink-0"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
          onClick={onMobileMenuOpen}
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-1.5">
          <img src="/assets/medicore-logo.png" alt="MediCore Logo" className="w-6 h-6 rounded-md object-contain shadow-xs" />
          <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>MediCore</span>
        </div>
      </div>

      {/* Page Title (desktop) */}
      {pageTitle && (
        <div className="hidden md:block flex-shrink-0">
          <span className="text-sm font-600" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {pageTitle}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search Trigger */}
      <button
        className="docr-search hidden sm:flex"
        style={{ minWidth: 180, maxWidth: 260 }}
        onClick={() => { sound.playClick(); onOpenSearch?.(); }}
      >
        <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <span className="text-sm flex-1 text-left" style={{ color: 'var(--color-text-muted)' }}>
          Search...
        </span>
        <div className="flex items-center gap-0.5">
          <kbd className="text-[10px] px-1 py-0.5 rounded font-mono" style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>⌘</kbd>
          <kbd className="text-[10px] px-1 py-0.5 rounded font-mono" style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>K</kbd>
        </div>
      </button>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search (mobile) */}
        <button
          className="sm:hidden p-2 rounded-xl"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
          onClick={() => { sound.playClick(); onOpenSearch?.(); }}
        >
          <Search size={16} />
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>


        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { sound.playClick(); setNotifOpen(v => !v); }}
            className="p-2 rounded-xl transition-colors relative"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
            title="Alerts"
          >
            <Bell size={16} />
            {criticalCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: 'var(--color-danger)' }}
              >
                {criticalCount > 9 ? '9+' : criticalCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-xl z-50 overflow-hidden animate-fade-up"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="text-sm font-700" style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Clinical Alerts
                </div>
                {criticalCount > 0 && (
                  <span className="badge badge-danger">{criticalCount} Critical</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No active alerts
                  </div>
                ) : (
                  alerts.slice(0, 8).map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 px-4 py-3 border-b transition-colors cursor-pointer"
                      style={{ borderColor: 'var(--color-border-light)' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{
                          background: alert.severity === 'critical' ? 'var(--color-danger)'
                            : alert.severity === 'high' ? 'var(--color-warning)'
                            : alert.severity === 'medium' ? 'var(--color-info)'
                            : 'var(--color-text-muted)',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-600" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                          {alert.title}
                        </div>
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                          {alert.department} · {alert.time}
                        </div>
                      </div>
                      <span className={`badge ${severityBadge[alert.severity] || 'badge-neutral'} flex-shrink-0`}>
                        {alert.severity}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setNotifOpen(false)}
                className="w-full py-2.5 text-xs font-600 text-center transition-colors"
                style={{
                  color: 'var(--color-brand-primary)',
                  fontWeight: 600,
                  background: 'var(--color-surface-2)',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                View All Alerts
              </button>
            </div>
          )}
        </div>

        {/* Click outside to close notif */}
        {notifOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
        )}
      </div>
    </header>
  );
};


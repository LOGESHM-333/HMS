/**
 * DocR-inspired Shared UI Primitives
 * Design System Components for MediCore HMS
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================
// BADGE
// ============================================================
export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, dot, className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
          style={{ background: 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
};

// Map common status strings to badge variants
export function statusToBadge(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (['active', 'available', 'completed', 'paid', 'in stock', 'on duty', 'optimal', 'admitted', 'dispensed', 'normal'].some(k => s.includes(k))) return 'success';
  if (['pending', 'scheduled', 'low stock', 'on break', 'borderline', 'partial', 'prescribed', 'in consultation'].some(k => s.includes(k))) return 'warning';
  if (['critical', 'icu', 'expired', 'overdue', 'cancelled', 'offline', 'abnormal', 'discontinued', 'off duty', 'surge'].some(k => s.includes(k))) return 'danger';
  if (['in-progress', 'in progress', 'analyzing', 'sample', 'high load', 'outpatient', 'in surgery'].some(k => s.includes(k))) return 'info';
  if (['discharged', 'maintenance', 'cleaning', 'refilled'].some(k => s.includes(k))) return 'purple';
  return 'neutral';
}

// ============================================================
// STAT CARD
// ============================================================
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  icon?: React.ReactNode;
  iconBg?: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, trend, icon, iconBg = 'bg-blue-50', subtitle, onClick, className = ''
}) => {
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;
  const trendClass = trend?.direction === 'up' ? 'stat-trend-up' : trend?.direction === 'down' ? 'stat-trend-down' : 'badge-neutral';

  return (
    <div
      className={`docr-stat-card cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="stat-label truncate">{label}</div>
          <div className="stat-value mt-1">{value}</div>
          {subtitle && <div className="text-xs text-secondary mt-1">{subtitle}</div>}
        </div>
        {trend && (
          <div className={`stat-trend ${trendClass} flex-shrink-0`}>
            <TrendIcon size={11} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// PAGE HEADER
// ============================================================
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; onClick?: () => void }[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumb, actions }) => {
  return (
    <div className="docr-page-header animate-fade-up">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-muted text-xs">/</span>}
                <span
                  className={`text-xs font-medium ${crumb.onClick ? 'text-brand cursor-pointer hover:underline' : 'text-secondary'}`}
                  onClick={crumb.onClick}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="docr-page-title">{title}</h1>
        {subtitle && <p className="docr-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
};

// ============================================================
// BUTTON
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'text-xs px-3 py-1.5 gap-1.5' : size === 'lg' ? 'text-sm px-6 py-3 gap-2.5' : '';
  return (
    <button
      className={`btn-${variant} ${sizeClass} ${className} ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
      {iconRight && !loading && iconRight}
    </button>
  );
};

// ============================================================
// INPUT
// ============================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label, error, hint, iconLeft, iconRight, className = '', ...props
}) => {
  return (
    <div className="w-full">
      {label && <label className="docr-label">{label}</label>}
      <div className="relative">
        {iconLeft && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            {iconLeft}
          </div>
        )}
        <input
          className={`docr-input ${iconLeft ? 'pl-10' : ''} ${iconRight ? 'pr-10' : ''} ${error ? 'border-danger focus:shadow-none' : ''} ${className}`}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-secondary">{hint}</p>}
    </div>
  );
};

// ============================================================
// SELECT
// ============================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, className = '', children, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="docr-label">{label}</label>}
      <select className={`docr-input docr-select ${error ? 'border-danger' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
    </div>
  );
};

// ============================================================
// MODAL
// ============================================================
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open, onClose, title, subtitle, children, maxWidth = 'max-w-xl', actions
}) => {
  if (!open) return null;

  return (
    <div className="docr-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`docr-modal ${maxWidth} w-full`} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <h2 className="text-base font-700" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{title}</h2>
              {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg hover:bg-surface-2 transition-colors flex-shrink-0"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {actions && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// AVATAR
// ============================================================
interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'warning' | 'critical';
  className?: string;
}

const sizeMap = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56 };
const textSizeMap = { xs: 'text-[9px]', sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg' };

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', status, className = '' }) => {
  const px = sizeMap[size];
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="docr-avatar object-cover"
          style={{ width: px, height: px }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div
          className={`docr-avatar flex items-center justify-center font-bold ${textSizeMap[size]}`}
          style={{
            width: px,
            height: px,
            background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent))',
            color: '#fff',
          }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`status-dot ${status} absolute bottom-0 right-0`}
        />
      )}
    </div>
  );
};

// ============================================================
// EMPTY STATE
// ============================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div className="mb-4 p-4 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
          <div style={{ color: 'var(--color-text-muted)' }}>{icon}</div>
        </div>
      )}
      <h3 className="text-sm font-600 mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{title}</h3>
      {description && <p className="text-xs mb-5" style={{ color: 'var(--color-text-secondary)', maxWidth: 320 }}>{description}</p>}
      {action}
    </div>
  );
};

// ============================================================
// LOADING SPINNER
// ============================================================
interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 20, color = 'var(--color-brand-primary)' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className="animate-spin"
  >
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" strokeOpacity="0.25" />
    <path
      d="M12 3a9 9 0 019 9"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

// ============================================================
// PROGRESS BAR
// ============================================================
interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, color = 'var(--color-brand-accent)', height = 6, className = ''
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`docr-progress ${className}`} style={{ height }}>
      <div
        className="docr-progress-bar"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
};

// ============================================================
// CARD
// ============================================================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children, className = '', padding = 'p-5', hover = false, onClick
}) => (
  <div
    className={`docr-card ${padding} ${hover ? 'cursor-pointer' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// ============================================================
// DIVIDER
// ============================================================
export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`docr-divider ${className}`} />
);

// ============================================================
// ALERT
// ============================================================
interface AlertProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, onClose }) => (
  <div className={`docr-alert docr-alert-${variant}`}>
    <div className="flex-1">
      {title && <div className="font-600 text-sm mb-0.5" style={{ fontWeight: 600 }}>{title}</div>}
      <div className="text-xs">{children}</div>
    </div>
    {onClose && (
      <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    )}
  </div>
);

// ============================================================
// TABS
// ============================================================
interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className = '' }) => (
  <div className={`docr-tabs overflow-x-auto ${className}`}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={`docr-tab flex items-center gap-1.5 ${active === tab.id ? 'active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
        {tab.label}
        {tab.count !== undefined && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active === tab.id ? 'bg-brand/10 text-brand' : 'bg-surface text-muted'}`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ============================================================
// TOOLTIP (simple)
// ============================================================
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const posClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[position];

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={`absolute ${posClass} z-50 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
        style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
      >
        {content}
      </div>
    </div>
  );
};


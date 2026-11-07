/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DocR-inspired Unified Portal Authentication
 * Clean, professional healthcare login UI preserving all original logic.
 */

import React, { useState } from 'react';
import { Patient, Doctor, ThemeMode } from '../../types';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Heart,
  Stethoscope,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Server,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export type AuthPortalCategory = 'patient' | 'doctor' | 'nurse' | 'admin' | 'super-admin';

interface UnifiedPortalAuthProps {
  theme: ThemeMode;
  initialCategory?: AuthPortalCategory;
  onLoginPatient: (patient: Patient) => void;
  onLoginDoctor: (doctor?: Doctor) => void;
  onLoginNurse: (nurseName?: string) => void;
  onLoginAdmin?: (adminName?: string) => void;
  onLoginSuperAdmin?: (superAdminName?: string) => void;
}

const PORTAL_CONFIG: Record<AuthPortalCategory, {
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  demoEmail: string;
  demoPassword: string;
  badge: string;
}> = {
  patient: {
    label: 'Patient Portal',
    desc: 'Access your health records, appointments, and test results',
    icon: Heart,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    demoEmail: 'patient@medicore.in',
    demoPassword: 'patient123',
    badge: 'Self Service',
  },
  doctor: {
    label: 'Physician Portal',
    desc: 'Clinical consultation desk, prescriptions, and SOAP notes',
    icon: Stethoscope,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    demoEmail: 'doctor@medicore.in',
    demoPassword: 'doctor123',
    badge: 'Clinical',
  },
  nurse: {
    label: 'Nursing Station',
    desc: 'Ward rounds, patient vitals, and SBAR handovers',
    icon: Activity,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    demoEmail: 'nurse@medicore.in',
    demoPassword: 'nurse123',
    badge: 'Clinical',
  },
  admin: {
    label: 'Admin Portal',
    desc: 'Hospital operations, bed management, and staff oversight',
    icon: Building2,
    color: '#0F52BA',
    gradient: 'linear-gradient(135deg, #0F52BA, #1E40AF)',
    demoEmail: 'admin@medicore.in',
    demoPassword: 'admin123',
    badge: 'Operations',
  },
  'super-admin': {
    label: 'Enterprise Command',
    desc: 'Multi-facility governance, security, and system configuration',
    icon: ShieldCheck,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    demoEmail: 'superadmin@medicore.in',
    demoPassword: 'enterprise123',
    badge: 'Enterprise',
  },
};

export const UnifiedPortalAuth: React.FC<UnifiedPortalAuthProps> = ({
  initialCategory = 'admin',
  onLoginPatient,
  onLoginDoctor,
  onLoginNurse,
  onLoginAdmin,
  onLoginSuperAdmin,
}) => {
  const [portalCategory, setPortalCategory] = useState<AuthPortalCategory>(initialCategory);

  React.useEffect(() => {
    if (initialCategory) setPortalCategory(initialCategory);
  }, [initialCategory]);

  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Patient signup
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const existingPatients = db.getPatients();
  const existingDoctors = db.getDoctors();

  const config = PORTAL_CONFIG[portalCategory];
  const Icon = config.icon;

  const handleCategorySwitch = (category: AuthPortalCategory) => {
    sound.playClick();
    setPortalCategory(category);
    setAuthView('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
  };

  const fillDemo = () => {
    sound.playClick();
    setEmail(config.demoEmail);
    setPassword(config.demoPassword);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email or ID.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    sound.playClick();

    setTimeout(() => {
      if (portalCategory === 'patient') {
        const found = existingPatients.find(
          p => p.email.toLowerCase() === email.trim().toLowerCase() ||
               p.patientCode.toLowerCase() === email.trim().toLowerCase()
        );
        const patient = found || existingPatients[0];
        sound.playSuccess();
        setSuccessMessage(`Welcome back, ${patient.name}! Launching Patient Portal...`);
        setTimeout(() => onLoginPatient(patient), 500);
      } else if (portalCategory === 'doctor') {
        const foundDoc = existingDoctors.find(
          d => d.name.toLowerCase().includes(email.trim().toLowerCase()) ||
               d.id.toLowerCase() === email.trim().toLowerCase()
        );
        const doctor = foundDoc || existingDoctors[0];
        sound.playSuccess();
        setSuccessMessage(`Welcome, ${doctor.name}! Accessing Clinical Station...`);
        setTimeout(() => onLoginDoctor(doctor), 500);
      } else if (portalCategory === 'nurse') {
        sound.playSuccess();
        setSuccessMessage('Welcome, Nurse Sarah Jenkins, RN! Opening Nursing Station...');
        setTimeout(() => onLoginNurse('Nurse Sarah Jenkins, RN'), 500);
      } else if (portalCategory === 'admin') {
        sound.playSuccess();
        setSuccessMessage('Welcome, Hospital Administrator! Loading Operations Portal...');
        setTimeout(() => { if (onLoginAdmin) onLoginAdmin('Hospital Admin'); }, 500);
      } else if (portalCategory === 'super-admin') {
        sound.playSuccess();
        setSuccessMessage('Enterprise access granted. Loading Governance Command...');
        setTimeout(() => { if (onLoginSuperAdmin) onLoginSuperAdmin('Chief Administrator'); }, 500);
      }
      setLoading(false);
    }, 900);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signUpName.trim()) { setErrorMessage('Please enter your full name.'); return; }
    if (!signUpEmail.trim()) { setErrorMessage('Please enter your email address.'); return; }
    if (!signUpPhone.trim()) { setErrorMessage('Please enter your phone number.'); return; }
    if (!signUpPassword || signUpPassword.length < 6) { setErrorMessage('Password must be at least 6 characters.'); return; }

    setLoading(true);
    sound.playClick();

    setTimeout(() => {
      const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        patientCode: `P-${Math.floor(10000 + Math.random() * 90000)}`,
        name: signUpName.trim(),
        age: 30,
        gender: 'Other',
        bloodGroup: 'A+',
        phone: signUpPhone.trim(),
        email: signUpEmail.trim(),
        avatar: '',
        admissionStatus: 'Outpatient',
        primaryDoctorId: 'doc-1',
        primaryDoctorName: existingDoctors[0]?.name || 'Dr. Roger S.',
        diagnosis: 'New patient registration',
        heartAge: 30,
        chronologicalAge: 30,
        riskScore: 15,
        vitals: {
          bloodPressure: '120/80',
          pulseRate: 72,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          temperature: 36.8,
          hba1c: 5.1,
          cholesterol: 185,
          stressLevel: 'Mild',
          sleepQuality: 'Good',
          lastUpdated: 'Just now',
        },
        symptoms: [],
        allergies: [],
        medicalHistory: [],
      };
      db.addPatient(newPatient);
      sound.playSuccess();
      setSuccessMessage(`Account created for ${newPatient.name}! Redirecting to your portal...`);
      setTimeout(() => onLoginPatient(newPatient), 600);
      setLoading(false);
    }, 1000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setErrorMessage('Please enter your registered email address.'); return; }
    setLoading(true);
    sound.playClick();
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage(`Password reset link sent to ${email}. Please check your inbox.`);
    }, 800);
  };

  const portalTabs: AuthPortalCategory[] = ['patient', 'doctor', 'nurse', 'admin', 'super-admin'];

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* ===== LEFT PANEL: Branding ===== */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[480px] flex-shrink-0 relative overflow-hidden"
        style={{ background: config.gradient }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Activity size={22} color="white" />
            </div>
            <div>
              <div className="text-white font-800 text-lg" style={{ fontWeight: 800 }}>MediCore OS</div>
              <div className="text-white/70 text-xs">Enterprise HMS Platform</div>
            </div>
          </div>

          {/* Active portal info */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <span className="text-white/80 text-xs font-600">{config.badge}</span>
            </div>
            <h1 className="text-4xl font-800 text-white mb-4 leading-tight" style={{ fontWeight: 800 }}>
              {config.label}
            </h1>
            <p className="text-white/75 text-base leading-relaxed">
              {config.desc}
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-3">
          {[
            'Real-time patient vitals & monitoring',
            'Secure role-based access control',
            'MySQL-backed data persistence',
            'Multi-facility enterprise governance',
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                  <path d="M10 3L5 8.5L2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <span className="text-white/80 text-sm">{feat}</span>
            </div>
          ))}
          <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <div className="text-white/50 text-xs">
              MediCore OS v3.0 · HIPAA Compliant · MySQL + Express Backend
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL: Auth Form ===== */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: config.gradient }}>
            <Activity size={16} color="white" />
          </div>
          <span className="font-800 text-sm" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>MediCore OS</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">

            {/* Portal Selector Tabs */}
            <div className="mb-8">
              <div className="text-xs font-700 uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)', fontWeight: 700 }}>
                Select Portal
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {portalTabs.map(tab => {
                  const cfg = PORTAL_CONFIG[tab];
                  const TabIcon = cfg.icon;
                  const isActive = portalCategory === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => handleCategorySwitch(tab)}
                      className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all"
                      style={{
                        background: isActive ? 'var(--color-surface)' : 'transparent',
                        borderColor: isActive ? cfg.color : 'var(--color-border)',
                        color: isActive ? cfg.color : 'var(--color-text-muted)',
                        boxShadow: isActive ? `0 2px 8px ${cfg.color}22` : 'none',
                      }}
                    >
                      <TabIcon size={16} />
                      <span className="text-[9px] font-600 text-center leading-tight" style={{ fontWeight: 600 }}>
                        {tab === 'super-admin' ? 'Super\nAdmin' : cfg.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Header */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: config.gradient }}
                >
                  <Icon size={20} color="white" />
                </div>
                <div>
                  <h2 className="text-xl font-800" style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>
                    {authView === 'login' ? 'Sign In' : authView === 'signup' ? 'Create Account' : 'Reset Password'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {config.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
                style={{ background: 'var(--color-danger-bg)', borderLeft: '3px solid var(--color-danger)' }}
              >
                <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: '#B91C1C' }}>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
                style={{ background: 'var(--color-success-bg)', borderLeft: '3px solid var(--color-success)' }}
              >
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: '#047857' }}>{successMessage}</span>
              </div>
            )}

            {/* ===== LOGIN FORM ===== */}
            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="docr-label">
                    {portalCategory === 'patient' ? 'Email or Patient Code' : 'Email or Staff ID'}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={config.demoEmail}
                      className="docr-input pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="docr-label mb-0">Password</label>
                    <button
                      type="button"
                      onClick={() => { sound.playClick(); setAuthView('forgot'); setErrorMessage(null); }}
                      className="text-xs font-600 transition-colors"
                      style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="docr-input pl-10 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-700 text-white text-sm transition-all mt-2"
                  style={{
                    background: config.gradient,
                    fontWeight: 700,
                    opacity: loading ? 0.75 : 1,
                    boxShadow: `0 4px 14px ${config.color}40`,
                    transform: loading ? 'none' : undefined,
                  }}
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                  ) : (
                    <>Sign in to {config.label} <ArrowRight size={16} /></>
                  )}
                </button>

                {/* Demo credentials */}
                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full text-xs py-2.5 rounded-xl border transition-all"
                  style={{
                    color: 'var(--color-text-secondary)',
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface-2)',
                  }}
                >
                  <span className="font-600" style={{ fontWeight: 600 }}>Auto-fill demo credentials</span>
                  <span className="ml-2 font-mono" style={{ color: 'var(--color-text-muted)' }}>({config.demoEmail})</span>
                </button>

                {/* Sign up option */}
                {portalCategory === 'patient' && (
                  <div className="text-center pt-1">
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => { sound.playClick(); setAuthView('signup'); setErrorMessage(null); }}
                      className="text-sm font-600 transition-colors"
                      style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}
                    >
                      Register as patient
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* ===== SIGNUP FORM ===== */}
            {authView === 'signup' && portalCategory === 'patient' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="docr-label">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="text" value={signUpName} onChange={e => setSignUpName(e.target.value)} placeholder="Your full name" className="docr-input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="docr-label">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} placeholder="you@example.com" className="docr-input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="docr-label">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="tel" value={signUpPhone} onChange={e => setSignUpPhone(e.target.value)} placeholder="+91 98765 43210" className="docr-input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="docr-label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input type={showPassword ? 'text' : 'password'} value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} placeholder="Min. 6 characters" className="docr-input pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-700 text-white text-sm" style={{ background: config.gradient, fontWeight: 700, opacity: loading ? 0.75 : 1 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Create Patient Account <ArrowRight size={16} /></>}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => { sound.playClick(); setAuthView('login'); setErrorMessage(null); }} className="text-sm font-600" style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>
                    Already have an account? Sign in
                  </button>
                </div>
              </form>
            )}

            {/* ===== FORGOT PASSWORD ===== */}
            {authView === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Enter your registered email and we'll send you a password reset link.
                </p>
                <div>
                  <label className="docr-label">Registered Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@hospital.com" className="docr-input pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-700 text-white text-sm" style={{ background: config.gradient, fontWeight: 700, opacity: loading ? 0.75 : 1 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => { sound.playClick(); setAuthView('login'); setErrorMessage(null); }} className="text-sm font-600" style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            {/* Footer note */}
            <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Protected by HIPAA compliance · End-to-end encrypted
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                MediCore OS Enterprise · MySQL-backed · v3.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

interface AuthorizedStaffAccount {
  allowedEmails: string[];
  allowedPasswords: string[];
  role: 'DOCTOR' | 'NURSE' | 'HOSPITAL_ADMIN' | 'SUPER_ADMIN';
  portalCategory: Exclude<AuthPortalCategory, 'patient'>;
  name: string;
  doctorData?: (doctors: Doctor[]) => Doctor | undefined;
}

const AUTHORIZED_MANAGEMENT_ACCOUNTS: Record<Exclude<AuthPortalCategory, 'patient'>, AuthorizedStaffAccount[]> = {
  doctor: [
    {
      allowedEmails: ['medicore.doctor@gmail.com'],
      allowedPasswords: ['Doctor@2026'],
      role: 'DOCTOR',
      portalCategory: 'doctor',
      name: 'Dr. Roger S., MD (Chief of Cardiology)',
      doctorData: (docs) => docs.find(d => d.id === 'doc-1' || d.name.toLowerCase().includes('roger')) || docs[0],
    }
  ],
  nurse: [
    {
      allowedEmails: ['medicore.nurse@gmail.com'],
      allowedPasswords: ['Nurse@2026'],
      role: 'NURSE',
      portalCategory: 'nurse',
      name: 'Nurse Sarah Jenkins, RN, BSN',
    }
  ],
  admin: [
    {
      allowedEmails: ['medicore.admin@gmail.com'],
      allowedPasswords: ['Admin@2026'],
      role: 'HOSPITAL_ADMIN',
      portalCategory: 'admin',
      name: 'Marcus Vance, MHA (Hospital Administrator)',
    }
  ],
  'super-admin': [
    {
      allowedEmails: ['medicore.superadmin@gmail.com'],
      allowedPasswords: ['SuperAdmin@2026'],
      role: 'SUPER_ADMIN',
      portalCategory: 'super-admin',
      name: 'Dr. Eleanor Vance, MD, CISSP (Enterprise Command)',
    }
  ]
};

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
    color: '#3B4E6A',
    gradient: 'linear-gradient(135deg, #3B4E6A, #485E83)',
    demoEmail: 'medicore.patient@gmail.com',
    demoPassword: 'patient123',
    badge: 'Self Service',
  },
  doctor: {
    label: 'Doctor Portal',
    desc: 'Clinical consultation desk, prescriptions, and SOAP notes',
    icon: Stethoscope,
    color: '#3B4E6A',
    gradient: 'linear-gradient(135deg, #3B4E6A, #506D9C)',
    demoEmail: 'medicore.doctor@gmail.com',
    demoPassword: 'Doctor@2026',
    badge: 'Clinical',
  },
  nurse: {
    label: 'Nursing Station',
    desc: 'Ward rounds, patient vitals, and SBAR handovers',
    icon: Activity,
    color: '#44597C',
    gradient: 'linear-gradient(135deg, #44597C, #506D9C)',
    demoEmail: 'medicore.nurse@gmail.com',
    demoPassword: 'Nurse@2026',
    badge: 'Clinical',
  },
  admin: {
    label: 'Admin Portal',
    desc: 'Hospital operations, bed management, and staff oversight',
    icon: Building2,
    color: '#3B4E6A',
    gradient: 'linear-gradient(135deg, #3B4E6A, #485E83)',
    demoEmail: 'medicore.admin@gmail.com',
    demoPassword: 'Admin@2026',
    badge: 'Operations',
  },
  'super-admin': {
    label: 'Enterprise Command',
    desc: 'Multi-facility governance, security, and system configuration',
    icon: ShieldCheck,
    color: '#2E3E55',
    gradient: 'linear-gradient(135deg, #2E3E55, #44597C)',
    demoEmail: 'medicore.superadmin@gmail.com',
    demoPassword: 'SuperAdmin@2026',
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
    localStorage.removeItem('medicore_authenticated');
  }, []);

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

    const inputEmail = email.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputEmail) {
      setErrorMessage(portalCategory === 'patient' ? 'Please enter your email or Patient Code.' : 'Please enter your management official Gmail / Email.');
      return;
    }
    if (!inputPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    sound.playClick();

    setTimeout(() => {
      // 1. PATIENT PORTAL LOGIN
      if (portalCategory === 'patient') {
        // A. Match against hospital database (existing patients or staff-registered patients)
        const dbPatient = existingPatients.find(
          p => p.email?.toLowerCase() === inputEmail ||
               p.patientCode?.toLowerCase() === inputEmail ||
               p.id?.toLowerCase() === inputEmail
        );

        if (dbPatient || inputEmail === 'medicore.patient@gmail.com') {
          const targetPatient = dbPatient || existingPatients[0];
          
          // Check registered accounts for custom password, or hospital default password 'patient123'
          let expectedPass = 'patient123';
          try {
            const registered = JSON.parse(localStorage.getItem('medicore_registered_patients') || '[]');
            const customReg = registered.find((p: any) => p.email?.toLowerCase() === inputEmail || p.id === targetPatient.id);
            if (customReg?.password) {
              expectedPass = customReg.password;
            } else if ((targetPatient as any).password) {
              expectedPass = (targetPatient as any).password;
            }
          } catch {}

          if (inputPass !== expectedPass) {
            setLoading(false);
            sound.playWarning();
            setErrorMessage('Gmail or password incorrect. Please enter the valid credentials.');
            return;
          }

          sound.playSuccess();
          setSuccessMessage(`Welcome back, ${targetPatient.name}! Launching Patient Portal...`);
          setTimeout(() => onLoginPatient(targetPatient), 400);
          setLoading(false);
          return;
        }

        // B. Check local self-registered accounts
        try {
          const registered = JSON.parse(localStorage.getItem('medicore_registered_patients') || '[]');
          const matched = registered.find((p: any) => p.email?.toLowerCase() === inputEmail || p.patientCode?.toLowerCase() === inputEmail);
          if (matched) {
            const expectedPass = matched.password || 'patient123';
            if (inputPass !== expectedPass) {
              setLoading(false);
              sound.playWarning();
              setErrorMessage('Gmail or password incorrect. Please enter the valid credentials.');
              return;
            }
            sound.playSuccess();
            setSuccessMessage(`Welcome back, ${matched.name}! Launching Patient Portal...`);
            setTimeout(() => onLoginPatient(matched), 400);
            setLoading(false);
            return;
          }
        } catch {}

        setLoading(false);
        sound.playWarning();
        setErrorMessage('Gmail or password incorrect. No patient account found with this email or Patient Code. Please register below.');
        return;
      } 
      // 2. MANAGEMENT ROLES (Doctor, Nurse, Admin, Super Admin)
      else {
        const categoryAccounts = AUTHORIZED_MANAGEMENT_ACCOUNTS[portalCategory];
        
        // Find matching staff account by allowed emails
        const matchedAccount = categoryAccounts.find(acc => 
          acc.allowedEmails.some(ae => ae.toLowerCase() === inputEmail)
        );

        if (!matchedAccount) {
          setLoading(false);
          sound.playWarning();
          setErrorMessage('Gmail or password incorrect. Only management-issued credentials can access this portal.');
          return;
        }

        // Validate corresponding password
        const passwordMatches = matchedAccount.allowedPasswords.some(ap => ap === inputPass);
        if (!passwordMatches) {
          setLoading(false);
          sound.playWarning();
          setErrorMessage('Gmail or password incorrect. Please enter the valid corresponding management password.');
          return;
        }

        // Successfully authenticated!
        sound.playSuccess();
        if (portalCategory === 'doctor') {
          const doctorObj = (matchedAccount.doctorData && matchedAccount.doctorData(existingDoctors)) || existingDoctors[0];
          setSuccessMessage(`Access Granted: Welcome, ${matchedAccount.name}! Opening Doctor Clinical Station...`);
          setTimeout(() => onLoginDoctor(doctorObj), 400);
        } else if (portalCategory === 'nurse') {
          setSuccessMessage(`Access Granted: Welcome, ${matchedAccount.name}! Opening Head Nurse Station...`);
          setTimeout(() => onLoginNurse(matchedAccount.name), 400);
        } else if (portalCategory === 'admin') {
          setSuccessMessage(`Access Granted: Welcome, ${matchedAccount.name}! Opening Hospital Operations Portal...`);
          setTimeout(() => { if (onLoginAdmin) onLoginAdmin(matchedAccount.name); }, 400);
        } else if (portalCategory === 'super-admin') {
          setSuccessMessage(`Enterprise Clearance Verified: Welcome, ${matchedAccount.name}! Accessing Governance Command...`);
          setTimeout(() => { if (onLoginSuperAdmin) onLoginSuperAdmin(matchedAccount.name); }, 400);
        }
      }
      setLoading(false);
    }, 500);
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
      const newPatient: Patient & { password?: string } = {
        id: `pat-${Date.now()}`,
        patientCode: `P-${Math.floor(10000 + Math.random() * 90000)}`,
        name: signUpName.trim(),
        age: 30,
        gender: 'Other',
        bloodGroup: 'A+',
        phone: signUpPhone.trim(),
        email: signUpEmail.trim().toLowerCase(),
        password: signUpPassword,
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
      
      try {
        const existingReg = JSON.parse(localStorage.getItem('medicore_registered_patients') || '[]');
        localStorage.setItem('medicore_registered_patients', JSON.stringify([...existingReg, newPatient]));
      } catch {}

      db.addPatient(newPatient);
      sound.playSuccess();
      setSuccessMessage(`Account created for ${newPatient.name}! Redirecting to your portal...`);
      setTimeout(() => onLoginPatient(newPatient), 500);
      setLoading(false);
    }, 600);
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
      {/* ===== LEFT PANEL: Professional Hospital Visual ===== */}
      <div className="hidden lg:flex flex-col justify-between p-10 w-[460px] xl:w-[480px] flex-shrink-0 relative overflow-hidden text-white shadow-2xl">
        {/* Real Hospital Image with Rich Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none select-none transition-all duration-700 scale-105"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111E] via-[#3B4E6A]/75 to-[#07111E]/80 backdrop-blur-[1px]" />

        {/* Top Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/assets/medicore-logo.png"
              alt="MediCore Logo"
              className="w-12 h-12 rounded-2xl object-cover border border-white/30 shadow-xl drop-shadow-md flex-shrink-0"
            />
            <div>
              <div className="text-white font-extrabold text-lg tracking-tight">MediCore Health</div>
              <div className="text-white/70 text-xs">Clinical Hospital Operating Network</div>
            </div>
          </div>
        </div>

        {/* Bottom Hero Card */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Smart Clinical Operations</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-snug tracking-tight">
            Advanced Clinical Care & Diagnostic Management
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Secure hospital intelligence serving doctors, nursing stations, hospital administrators, and patient care in real time.
          </p>

          <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
            <span>HIPAA Compliant System</span>
            <span>24/7 Clinical Network</span>
          </div>
        </div>
      </div>
      {/* ===== RIGHT PANEL: Auth Form ===== */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <img
            src="/assets/medicore-logo.png"
            alt="MediCore Logo"
            className="w-9 h-9 rounded-xl object-contain shadow-sm flex-shrink-0"
          />
          <div>
            <span className="font-800 text-sm block" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>MediCore OS</span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Hospital Intelligence System</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
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
              <div className="flex items-center gap-3.5 mb-2">
                <img
                  src="/assets/medicore-logo.png"
                  alt="MediCore Logo"
                  className="w-11 h-11 rounded-2xl object-cover shadow-md border border-slate-200 dark:border-slate-700/60 flex-shrink-0"
                />
                <div>
                  <h2 className="text-xl font-800" style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>
                    {authView === 'login' ? 'Sign In' : authView === 'signup' ? 'Create Account' : 'Reset Password'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {config.label} • MediCore OS
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
                <span style={{ color: '#3B4E6A' }}>{successMessage}</span>
              </div>
            )}

            {/* ===== LOGIN FORM ===== */}
            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="docr-label">
                    {portalCategory === 'patient' ? 'Email or Patient Code' : 'Management Official Gmail / Email'}
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3.5 pointer-events-none z-10" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={config.demoEmail}
                      className="docr-input"
                      style={{ paddingLeft: '44px' }}
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
                      className="text-xs font-600 transition-colors cursor-pointer"
                      style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 pointer-events-none z-10" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="docr-input"
                      style={{ paddingLeft: '44px', paddingRight: '44px' }}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer z-10 transition-colors"
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

                {/* Management Credential Guide / Helper Box */}
                {portalCategory !== 'patient' ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wide">
                        <Lock size={12} className="text-[#3B4E6A]" />
                        Official Management Login:
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#3B4E6A]/10 text-[#3B4E6A]">
                        Authorized Only
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/70">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans text-[11px]">Management Gmail:</span>
                        <strong className="text-slate-900 select-all font-semibold">{config.demoEmail}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans text-[11px]">Password:</span>
                        <strong className="text-slate-900 select-all font-semibold">{config.demoPassword}</strong>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      🔒 Access Policy: Only official management Gmail credentials can log in to this portal. Other accounts are rejected.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>Demo Patient Account:</span>
                      <span className="font-mono text-slate-800 font-semibold">{config.demoEmail}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>Password:</span>
                      <span className="font-mono text-slate-800 font-semibold">{config.demoPassword}</span>
                    </div>
                  </div>
                )}

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
            {authView === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/60 mb-2 shadow-xs">
                  <img src="/assets/medicore-logo.png" alt="MediCore Logo" className="w-10 h-10 rounded-xl object-contain shadow-xs flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">MediCore Registration</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Join the HIPAA-compliant clinical care network</div>
                  </div>
                </div>
                <div>
                  <label className="docr-label">Full Name</label>
                  <div className="relative flex items-center">
                    <User size={16} className="absolute left-3.5 pointer-events-none z-10" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="text" value={signUpName} onChange={e => setSignUpName(e.target.value)} placeholder="Your full name" className="docr-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <div>
                  <label className="docr-label">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3.5 pointer-events-none z-10" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} placeholder="you@example.com" className="docr-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <div>
                  <label className="docr-label">Phone Number</label>
                  <div className="relative flex items-center">
                    <Phone size={16} className="absolute left-3.5 pointer-events-none z-10" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="tel" value={signUpPhone} onChange={e => setSignUpPhone(e.target.value)} placeholder="+91 98765 43210" className="docr-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <div>
                  <label className="docr-label">Password</label>
                  <div className="relative flex items-center">
                    <Lock size={16} className="absolute left-3.5 pointer-events-none z-10" style={{ color: 'var(--color-text-muted)' }} />
                    <input type={showPassword ? 'text' : 'password'} value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} placeholder="Min. 6 characters" className="docr-input" style={{ paddingLeft: '44px', paddingRight: '44px' }} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer z-10" style={{ color: 'var(--color-text-muted)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-700 text-white text-sm cursor-pointer" style={{ background: config.gradient, fontWeight: 700, opacity: loading ? 0.75 : 1 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Create Patient Account <ArrowRight size={16} /></>}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => { sound.playClick(); setAuthView('login'); setErrorMessage(null); }} className="text-sm font-600 cursor-pointer" style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>
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
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3.5 pointer-events-none z-10" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@hospital.com" className="docr-input" style={{ paddingLeft: '44px' }} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-700 text-white text-sm cursor-pointer" style={{ background: config.gradient, fontWeight: 700, opacity: loading ? 0.75 : 1 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => { sound.playClick(); setAuthView('login'); setErrorMessage(null); }} className="text-sm font-600 cursor-pointer" style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>
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

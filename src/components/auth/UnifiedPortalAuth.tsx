/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
  CheckCircle2
} from 'lucide-react';

interface UnifiedPortalAuthProps {
  theme: ThemeMode;
  initialCategory?: 'patient' | 'doctor' | 'nurse';
  onLoginPatient: (patient: Patient) => void;
  onLoginDoctor: (doctor?: Doctor) => void;
  onLoginNurse: (nurseName?: string) => void;
}

export const UnifiedPortalAuth: React.FC<UnifiedPortalAuthProps> = ({
  initialCategory = 'patient',
  onLoginPatient,
  onLoginDoctor,
  onLoginNurse
}) => {
  const [portalCategory, setPortalCategory] = useState<'patient' | 'doctor' | 'nurse'>(initialCategory);

  // Sync category if initialCategory changes
  React.useEffect(() => {
    if (initialCategory) {
      setPortalCategory(initialCategory);
    }
  }, [initialCategory]);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Common Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Patient Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Google OAuth Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const existingPatients = db.getPatients();
  const existingDoctors = db.getDoctors();

  // Reset form when changing category
  const handleCategorySwitch = (category: 'patient' | 'doctor' | 'nurse') => {
    sound.playClick();
    setPortalCategory(category);
    setAuthView('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(
        portalCategory === 'patient'
          ? 'Please enter your email address or patient code.'
          : portalCategory === 'doctor'
            ? 'Please enter your doctor ID or clinical email.'
            : 'Please enter your nurse ID or hospital email.'
      );
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password / security credential.');
      return;
    }

    setLoading(true);
    sound.playClick();

    setTimeout(() => {
      if (portalCategory === 'patient') {
        const found = existingPatients.find(
          p =>
            p.email.toLowerCase() === email.trim().toLowerCase() ||
            p.patientCode.toLowerCase() === email.trim().toLowerCase()
        );
        const patient = found || existingPatients[0];
        sound.playSuccess();
        setSuccessMessage(`Welcome back, ${patient.name}! Launching Patient Portal...`);
        setTimeout(() => {
          onLoginPatient(patient);
        }, 500);
      } else if (portalCategory === 'doctor') {
        const foundDoc = existingDoctors.find(
          d =>
            d.name.toLowerCase().includes(email.trim().toLowerCase()) ||
            d.id.toLowerCase() === email.trim().toLowerCase()
        );
        const doctor = foundDoc || existingDoctors[0];
        sound.playSuccess();
        setSuccessMessage(`Welcome, ${doctor.name}! Accessing Clinical Station...`);
        setTimeout(() => {
          onLoginDoctor(doctor);
        }, 500);
      } else {
        sound.playSuccess();
        setSuccessMessage('Welcome, Nurse Sarah Jenkins, RN! Opening Head Nurse Station...');
        setTimeout(() => {
          onLoginNurse('Nurse Sarah Jenkins, RN');
        }, 500);
      }
      setLoading(false);
    }, 600);
  };

  // Handle Patient Sign Up
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signUpName.trim() || !signUpEmail.trim()) {
      setErrorMessage('Please enter your full legal name and email.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    sound.playClick();

    setTimeout(() => {
      const newPatient = db.addPatient({
        name: signUpName.trim(),
        age: 32,
        gender: 'Female',
        bloodGroup: 'O+',
        phone: signUpPhone.trim() || '+1 (555) 234-5678',
        email: signUpEmail.trim(),
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        admissionStatus: 'Outpatient',
        primaryDoctorId: 'doc-1',
        primaryDoctorName: 'Dr. Roger S.',
        diagnosis: 'Preventive Health Examination',
        heartAge: 32,
        chronologicalAge: 32,
        riskScore: 12.0,
        vitals: {
          bloodPressure: '120/80',
          pulseRate: 72,
          respiratoryRate: 16,
          oxygenSaturation: 99,
          temperature: 36.8,
          hba1c: 5.2,
          cholesterol: 180,
          stressLevel: 'Mild',
          sleepQuality: 'Good',
          lastUpdated: 'Just now'
        },
        symptoms: [],
        allergies: ['NKDA'],
        medicalHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            event: 'Patient Account Registered via Portal',
            doctor: 'Dr. Roger S.',
            facility: 'MediCore Outpatient Pavilion',
            notes: 'Initial account creation.'
          }
        ]
      });

      sound.playSuccess();
      setSuccessMessage(`Account created! Welcome, ${newPatient.name}.`);
      setTimeout(() => {
        onLoginPatient(newPatient);
      }, 500);
      setLoading(false);
    }, 700);
  };

  // Handle Google OAuth Selection
  const handleSelectGoogleAccount = (selectedEmail: string, selectedName: string, avatar?: string) => {
    setLoading(true);
    sound.playClick();
    setGoogleModalOpen(false);

    setTimeout(() => {
      if (portalCategory === 'patient') {
        let patient = existingPatients.find(p => p.email.toLowerCase() === selectedEmail.toLowerCase());
        if (!patient) {
          patient = db.addPatient({
            name: selectedName,
            age: 34,
            gender: 'Female',
            bloodGroup: 'O+',
            phone: '+1 (555) 987-6543',
            email: selectedEmail,
            avatar: avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            admissionStatus: 'Outpatient',
            primaryDoctorId: 'doc-1',
            primaryDoctorName: 'Dr. Roger S.',
            diagnosis: 'General Health Maintenance',
            heartAge: 34,
            chronologicalAge: 34,
            riskScore: 10.0,
            vitals: {
              bloodPressure: '118/78',
              pulseRate: 70,
              respiratoryRate: 15,
              oxygenSaturation: 99,
              temperature: 36.7,
              hba1c: 5.0,
              cholesterol: 175,
              stressLevel: 'Mild',
              sleepQuality: 'Good',
              lastUpdated: 'Just now'
            },
            symptoms: [],
            allergies: ['NKDA'],
            medicalHistory: [
              {
                date: new Date().toISOString().split('T')[0],
                event: 'Google SSO Authentication',
                doctor: 'Dr. Roger S.',
                facility: 'MediCore Digital Gateway',
                notes: 'Authenticated via Google account.'
              }
            ]
          });
        }
        sound.playSuccess();
        setSuccessMessage(`Signed in as ${patient.name}`);
        setTimeout(() => {
          onLoginPatient(patient);
        }, 500);
      } else if (portalCategory === 'doctor') {
        const doctor = existingDoctors[0];
        sound.playSuccess();
        setSuccessMessage(`Google SSO Verified: ${doctor.name}`);
        setTimeout(() => {
          onLoginDoctor(doctor);
        }, 500);
      } else {
        sound.playSuccess();
        setSuccessMessage(`Google SSO Verified: ${selectedName}`);
        setTimeout(() => {
          onLoginNurse(selectedName);
        }, 500);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-cover bg-center overflow-hidden transition-all"
      style={{
        backgroundImage: `url('/assets/backgrounds/bg-option-2-warm-caring.jpg')`
      }}
    >
      {/* Soft translucent tint to keep warm clinic background image vibrant */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Top Header Badge */}
      <div className="absolute top-6 left-6 z-20 flex items-center pointer-events-none">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-lg pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-extrabold text-xs tracking-tight">MediCore Hospital OS</span>
        </div>
      </div>

      {/* Central Fully Transparent Frosted Glass Card */}
      <div className="relative z-10 w-full max-w-[450px] my-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-[28px] border border-white/20 p-5 sm:p-8 shadow-[0_16px_45px_rgba(0,0,0,0.4)] bg-black/30 backdrop-blur-xl text-white">

          {/* ================= 3-WAY PORTAL SPLIT SWITCHER ================= */}
          <div className="grid grid-cols-3 p-1.5 mb-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15">
            <button
              type="button"
              onClick={() => handleCategorySwitch('patient')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portalCategory === 'patient'
                  ? 'bg-[#0095F6] text-white shadow-lg shadow-[#0095F6]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className="w-3.5 h-3.5 shrink-0" />
              <span>Patient</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySwitch('doctor')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portalCategory === 'doctor'
                  ? 'bg-[#0095F6] text-white shadow-lg shadow-[#0095F6]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 shrink-0" />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySwitch('nurse')}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                portalCategory === 'nurse'
                  ? 'bg-[#0095F6] text-white shadow-lg shadow-[#0095F6]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
              <span>Head Nurse</span>
            </button>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/25 backdrop-blur-md border border-rose-400/30 text-rose-100 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/25 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ================= VIEW 1: LOGIN ================= */}
          {authView === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address / ID Input */}
              <div className="relative">
                <Mail className="w-4 h-4 text-white/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={
                    portalCategory === 'patient'
                      ? "Email address or patient code"
                      : portalCategory === 'doctor'
                        ? "Doctor ID or hospital email"
                        : "Nurse ID or hospital email (e.g. stf-1)"
                  }
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/20 bg-black/25 hover:bg-black/35 focus:bg-black/45 backdrop-blur-md text-white placeholder:text-white/60 text-sm focus:outline-hidden focus:border-[#0095F6] transition-all shadow-inner"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="w-4 h-4 text-white/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={
                    portalCategory === 'patient'
                      ? "Password"
                      : portalCategory === 'doctor'
                        ? "Doctor Password / PIN"
                        : "Nurse PIN / Password"
                  }
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-white/20 bg-black/25 hover:bg-black/35 focus:bg-black/45 backdrop-blur-md text-white placeholder:text-white/60 text-sm focus:outline-hidden focus:border-[#0095F6] transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Blue Log In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#0095F6] hover:bg-[#1877F2] active:bg-[#0081d6] text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0095F6]/30 active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>
                    {portalCategory === 'patient'
                      ? 'Log In'
                      : portalCategory === 'doctor'
                        ? 'Log In to Doctor Station'
                        : 'Log In to Nurse Station'}
                  </span>
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAuthView('forgot');
                  }}
                  className="text-xs text-white/80 hover:text-white transition-colors cursor-pointer drop-shadow-xs"
                >
                  Forgot password?
                </button>
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-px bg-white/25 flex-1" />
                <span className="text-[11px] font-bold text-white/70 tracking-wider drop-shadow-xs">
                  OR
                </span>
                <div className="h-px bg-white/25 flex-1" />
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setGoogleModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#f2f4f7] active:bg-[#e5e7eb] text-[#1c1e21] font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Bottom Section: Patient Signup OR Doctor Quick Access OR Nurse Quick Access */}
              {portalCategory === 'patient' && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAuthView('signup');
                    setErrorMessage(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-white/25 hover:border-white/40 bg-black/20 hover:bg-black/35 text-white font-bold text-sm flex items-center justify-center transition-all cursor-pointer active:scale-[0.99] backdrop-blur-md"
                >
                  Create new account
                </button>
              )}

              {portalCategory === 'doctor' && (
                <div className="pt-2 border-t border-white/15">
                  <p className="text-[11px] font-bold text-white/60 mb-2">
                    ⚡ Quick Doctor Access (1-Click Entry):
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {existingDoctors.slice(0, 2).map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          sound.playSuccess();
                          onLoginDoctor(d);
                        }}
                        className="p-2 rounded-xl text-left bg-black/30 hover:bg-black/50 border border-white/15 transition-all cursor-pointer text-xs flex items-center gap-2"
                      >
                        <img src={d.avatar} alt={d.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-white truncate">{d.name.split(' ')[1] || d.name}</p>
                          <p className="text-[10px] text-teal-300 truncate">{d.department}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {portalCategory === 'nurse' && (
                <div className="pt-2 border-t border-white/15">
                  <p className="text-[11px] font-bold text-white/60 mb-2">
                    ⚡ Quick Head Nurse Access (1-Click Station Entry):
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSuccess();
                      onLoginNurse('Nurse Sarah Jenkins, RN');
                    }}
                    className="w-full p-2.5 rounded-xl text-left bg-black/30 hover:bg-black/50 border border-white/20 transition-all cursor-pointer text-xs flex items-center gap-3"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80"
                      alt="Head Nurse Sarah"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-400/50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">Nurse Sarah Jenkins, RN, BSN</p>
                      <p className="text-[11px] text-emerald-300 truncate">Head Charge Nurse • ICU & Surgical Wing</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Enter
                    </span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ================= VIEW 2: PATIENT SIGN UP ================= */}
          {authView === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5 animate-in fade-in">
              <div className="text-center pb-1">
                <h3 className="font-bold text-base text-white drop-shadow-sm">Create patient account</h3>
                <p className="text-xs text-white/70">Enter your details to register</p>
              </div>

              <div className="relative">
                <User className="w-4 h-4 text-white/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={e => setSignUpName(e.target.value)}
                  placeholder="Full name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 bg-black/25 hover:bg-black/35 focus:bg-black/45 backdrop-blur-md text-white placeholder:text-white/60 text-sm focus:outline-hidden focus:border-[#0095F6] transition-all"
                />
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 text-white/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 bg-black/25 hover:bg-black/35 focus:bg-black/45 backdrop-blur-md text-white placeholder:text-white/60 text-sm focus:outline-hidden focus:border-[#0095F6] transition-all"
                />
              </div>

              <div className="relative">
                <Phone className="w-4 h-4 text-white/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={signUpPhone}
                  onChange={e => setSignUpPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 bg-black/25 hover:bg-black/35 focus:bg-black/45 backdrop-blur-md text-white placeholder:text-white/60 text-sm focus:outline-hidden focus:border-[#0095F6] transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-white/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={signUpPassword}
                  onChange={e => setSignUpPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-white/20 bg-black/25 hover:bg-black/35 focus:bg-black/45 backdrop-blur-md text-white placeholder:text-white/60 text-sm focus:outline-hidden focus:border-[#0095F6] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#0095F6] hover:bg-[#1877F2] active:bg-[#0081d6] text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0095F6]/30 active:scale-[0.99] cursor-pointer disabled:opacity-60 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAuthView('login');
                  setErrorMessage(null);
                }}
                className="w-full py-2.5 text-center text-xs text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                Already have an account? <span className="text-[#0095F6] font-semibold">Log In</span>
              </button>
            </form>
          )}

          {/* ================= VIEW 3: FORGOT PASSWORD ================= */}
          {authView === 'forgot' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center pb-1">
                <h3 className="font-bold text-base text-white drop-shadow-sm">Reset credentials</h3>
                <p className="text-xs text-white/70">Enter your email to receive recovery instructions</p>
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 text-white/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/20 bg-black/25 hover:bg-black/35 focus:bg-black/45 backdrop-blur-md text-white placeholder:text-white/60 text-sm focus:outline-hidden focus:border-[#0095F6] transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playSuccess();
                  setSuccessMessage('Password reset link sent to your registered email.');
                  setTimeout(() => setAuthView('login'), 1500);
                }}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#0095F6] hover:bg-[#1877F2] text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-[#0095F6]/30"
              >
                Send Reset Link
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="text-xs text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Back to <span className="text-[#0095F6] font-semibold">Log In</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ================= GOOGLE OAUTH MODAL ================= */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-950/90 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl text-white border border-white/20 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/15">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="font-bold text-sm text-white">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="text-white/50 hover:text-white font-bold text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="py-4">
              <h3 className="font-bold text-base text-white mb-1">Choose an account</h3>
              <p className="text-xs text-white/70 mb-4">
                to continue to <strong className="text-white">MediCore {portalCategory === 'patient' ? 'Patient Portal' : portalCategory === 'doctor' ? 'Doctor Portal' : 'Head Nurse Station'}</strong>
              </p>

              {/* Accounts List */}
              <div className="space-y-2">
                {portalCategory === 'patient' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectGoogleAccount(
                          'sarah.jenkins@gmail.com',
                          'Sarah Jenkins',
                          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                        )
                      }
                      className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-3 transition-all text-left group cursor-pointer"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
                        alt="Sarah Jenkins"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0095F6]/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-[#0095F6] transition-colors">
                          Sarah Jenkins (Patient)
                        </p>
                        <p className="text-[11px] text-white/70 truncate">sarah.jenkins@gmail.com</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectGoogleAccount(
                          'magnus.stephenson@healthmail.com',
                          'Magnus Stephenson',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                        )
                      }
                      className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-3 transition-all text-left group cursor-pointer"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                        alt="Magnus Stephenson"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0095F6]/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-[#0095F6] transition-colors">
                          Magnus Stephenson (Patient)
                        </p>
                        <p className="text-[11px] text-white/70 truncate">magnus.stephenson@healthmail.com</p>
                      </div>
                    </button>
                  </>
                )}

                {portalCategory === 'doctor' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectGoogleAccount(
                          'dr.roger@medicore.io',
                          'Dr. Roger S.',
                          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
                        )
                      }
                      className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-3 transition-all text-left group cursor-pointer"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
                        alt="Dr. Roger S."
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0095F6]/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-[#0095F6] transition-colors">
                          Dr. Roger S., MD (Pulmonology)
                        </p>
                        <p className="text-[11px] text-white/70 truncate">dr.roger@medicore.io</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectGoogleAccount(
                          'dr.sophia@medicore.io',
                          'Dr. Sophia Chen',
                          'https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80'
                        )
                      }
                      className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-3 transition-all text-left group cursor-pointer"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80"
                        alt="Dr. Sophia Chen"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0095F6]/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-[#0095F6] transition-colors">
                          Dr. Sophia Chen, MD (Critical Care)
                        </p>
                        <p className="text-[11px] text-white/70 truncate">dr.sophia@medicore.io</p>
                      </div>
                    </button>
                  </>
                )}

                {portalCategory === 'nurse' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectGoogleAccount(
                          'nurse.sarah@medicore.io',
                          'Nurse Sarah Jenkins, RN, BSN',
                          'https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80'
                        )
                      }
                      className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-3 transition-all text-left group cursor-pointer"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1594824813571-638f02614d3f?w=150&auto=format&fit=crop&q=80"
                        alt="Nurse Sarah Jenkins"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0095F6]/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-[#0095F6] transition-colors">
                          Nurse Sarah Jenkins, RN, BSN
                        </p>
                        <p className="text-[11px] text-white/70 truncate">nurse.sarah@medicore.io • Head Charge Nurse</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectGoogleAccount(
                          'nurse.clara@medicore.io',
                          'Nurse Clara Higgins, RN',
                          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
                        )
                      }
                      className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-3 transition-all text-left group cursor-pointer"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                        alt="Nurse Clara Higgins"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0095F6]/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-[#0095F6] transition-colors">
                          Nurse Clara Higgins, RN
                        </p>
                        <p className="text-[11px] text-white/70 truncate">nurse.clara@medicore.io • Staff Nurse II</p>
                      </div>
                    </button>
                  </>
                )}

                {/* Custom Google Account input toggle */}
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full p-2.5 rounded-xl hover:bg-white/10 border border-dashed border-white/20 flex items-center gap-2.5 transition-all text-left text-xs font-medium text-white/70 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-white/70" />
                    <span>Use another Google account</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl border border-[#0095F6]/40 bg-black/40 backdrop-blur-md space-y-2 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={customGoogleName}
                      onChange={e => setCustomGoogleName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-white/20 bg-black/40 text-white text-xs"
                    />
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      value={customGoogleEmail}
                      onChange={e => setCustomGoogleEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-white/20 bg-black/40 text-white text-xs"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-white/70 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (customGoogleEmail && customGoogleName) {
                            handleSelectGoogleAccount(customGoogleEmail, customGoogleName);
                          }
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#0095F6] text-white cursor-pointer"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Users, 
  Stethoscope, 
  Bed as BedIcon, 
  CreditCard, 
  Navigation, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Activity,
  Layers,
  Heart,
  Calendar,
  Pill,
  FlaskConical,
  FileText,
  ShieldCheck,
  Building2,
  CornerDownLeft
} from 'lucide-react';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { Patient, Doctor, Bed, Invoice, ThemeMode } from '../../types';
import { HeaderPortalMode } from '../../App';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  portalMode: HeaderPortalMode;
  onSwitchPortal: (mode: HeaderPortalMode) => void;
  onNavigateTab: (tab: string) => void;
  onSelectPatient?: (patient: Patient) => void;
}

type SearchCategory = 'all' | 'patients' | 'doctors' | 'beds' | 'billing' | 'navigation';

interface CommandResultItem {
  id: string;
  category: 'patient' | 'doctor' | 'bed' | 'billing' | 'navigation';
  title: string;
  subtitle: string;
  tag: string;
  tagType?: 'optimal' | 'elevated' | 'critical' | 'teal' | 'neutral';
  meta?: string;
  icon?: any;
  avatar?: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  theme,
  portalMode,
  onSwitchPortal,
  onNavigateTab,
  onSelectPatient
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Load all live mock database entities
  const patients = useMemo(() => db.getPatients(), [isOpen]);
  const doctors = useMemo(() => db.getDoctors(), [isOpen]);
  const beds = useMemo(() => db.getBeds(), [isOpen]);
  const invoices = useMemo(() => db.getInvoices(), [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Navigation Items
  const navItems = useMemo(() => [
    { title: 'Hospital Executive Dashboard', subtitle: 'Macro operations & facility census monitor', tab: 'dashboard', mode: 'admin', icon: Building2 },
    { title: 'Patient Directory & EMR Records', subtitle: 'Comprehensive patient directory and 3D organ volumetry', tab: 'patients', mode: 'admin', icon: Users },
    { title: 'Inpatient Ward & Bed Flow', subtitle: 'Live census, ward telemetry, and bed allocations', tab: 'ward', mode: 'admin', icon: Layers },
    { title: 'Bed Management Matrix', subtitle: 'ICU, emergency, and general bed state manager', tab: 'beds', mode: 'admin', icon: BedIcon },
    { title: 'Doctor Clinical Station', subtitle: 'Doctor overview, SOAP clinical notes, and inpatient rounds', tab: 'doctor-consult', mode: 'doctor', icon: Stethoscope },
    { title: 'Head Nurse Station & MAR Flow', subtitle: 'Nurse dashboard, vitals rounds, and doctor order execution', tab: 'nurse-rounds', mode: 'nurse', icon: Activity },
    { title: 'Patient Health Portal', subtitle: 'Self-service health metrics, prescriptions, and billing', tab: 'patient-health', mode: 'patient', icon: Heart },
    { title: 'Super Admin Multi-Hospital Network', subtitle: 'Multi-hospital telemetry, RBAC, and HIPAA compliance', tab: 'overview', mode: 'super-admin', icon: ShieldCheck },
    { title: 'Hospital Central Pharmacy', subtitle: 'Formulary management, stock inventory, and dispensation', tab: 'pharmacy', mode: 'admin', icon: Pill },
    { title: 'Diagnostic Laboratory & Imaging', subtitle: 'STAT pathology tests, blood panels, and imaging orders', tab: 'lab', mode: 'admin', icon: FlaskConical },
    { title: 'Billing, Invoices & Claims', subtitle: 'GST invoices, insurance remittance, and payment gateway', tab: 'billing', mode: 'admin', icon: CreditCard },
    { title: 'System Settings & Security', subtitle: 'Personal credentials, active sessions, and audit logs', tab: 'settings', mode: 'admin', icon: FileText }
  ], []);

  // Compute matched results
  const results = useMemo<CommandResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const items: CommandResultItem[] = [];

    // 1. PATIENTS
    if (activeCategory === 'all' || activeCategory === 'patients') {
      patients.forEach(pat => {
        if (!q || pat.name.toLowerCase().includes(q) || pat.patientCode.toLowerCase().includes(q) || pat.diagnosis.toLowerCase().includes(q) || pat.bloodGroup.toLowerCase().includes(q)) {
          items.push({
            id: `pat-${pat.id}`,
            category: 'patient',
            title: pat.name,
            subtitle: `${pat.diagnosis} • Dr. ${pat.primaryDoctorName}`,
            tag: pat.admissionStatus,
            tagType: pat.admissionStatus === 'ICU' ? 'critical' : pat.admissionStatus === 'Admitted' ? 'elevated' : 'optimal',
            meta: `${pat.patientCode} • ${pat.gender}, ${pat.age}y • ${pat.ward || 'Outpatient'}`,
            avatar: pat.avatar,
            onSelect: () => {
              sound.playClick();
              db.setSelectedPatient(pat.id);
              if (onSelectPatient) onSelectPatient(pat);
              if (portalMode === 'patient') {
                onNavigateTab('patient-health');
              } else if (portalMode === 'doctor') {
                onNavigateTab('doctor-patients');
              } else {
                onNavigateTab('patients');
              }
              onClose();
            }
          });
        }
      });
    }

    // 2. DOCTORS
    if (activeCategory === 'all' || activeCategory === 'doctors') {
      doctors.forEach(doc => {
        if (!q || doc.name.toLowerCase().includes(q) || doc.department.toLowerCase().includes(q) || doc.specialization.toLowerCase().includes(q)) {
          items.push({
            id: `doc-${doc.id}`,
            category: 'doctor',
            title: doc.name,
            subtitle: `${doc.title} • ${doc.department}`,
            tag: doc.availability,
            tagType: doc.availability === 'Available' ? 'optimal' : doc.availability === 'In Surgery' ? 'critical' : 'elevated',
            meta: `${doc.specialization} • ₹${doc.consultationFee} Consult Fee`,
            avatar: doc.avatar,
            onSelect: () => {
              sound.playClick();
              if (portalMode !== 'admin' && portalMode !== 'management') {
                onSwitchPortal('admin');
              }
              onNavigateTab('doctors');
              onClose();
            }
          });
        }
      });
    }

    // 3. BEDS
    if (activeCategory === 'all' || activeCategory === 'beds') {
      beds.forEach(bed => {
        if (!q || bed.bedNumber.toLowerCase().includes(q) || bed.wardName.toLowerCase().includes(q) || (bed.patientName && bed.patientName.toLowerCase().includes(q))) {
          items.push({
            id: `bed-${bed.id}`,
            category: 'bed',
            title: `${bed.bedNumber} (${bed.wardName})`,
            subtitle: bed.patientName ? `Occupied by: ${bed.patientName}` : `Bed is clean and ready for admission`,
            tag: bed.status,
            tagType: bed.status === 'Available' ? 'optimal' : bed.status === 'Occupied' ? 'elevated' : 'neutral',
            meta: `${bed.type} Unit • Bed ID: #${bed.id}`,
            icon: BedIcon,
            onSelect: () => {
              sound.playClick();
              if (portalMode === 'nurse') {
                onNavigateTab('beds');
              } else {
                onNavigateTab('beds');
              }
              onClose();
            }
          });
        }
      });
    }

    // 4. BILLING & INVOICES
    if (activeCategory === 'all' || activeCategory === 'billing') {
      invoices.forEach(inv => {
        if (!q || inv.invoiceNumber.toLowerCase().includes(q) || inv.patientName.toLowerCase().includes(q) || inv.status.toLowerCase().includes(q)) {
          items.push({
            id: `inv-${inv.id}`,
            category: 'billing',
            title: `${inv.invoiceNumber} - ${inv.patientName}`,
            subtitle: `Total: ₹${inv.grandTotal.toFixed(2)} • Billed: ${inv.date} (Due: ${inv.dueDate})`,
            tag: inv.status,
            tagType: inv.status === 'Paid' ? 'optimal' : 'elevated',
            meta: `${inv.items.length} itemized clinical services`,
            icon: CreditCard,
            onSelect: () => {
              sound.playClick();
              if (portalMode === 'patient') {
                onNavigateTab('patient-billing');
              } else {
                onNavigateTab('billing');
              }
              onClose();
            }
          });
        }
      });
    }

    // 5. NAVIGATION
    if (activeCategory === 'all' || activeCategory === 'navigation') {
      navItems.forEach((nav, idx) => {
        if (!q || nav.title.toLowerCase().includes(q) || nav.subtitle.toLowerCase().includes(q)) {
          items.push({
            id: `nav-${idx}`,
            category: 'navigation',
            title: nav.title,
            subtitle: nav.subtitle,
            tag: nav.mode.toUpperCase(),
            tagType: 'teal',
            meta: `Jump to ${nav.tab}`,
            icon: nav.icon,
            onSelect: () => {
              sound.playClick();
              if (nav.mode !== portalMode && (nav.mode === 'patient' || nav.mode === 'nurse' || nav.mode === 'doctor' || nav.mode === 'super-admin')) {
                onSwitchPortal(nav.mode as HeaderPortalMode);
              }
              onNavigateTab(nav.tab);
              onClose();
            }
          });
        }
      });
    }

    return items;
  }, [query, activeCategory, patients, doctors, beds, invoices, navItems, portalMode, onNavigateTab, onSwitchPortal, onSelectPatient, onClose]);

  // Keep selectedIndex in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[82vh] transition-all duration-200 ${
          isDark ? 'bg-[#0E2035] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-[#142C43]'
        }`}
        style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3), 0 0 0 1px rgba(13,148,136,0.1)' }}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Box */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Search className="w-5 h-5 shrink-0" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across patients, doctors, beds, invoices, or modules..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm sm:text-base font-semibold placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Records', count: results.length },
            { id: 'patients', label: 'Patients', icon: Users, count: patients.length },
            { id: 'doctors', label: 'Doctors', icon: Stethoscope, count: doctors.length },
            { id: 'beds', label: 'Beds & Wards', icon: BedIcon, count: beds.length },
            { id: 'billing', label: 'Invoices', icon: CreditCard, count: invoices.length },
            { id: 'navigation', label: 'Navigation', icon: Navigation, count: navItems.length },
          ].map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  setActiveCategory(cat.id as SearchCategory);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-teal-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Stream */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100/60 dark:divide-slate-800/60">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-500" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No matching hospital records found</p>
              <p className="mt-1">Try searching by patient code (P-12563a), doctor name, bed #, or invoice #</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-500/10 border border-teal-500/25 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.title}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                    ) : Icon ? (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    ) : null}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm truncate text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          item.tagType === 'optimal'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : item.tagType === 'critical'
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              : item.tagType === 'elevated'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                      {item.meta && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {item.meta}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                      {item.category}
                    </span>
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-teal-600 text-white' : 'text-slate-400'}`}>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <span className="font-semibold text-teal-600 dark:text-teal-400">
            MediCore Global Search
          </span>
        </div>
      </div>
    </div>
  );
};

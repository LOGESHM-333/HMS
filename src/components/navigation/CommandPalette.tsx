/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Users, 
  Stethoscope, 
  Bed as BedIcon, 
  CreditCard, 
  Navigation, 
  CornerDownLeft,
  Calendar,
  Pill,
  FlaskConical,
  Activity,
  Heart,
  FileText,
  ShieldCheck,
  Building2,
  Receipt,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { db } from '../../services/mockDatabase';
import { sound } from '../../services/audioService';
import { Patient, ThemeMode } from '../../types';
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

interface CommandResultItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  tag: string;
  tagType?: 'optimal' | 'elevated' | 'critical' | 'sky' | 'neutral';
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
  onNavigateTab,
  onSelectPatient
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Live database records
  const allPatients = useMemo(() => db.getPatients(), [isOpen]);
  const allDoctors = useMemo(() => db.getDoctors(), [isOpen]);
  const allBeds = useMemo(() => db.getBeds(), [isOpen]);
  const allInvoices = useMemo(() => db.getInvoices(), [isOpen]);
  const allPrescriptions = useMemo(() => db.getPrescriptions(), [isOpen]);
  const allAppointments = useMemo(() => db.getAppointments(), [isOpen]);
  const allLabOrders = useMemo(() => db.getLabOrders(), [isOpen]);

  // Current active patient context for Patient Portal
  const activePatient = useMemo(() => {
    return db.getSelectedPatient() || allPatients[0];
  }, [allPatients, isOpen]);

  // Focus input & reset filters on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, portalMode]);

  // Dynamic Categories based strictly on portalMode
  const availableCategories = useMemo(() => {
    switch (portalMode) {
      case 'patient':
        return [
          { id: 'all', label: 'All Records' },
          { id: 'rx', label: 'My Prescriptions', icon: Pill },
          { id: 'apts', label: 'My Appointments', icon: Calendar },
          { id: 'labs', label: 'Lab Reports', icon: FlaskConical },
          { id: 'billing', label: 'Invoices & Receipts', icon: Receipt },
          { id: 'nav', label: 'Health Modules', icon: Navigation },
        ];
      case 'doctor':
        return [
          { id: 'all', label: 'All Clinical' },
          { id: 'inpatients', label: 'My Inpatients', icon: Users },
          { id: 'schedule', label: "Today's Schedule", icon: Calendar },
          { id: 'orders', label: 'Clinical Orders', icon: ClipboardList },
          { id: 'nav', label: 'Doctor Modules', icon: Navigation },
        ];
      case 'nurse':
        return [
          { id: 'all', label: 'All Nursing' },
          { id: 'census', label: 'Ward 4 Census', icon: Users },
          { id: 'beds', label: 'Bed Status', icon: BedIcon },
          { id: 'mar', label: 'MAR Meds Due', icon: Pill },
          { id: 'nav', label: 'Nurse Modules', icon: Navigation },
        ];
      case 'super-admin':
        return [
          { id: 'all', label: 'All Enterprise' },
          { id: 'nodes', label: 'Hospital Nodes', icon: Building2 },
          { id: 'rbac', label: 'Staff Accounts', icon: ShieldCheck },
          { id: 'nav', label: 'Governance', icon: Navigation },
        ];
      case 'admin':
      case 'management':
      default:
        return [
          { id: 'all', label: 'All Hospital' },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'doctors', label: 'Doctors', icon: Stethoscope },
          { id: 'beds', label: 'Beds', icon: BedIcon },
          { id: 'billing', label: 'Billing', icon: CreditCard },
          { id: 'nav', label: 'Modules', icon: Navigation },
        ];
    }
  }, [portalMode]);

  // Compute matched results filtered strictly by portal permissions
  const results = useMemo<CommandResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const items: CommandResultItem[] = [];

    // ==============================================================
    // 1. PATIENT PORTAL SCOPE (Only patient's own confidential records)
    // ==============================================================
    if (portalMode === 'patient') {
      const patientId = activePatient?.id || 'pat-1';

      // Patient Prescriptions
      if (activeCategory === 'all' || activeCategory === 'rx') {
        const patientRxs = allPrescriptions.filter(p => p.patientId === patientId);
        patientRxs.forEach(rx => {
          rx.items.forEach(it => {
            if (!q || it.medicineName.toLowerCase().includes(q) || it.dosage.toLowerCase().includes(q)) {
              items.push({
                id: `rx-${rx.id}-${it.medicineId}`,
                category: 'Prescription',
                title: it.medicineName,
                subtitle: `${it.dosage} • ${it.frequency} (Duration: ${it.duration})`,
                tag: it.dispensed ? 'Dispensed' : 'Active Regimen',
                tagType: 'sky',
                meta: `Prescribing Doctor: ${rx.doctorName}`,
                icon: Pill,
                onSelect: () => {
                  sound.playClick();
                  onNavigateTab('patient-prescriptions');
                  onClose();
                }
              });
            }
          });
        });
      }

      // Patient Appointments
      if (activeCategory === 'all' || activeCategory === 'apts') {
        const patientApts = allAppointments.filter(a => a.patientId === patientId);
        patientApts.forEach(apt => {
          if (!q || apt.doctorName.toLowerCase().includes(q) || apt.department.toLowerCase().includes(q) || apt.visitType.toLowerCase().includes(q)) {
            items.push({
              id: `apt-${apt.id}`,
              category: 'Appointment',
              title: `${apt.visitType} with ${apt.doctorName}`,
              subtitle: `${apt.department} • ${apt.date} at ${apt.time}`,
              tag: apt.status,
              tagType: apt.status === 'Scheduled' ? 'optimal' : 'neutral',
              icon: Calendar,
              onSelect: () => {
                sound.playClick();
                onNavigateTab('patient-appointments');
                onClose();
              }
            });
          }
        });
      }

      // Patient Lab Reports
      if (activeCategory === 'all' || activeCategory === 'labs') {
        const patientLabs = allLabOrders.filter(l => l.patientId === patientId);
        patientLabs.forEach(lab => {
          if (!q || lab.testName.toLowerCase().includes(q) || lab.status.toLowerCase().includes(q)) {
            items.push({
              id: `lab-${lab.id}`,
              category: 'Lab Report',
              title: lab.testName,
              subtitle: `Ordered: ${lab.orderedDate} • Interpretation: ${lab.interpretation || 'Normal'}`,
              tag: lab.status,
              tagType: lab.interpretation === 'Normal' ? 'optimal' : 'elevated',
              icon: FlaskConical,
              onSelect: () => {
                sound.playClick();
                onNavigateTab('patient-labs');
                onClose();
              }
            });
          }
        });
      }

      // Patient Invoices
      if (activeCategory === 'all' || activeCategory === 'billing') {
        const patientInvoices = allInvoices.filter(i => i.patientId === patientId || i.patientName === activePatient?.name);
        patientInvoices.forEach(inv => {
          if (!q || inv.invoiceNumber.toLowerCase().includes(q) || inv.status.toLowerCase().includes(q)) {
            items.push({
              id: `inv-${inv.id}`,
              category: 'Invoice',
              title: `${inv.invoiceNumber} - Hospital Services`,
              subtitle: `Total: ₹${inv.grandTotal.toFixed(2)} • Billed: ${inv.date}`,
              tag: inv.status,
              tagType: inv.status === 'Paid' ? 'optimal' : 'elevated',
              icon: Receipt,
              onSelect: () => {
                sound.playClick();
                onNavigateTab('patient-billing');
                onClose();
              }
            });
          }
        });
      }

      // Patient Portal Navigation Modules
      if (activeCategory === 'all' || activeCategory === 'nav') {
        const patientModules = [
          { title: 'Health Summary & 3D Anatomy', subtitle: 'View vital telemetry, cardiac score & biological organs', tab: 'patient-health', icon: Heart },
          { title: 'My Appointments & Telehealth', subtitle: 'Consultations, video calls & appointment history', tab: 'patient-appointments', icon: Calendar },
          { title: 'Active Prescriptions & Regimen', subtitle: 'Medication tracking, dosages & refill requests', tab: 'patient-prescriptions', icon: Pill },
          { title: 'Diagnostic Lab Reports & Scans', subtitle: 'CT imaging, lipid panels & blood work results', tab: 'patient-labs', icon: FlaskConical },
          { title: 'Medical Records & Clinical History', subtitle: 'Discharge summaries & clinical notes', tab: 'patient-records', icon: FileText },
          { title: 'Immunization & Vaccine Passport', subtitle: 'Verified vaccination certificates & booster schedules', tab: 'patient-vaccines', icon: ShieldCheck },
          { title: 'Hospital Billing & Insurance Claims', subtitle: 'Tax receipts, invoices & insurance pre-authorizations', tab: 'patient-billing', icon: CreditCard },
          { title: 'Direct Doctor Consultation Chat', subtitle: 'Message attending doctor & pulmonary care specialist', tab: 'patient-messages', icon: Stethoscope },
          { title: 'Nutrition & Dietary Regimen', subtitle: 'Heart-healthy dietary intake, sodium tracking & hydration', tab: 'patient-nutrition', icon: Activity },
          { title: 'Emergency SOS Ambulance Dispatch', subtitle: 'Instant 911 trauma unit mobile dispatch', tab: 'patient-emergency', icon: AlertTriangle }
        ];

        patientModules.forEach(m => {
          if (!q || m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)) {
            items.push({
              id: `nav-${m.tab}`,
              category: 'Module',
              title: m.title,
              subtitle: m.subtitle,
              tag: 'PATIENT VIEW',
              tagType: 'sky',
              icon: m.icon,
              onSelect: () => {
                sound.playClick();
                onNavigateTab(m.tab);
                onClose();
              }
            });
          }
        });
      }

      return items;
    }

    // ==============================================================
    // 2. DOCTOR PORTAL SCOPE (Only Doctor's clinical rounds & visits)
    // ==============================================================
    if (portalMode === 'doctor') {
      // Inpatients assigned or monitored by Doctor
      if (activeCategory === 'all' || activeCategory === 'inpatients') {
        allPatients.forEach(pat => {
          if (!q || pat.name.toLowerCase().includes(q) || pat.patientCode.toLowerCase().includes(q) || pat.diagnosis.toLowerCase().includes(q)) {
            items.push({
              id: `doc-pat-${pat.id}`,
              category: 'Inpatient',
              title: pat.name,
              subtitle: `${pat.diagnosis} • ${pat.ward || 'Ward 4'} (Bed ${pat.bedNumber || '402'})`,
              tag: pat.admissionStatus,
              tagType: pat.admissionStatus === 'ICU' ? 'critical' : 'optimal',
              meta: `BP: ${pat.vitals.bloodPressure} • HR: ${pat.vitals.pulseRate} bpm • Code: ${pat.patientCode}`,
              avatar: pat.avatar,
              onSelect: () => {
                sound.playClick();
                db.setSelectedPatient(pat.id);
                if (onSelectPatient) onSelectPatient(pat);
                onNavigateTab('doctor-patients');
                onClose();
              }
            });
          }
        });
      }

      // Today's Doctor Visits
      if (activeCategory === 'all' || activeCategory === 'schedule') {
        allAppointments.forEach(apt => {
          if (!q || apt.patientName.toLowerCase().includes(q) || apt.visitType.toLowerCase().includes(q)) {
            items.push({
              id: `doc-apt-${apt.id}`,
              category: 'Schedule',
              title: `${apt.patientName} (${apt.visitType})`,
              subtitle: `${apt.department} • Today at ${apt.time}`,
              tag: apt.status,
              tagType: 'sky',
              icon: Calendar,
              onSelect: () => {
                sound.playClick();
                onNavigateTab('doctor-schedule');
                onClose();
              }
            });
          }
        });
      }

      // Clinical Orders
      if (activeCategory === 'all' || activeCategory === 'orders') {
        allPrescriptions.slice(0, 5).forEach(rx => {
          if (!q || rx.patientName.toLowerCase().includes(q) || rx.items.some(it => it.medicineName.toLowerCase().includes(q))) {
            items.push({
              id: `doc-rx-${rx.id}`,
              category: 'E-Prescription',
              title: `Rx #${rx.id} - ${rx.patientName}`,
              subtitle: `${rx.items.map(it => it.medicineName).join(', ')}`,
              tag: rx.status,
              tagType: 'sky',
              icon: Pill,
              onSelect: () => {
                sound.playClick();
                onNavigateTab('doctor-rx');
                onClose();
              }
            });
          }
        });
      }

      // Doctor Navigation Modules
      if (activeCategory === 'all' || activeCategory === 'nav') {
        const docModules = [
          { title: 'Doctor Overview Dashboard', subtitle: 'Live telemetry, census, and shift status', tab: 'doctor-overview', icon: Activity },
          { title: 'Inpatient Rounds & Telemetry', subtitle: 'Patient watchlist, MEWS acuity, and chart reviews', tab: 'doctor-patients', icon: Users },
          { title: 'Clinical SOAP Chart Notes', subtitle: 'Subjective, Objective, Assessment, Plan notes', tab: 'doctor-soap', icon: ClipboardList },
          { title: 'E-Prescriptions & Refills', subtitle: 'Digital prescription authoring and pharmacy dispatch', tab: 'doctor-rx', icon: Pill },
          { title: 'Lab & Diagnostic Imaging Orders', subtitle: 'STAT pathology and volumetric scan orders', tab: 'doctor-labs', icon: FlaskConical },
          { title: 'Clinic Schedule & Telehealth', subtitle: 'Virtual telehealth consultations and appointments', tab: 'doctor-schedule', icon: Calendar },
          { title: '3D Organ Anatomy Telemetry', subtitle: 'High-res interactive thoracic & cardiac volumetry', tab: 'doctor-3d', icon: Heart }
        ];

        docModules.forEach(m => {
          if (!q || m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)) {
            items.push({
              id: `doc-nav-${m.tab}`,
              category: 'Module',
              title: m.title,
              subtitle: m.subtitle,
              tag: 'DOCTOR STATION',
              tagType: 'sky',
              icon: m.icon,
              onSelect: () => {
                sound.playClick();
                onNavigateTab(m.tab);
                onClose();
              }
            });
          }
        });
      }

      return items;
    }

    // ==============================================================
    // 3. NURSE PORTAL SCOPE (Ward 4 Inpatients, Vitals, Beds, MAR)
    // ==============================================================
    if (portalMode === 'nurse') {
      // Census & Inpatients
      if (activeCategory === 'all' || activeCategory === 'census') {
        allPatients.filter(p => p.admissionStatus === 'Admitted' || p.admissionStatus === 'ICU').forEach(pat => {
          if (!q || pat.name.toLowerCase().includes(q) || pat.diagnosis.toLowerCase().includes(q)) {
            items.push({
              id: `nurse-pat-${pat.id}`,
              category: 'Census',
              title: `${pat.name} (Bed ${pat.bedNumber || '402'})`,
              subtitle: `${pat.diagnosis} • Vitals: BP ${pat.vitals.bloodPressure}, SpO2 ${pat.vitals.oxygenSaturation}%`,
              tag: pat.admissionStatus,
              tagType: pat.admissionStatus === 'ICU' ? 'critical' : 'optimal',
              avatar: pat.avatar,
              onSelect: () => {
                sound.playClick();
                db.setSelectedPatient(pat.id);
                if (onSelectPatient) onSelectPatient(pat);
                onNavigateTab('nurse-rounds');
                onClose();
              }
            });
          }
        });
      }

      // Beds in Ward 4
      if (activeCategory === 'all' || activeCategory === 'beds') {
        allBeds.forEach(bed => {
          if (!q || bed.bedNumber.toLowerCase().includes(q) || bed.wardName.toLowerCase().includes(q)) {
            items.push({
              id: `nurse-bed-${bed.id}`,
              category: 'Bed',
              title: `${bed.bedNumber} - ${bed.wardName}`,
              subtitle: bed.patientName ? `Patient: ${bed.patientName}` : `Bed is clean and sanitizing`,
              tag: bed.status,
              tagType: bed.status === 'Available' ? 'optimal' : 'neutral',
              icon: BedIcon,
              onSelect: () => {
                sound.playClick();
                onNavigateTab('nurse-rounds');
                onClose();
              }
            });
          }
        });
      }

      // Nurse Navigation
      if (activeCategory === 'all' || activeCategory === 'nav') {
        const nurseModules = [
          { title: 'Nurse Dashboard & Station', subtitle: 'Census, MAR meds due, doctor orders queue', tab: 'nurse-dashboard', icon: Activity },
          { title: 'Inpatient Vitals & Rounds', subtitle: 'Hourly vitals logging and patient monitoring', tab: 'nurse-rounds', icon: Users },
          { title: 'Doctor Orders Execution Queue', subtitle: 'STAT blood draws, IV lines, wound dressings', tab: 'nurse-rounds', icon: ClipboardList }
        ];

        nurseModules.forEach(m => {
          if (!q || m.title.toLowerCase().includes(q)) {
            items.push({
              id: `nurse-nav-${m.tab}`,
              category: 'Module',
              title: m.title,
              subtitle: m.subtitle,
              tag: 'HEAD NURSE',
              tagType: 'sky',
              icon: m.icon,
              onSelect: () => {
                sound.playClick();
                onNavigateTab(m.tab);
                onClose();
              }
            });
          }
        });
      }

      return items;
    }

    // ==============================================================
    // 4. SUPER ADMIN PORTAL SCOPE (Enterprise Infrastructure & RBAC)
    // ==============================================================
    if (portalMode === 'super-admin') {
      if (activeCategory === 'all' || activeCategory === 'nodes') {
        const nodes = [
          { name: 'MediCore Central Hospital (Flagship)', city: 'New York, NY', beds: '584 / 620 Beds', status: 'Optimal' },
          { name: 'CityCare Metropolitan Pavilion', city: 'Brooklyn, NY', beds: '402 / 450 Beds', status: 'High Load' },
          { name: 'St. Jude Academic Medical Wing', city: 'Queens, NY', beds: '210 / 240 Beds', status: 'Optimal' },
          { name: 'MediCore Westside Trauma Center', city: 'Jersey City, NJ', beds: '127 / 160 Beds', status: 'Optimal' }
        ];

        nodes.forEach((node, i) => {
          if (!q || node.name.toLowerCase().includes(q) || node.city.toLowerCase().includes(q)) {
            items.push({
              id: `node-${i}`,
              category: 'Node',
              title: node.name,
              subtitle: `${node.city} • Occupancy: ${node.beds}`,
              tag: node.status,
              tagType: node.status === 'Optimal' ? 'optimal' : 'elevated',
              icon: Building2,
              onSelect: () => {
                sound.playClick();
                onNavigateTab('overview');
                onClose();
              }
            });
          }
        });
      }

      if (activeCategory === 'all' || activeCategory === 'nav') {
        const adminModules = [
          { title: 'Multi-Hospital Network Telemetry', subtitle: '4 facility nodes live capacity & ICU beds', tab: 'overview', icon: Building2 },
          { title: 'Role-Based Access Control (RBAC)', subtitle: 'User provision, 2FA enforcement, and access tiers', tab: 'overview', icon: ShieldCheck },
          { title: 'HIPAA & Compliance Audit Trail', subtitle: 'Cryptographic immutable security audit logs', tab: 'overview', icon: FileText },
          { title: 'API & Server Infrastructure', subtitle: 'Express REST backend and database storage latency', tab: 'overview', icon: Activity }
        ];

        adminModules.forEach(m => {
          if (!q || m.title.toLowerCase().includes(q)) {
            items.push({
              id: `sa-nav-${m.tab}`,
              category: 'Governance',
              title: m.title,
              subtitle: m.subtitle,
              tag: 'SUPER ADMIN',
              tagType: 'sky',
              icon: m.icon,
              onSelect: () => {
                sound.playClick();
                onNavigateTab(m.tab);
                onClose();
              }
            });
          }
        });
      }

      return items;
    }

    // ==============================================================
    // 5. HOSPITAL ADMIN PORTAL SCOPE (Standard Operations & Directory)
    // ==============================================================
    if (activeCategory === 'all' || activeCategory === 'patients') {
      allPatients.forEach(pat => {
        if (!q || pat.name.toLowerCase().includes(q) || pat.patientCode.toLowerCase().includes(q) || pat.diagnosis.toLowerCase().includes(q)) {
          items.push({
            id: `admin-pat-${pat.id}`,
            category: 'Patient',
            title: pat.name,
            subtitle: `${pat.diagnosis} • Attending: Dr. ${pat.primaryDoctorName}`,
            tag: pat.admissionStatus,
            tagType: pat.admissionStatus === 'ICU' ? 'critical' : 'optimal',
            meta: `${pat.patientCode} • ${pat.gender}, ${pat.age}y`,
            avatar: pat.avatar,
            onSelect: () => {
              sound.playClick();
              db.setSelectedPatient(pat.id);
              if (onSelectPatient) onSelectPatient(pat);
              onNavigateTab('patients');
              onClose();
            }
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'doctors') {
      allDoctors.forEach(doc => {
        if (!q || doc.name.toLowerCase().includes(q) || doc.department.toLowerCase().includes(q)) {
          items.push({
            id: `admin-doc-${doc.id}`,
            category: 'Doctor',
            title: doc.name,
            subtitle: `${doc.title} • ${doc.department}`,
            tag: doc.availability,
            tagType: doc.availability === 'Available' ? 'optimal' : 'elevated',
            avatar: doc.avatar,
            onSelect: () => {
              sound.playClick();
              onNavigateTab('doctors');
              onClose();
            }
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'beds') {
      allBeds.forEach(bed => {
        if (!q || bed.bedNumber.toLowerCase().includes(q) || bed.wardName.toLowerCase().includes(q)) {
          items.push({
            id: `admin-bed-${bed.id}`,
            category: 'Bed',
            title: `${bed.bedNumber} (${bed.wardName})`,
            subtitle: bed.patientName ? `Occupied: ${bed.patientName}` : `Bed is available`,
            tag: bed.status,
            tagType: bed.status === 'Available' ? 'optimal' : 'neutral',
            icon: BedIcon,
            onSelect: () => {
              sound.playClick();
              onNavigateTab('beds');
              onClose();
            }
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'billing') {
      allInvoices.forEach(inv => {
        if (!q || inv.invoiceNumber.toLowerCase().includes(q) || inv.patientName.toLowerCase().includes(q)) {
          items.push({
            id: `admin-inv-${inv.id}`,
            category: 'Billing',
            title: `${inv.invoiceNumber} - ${inv.patientName}`,
            subtitle: `Total: ₹${inv.grandTotal.toFixed(2)} • Billed: ${inv.date}`,
            tag: inv.status,
            tagType: inv.status === 'Paid' ? 'optimal' : 'elevated',
            icon: CreditCard,
            onSelect: () => {
              sound.playClick();
              onNavigateTab('billing');
              onClose();
            }
          });
        }
      });
    }

    if (activeCategory === 'all' || activeCategory === 'nav') {
      const adminNavs = [
        { title: 'Executive Operations Dashboard', subtitle: 'Facility census, capacity, and clinical safety index', tab: 'dashboard', icon: Building2 },
        { title: 'Patient Directory & EMR Records', subtitle: 'Comprehensive patient directory and 3D organ volumetry', tab: 'patients', icon: Users },
        { title: 'Inpatient Ward & Bed Flow', subtitle: 'Live census, ward telemetry, and bed allocations', tab: 'ward', icon: BedIcon },
        { title: 'Hospital Central Pharmacy', subtitle: 'Formulary management, stock inventory, and dispensation', tab: 'pharmacy', icon: Pill },
        { title: 'Diagnostic Laboratory & Imaging', subtitle: 'STAT pathology tests, blood panels, and imaging orders', tab: 'lab', icon: FlaskConical },
        { title: 'Billing, Invoices & Claims', subtitle: 'GST invoices, insurance remittance, and payment gateway', tab: 'billing', icon: CreditCard },
        { title: 'System Settings & Security', subtitle: 'Personal credentials, active sessions, and audit logs', tab: 'settings', icon: FileText }
      ];

      adminNavs.forEach(m => {
        if (!q || m.title.toLowerCase().includes(q)) {
          items.push({
            id: `admin-nav-${m.tab}`,
            category: 'Module',
            title: m.title,
            subtitle: m.subtitle,
            tag: 'ADMIN',
            tagType: 'sky',
            icon: m.icon,
            onSelect: () => {
              sound.playClick();
              onNavigateTab(m.tab);
              onClose();
            }
          });
        }
      });
    }

    return items;
  }, [
    portalMode, 
    query, 
    activeCategory, 
    activePatient, 
    allPatients, 
    allDoctors, 
    allBeds, 
    allInvoices, 
    allPrescriptions, 
    allAppointments, 
    allLabOrders, 
    onNavigateTab, 
    onSelectPatient, 
    onClose
  ]);

  // Reset selected index when search changes
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

  // Portal title badge helper
  const portalNameLabel = {
    patient: 'Patient Self-Service',
    doctor: 'Doctor Clinical Station',
    nurse: 'Head Nurse Station',
    'super-admin': 'Super Admin Network',
    admin: 'Hospital Administration',
    management: 'Hospital Administration'
  }[portalMode] || 'Hospital Management';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[82vh] transition-all duration-200 ${
          isDark ? 'bg-[#0E2035] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-[#1E293B]'
        }`}
        style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3), 0 0 0 1px rgba(13,148,136,0.1)' }}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Box with Portal Scope Indicator */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
          <img src="/assets/medicore-logo.png" alt="MediCore Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs shrink-0" />
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={
              portalMode === 'patient'
                ? "Search my prescriptions, appointments, lab reports, receipts..."
                : portalMode === 'doctor'
                  ? "Search inpatients, visits today, clinical orders..."
                  : portalMode === 'nurse'
                    ? "Search Ward 4 census, beds, MAR meds due..."
                    : "Search patients, doctors, beds, invoices, modules..."
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm sm:text-base font-semibold placeholder:text-slate-400"
          />
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
              {portalNameLabel}
            </span>
            <button
              onClick={onClose}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              ESC
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Scoped strictly to this portal) */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto no-scrollbar text-xs">
          {availableCategories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  setActiveCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Stream */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100/60 dark:divide-slate-800/60">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-sky-500" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                {portalMode === 'patient' ? 'No personal records match your search' : 'No matching records found'}
              </p>
              <p className="mt-1">
                {portalMode === 'patient' 
                  ? 'Try searching by medicine name, doctor name, or invoice'
                  : 'Try searching by patient code, room #, or doctor name'}
              </p>
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
                      ? 'bg-sky-500/10 border border-sky-500/25 shadow-xs'
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
                        isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400'
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
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">
                          {item.meta}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                      {item.category}
                    </span>
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-sky-600 text-white' : 'text-slate-400'}`}>
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
          <span className="font-semibold text-sky-600 dark:text-sky-400 text-[10px] uppercase tracking-wider">
            {portalNameLabel} Search
          </span>
        </div>
      </div>
    </div>
  );
};

# MediCore Enterprise Hospital Management System (HMS)

> An enterprise-grade clinical healthcare operations suite featuring 5 specialized role-based portals, dual PostgreSQL & MySQL database support with a 1,000-member live dataset, interactive ward matrix floorplan, automated clinical laboratory, and full printable PDF document generation.

[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🏥 Portals Architecture

MediCore provides 5 role-based clinical environments accessible with seamless cross-portal switching:

| Portal | Role Target | Core Capabilities |
|---|---|---|
| **Super Admin** | Hospital CIO / Tier 0 Root | Enterprise census telemetry, RBAC credential management, emergency lockdown protocols, cold-storage backup snapshots, and real-time STAT broadcasts. |
| **Doctor Portal** | Attending Physicians & Surgeons | Inpatient rounds roster, E-prescriptions with drug-interaction checks, SOAP notes, 3D organ telemetry, bed transfers, and clinical discharge sign-offs. |
| **Head Nurse Portal** | Inpatient Ward Supervisors | 5-Right Medication Administration Record (MAR), SBAR clinical shift handoffs, bedside vitals logging, doctor orders execution, and emergency resuscitation alerts. |
| **Patient Portal** | Patients & Family Caregivers | Digital Health ID Card with QR barcode, interactive 3D anatomy symptom locator, appointment booking, lab results viewer, and online insurance/billing clearance. |
| **Executive Admin & Wards** | Hospital Administration & Operations | Interactive spatial architectural floorplan, acuity bed matrix, 1,000-patient directory, appointment scheduler, pharmacy inventory, and diagnostic laboratory. |

---

## 🗄️ Database Architecture

MediCore features a hybrid dual SQL database engine designed for enterprise resilience:

```
                            ┌──────────────────────────────────────────────┐
                            │            Frontend React Portals            │
                            │   Doctor • Nurse • Admin • Patient • Super   │
                            └──────────────────────┬───────────────────────┘
                                                   │ HTTP / REST (/api/...)
                                                   ▼
                                    ┌─────────────────────────────┐
                                    │    Express REST Backend     │
                                    │    Port 5000 (TypeScript)   │
                                    └──────────────┬──────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
            ┌───────────────────────────┐                       ┌───────────────────────────┐
            │   Native MySQL 8.0        │                       │   PostgreSQL 16 Engine    │
            │   Port 3306 (medicore_db) │                       │   Port 5432 (JSONB)       │
            └────────────┬──────────────┘                       └─────────────┬─────────────┘
                         │                                                   │
                         └─────────────────────────┬─────────────────────────┘
                                                   ▼
                                    ┌─────────────────────────────┐
                                    │  Automatic Fallback Engine  │
                                    │  Syncs to JSON on write     │
                                    │  1,000 Live Demo Members    │
                                    └─────────────────────────────┘
```

### 1,000 Members Live Dataset
- **850 Patients**: Comprehensive clinical dossiers, diagnoses, vitals histories, allergies, and admission statuses (`Admitted`, `ICU`, `Outpatient`, `Discharged`).
- **80 Doctors**: Specialists across Pulmonology, Cardiology, Neurology, Orthopedics, Oncology, and Critical Care with consultation fee in Indian Rupees (`₹`).
- **70 Staff**: Nurses, surgical technicians, pharmacists, lab technicians, and administrative personnel across three rotating shifts.

### Operational Tables
- `patients`: Patient demographic, clinical, and JSON vitals/allergies/history records.
- `doctors`: Physician directory, credentials, consultation fees, and weekly consultation schedules.
- `staff`: Hospital personnel across shifts and departments.
- `beds`: Ward bed matrix with real-time status (`Available`, `Occupied`, `Cleaning`, `Maintenance`).
- `appointments`: Scheduled clinical consultations with date, time, and status.
- `medicines`: Pharmacy formulary with stock thresholds, batch numbers, and unit pricing (`₹`).
- `prescriptions`: Electronic prescription records linked to attending doctors and patients.
- `invoices`: Itemized medical invoices with subtotal, tax, discount, and grand total in `₹`.
- `lab_tests`: 18 diagnostic assays across Hematology, Biochemistry, Cardiac, Endocrine, and Imaging.
- `lab_orders`: Clinical orders with barcode tracking (`MED-BC-xxxxx`), status, and results.
- `audit_logs`: Immutable HIPAA security and change-tracking ledger.

---

## 🧪 Laboratory Diagnostic Module

The clinical laboratory module (`LabManager.tsx`) includes:

- **18 Clinical Diagnostic Assays**: Complete Blood Count (CBC), Comprehensive Metabolic Panel (CMP-14), Lipid & ApoB Panel, High-Sensitivity Cardiac Troponin I (hs-cTnI), Glycated Hemoglobin (HbA1c), Thyroid Tri-Panel, Arterial Blood Gas (ABG), Renal Function Profile, Liver Function Test (LFT-7), Coagulation Profile, Urinalysis, Thoracic 3D High-Res CT, Brain MRI & MRA, Blood Culture & Sensitivity, D-Dimer, High-Sensitivity CRP, Vitamin D 25-Hydroxy, and Serum Ferritin.
- **Specimen & Barcode Tracking**: Automatic generation of barcode identifiers (`MED-BC-xxxxx`) with specimen tube cap color-coding (Lavender EDTA, Gold SST, Light Blue Sodium Citrate, Royal Blue Trace Element, etc.).
- **Analyzer Run Simulator**: Interactive simulation for optical centrifugation, laser flow cytometry, spectrophotometry, and immunoassay processing.
- **Pathologist Verification**: Numerical quantitative results entry, abnormal panic value flagging, and sign-off.
- **Printable Diagnostic Reports**: Standardized printable laboratory reports with NABL and CAP accreditation seals.

---

## 🎨 Global UI Suite & Design System

- **Glassmorphic Button Suite**: 5 standardized glassy buttons (`glass-btn-teal`, `glass-btn-navy`, `glass-btn-neutral`, `glass-btn-ruby`, `glass-btn-ghost`) featuring backdrop blur, subtle inner highlights, and executive shadows.
- **Global Command Palette (`Ctrl + K`)**: Instant search and navigation across patients, doctors, beds, and billing records from any screen.
- **Interactive Ward Floorplan Matrix**: Architectural spatial map of wards with live call-bell telemetry, bed allocation, and discharge capabilities.
- **Printable Export Suite**:
  - Official Inpatient Tax Invoices in Indian Rupees (`₹`)
  - Electronic Medical Prescriptions with Doctor Signature Blocks
  - Digital Patient Health ID Cards with Scannable QR Codes

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL 8.0+](https://www.mysql.com/) or [PostgreSQL 14+](https://www.postgresql.org/) (optional; system automatically runs in fallback mode if no database daemon is active)

### 1. Clone the Repository
```bash
git clone https://github.com/LOGESHM-333/HMS.git
cd HMS
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your database credentials:
```env
# Database Configuration (MySQL)
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=medicore_db

PORT=5000
```

### 4. Initialize Database
Run the MySQL seeder script to create the schema and populate the 1,000-member dataset:
```bash
node server/scripts/initMysql.cjs
```

### 5. Start the Application

Start the Express REST backend:
```bash
node ./node_modules/tsx/dist/cli.mjs server/index.ts
```

In a separate terminal, start the Vite development server:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:5000/api/health`

---

## 🧪 Verification & Testing

Verify end-to-end CRUD operations, database persistence, and laboratory endpoints:
```bash
node server/scripts/verifyOperations.cjs
```

Type checking:
```bash
npx tsc --noEmit
```

Production build:
```bash
npm run build
```

---

## 📄 License
This project is licensed under the Apache 2.0 License.

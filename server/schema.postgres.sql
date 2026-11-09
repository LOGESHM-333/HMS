-- ============================================================
-- MediCore Enterprise Hospital Management System
-- PostgreSQL Schema (PostgreSQL 14+ / Supabase / Neon / AWS RDS)
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(64) PRIMARY KEY,
    patient_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(16) NOT NULL,
    blood_group VARCHAR(16) NOT NULL,
    emergency_contact VARCHAR(64),
    email VARCHAR(255),
    avatar TEXT,
    admission_status VARCHAR(32) NOT NULL DEFAULT 'Outpatient',
    room_bed VARCHAR(64),
    attending_doctor VARCHAR(255),
    diagnosis TEXT,
    vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    medical_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    qualification VARCHAR(255),
    avatar TEXT,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    experience_years INT NOT NULL DEFAULT 5,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90,
    current_patient_count INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'Available',
    schedule JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    shift VARCHAR(64) NOT NULL DEFAULT 'Morning (07:00 - 15:00)',
    contact VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'On Duty',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Scheduled',
    type VARCHAR(32) NOT NULL DEFAULT 'Consultation',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beds (
    id VARCHAR(64) PRIMARY KEY,
    bed_number VARCHAR(32) NOT NULL UNIQUE,
    ward_id VARCHAR(32) NOT NULL,
    ward_name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'General',
    status VARCHAR(32) NOT NULL DEFAULT 'Available',
    patient_id VARCHAR(64),
    patient_name VARCHAR(255),
    admitted_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicines (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    dosage_form VARCHAR(64) NOT NULL,
    strength VARCHAR(64) NOT NULL,
    batch_number VARCHAR(64) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_threshold INT NOT NULL DEFAULT 20,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expiry_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'In Stock'
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Prescribed',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    payment_method VARCHAR(64),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_tests (
    id VARCHAR(64) PRIMARY KEY,
    test_code VARCHAR(32) NOT NULL UNIQUE,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    specimen_type VARCHAR(64) NOT NULL DEFAULT 'Whole Blood',
    price NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    duration_hours INT NOT NULL DEFAULT 4,
    normal_range VARCHAR(255) NOT NULL,
    unit VARCHAR(64) NOT NULL,
    methodology VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_orders (
    id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255),
    test_id VARCHAR(64) REFERENCES lab_tests(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    order_date DATE NOT NULL,
    completed_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'Ordered',
    priority VARCHAR(32) NOT NULL DEFAULT 'Routine',
    specimen_barcode VARCHAR(64),
    specimen_type VARCHAR(64) NOT NULL DEFAULT 'Whole Blood',
    result_value TEXT,
    reference_range VARCHAR(255),
    unit VARCHAR(64),
    interpretation VARCHAR(32) DEFAULT 'Normal',
    technician_notes TEXT,
    report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp VARCHAR(64) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(admission_status);
CREATE INDEX IF NOT EXISTS idx_doctors_dept ON doctors(department);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_date ON lab_orders(order_date);


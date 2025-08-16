-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'school_admin', 
    'accountant',
    'teacher',
    'student',
    'parent'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled',
    'refunded'
);

CREATE TYPE payment_method AS ENUM (
    'cash',
    'card',
    'upi',
    'net_banking',
    'cheque',
    'bank_transfer'
);

CREATE TYPE fee_type AS ENUM (
    'tuition',
    'transport',
    'library',
    'laboratory',
    'sports',
    'examination',
    'other'
);

CREATE TYPE penalty_type AS ENUM (
    'late_fee',
    'fine',
    'interest'
);

CREATE TYPE reminder_type AS ENUM (
    'email',
    'sms',
    'whatsapp',
    'in_app'
);

CREATE TYPE reminder_status AS ENUM (
    'scheduled',
    'sent',
    'failed',
    'cancelled'
);

-- Institutions table with WhatsApp API support
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- WhatsApp Business API Configuration (per institution)
    whatsapp_api_key VARCHAR(500),
    whatsapp_endpoint_url VARCHAR(500),
    whatsapp_phone_number_id VARCHAR(100),
    whatsapp_waba_id VARCHAR(100),
    whatsapp_business_phone VARCHAR(20),
    whatsapp_webhook_secret VARCHAR(255),
    
    -- Institution settings
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(3) DEFAULT 'INR',
    academic_year_start DATE,
    academic_year_end DATE,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    
    -- Profile information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Additional fields for students/parents
    student_id VARCHAR(50), -- For students
    parent_id UUID REFERENCES users(id), -- For linking parents to students
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(10),
    academic_year VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(institution_id, name, section, academic_year)
);

-- Students table (extends users for student-specific data)
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    
    -- Student specific information
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    roll_number VARCHAR(50),
    admission_date DATE,
    guardian_name VARCHAR(200),
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(255),
    guardian_relationship VARCHAR(50),
    
    -- Academic information
    current_academic_year VARCHAR(20),
    previous_school VARCHAR(255),
    blood_group VARCHAR(5),
    emergency_contact VARCHAR(20),
    
    -- Status
    enrollment_status VARCHAR(20) DEFAULT 'active', -- active, inactive, graduated, transferred
    is_scholarship_holder BOOLEAN DEFAULT false,
    scholarship_details TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Plans table
CREATE TABLE fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    academic_year VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Items table
CREATE TABLE fee_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    fee_plan_id UUID REFERENCES fee_plans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fee_type fee_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annually, one_time
    due_day INTEGER DEFAULT 1, -- Day of month when fee is due
    is_optional BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Fees table (links students to fee plans)
CREATE TABLE student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_plan_id UUID REFERENCES fee_plans(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    outstanding_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, fee_plan_id, academic_year)
);

-- Student Fee Items table (individual fee items for each student)
CREATE TABLE student_fee_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_fee_id UUID REFERENCES student_fees(id) ON DELETE CASCADE,
    fee_item_id UUID REFERENCES fee_items(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    outstanding_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
    penalty_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, waived
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Penalty Rules table
CREATE TABLE penalty_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    penalty_type penalty_type NOT NULL,
    grace_period_days INTEGER DEFAULT 0,
    penalty_amount DECIMAL(10,2),
    penalty_percentage DECIMAL(5,2),
    is_compound BOOLEAN DEFAULT false,
    max_penalty_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Payment details
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    
    -- Transaction details
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional information
    notes TEXT,
    collected_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Fee Items table (links payments to specific fee items)
CREATE TABLE payment_fee_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    student_fee_item_id UUID REFERENCES student_fee_items(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pdf_url TEXT,
    qr_code_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminder Templates table
CREATE TABLE reminder_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message_template TEXT NOT NULL,
    reminder_type reminder_type NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminder Schedules table
CREATE TABLE reminder_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    template_id UUID REFERENCES reminder_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Schedule configuration
    days_before_due INTEGER DEFAULT 7,
    frequency VARCHAR(20) DEFAULT 'once', -- once, daily, weekly
    time_of_day TIME DEFAULT '09:00:00',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminder Logs table
CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES reminder_schedules(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    template_id UUID REFERENCES reminder_templates(id) ON DELETE CASCADE,
    
    -- Reminder details
    reminder_type reminder_type NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    recipient_whatsapp VARCHAR(20),
    message_content TEXT,
    
    -- Status
    status reminder_status DEFAULT 'scheduled',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_institutions_code ON institutions(code);
CREATE INDEX idx_institutions_active ON institutions(is_active);
CREATE INDEX idx_users_institution_role ON users(institution_id, role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_classes_institution ON classes(institution_id);
CREATE INDEX idx_fee_plans_institution ON fee_plans(institution_id);
CREATE INDEX idx_fee_items_plan ON fee_items(fee_plan_id);
CREATE INDEX idx_student_fees_student ON student_fees(student_id);
CREATE INDEX idx_student_fee_items_due_date ON student_fee_items(due_date);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_receipt_number ON payments(receipt_number);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_receipts_payment ON receipts(payment_id);
CREATE INDEX idx_reminder_logs_student ON reminder_logs(student_id);
CREATE INDEX idx_reminder_logs_status ON reminder_logs(status);
CREATE INDEX idx_audit_logs_institution ON audit_logs(institution_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_plans_updated_at BEFORE UPDATE ON fee_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_items_updated_at BEFORE UPDATE ON fee_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_fees_updated_at BEFORE UPDATE ON student_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_fee_items_updated_at BEFORE UPDATE ON student_fee_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_penalty_rules_updated_at BEFORE UPDATE ON penalty_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminder_templates_updated_at BEFORE UPDATE ON reminder_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminder_schedules_updated_at BEFORE UPDATE ON reminder_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

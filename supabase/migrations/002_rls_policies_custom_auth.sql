-- =====================================================
-- RLS POLICIES FOR FEE MANAGEMENT SYSTEM
-- =====================================================

-- Enable Row Level Security on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_fee_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================

-- Drop existing functions to avoid conflicts (with CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS public.get_user_institution_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_school_admin_or_higher() CASCADE;
DROP FUNCTION IF EXISTS public.is_accountant_or_higher() CASCADE;

-- Also drop functions without schema prefix if they exist
DROP FUNCTION IF EXISTS get_user_institution_id() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS is_school_admin_or_higher() CASCADE;
DROP FUNCTION IF EXISTS is_accountant_or_higher() CASCADE;

-- =====================================================
-- DROP EXISTING POLICIES TO AVOID CONFLICTS
-- =====================================================

-- Drop all existing policies for main tables
DROP POLICY IF EXISTS "Super admins can manage all institutions" ON institutions;
DROP POLICY IF EXISTS "School admins can view and update their institution" ON institutions;

DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view users in their institution" ON users;
DROP POLICY IF EXISTS "School admins can manage users in their institution" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Super admins can manage all classes" ON classes;
DROP POLICY IF EXISTS "Institution users can manage classes" ON classes;

DROP POLICY IF EXISTS "Super admins can manage all students" ON students;
DROP POLICY IF EXISTS "Institution users can manage students" ON students;
DROP POLICY IF EXISTS "Students can view their own data" ON students;
DROP POLICY IF EXISTS "Parents can view their children's data" ON students;

DROP POLICY IF EXISTS "Super admins can manage all fee plans" ON fee_plans;
DROP POLICY IF EXISTS "Institution users can manage fee plans" ON fee_plans;

DROP POLICY IF EXISTS "Super admins can manage all fee items" ON fee_items;
DROP POLICY IF EXISTS "Institution users can manage fee items" ON fee_items;

DROP POLICY IF EXISTS "Super admins can manage all student fees" ON student_fees;
DROP POLICY IF EXISTS "Institution users can manage student fees" ON student_fees;
DROP POLICY IF EXISTS "Students can view their own fees" ON student_fees;
DROP POLICY IF EXISTS "Parents can view their children's fees" ON student_fees;

DROP POLICY IF EXISTS "Super admins can manage all student fee items" ON student_fee_items;
DROP POLICY IF EXISTS "Institution users can manage student fee items" ON student_fee_items;
DROP POLICY IF EXISTS "Students can view their own fee items" ON student_fee_items;
DROP POLICY IF EXISTS "Parents can view their children's fee items" ON student_fee_items;

DROP POLICY IF EXISTS "Super admins can manage all penalty rules" ON penalty_rules;
DROP POLICY IF EXISTS "Institution users can manage penalty rules" ON penalty_rules;

DROP POLICY IF EXISTS "Super admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Institution users can manage payments" ON payments;
DROP POLICY IF EXISTS "Students can view their own payments" ON payments;
DROP POLICY IF EXISTS "Parents can view their children's payments" ON payments;

DROP POLICY IF EXISTS "Super admins can manage all payment fee items" ON payment_fee_items;
DROP POLICY IF EXISTS "Institution users can manage payment fee items" ON payment_fee_items;

DROP POLICY IF EXISTS "Super admins can manage all receipts" ON receipts;
DROP POLICY IF EXISTS "Institution users can manage receipts" ON receipts;
DROP POLICY IF EXISTS "Students can view their own receipts" ON receipts;
DROP POLICY IF EXISTS "Parents can view their children's receipts" ON receipts;

DROP POLICY IF EXISTS "Super admins can manage all reminder templates" ON reminder_templates;
DROP POLICY IF EXISTS "Institution users can manage reminder templates" ON reminder_templates;

DROP POLICY IF EXISTS "Super admins can manage all reminder schedules" ON reminder_schedules;
DROP POLICY IF EXISTS "Institution users can manage reminder schedules" ON reminder_schedules;

DROP POLICY IF EXISTS "Super admins can manage all reminder logs" ON reminder_logs;
DROP POLICY IF EXISTS "Institution users can view reminder logs" ON reminder_logs;
DROP POLICY IF EXISTS "Students can view their own reminder logs" ON reminder_logs;
DROP POLICY IF EXISTS "Parents can view their children's reminder logs" ON reminder_logs;

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Institution users can view their audit logs" ON audit_logs;

-- Function to get user institution ID from profiles
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS UUID AS $$
DECLARE
    institution_id_text TEXT;
BEGIN
    -- First extract the text value from JSONB
    SELECT raw_app_meta_data->>'institution_id' INTO institution_id_text
    FROM public.profiles 
    WHERE id = public.get_current_user_id();
    
    -- Then cast to UUID if not null
    IF institution_id_text IS NOT NULL AND institution_id_text != '' THEN
        RETURN institution_id_text::UUID;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
DECLARE
    role_text TEXT;
BEGIN
    -- First extract the text value from JSONB
    SELECT raw_app_meta_data->>'role' INTO role_text
    FROM public.profiles 
    WHERE id = public.get_current_user_id();
    
    -- Then cast to user_role enum if not null
    IF role_text IS NOT NULL AND role_text != '' THEN
        RETURN role_text::user_role;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value TEXT;
BEGIN
    -- Get the user role
    user_role_value := public.get_user_role();
    
    -- Return TRUE if role is super_admin, FALSE otherwise (including NULL)
    IF user_role_value = 'super_admin' THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is school admin or higher
CREATE OR REPLACE FUNCTION public.is_school_admin_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('super_admin', 'school_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is accountant or higher
CREATE OR REPLACE FUNCTION public.is_accountant_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role() IN ('super_admin', 'school_admin', 'accountant');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES BY TABLE
-- =====================================================

-- Institutions policies
CREATE POLICY "Super admins can manage all institutions" ON institutions
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "School admins can view and update their institution" ON institutions
    FOR ALL USING (
        id = public.get_user_institution_id() AND 
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant', 'teacher')
    );

-- Users policies
CREATE POLICY "Super admins can manage all users" ON users
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view users in their institution" ON users
    FOR SELECT USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant', 'teacher')
    );

CREATE POLICY "School admins can manage users in their institution" ON users
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() = 'school_admin'
    );

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = public.get_current_user_id());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = public.get_current_user_id());

-- Classes policies
CREATE POLICY "Super admins can manage all classes" ON classes
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage classes" ON classes
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant', 'teacher')
    );

-- Students policies
CREATE POLICY "Super admins can manage all students" ON students
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage students" ON students
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant', 'teacher')
    );

CREATE POLICY "Students can view their own data" ON students
    FOR SELECT USING (id = public.get_current_user_id());

CREATE POLICY "Parents can view their children's data" ON students
    FOR SELECT USING (
        id IN (
            SELECT student_id::UUID 
            FROM users 
            WHERE parent_id = public.get_current_user_id()
        )
    );

-- Fee Plans policies
CREATE POLICY "Super admins can manage all fee plans" ON fee_plans
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage fee plans" ON fee_plans
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

-- Fee Items policies
CREATE POLICY "Super admins can manage all fee items" ON fee_items
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage fee items" ON fee_items
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

-- Student Fees policies
CREATE POLICY "Super admins can manage all student fees" ON student_fees
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage student fees" ON student_fees
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students 
            WHERE institution_id = public.get_user_institution_id()
            AND public.get_user_institution_id() IS NOT NULL
        ) AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

CREATE POLICY "Students can view their own fees" ON student_fees
    FOR SELECT USING (student_id = public.get_current_user_id());

CREATE POLICY "Parents can view their children's fees" ON student_fees
    FOR SELECT USING (
        student_id IN (
            SELECT student_id::UUID 
            FROM users 
            WHERE parent_id = public.get_current_user_id()
        )
    );

-- Student Fee Items policies
CREATE POLICY "Super admins can manage all student fee items" ON student_fee_items
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage student fee items" ON student_fee_items
    FOR ALL USING (
        student_fee_id IN (
            SELECT sf.id FROM student_fees sf
            JOIN students s ON sf.student_id = s.id
            WHERE s.institution_id = public.get_user_institution_id()
            AND public.get_user_institution_id() IS NOT NULL
        ) AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

CREATE POLICY "Students can view their own fee items" ON student_fee_items
    FOR SELECT USING (
        student_fee_id IN (
            SELECT id FROM student_fees WHERE student_id = public.get_current_user_id()
        )
    );

CREATE POLICY "Parents can view their children's fee items" ON student_fee_items
    FOR SELECT USING (
        student_fee_id IN (
            SELECT sf.id FROM student_fees sf
            JOIN users u ON sf.student_id = u.student_id::UUID
            WHERE u.parent_id = public.get_current_user_id()
        )
    );

-- Penalty Rules policies
CREATE POLICY "Super admins can manage all penalty rules" ON penalty_rules
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage penalty rules" ON penalty_rules
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

-- Payments policies
CREATE POLICY "Super admins can manage all payments" ON payments
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage payments" ON payments
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

CREATE POLICY "Students can view their own payments" ON payments
    FOR SELECT USING (student_id = public.get_current_user_id());

CREATE POLICY "Parents can view their children's payments" ON payments
    FOR SELECT USING (
        student_id IN (
            SELECT student_id::UUID 
            FROM users 
            WHERE parent_id = public.get_current_user_id()
        )
    );

-- Payment Fee Items policies
CREATE POLICY "Super admins can manage all payment fee items" ON payment_fee_items
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage payment fee items" ON payment_fee_items
    FOR ALL USING (
        payment_id IN (
            SELECT id FROM payments 
            WHERE institution_id = public.get_user_institution_id()
            AND public.get_user_institution_id() IS NOT NULL
        ) AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

-- Receipts policies
CREATE POLICY "Super admins can manage all receipts" ON receipts
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage receipts" ON receipts
    FOR ALL USING (
        payment_id IN (
            SELECT id FROM payments 
            WHERE institution_id = public.get_user_institution_id()
            AND public.get_user_institution_id() IS NOT NULL
        ) AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

CREATE POLICY "Students can view their own receipts" ON receipts
    FOR SELECT USING (
        payment_id IN (
            SELECT id FROM payments WHERE student_id = public.get_current_user_id()
        )
    );

CREATE POLICY "Parents can view their children's receipts" ON receipts
    FOR SELECT USING (
        payment_id IN (
            SELECT p.id FROM payments p
            JOIN users u ON p.student_id = u.student_id::UUID
            WHERE u.parent_id = public.get_current_user_id()
        )
    );

-- Reminder Templates policies
CREATE POLICY "Super admins can manage all reminder templates" ON reminder_templates
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage reminder templates" ON reminder_templates
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

-- Reminder Schedules policies
CREATE POLICY "Super admins can manage all reminder schedules" ON reminder_schedules
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can manage reminder schedules" ON reminder_schedules
    FOR ALL USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

-- Reminder Logs policies
CREATE POLICY "Super admins can manage all reminder logs" ON reminder_logs
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Institution users can view reminder logs" ON reminder_logs
    FOR SELECT USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

CREATE POLICY "Students can view their own reminder logs" ON reminder_logs
    FOR SELECT USING (student_id = public.get_current_user_id());

CREATE POLICY "Parents can view their children's reminder logs" ON reminder_logs
    FOR SELECT USING (
        student_id IN (
            SELECT student_id::UUID 
            FROM users 
            WHERE parent_id = public.get_current_user_id()
        )
    );

-- Audit Logs policies
CREATE POLICY "Super admins can view all audit logs" ON audit_logs
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Institution users can view their audit logs" ON audit_logs
    FOR SELECT USING (
        institution_id = public.get_user_institution_id() AND
        public.get_user_institution_id() IS NOT NULL AND
        public.get_user_role() IN ('school_admin', 'accountant')
    );

-- =====================================================
-- AUDIT AND UTILITY FUNCTIONS
-- =====================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        institution_id,
        user_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values
    ) VALUES (
        COALESCE(NEW.institution_id, OLD.institution_id),
        public.get_current_user_id(),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_institutions ON institutions;
DROP TRIGGER IF EXISTS audit_users ON users;
DROP TRIGGER IF EXISTS audit_students ON students;
DROP TRIGGER IF EXISTS audit_payments ON payments;
DROP TRIGGER IF EXISTS audit_receipts ON receipts;

CREATE TRIGGER audit_institutions AFTER INSERT OR UPDATE OR DELETE ON institutions FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON students FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_receipts AFTER INSERT OR UPDATE OR DELETE ON receipts FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number(institution_code TEXT)
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_sequence INTEGER;
    receipt_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get next sequence for this institution and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM LENGTH(institution_code || current_year || '-') + 1) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM receipts r
    JOIN payments p ON r.payment_id = p.id
    JOIN institutions i ON p.institution_id = i.id
    WHERE i.code = institution_code
    AND receipt_number LIKE institution_code || current_year || '-%';
    
    receipt_number := institution_code || current_year || '-' || LPAD(next_sequence::TEXT, 6, '0');
    
    RETURN receipt_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate penalty
CREATE OR REPLACE FUNCTION calculate_penalty(
    student_fee_item_id UUID,
    penalty_rule_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    fee_item RECORD;
    penalty_rule RECORD;
    days_overdue INTEGER;
    penalty_amount DECIMAL(10,2) := 0;
BEGIN
    -- Get fee item details
    SELECT sfi.*, fi.amount, fi.due_date
    INTO fee_item
    FROM student_fee_items sfi
    JOIN fee_items fi ON sfi.fee_item_id = fi.id
    WHERE sfi.id = student_fee_item_id;
    
    -- Get penalty rule details
    SELECT *
    INTO penalty_rule
    FROM penalty_rules
    WHERE id = penalty_rule_id;
    
    -- Calculate days overdue
    days_overdue := GREATEST(0, CURRENT_DATE - fee_item.due_date - penalty_rule.grace_period_days);
    
    IF days_overdue > 0 THEN
        -- Calculate penalty based on type
        IF penalty_rule.penalty_type = 'late_fee' THEN
            IF penalty_rule.penalty_amount IS NOT NULL THEN
                penalty_amount := penalty_rule.penalty_amount;
            ELSIF penalty_rule.penalty_percentage IS NOT NULL THEN
                penalty_amount := (fee_item.amount * penalty_rule.penalty_percentage / 100);
            END IF;
        ELSIF penalty_rule.penalty_type = 'interest' THEN
            IF penalty_rule.penalty_percentage IS NOT NULL THEN
                penalty_amount := (fee_item.amount * penalty_rule.penalty_percentage / 100) * (days_overdue / 30.0);
            END IF;
        END IF;
        
        -- Apply compound penalty if enabled
        IF penalty_rule.is_compound THEN
            penalty_amount := penalty_amount * (days_overdue / 30.0);
        END IF;
        
        -- Apply maximum penalty limit
        IF penalty_rule.max_penalty_amount IS NOT NULL AND penalty_amount > penalty_rule.max_penalty_amount THEN
            penalty_amount := penalty_rule.max_penalty_amount;
        END IF;
    END IF;
    
    RETURN penalty_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEBUG FUNCTIONS (for troubleshooting)
-- =====================================================

-- Function to debug authentication state
CREATE OR REPLACE FUNCTION public.debug_auth_state()
RETURNS TABLE(
    current_user_id UUID,
    user_role TEXT,
    institution_id UUID,
    is_super_admin BOOLEAN,
    has_session BOOLEAN,
    has_profile BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        public.get_current_user_id() as current_user_id,
        public.get_user_role() as user_role,
        public.get_user_institution_id() as institution_id,
        public.is_super_admin() as is_super_admin,
        EXISTS(SELECT 1 FROM public.sessions WHERE user_id = public.get_current_user_id()) as has_session,
        EXISTS(SELECT 1 FROM public.profiles WHERE id = public.get_current_user_id()) as has_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

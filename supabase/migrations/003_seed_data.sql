-- Seed data for testing and development

-- Insert sample institutions with WhatsApp API credentials
INSERT INTO institutions (
    id, name, code, address, city, state, country, postal_code, phone, email, website,
    whatsapp_api_key, whatsapp_endpoint_url, whatsapp_phone_number_id, whatsapp_waba_id, whatsapp_business_phone,
    timezone, currency, academic_year_start, academic_year_end, is_active, subscription_plan
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Delhi Public School',
    'DPS001',
    '123 Education Street, Connaught Place',
    'New Delhi',
    'Delhi',
    'India',
    '110001',
    '+91-11-23456789',
    'admin@dps.edu.in',
    'https://www.dps.edu.in',
    'your_whatsapp_api_key_here',
    'https://graph.facebook.com/v17.0',
    '123456789012345',
    '987654321098765',
    '+91-9876543210',
    'Asia/Kolkata',
    'INR',
    '2024-04-01',
    '2025-03-31',
    true,
    'premium'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'St. Xavier''s School',
    'SXS002',
    '456 Knowledge Avenue, Bandra West',
    'Mumbai',
    'Maharashtra',
    'India',
    '400050',
    '+91-22-34567890',
    'principal@sxs.edu.in',
    'https://www.sxs.edu.in',
    'your_whatsapp_api_key_here_2',
    'https://graph.facebook.com/v17.0',
    '234567890123456',
    '876543210987654',
    '+91-8765432109',
    'Asia/Kolkata',
    'INR',
    '2024-04-01',
    '2025-03-31',
    true,
    'basic'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Kendriya Vidyalaya',
    'KV003',
    '789 Learning Road, Koramangala',
    'Bangalore',
    'Karnataka',
    'India',
    '560034',
    '+91-80-45678901',
    'kv@kendriyavidyalaya.edu.in',
    'https://www.kendriyavidyalaya.edu.in',
    'your_whatsapp_api_key_here_3',
    'https://graph.facebook.com/v17.0',
    '345678901234567',
    '765432109876543',
    '+91-7654321098',
    'Asia/Kolkata',
    'INR',
    '2024-04-01',
    '2025-03-31',
    true,
    'standard'
);

-- Insert sample classes
INSERT INTO classes (institution_id, name, section, academic_year, capacity) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Class 10', 'A', '2024-2025', 40),
('550e8400-e29b-41d4-a716-446655440001', 'Class 10', 'B', '2024-2025', 40),
('550e8400-e29b-41d4-a716-446655440001', 'Class 9', 'A', '2024-2025', 40),
('550e8400-e29b-41d4-a716-446655440002', 'Class 12', 'A', '2024-2025', 35),
('550e8400-e29b-41d4-a716-446655440002', 'Class 11', 'A', '2024-2025', 35),
('550e8400-e29b-41d4-a716-446655440003', 'Class 8', 'A', '2024-2025', 45);

-- Insert sample fee plans
INSERT INTO fee_plans (institution_id, name, description, academic_year) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Standard Fee Plan', 'Regular fee structure for all students', '2024-2025'),
('550e8400-e29b-41d4-a716-446655440001', 'Premium Fee Plan', 'Enhanced fee plan with additional facilities', '2024-2025'),
('550e8400-e29b-41d4-a716-446655440002', 'Regular Fee Plan', 'Standard fee structure', '2024-2025'),
('550e8400-e29b-41d4-a716-446655440003', 'Basic Fee Plan', 'Basic fee structure for government school', '2024-2025');

-- Insert sample fee items
INSERT INTO fee_items (institution_id, fee_plan_id, name, description, fee_type, amount, frequency, due_day) VALUES
-- DPS Fee Items
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM fee_plans WHERE name = 'Standard Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440001'), 'Tuition Fee', 'Monthly tuition fee', 'tuition', 5000.00, 'monthly', 5),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM fee_plans WHERE name = 'Standard Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440001'), 'Transport Fee', 'Monthly transport fee', 'transport', 1500.00, 'monthly', 5),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM fee_plans WHERE name = 'Standard Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440001'), 'Library Fee', 'Annual library fee', 'library', 2000.00, 'annually', 1),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM fee_plans WHERE name = 'Premium Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440001'), 'Tuition Fee', 'Premium tuition fee', 'tuition', 8000.00, 'monthly', 5),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM fee_plans WHERE name = 'Premium Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440001'), 'Transport Fee', 'Premium transport fee', 'transport', 2000.00, 'monthly', 5),

-- St. Xavier's Fee Items
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM fee_plans WHERE name = 'Regular Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440002'), 'Tuition Fee', 'Monthly tuition fee', 'tuition', 6000.00, 'monthly', 10),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM fee_plans WHERE name = 'Regular Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440002'), 'Laboratory Fee', 'Science lab fee', 'laboratory', 1000.00, 'monthly', 10),

-- KV Fee Items
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM fee_plans WHERE name = 'Basic Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440003'), 'Tuition Fee', 'Monthly tuition fee', 'tuition', 2000.00, 'monthly', 15),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM fee_plans WHERE name = 'Basic Fee Plan' AND institution_id = '550e8400-e29b-41d4-a716-446655440003'), 'Examination Fee', 'Term examination fee', 'examination', 500.00, 'quarterly', 1);

-- Insert sample penalty rules
INSERT INTO penalty_rules (institution_id, name, description, penalty_type, grace_period_days, penalty_amount, penalty_percentage, is_compound, max_penalty_amount) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Late Fee Rule', 'Standard late fee for overdue payments', 'late_fee', 5, 100.00, NULL, false, 500.00),
('550e8400-e29b-41d4-a716-446655440001', 'Interest Rule', 'Monthly interest on overdue amounts', 'interest', 0, NULL, 2.00, true, 1000.00),
('550e8400-e29b-41d4-a716-446655440002', 'Late Fee Rule', 'Late fee for overdue payments', 'late_fee', 3, 150.00, NULL, false, 750.00),
('550e8400-e29b-41d4-a716-446655440003', 'Late Fee Rule', 'Basic late fee for overdue payments', 'late_fee', 7, 50.00, NULL, false, 300.00);

-- Insert sample reminder templates
INSERT INTO reminder_templates (institution_id, name, subject, message_template, reminder_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Payment Due Reminder', 'Fee Payment Due - DPS', 'Dear {{parent_name}}, This is a reminder that fee payment of ₹{{amount}} for {{student_name}} (Class {{class}}) is due on {{due_date}}. Please make the payment to avoid late fees. Thank you.', 'whatsapp'),
('550e8400-e29b-41d4-a716-446655440001', 'Payment Confirmation', 'Payment Received - DPS', 'Dear {{parent_name}}, We have received your payment of ₹{{amount}} for {{student_name}}. Receipt number: {{receipt_number}}. Thank you for your prompt payment.', 'whatsapp'),
('550e8400-e29b-41d4-a716-446655440002', 'Payment Due Reminder', 'Fee Payment Due - St. Xavier''s', 'Dear {{parent_name}}, Fee payment of ₹{{amount}} for {{student_name}} is due on {{due_date}}. Please pay to avoid penalties.', 'whatsapp'),
('550e8400-e29b-41d4-a716-446655440003', 'Payment Due Reminder', 'Fee Payment Due - KV', 'Dear {{parent_name}}, Fee payment of ₹{{amount}} for {{student_name}} is due on {{due_date}}. Please make the payment.', 'whatsapp');

-- Insert sample reminder schedules
INSERT INTO reminder_schedules (institution_id, template_id, name, description, days_before_due, frequency, time_of_day) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM reminder_templates WHERE name = 'Payment Due Reminder' AND institution_id = '550e8400-e29b-41d4-a716-446655440001'), 'Weekly Reminder', 'Send reminder 7 days before due date', 7, 'once', '09:00:00'),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM reminder_templates WHERE name = 'Payment Due Reminder' AND institution_id = '550e8400-e29b-41d4-a716-446655440001'), 'Daily Reminder', 'Send daily reminder after due date', 0, 'daily', '10:00:00'),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM reminder_templates WHERE name = 'Payment Due Reminder' AND institution_id = '550e8400-e29b-41d4-a716-446655440002'), 'Weekly Reminder', 'Send reminder 7 days before due date', 7, 'once', '09:00:00'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM reminder_templates WHERE name = 'Payment Due Reminder' AND institution_id = '550e8400-e29b-41d4-a716-446655440003'), 'Weekly Reminder', 'Send reminder 7 days before due date', 7, 'once', '09:00:00');

-- Note: Users, students, and payments will be created through the application
-- as they require authentication and proper user management

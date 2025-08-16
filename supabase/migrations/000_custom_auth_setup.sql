-- =====================================================
-- CUSTOM AUTH SETUP FOR FEE MANAGEMENT SYSTEM
-- =====================================================

-- Enable required extensions for uuid generation and encryption
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- =====================================================
-- CUSTOM AUTH TABLES IN PUBLIC SCHEMA
-- =====================================================

-- Create profiles table in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    invited_at TIMESTAMP WITH TIME ZONE,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMP WITH TIME ZONE,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone VARCHAR(15) UNIQUE,
    phone_confirmed_at TIMESTAMP WITH TIME ZONE,
    phone_change VARCHAR(15) UNIQUE,
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    email_change_token_current VARCHAR(255),
    email_change_confirm_status SMALLINT DEFAULT 0,
    banned_until TIMESTAMP WITH TIME ZONE,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMP WITH TIME ZONE
);

-- Create sessions table in public schema
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create identities table in public schema
CREATE TABLE IF NOT EXISTS public.identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_data JSONB NOT NULL,
    provider VARCHAR(255) NOT NULL,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sub TEXT GENERATED ALWAYS AS (identity_data->>'sub') STORED,
    UNIQUE(provider, sub)
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON AUTH TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CUSTOM AUTH HELPER FUNCTIONS
-- =====================================================

-- Function to get current user ID from custom sessions
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT user_id 
        FROM public.sessions 
        WHERE access_token = current_setting('request.jwt.claim', true)::json->>'access_token'
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_current_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    role_text TEXT;
BEGIN
    -- First extract the text value from JSONB
    SELECT raw_app_meta_data->>'role' INTO role_text
    FROM public.profiles 
    WHERE id = public.get_current_user_id();
    
    -- Return the text value
    RETURN role_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- =====================================================
-- RLS POLICIES FOR CUSTOM AUTH TABLES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view own identities" ON public.identities;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = public.get_current_user_id());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = public.get_current_user_id())
    WITH CHECK (id = public.get_current_user_id());

CREATE POLICY "Super admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        raw_app_meta_data->>'role' = 'super_admin'
    );

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (user_id = public.get_current_user_id());

CREATE POLICY "Users can manage own sessions" ON public.sessions
    FOR ALL USING (user_id = public.get_current_user_id());

-- Identities policies
CREATE POLICY "Users can view own identities" ON public.identities
    FOR SELECT USING (user_id = public.get_current_user_id());

-- =====================================================
-- TRIGGERS FOR CUSTOM AUTH
-- =====================================================

-- Trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, raw_app_meta_data)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_app_meta_data, '{}'::jsonb)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING GIN(raw_app_meta_data);
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON public.profiles USING GIN(raw_app_meta_data);

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON public.sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- Indexes for identities table
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON public.identities(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_provider ON public.identities(provider);

-- =====================================================
-- UTILITY FUNCTIONS FOR AUTH MANAGEMENT
-- =====================================================

-- Function to create a new session
CREATE OR REPLACE FUNCTION public.create_session(
    p_user_id UUID,
    p_access_token VARCHAR(255),
    p_refresh_token VARCHAR(255),
    p_expires_in INTEGER DEFAULT 3600
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Delete existing sessions for this user
    DELETE FROM public.sessions WHERE user_id = p_user_id;
    
    -- Create new session
    INSERT INTO public.sessions (user_id, access_token, refresh_token, expires_at)
    VALUES (
        p_user_id,
        p_access_token,
        p_refresh_token,
        NOW() + (p_expires_in || ' seconds')::INTERVAL
    )
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate session
CREATE OR REPLACE FUNCTION public.validate_session(p_access_token VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE access_token = p_access_token 
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh session
CREATE OR REPLACE FUNCTION public.refresh_session(
    p_refresh_token VARCHAR(255),
    p_new_access_token VARCHAR(255),
    p_expires_in INTEGER DEFAULT 3600
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.sessions 
    SET 
        access_token = p_new_access_token,
        expires_at = NOW() + (p_expires_in || ' seconds')::INTERVAL
    WHERE refresh_token = p_refresh_token 
    AND expires_at > NOW();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete session
CREATE OR REPLACE FUNCTION public.delete_session(p_access_token VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.sessions WHERE access_token = p_access_token;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA (OPTIONAL)
-- =====================================================

-- Create a default super admin user if needed
-- Uncomment and modify as needed:
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data)
VALUES (
    uuid_generate_v4(),
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"role": "super_admin", "institution_id": null}'::jsonb
) ON CONFLICT (email) DO NOTHING;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test queries to verify setup (run these after setup):
/*
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'sessions', 'identities');

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%';

-- Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'sessions', 'identities');
*/

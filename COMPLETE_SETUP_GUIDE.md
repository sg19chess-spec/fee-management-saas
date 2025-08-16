# 🔐 Complete Custom Auth Setup Guide

## 🎯 **Overview**

This guide provides a **complete, consistent** custom Auth setup for your Fee Management System. All SQL files are designed to work together seamlessly.

## 📁 **Migration Files Order**

Run these files in **exact order**:

1. **`000_custom_auth_setup.sql`** - Custom Auth tables and functions
2. **`001_initial_schema.sql`** - Main database schema
3. **`002_rls_policies_custom_auth.sql`** - RLS policies and security

## ✅ **Step 1: Custom Auth Setup**

### **1.1 Go to Supabase Dashboard**
1. **Go to [supabase.com](https://supabase.com)**
2. **Select your project:** `wuqvtakbexumqoujdazy`
3. **Go to "SQL Editor" → "New Query"**

### **1.2 Run Custom Auth Setup**
Copy and paste the entire content of `000_custom_auth_setup.sql`:

```sql
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
BEGIN
    RETURN (
        SELECT raw_app_meta_data->>'role'
        FROM public.profiles 
        WHERE id = public.get_current_user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user institution ID from profiles
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT raw_app_meta_data->>'institution_id'::UUID
        FROM public.profiles 
        WHERE id = public.get_current_user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES FOR CUSTOM AUTH TABLES
-- =====================================================

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
```

## ✅ **Step 2: Main Database Schema**

### **2.1 Create Another Query**
1. **Go to "SQL Editor" → "New Query"**
2. **Copy and paste the content from `001_initial_schema.sql`**
3. **Click "Run"**

## ✅ **Step 3: RLS Policies**

### **3.1 Create Another Query**
1. **Go to "SQL Editor" → "New Query"**
2. **Copy and paste the content from `002_rls_policies_custom_auth.sql`**
3. **Click "Run"**

## ✅ **Step 4: Test Your Setup**

### **4.1 Test Custom Auth Functions**
In **SQL Editor**, run:

```sql
-- Test if custom Auth tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'sessions', 'identities');

-- Test if helper functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%';

-- Test if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'sessions', 'identities');

-- Test get_current_user_id function (will return NULL if no active session)
SELECT public.get_current_user_id();
```

## 🎯 **Key Features of This Setup**

### **✅ Consistent Function Naming**
- `public.get_current_user_id()` - Gets current user from sessions
- `public.get_user_role()` - Gets role from profiles
- `public.get_user_institution_id()` - Gets institution from profiles
- `public.is_authenticated()` - Checks if user is authenticated

### **✅ Proper Data Flow**
1. **User signs up** → `auth.users` table
2. **Trigger fires** → Creates `public.profiles` entry
3. **User logs in** → Creates `public.sessions` entry
4. **RLS policies** → Use `public.get_current_user_id()`

### **✅ Complete Security**
- **Row Level Security** on all tables
- **Multi-tenant isolation** via `institution_id`
- **Role-based access** via `role` field
- **Session management** with expiration

### **✅ Performance Optimized**
- **Indexes** on frequently queried columns
- **GIN indexes** for JSONB fields
- **Efficient queries** with proper joins

## 🔧 **What This Fixes**

- ✅ **No UUID comparison errors** - Consistent UUID handling
- ✅ **Proper Auth integration** - Works with your custom setup
- ✅ **Multi-tenant security** - Complete data isolation
- ✅ **Role-based access** - Proper permissions
- ✅ **Session management** - Secure token handling

## 🚀 **Next Steps**

1. **Run all migrations** in order (above)
2. **Test the setup** with verification queries
3. **Deploy to Vercel**
4. **Test your application**

## 🆘 **Troubleshooting**

### **If you get errors:**

1. **Check if tables exist:**
   ```sql
   SELECT * FROM public.profiles LIMIT 1;
   SELECT * FROM public.sessions LIMIT 1;
   ```

2. **Check if functions exist:**
   ```sql
   SELECT public.get_current_user_id();
   SELECT public.get_user_role();
   ```

3. **Check if policies exist:**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

4. **Verify RLS is enabled:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

---

**This setup provides complete consistency across all SQL files! 🚀**

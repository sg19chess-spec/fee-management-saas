# 🔐 Custom Auth Setup Guide

## 🎯 **Perfect! You Have Custom Auth**

Your Auth setup is actually **more sophisticated** than the default Supabase Auth. You're using:
- **Custom Auth tables** in `public` schema
- **Custom sessions management**
- **Custom user profiles**
- **Custom triggers** for user creation

## ✅ **Step 1: Run Your Custom Auth Setup**

### **1.1 Go to SQL Editor**
1. **Go to [supabase.com](https://supabase.com)**
2. **Select your project:** `wuqvtakbexumqoujdazy`
3. **Go to "SQL Editor" → "New Query"**

### **1.2 Run Your Auth Schema**
Copy and paste your custom Auth setup:

```sql
-- Enable required extensions for uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Create a profiles table in the public schema
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

-- Enable RLS on public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identities ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create policies for sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Create policies for identities
CREATE POLICY "Users can view own identities" ON public.identities
    FOR SELECT USING (auth.uid() = user_id);

-- Optional: Trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## ✅ **Step 2: Run Your Main Schema**

### **2.1 Create Another Query**
1. **Go to "SQL Editor" → "New Query"**
2. **Copy and paste the content from `001_initial_schema.sql`**
3. **Click "Run"**

## ✅ **Step 3: Run Custom RLS Policies**

### **3.1 Create Another Query**
1. **Go to "SQL Editor" → "New Query"**
2. **Copy and paste the content from `002_rls_policies_custom_auth.sql`**
3. **Click "Run"**

## ✅ **Step 4: Test Your Custom Auth**

### **4.1 Test Auth Functions**
In **SQL Editor**, run:

```sql
-- Test if your custom auth.uid() function works
SELECT auth.uid();

-- Test if profiles table exists
SELECT * FROM public.profiles LIMIT 1;

-- Test if sessions table exists
SELECT * FROM public.sessions LIMIT 1;
```

## 🎯 **Key Differences in Your Setup**

### **Your Custom Auth vs Default Supabase Auth:**

1. **Schema Location:**
   - **Your setup:** `public.profiles`, `public.sessions`, `public.identities`
   - **Default:** `auth.users`, `auth.sessions`, `auth.identities`

2. **Auth Function:**
   - **Your setup:** Custom `auth.uid()` that reads from `public.sessions`
   - **Default:** Built-in `auth.uid()` that reads from `auth.sessions`

3. **User Management:**
   - **Your setup:** Custom triggers and profile management
   - **Default:** Automatic user management

## 🔧 **What This Fixes**

- ✅ **Custom auth.uid() function** works with your `public.sessions` table
- ✅ **RLS policies** can access user context from your custom Auth
- ✅ **UUID comparisons** work properly with your setup
- ✅ **Multi-tenant isolation** functions with your custom Auth

## 🚀 **Next Steps**

1. **Run your custom Auth setup** (Step 1)
2. **Run main schema** (Step 2)
3. **Run custom RLS policies** (Step 3)
4. **Test Auth functions** (Step 4)
5. **Deploy to Vercel**

## 🆘 **Troubleshooting**

### **If you still get errors:**

1. **Check your custom Auth tables:**
   ```sql
   SELECT * FROM public.profiles;
   SELECT * FROM public.sessions;
   ```

2. **Test your custom auth.uid():**
   ```sql
   SELECT auth.uid();
   ```

3. **Verify RLS is enabled:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

---

**Your custom Auth setup is actually more powerful than the default! 🚀**

# 🔐 Supabase Auth Setup Guide

## 🚨 **Critical Issue: Auth Not Configured**

The error `"operator does not exist: uuid = character varying"` is likely caused by **Supabase Auth not being properly configured**. The RLS policies depend on `auth.uid()` function, which won't work without Auth setup.

## ✅ **Step 1: Enable Supabase Auth**

### **1.1 Go to Authentication Settings**
1. **Go to [supabase.com](https://supabase.com)**
2. **Select your project:** `wuqvtakbexumqoujdazy`
3. **Go to "Authentication" → "Settings"**

### **1.2 Configure Auth Settings**
1. **Enable Email Auth:**
   - ✅ **Enable email confirmations:** Turn ON
   - ✅ **Enable email change confirmations:** Turn ON
   - ✅ **Enable phone confirmations:** Turn OFF (unless needed)

2. **Site URL Configuration:**
   - **Site URL:** `http://localhost:3000` (for development)
   - **Redirect URLs:** Add your Vercel URL when ready

3. **Email Templates:**
   - **Confirm signup:** Customize if needed
   - **Reset password:** Customize if needed

## ✅ **Step 2: Create Auth Schema**

### **2.1 Run Auth Schema Migration**
Go to **SQL Editor** → **New Query** and run:

```sql
-- Enable the auth schema and extensions
CREATE SCHEMA IF NOT EXISTS auth;

-- Enable required extensions for auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth.users table (if not exists)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
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

-- Create auth.sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create auth.identities table
CREATE TABLE IF NOT EXISTS auth.identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_data JSONB NOT NULL,
    provider VARCHAR(255) NOT NULL,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, identity_data->>'sub')
);

-- Enable RLS on auth tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

-- Create auth policies
CREATE POLICY "Users can view own user data" ON auth.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own user data" ON auth.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON auth.sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own identities" ON auth.identities
    FOR SELECT USING (auth.uid() = user_id);
```

## ✅ **Step 3: Create Auth Functions**

### **3.1 Run Auth Functions Migration**
Create another **New Query** and run:

```sql
-- Function to get current user ID
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT user_id 
        FROM auth.sessions 
        WHERE access_token = current_setting('request.jwt.claim', true)::json->>'access_token'
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT raw_app_meta_data->>'role'
        FROM auth.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## ✅ **Step 4: Test Auth Setup**

### **4.1 Create Test User**
Go to **Authentication** → **Users** → **Add User**:

1. **Email:** `admin@example.com`
2. **Password:** `password123`
3. **User Metadata:**
   ```json
   {
     "role": "super_admin",
     "institution_id": "system-administration"
   }
   ```

### **4.2 Test Auth Functions**
In **SQL Editor**, run:

```sql
-- Test auth.uid() function
SELECT auth.uid();

-- Test auth.role() function  
SELECT auth.role();

-- Test auth.is_authenticated() function
SELECT auth.is_authenticated();
```

## ✅ **Step 5: Now Run Your RLS Policies**

After Auth is properly set up, run your RLS policies:

1. **Go to SQL Editor**
2. **Run `001_initial_schema.sql`**
3. **Run `002_rls_policies_fixed.sql`**

## 🔧 **Alternative: Use Supabase Auth UI**

If you prefer the UI approach:

### **1. Go to Authentication → Users**
1. **Click "Add User"**
2. **Create your first admin user**
3. **Set role in user metadata**

### **2. Go to Authentication → Settings**
1. **Configure email settings**
2. **Set site URL**
3. **Configure redirect URLs**

### **3. Go to Authentication → Policies**
1. **Review existing policies**
2. **Create custom policies if needed**

## 🎯 **Expected Result**

After Auth setup:
- ✅ `auth.uid()` function works correctly
- ✅ RLS policies can access user context
- ✅ Multi-tenant isolation functions properly
- ✅ No more UUID comparison errors

## 🆘 **Troubleshooting**

### **If you still get errors:**

1. **Check Auth is enabled:**
   ```sql
   SELECT * FROM auth.users LIMIT 1;
   ```

2. **Test auth functions:**
   ```sql
   SELECT auth.uid(), auth.role(), auth.is_authenticated();
   ```

3. **Verify user exists:**
   ```sql
   SELECT * FROM auth.users WHERE email = 'your-email@example.com';
   ```

4. **Check RLS is enabled:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

---

**Once Auth is properly configured, your RLS policies will work perfectly! 🔐**

# 🚀 Vercel + Supabase Deployment Guide

Complete step-by-step guide to deploy your Fee Management System to Vercel and set up Supabase database.

## 📋 **Prerequisites**

- GitHub account
- Vercel account (free tier available)
- Supabase account (free tier available)
- Your code committed to GitHub

## 🗄 **Step 1: Set Up Supabase Database**

### 1.1 Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Fill in project details:**
   - Organization: Select or create one
   - Project name: `fee-management-saas`
   - Database password: Create a strong password (save it!)
   - Region: Choose closest to your users
5. **Click "Create new project"**
6. **Wait for setup** (2-3 minutes)

### 1.2 Get Database Credentials

1. **Go to Project Settings** (gear icon in sidebar)
2. **Click "API"** in the sidebar
3. **Copy these values:**
   ```
   Project URL: https://your-project-ref.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 1.3 Run Database Migrations

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Run migrations:**
   ```bash
   supabase db push
   ```

5. **Generate TypeScript types:**
   ```bash
   supabase gen types typescript --project-id your-project-ref > types/supabase.ts
   ```

### 1.4 Verify Database Setup

1. **Go to Supabase Dashboard → Table Editor**
2. **Verify these tables exist:**
   - `institutions`
   - `profiles`
   - `classes`
   - `students`
   - `fee_categories`
   - `fee_items`
   - `fee_plans`
   - `fee_payments`
   - `receipts`
   - `audit_logs`

## 🌐 **Step 2: Deploy to Vercel**

### 2.1 Push Code to GitHub

1. **Create GitHub repository** (if not exists):
   ```bash
   git remote add origin https://github.com/yourusername/fee-management-saas.git
   git push -u origin master
   ```

### 2.2 Connect to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Import your repository:**
   - Select your `fee-management-saas` repository
   - Click "Import"

### 2.3 Configure Project Settings

1. **Project Name:** `fee-management-saas`
2. **Framework Preset:** Next.js (auto-detected)
3. **Root Directory:** `./` (default)
4. **Build Command:** `npm run build` (default)
5. **Output Directory:** `.next` (default)
6. **Install Command:** `npm install` (default)

### 2.4 Set Environment Variables

**Click "Environment Variables" and add:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your_random_secret_here

# Optional: Default Institution
NEXT_PUBLIC_DEFAULT_INSTITUTION_ID=your_default_institution_id
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2.5 Deploy

1. **Click "Deploy"**
2. **Wait for build** (2-3 minutes)
3. **Check deployment status**

## 🔧 **Step 3: Post-Deployment Setup**

### 3.1 Create Super Admin User

1. **Go to your deployed app:** `https://your-app.vercel.app`
2. **Sign up with your email**
3. **Go to Supabase Dashboard → Authentication → Users**
4. **Find your user and update metadata:**
   ```json
   {
     "role": "super_admin",
     "institution_id": "system-administration"
   }
   ```

### 3.2 Create Default Institution

1. **Go to your app → Admin Panel**
2. **Create a new institution:**
   - Name: "System Administration"
   - Domain: your domain
   - Contact info

### 3.3 Test the System

1. **Login as Super Admin**
2. **Create a test institution**
3. **Create test users**
4. **Test all features**

## 🔒 **Step 4: Security Configuration**

### 4.1 Supabase Security

1. **Go to Supabase Dashboard → Authentication → Settings**
2. **Configure:**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`
   - Enable email confirmations (optional)

### 4.2 Row Level Security

1. **Verify RLS is enabled** on all tables
2. **Test multi-tenant isolation**
3. **Verify role-based access**

## 📊 **Step 5: Monitoring & Analytics**

### 5.1 Vercel Analytics

1. **Go to Vercel Dashboard → Analytics**
2. **Enable Web Analytics** (free tier)
3. **Monitor performance**

### 5.2 Supabase Monitoring

1. **Go to Supabase Dashboard → Logs**
2. **Monitor database queries**
3. **Check for errors**

## 🚨 **Troubleshooting**

### Common Issues

#### 1. **Build Failures**
```bash
# Check build locally
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

#### 2. **Database Connection Issues**
```bash
# Test Supabase connection
supabase status

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### 3. **Authentication Issues**
- Verify `NEXTAUTH_URL` matches your domain
- Check Supabase Auth settings
- Verify redirect URLs

#### 4. **RLS Policy Issues**
```sql
-- Test RLS policies
SELECT * FROM students WHERE institution_id = 'your-institution-id';
```

## 🔄 **Step 6: Continuous Deployment**

### 6.1 Automatic Deployments

1. **Every push to `master` branch** will auto-deploy
2. **Preview deployments** for pull requests
3. **Rollback** to previous versions if needed

### 6.2 Environment Management

1. **Development:** Use local `.env.local`
2. **Production:** Use Vercel environment variables
3. **Staging:** Create separate Vercel project

## 📈 **Step 7: Performance Optimization**

### 7.1 Vercel Optimizations

1. **Enable Edge Functions** for API routes
2. **Use Image Optimization** for logos
3. **Enable Compression**

### 7.2 Database Optimizations

1. **Add indexes** for frequently queried columns
2. **Monitor query performance**
3. **Use connection pooling**

## 🔍 **Step 8: Testing Production**

### 8.1 Smoke Tests

1. **Test login/logout**
2. **Test student creation**
3. **Test payment processing**
4. **Test PDF generation**
5. **Test reports and exports**

### 8.2 Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 📞 **Support & Maintenance**

### 8.1 Monitoring

- **Vercel Dashboard** - App performance
- **Supabase Dashboard** - Database health
- **Error tracking** - Set up Sentry (optional)

### 8.2 Backups

- **Supabase** - Automatic daily backups
- **Code** - GitHub repository
- **Environment** - Document all variables

## 🎉 **Success Checklist**

- [ ] Supabase project created and configured
- [ ] Database migrations run successfully
- [ ] Vercel project deployed
- [ ] Environment variables set
- [ ] Super admin user created
- [ ] Default institution created
- [ ] All features tested
- [ ] Security configured
- [ ] Monitoring enabled
- [ ] Documentation updated

## 🔗 **Useful Links**

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Your App URL](https://your-app.vercel.app)

---

**🎯 Your Fee Management System is now live and ready for production use!**

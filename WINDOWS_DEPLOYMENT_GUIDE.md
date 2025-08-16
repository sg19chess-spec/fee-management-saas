# 🚀 Windows Deployment Guide for Fee Management System

Complete step-by-step guide to deploy your Fee Management System from Windows to Vercel and Supabase.

## 📋 **Prerequisites**

- Windows 10/11
- Node.js 18+ installed
- Git installed
- GitHub account
- Vercel account (free tier available)
- Supabase account (free tier available)

## 🔧 **Step 1: Fix PowerShell Execution Policy**

### 1.1 Open PowerShell as Administrator

1. **Press `Windows + X`**
2. **Select "Windows PowerShell (Admin)"**
3. **Run this command:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
4. **Type `Y` and press Enter**

### 1.2 Verify Node.js and npm

```powershell
node --version
npm --version
```

## 🗄 **Step 2: Set Up Supabase Database**

### 2.1 Create Supabase Project

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

### 2.2 Get Database Credentials

1. **Go to Project Settings** (gear icon in sidebar)
2. **Click "API"** in the sidebar
3. **Copy these values:**
   ```
   Project URL: https://your-project-ref.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2.3 Install Supabase CLI

```powershell
npm install -g supabase
```

### 2.4 Login and Link Project

```powershell
# Login to Supabase
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref your-project-ref
```

### 2.5 Run Database Migrations

```powershell
# Push migrations to Supabase
supabase db push

# Generate TypeScript types
supabase gen types typescript --project-id your-project-ref > types/supabase.ts
```

### 2.6 Verify Database Setup

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

## 🌐 **Step 3: Prepare Code for Deployment**

### 3.1 Test Build Locally

```powershell
# Install dependencies
npm install

# Test build
npm run build

# Test TypeScript
npm run type-check

# Test linting
npm run lint
```

### 3.2 Create Environment File

Create `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

# Optional: Default Institution
NEXT_PUBLIC_DEFAULT_INSTITUTION_ID=your_default_institution_id
```

### 3.3 Test Locally

```powershell
npm run dev
```

Visit `http://localhost:3000` to test your application.

## 📤 **Step 4: Push to GitHub**

### 4.1 Initialize Git (if not already done)

```powershell
git init
git add .
git commit -m "Initial commit - Fee Management System"
```

### 4.2 Create GitHub Repository

1. **Go to [github.com](https://github.com)**
2. **Click "New repository"**
3. **Name it:** `fee-management-saas`
4. **Make it public or private**
5. **Don't initialize with README** (you already have one)

### 4.3 Push to GitHub

```powershell
# Add remote origin (replace with your GitHub username)
git remote add origin https://github.com/yourusername/fee-management-saas.git

# Push to GitHub
git push -u origin master
```

## 🚀 **Step 5: Deploy to Vercel**

### 5.1 Connect to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Import your repository:**
   - Select your `fee-management-saas` repository
   - Click "Import"

### 5.2 Configure Project Settings

1. **Project Name:** `fee-management-saas`
2. **Framework Preset:** Next.js (auto-detected)
3. **Root Directory:** `./` (default)
4. **Build Command:** `npm run build` (default)
5. **Output Directory:** `.next` (default)
6. **Install Command:** `npm install` (default)

### 5.3 Set Environment Variables

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
```powershell
# Open PowerShell and run:
[System.Web.Security.Membership]::GeneratePassword(32, 10)
```

### 5.4 Deploy

1. **Click "Deploy"**
2. **Wait for build** (2-3 minutes)
3. **Check deployment status**

## 🔧 **Step 6: Post-Deployment Setup**

### 6.1 Create Super Admin User

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

### 6.2 Create Default Institution

1. **Go to your app → Admin Panel**
2. **Create a new institution:**
   - Name: "System Administration"
   - Domain: your domain
   - Contact info

### 6.3 Test the System

1. **Login as Super Admin**
2. **Create a test institution**
3. **Create test users**
4. **Test all features**

## 🔒 **Step 7: Security Configuration**

### 7.1 Supabase Security

1. **Go to Supabase Dashboard → Authentication → Settings**
2. **Configure:**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`
   - Enable email confirmations (optional)

### 7.2 Row Level Security

1. **Verify RLS is enabled** on all tables
2. **Test multi-tenant isolation**
3. **Verify role-based access**

## 🚨 **Troubleshooting Windows Issues**

### Common PowerShell Issues

#### 1. **Execution Policy Error**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. **npm Command Not Found**
```powershell
# Reinstall Node.js from https://nodejs.org
# Make sure to check "Add to PATH" during installation
```

#### 3. **Git Command Not Found**
```powershell
# Install Git from https://git-scm.com
# Make sure to check "Add to PATH" during installation
```

#### 4. **Build Failures**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Common Deployment Issues

#### 1. **Environment Variables Not Set**
- Double-check all environment variables in Vercel
- Make sure there are no extra spaces
- Verify the values are correct

#### 2. **Database Connection Issues**
```powershell
# Test Supabase connection
supabase status

# Check environment variables
echo $env:NEXT_PUBLIC_SUPABASE_URL
```

#### 3. **Authentication Issues**
- Verify `NEXTAUTH_URL` matches your domain
- Check Supabase Auth settings
- Verify redirect URLs

## 📊 **Step 8: Monitoring & Analytics**

### 8.1 Vercel Analytics

1. **Go to Vercel Dashboard → Analytics**
2. **Enable Web Analytics** (free tier)
3. **Monitor performance**

### 8.2 Supabase Monitoring

1. **Go to Supabase Dashboard → Logs**
2. **Monitor database queries**
3. **Check for errors**

## 🔄 **Step 9: Continuous Deployment**

### 9.1 Automatic Deployments

1. **Every push to `master` branch** will auto-deploy
2. **Preview deployments** for pull requests
3. **Rollback** to previous versions if needed

### 9.2 Environment Management

1. **Development:** Use local `.env.local`
2. **Production:** Use Vercel environment variables
3. **Staging:** Create separate Vercel project

## 🎉 **Success Checklist**

- [ ] PowerShell execution policy fixed
- [ ] Node.js and npm working
- [ ] Supabase project created and configured
- [ ] Database migrations run successfully
- [ ] Local build and test successful
- [ ] Code pushed to GitHub
- [ ] Vercel project deployed
- [ ] Environment variables set
- [ ] Super admin user created
- [ ] Default institution created
- [ ] All features tested
- [ ] Security configured
- [ ] Monitoring enabled

## 🔗 **Useful Links**

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Node.js Download](https://nodejs.org)
- [Git Download](https://git-scm.com)
- [Your App URL](https://your-app.vercel.app)

## 📞 **Windows-Specific Support**

If you encounter Windows-specific issues:

1. **Check Windows Event Viewer** for errors
2. **Run PowerShell as Administrator** for permission issues
3. **Use Windows Terminal** for better experience
4. **Check Windows Defender** for blocking npm/git

---

**🎯 Your Fee Management System is now live and ready for production use on Windows!**

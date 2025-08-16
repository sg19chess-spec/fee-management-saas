#!/bin/bash

# 🚀 Fee Management System Deployment Setup Script
# This script helps you set up your deployment environment

echo "🚀 Fee Management System - Deployment Setup"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ Git version: $(git --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if build works
echo "🔨 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix the issues before deploying."
    exit 1
fi

# Check if tests pass
echo "🧪 Running tests..."
npm test

if [ $? -eq 0 ]; then
    echo "✅ Tests passed!"
else
    echo "⚠️  Some tests failed. You can still deploy, but consider fixing them."
fi

# Generate environment template
echo "📝 Creating environment template..."
cat > .env.example << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your_random_secret_here

# Optional: Default Institution
NEXT_PUBLIC_DEFAULT_INSTITUTION_ID=your_default_institution_id
EOL

echo "✅ Environment template created: .env.example"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
else
    echo "✅ Supabase CLI is already installed"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. 📋 Create Supabase project:"
echo "   - Go to https://supabase.com"
echo "   - Create new project"
echo "   - Copy your project URL and keys"
echo ""
echo "2. 🗄️  Set up database:"
echo "   - Run: supabase login"
echo "   - Run: supabase link --project-ref your-project-ref"
echo "   - Run: supabase db push"
echo ""
echo "3. 🌐 Deploy to Vercel:"
echo "   - Push code to GitHub"
echo "   - Go to https://vercel.com"
echo "   - Import your repository"
echo "   - Set environment variables"
echo "   - Deploy!"
echo ""
echo "📖 See VERCEL_SUPABASE_SETUP.md for detailed instructions"
echo ""

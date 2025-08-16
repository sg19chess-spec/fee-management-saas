# Deployment Guide

This guide covers how to deploy the Fee Management System to production.

## 🚀 Deployment Options

### 1. **Vercel** (Recommended)
- Zero-config deployment
- Automatic CI/CD
- Built-in analytics
- Edge functions support

### 2. **Railway**
- Simple deployment
- Database included
- Good for small to medium projects

### 3. **DigitalOcean App Platform**
- Scalable infrastructure
- Multiple regions
- Built-in monitoring

### 4. **AWS/GCP/Azure**
- Enterprise-grade
- Full control
- Complex setup

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Production Supabase project created
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates ready
- [ ] Domain configured

### Code Preparation
- [ ] All tests passing
- [ ] Build successful locally
- [ ] Environment variables documented
- [ ] README updated
- [ ] License file present

### Security
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] Database backups configured
- [ ] Monitoring set up

## 🎯 Vercel Deployment (Recommended)

### 1. **Prepare Repository**
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. **Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure project settings

### 3. **Environment Variables**
Set these in Vercel dashboard:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Application Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret

# Optional: Payment Gateway
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Optional: WhatsApp API
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id

# Optional: Email Service
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 4. **Build Configuration**
Vercel will auto-detect Next.js, but you can customize:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 5. **Deploy**
```bash
# Deploy automatically via Git push
git push origin main

# Or deploy manually
vercel --prod
```

### 6. **Custom Domain**
1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain
5. Configure DNS records

## 🚂 Railway Deployment

### 1. **Connect Repository**
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### 2. **Configure Environment**
```bash
# Add environment variables in Railway dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Deploy**
Railway will automatically deploy on every push to main branch.

## ☁️ DigitalOcean App Platform

### 1. **Create App**
1. Go to DigitalOcean dashboard
2. Click "Create" → "Apps"
3. Connect your GitHub repository
4. Select branch and directory

### 2. **Configure Build**
```yaml
# .do/app.yaml
name: fee-management-system
services:
  - name: web
    source_dir: /
    github:
      repo: your-username/your-repo
      branch: main
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
```

### 3. **Environment Variables**
Set in DigitalOcean dashboard or via CLI:
```bash
doctl apps create --spec .do/app.yaml
```

## 🐳 Docker Deployment

### 1. **Create Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. **Create Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
```

### 3. **Deploy with Docker**
```bash
# Build and run
docker-compose up -d

# Or with Docker directly
docker build -t fee-management-system .
docker run -p 3000:3000 fee-management-system
```

## 🔧 Production Configuration

### 1. **Next.js Configuration**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Enable compression
  compress: true,
  // Optimize bundle
  swcMinify: true,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 2. **Environment Variables**
Create `.env.production`:
```env
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
NEXTAUTH_SECRET=your_very_long_random_secret
NEXTAUTH_URL=https://your-domain.com

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### 3. **Database Migration**
```bash
# Run migrations on production database
supabase db push --project-ref your-project-ref

# Or manually run SQL files
psql -h your-db-host -U your-user -d your-database -f migrations/001_initial_schema.sql
```

## 📊 Monitoring & Analytics

### 1. **Vercel Analytics**
```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to your app
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. **Error Monitoring**
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs
```

### 3. **Performance Monitoring**
```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  // your existing config
}

const sentryWebpackPluginOptions = {
  silent: true,
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
```

## 🔒 Security Checklist

### 1. **Environment Variables**
- [ ] All secrets are environment variables
- [ ] No hardcoded credentials
- [ ] Production keys are different from development
- [ ] Service role key is secure

### 2. **Database Security**
- [ ] RLS policies enabled
- [ ] Connection strings are secure
- [ ] Database backups configured
- [ ] Access logs enabled

### 3. **Application Security**
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented

### 4. **Authentication**
- [ ] JWT tokens secure
- [ ] Password policies enforced
- [ ] Multi-factor authentication available
- [ ] Session management secure

## 🚨 Troubleshooting

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

#### 2. **Environment Variables**
```bash
# Verify environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL

# Check in deployment platform
vercel env ls
```

#### 3. **Database Connection**
```bash
# Test database connection
supabase status

# Check RLS policies
supabase db reset
```

#### 4. **Performance Issues**
```bash
# Analyze bundle size
npm run build
# Check .next/analyze for bundle analysis

# Monitor performance
npm run dev
# Open Chrome DevTools → Performance tab
```

## 📈 Post-Deployment

### 1. **Health Checks**
```bash
# Test application endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/students

# Test database connection
curl https://your-domain.com/api/test-db
```

### 2. **Performance Testing**
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### 3. **Monitoring Setup**
- Set up uptime monitoring
- Configure error alerts
- Set up performance monitoring
- Enable database monitoring

### 4. **Backup Strategy**
- Database backups (daily)
- File storage backups
- Configuration backups
- Disaster recovery plan

## 🔄 Continuous Deployment

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

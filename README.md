# Fee Management System

A comprehensive multi-tenant SaaS solution for schools and colleges to manage fee collection, built with Next.js, Supabase, and modern web technologies.

## 🚀 Features

### Core Modules

1. **Multi-Tenant Institution Management** ✅ **NEW**
   - Support for multiple institutions with complete isolation
   - Role-based access control (Super Admin, Institution Admin, Staff, Student)
   - Institution-specific settings and branding
   - Super Admin Panel for managing all tenants
   - Payment gateway and WhatsApp configurations per institution
   - Row Level Security (RLS) for data isolation

2. **Student Management**
   - Bulk student upload via CSV/Excel
   - Student profiles with parent information
   - Sibling support (same parent contact)
   - Class/course assignments

3. **Fee Structure Management**
   - Flexible fee plans per class/course
   - Support for fixed, recurring, and irregular schedules
   - Discounts, scholarships, and concessions
   - Fee plan versioning
   - Penalty rules (fixed or percentage-based)

4. **Payment Processing**
   - Online payments (UPI, cards, netbanking)
   - Offline payments (cash, cheque, DD)
   - Partial payments support
   - Payment gateway integration
   - Webhook handling for payment status updates

5. **Receipt Management**
   - Auto-generated PDF receipts with QR codes
   - Sequential receipt numbering
   - Receipt reissue and cancellation
   - Digital delivery via WhatsApp/email/SMS

6. **Reminder System**
   - Automated fee due reminders
   - WhatsApp, SMS, and email notifications
   - Customizable templates
   - Scheduled reminder campaigns

7. **Reports & Analytics** ✅ **NEW**
   - Real-time dashboard with key metrics
   - Collection vs pending reports
   - Class-wise summaries
   - Export to Excel/PDF
   - Audit logs for all transactions
   - **New Features:**
     - KPI cards for total collection, outstanding dues, collection rate, YTD revenue
     - Interactive charts using Recharts (Bar, Line, Pie, Area)
     - Tabbed interface: Collections, Dues, Trends, Payment Modes
     - Revenue trends with peak/low period highlighting
     - Payment mode breakdown analysis
     - Top defaulters identification
     - CSV and PDF export functionality

8. **Dispute Resolution**
   - Payment dispute marking
   - Manual reconciliation tools
   - Admin override capabilities

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Recharts** - Data visualization ✅ **Enhanced**
- **React Hot Toast** - Notifications
- **@headlessui/react** - UI components (Tabs)

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS) ✅ **Enhanced**
  - Real-time subscriptions
  - Edge Functions
  - Storage for files
- **Supabase Auth** - Authentication system ✅ **Enhanced**

### Integrations
- **Payment Gateways** - Stripe, Razorpay support
- **WhatsApp Business API** - Messaging
- **Twilio** - SMS notifications
- **Nodemailer** - Email delivery
- **jsPDF** - PDF generation
- **QR Code** - Receipt QR codes

## 📁 Project Structure

```
fee-management-saas/
├── app/                          # Next.js App Router
│   ├── dashboard/                # Dashboard pages
│   │   └── fees/                # Fees management
│   │       └── page.tsx         # Main fees page with Reports tab ✅ **Updated**
│   ├── admin/                    # Super admin pages ✅ **NEW**
│   │   └── page.tsx             # Super Admin Panel
│   ├── teacher/                  # Teacher pages
│   ├── student/                  # Student/parent pages
│   ├── api/                      # API routes ✅ **Enhanced**
│   │   ├── fees/reports/         # Reports API ✅ **NEW**
│   │   │   ├── summary/         # Summary endpoint
│   │   │   ├── collections/     # Collections endpoint
│   │   │   ├── outstanding/     # Outstanding dues endpoint
│   │   │   ├── payment-modes/   # Payment modes endpoint
│   │   │   ├── revenue-trends/  # Revenue trends endpoint
│   │   │   └── export/          # Export endpoints ✅ **NEW**
│   │   └── admin/               # Admin API ✅ **NEW**
│   │       └── institutions/    # Institution management
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # React components ✅ **Enhanced**
│   ├── auth/                    # Authentication components
│   ├── dashboard/               # Dashboard components
│   ├── students/                # Student management
│   ├── payments/                # Payment components
│   ├── fees/                    # Fees components ✅ **Enhanced**
│   │   ├── ReportsDashboard.tsx # Main reports dashboard ✅ **NEW**
│   │   └── reports/             # Report components ✅ **NEW**
│   │       ├── CollectionsTab.tsx
│   │       ├── DuesTab.tsx
│   │       ├── TrendsTab.tsx
│   │       └── PaymentModesTab.tsx
│   ├── admin/                   # Admin components ✅ **NEW**
│   │   ├── InstitutionsList.tsx
│   │   ├── InstitutionForm.tsx
│   │   └── PaymentConfigsList.tsx
│   └── ui/                      # Reusable UI components
├── lib/                         # Utility libraries ✅ **Enhanced**
│   ├── supabase.ts             # Supabase client
│   ├── auth/                   # Auth utilities ✅ **NEW**
│   │   ├── supabase-auth.ts    # Supabase auth helpers
│   │   └── auth-context.tsx    # React auth context
│   ├── api.ts                  # API utilities
│   └── utils.ts                # Helper functions
├── types/                       # TypeScript types
│   └── supabase.ts             # Database types
├── supabase/                    # Supabase configuration ✅ **Enhanced**
│   ├── migrations/             # Database migrations ✅ **Enhanced**
│   │   ├── 012_multi_tenant_schema.sql    # Multi-tenant schema ✅ **NEW**
│   │   └── 013_rls_existing_tables.sql    # RLS policies ✅ **NEW**
│   └── functions/              # Edge functions
├── public/                      # Static assets
└── package.json                 # Dependencies
```

## 🗄 Database Schema

### Core Tables ✅ **Enhanced**

1. **institutions** - Institution information ✅ **NEW**
2. **profiles** - User profiles and roles ✅ **NEW**
3. **payment_gateway_configs** - Payment gateway settings per institution ✅ **NEW**
4. **whatsapp_configs** - WhatsApp API settings per institution ✅ **NEW**
5. **classes** - Class/course definitions
6. **students** - Student information
7. **fee_categories** - Fee categories ✅ **Enhanced with institution_id**
8. **fee_items** - Individual fee components ✅ **Enhanced with institution_id**
9. **fee_plans** - Fee structure templates ✅ **Enhanced with institution_id**
10. **fee_plan_assignments** - Student fee assignments ✅ **Enhanced with institution_id**
11. **fee_discounts** - Discounts and concessions ✅ **Enhanced with institution_id**
12. **fee_due_dates** - Due date management ✅ **Enhanced with institution_id**
13. **fee_payments** - Payment transactions ✅ **Enhanced with institution_id**
14. **receipts** - Payment receipts ✅ **Enhanced with institution_id**
15. **reminder_templates** - Notification templates
16. **reminder_logs** - Reminder history
17. **audit_logs** - System audit trail

### Key Features ✅ **Enhanced**

- **Row Level Security (RLS)** - Multi-tenant data isolation with role-based policies
- **Audit Logging** - Complete transaction history
- **Soft Deletes** - Data preservation
- **Optimized Indexes** - Performance optimization
- **Helper Functions** - Database functions for role checks and access control ✅ **NEW**
- **Triggers** - Automatic profile creation on user signup ✅ **NEW**

### Multi-Tenant Architecture ✅ **NEW**

- **Institution Isolation** - Complete data separation between institutions
- **Role-Based Access Control** - Fine-grained permissions per role
- **Super Admin Bypass** - Super admins can access all data
- **Student Self-Access** - Students can only access their own data
- **Institution Admin Full Access** - Full access to their institution's data
- **Staff Restricted Access** - Read-only for some tables, write access for fees/receipts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Payment gateway account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fee-management-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Run migrations (including new multi-tenant migrations)
   supabase db push
   
   # Generate types
   npm run db:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Database Setup ✅ **Enhanced**

1. **Run migrations in order**
   ```sql
   -- Run the migration files in order:
   -- 001_initial_schema.sql
   -- 002_rls_policies.sql
   -- 003_seed_data.sql
   -- 012_multi_tenant_schema.sql    # NEW: Multi-tenant foundation
   -- 013_rls_existing_tables.sql    # NEW: Enhanced RLS policies
   ```

2. **Verify RLS policies** ✅ **Enhanced**
   - All tables have RLS enabled
   - Policies enforce multi-tenant isolation
   - Role-based access control implemented
   - Helper functions for efficient role checks

3. **Test with seed data**
   - Sample institutions, users, and data provided
   - Use for development and testing
   - Default 'System Administration' institution created

## 🔐 Authentication & Authorization ✅ **Enhanced**

### User Roles ✅ **Updated**

1. **Super Admin** ✅ **NEW**
   - Manage all institutions
   - System-wide settings
   - User management
   - Payment gateway and WhatsApp configurations
   - Access to Super Admin Panel

2. **Institution Admin** ✅ **Updated**
   - Institution management
   - Staff management
   - Reports and analytics
   - Full access to their institution's data

3. **Staff** ✅ **Updated**
   - Fee management
   - Payment processing
   - Receipt generation
   - Restricted access (read-only for some tables, write for fees/receipts)

4. **Student** ✅ **Updated**
   - View own fees and data only
   - Payment history
   - Receipts
   - Self-service capabilities

### Security Features ✅ **Enhanced**

- **JWT Authentication** - Secure token-based auth with role and institution claims
- **Row Level Security** - Database-level access control with multi-tenant isolation
- **Role-based Permissions** - Granular access control per role and institution
- **Audit Logging** - Complete activity tracking
- **Input Validation** - XSS and injection protection
- **Institution Isolation** - Complete data separation between tenants ✅ **NEW**

### Multi-Tenant Security ✅ **NEW**

- **Institution Scoping** - All data queries automatically scoped to user's institution
- **Super Admin Bypass** - Super admins can access all institutions' data
- **Student Self-Access** - Students can only access their own records
- **API Key Encryption** - Payment gateway and WhatsApp credentials encrypted at rest
- **JWT Claims** - Efficient authorization with role and institution_id in tokens

## 💳 Payment Integration ✅ **Enhanced**

### Supported Methods

1. **Online Payments**
   - UPI
   - Credit/Debit Cards
   - Net Banking
   - Digital Wallets

2. **Offline Payments**
   - Cash
   - Cheque
   - Demand Draft

### Payment Flow ✅ **Enhanced**

1. **Payment Initiation**
   - Student selects fee items
   - System calculates total with penalties
   - Institution-specific payment gateway integration ✅ **NEW**

2. **Payment Processing**
   - Secure payment processing using institution credentials ✅ **NEW**
   - Real-time status updates
   - Webhook handling

3. **Post-Payment**
   - Receipt generation with institution branding ✅ **NEW**
   - Fee status updates
   - Notification sending using institution WhatsApp config ✅ **NEW**

### Multi-Tenant Payment Integration ✅ **NEW**

- **Institution-Specific Credentials** - Each institution has its own payment gateway config
- **Dynamic Credential Fetching** - API calls use correct credentials based on user's institution
- **Secure Storage** - API keys and secrets encrypted at rest
- **Audit Trail** - All payment operations logged with institution context

## 📊 Reporting & Analytics ✅ **Enhanced**

### Dashboard Metrics ✅ **Enhanced**

- Total students
- Fee collection vs pending
- Daily/monthly trends
- Class-wise summaries
- **New KPIs:** ✅ **NEW**
  - Total collection amount
  - Outstanding dues
  - Collection rate percentage
  - YTD revenue
  - Top defaulters

### Report Types ✅ **Enhanced**

1. **Collection Reports** ✅ **Enhanced**
   - Paid vs unpaid analysis
   - Payment method breakdown
   - Date range filtering
   - Interactive charts (Bar, Line, Area)
   - Export to CSV/PDF

2. **Student Reports** ✅ **Enhanced**
   - Individual fee status
   - Payment history
   - Due date tracking
   - Outstanding dues analysis
   - Top defaulters identification

3. **Institutional Reports** ✅ **Enhanced**
   - Overall performance
   - Revenue analytics
   - Growth metrics
   - Revenue trends with peak/low periods
   - Payment mode distribution

4. **New Report Types** ✅ **NEW**
   - **Collections Tab** - Daily/monthly/yearly collection trends
   - **Dues Tab** - Outstanding dues by class and student
   - **Trends Tab** - Revenue trends with YoY growth analysis
   - **Payment Modes Tab** - Payment method breakdown and analysis

### Export Functionality ✅ **NEW**

- **CSV Export** - Structured data export for all report types
- **PDF Export** - Simplified text-based PDF generation
- **Filtered Exports** - Export data based on applied filters
- **Institution Scoping** - All exports respect institution boundaries

## 🔔 Notification System ✅ **Enhanced**

### Reminder Types

1. **Fee Due Reminders**
   - Before due date
   - On due date
   - After due date

2. **Payment Confirmations**
   - Successful payments
   - Receipt delivery
   - Failed payment alerts

### Channels ✅ **Enhanced**

- **WhatsApp** - Business API integration with institution-specific credentials ✅ **NEW**
- **SMS** - Twilio integration
- **Email** - SMTP integration

### Multi-Tenant Notifications ✅ **NEW**

- **Institution-Specific Configs** - Each institution has its own WhatsApp API credentials
- **Dynamic Credential Fetching** - Notifications use correct credentials based on institution
- **Branded Messages** - Institution-specific branding in notifications
- **Audit Logging** - All notification attempts logged with institution context

## 🚀 Deployment

### Vercel Deployment

1. **Connect repository to Vercel**
2. **Set environment variables**
3. **Deploy automatically**

### Supabase Production

1. **Create production project**
2. **Run migrations (including new multi-tenant migrations)**
3. **Update environment variables**

### Environment Configuration ✅ **Enhanced**

```env
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
STRIPE_SECRET_KEY=your_stripe_key
WHATSAPP_API_TOKEN=your_whatsapp_token

# Multi-tenant specific variables ✅ **NEW**
NEXT_PUBLIC_DEFAULT_INSTITUTION_ID=your_default_institution_id
```

## 🧪 Testing

### Test Coverage

- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- **Multi-tenant isolation tests** ✅ **NEW**

### Test Commands

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📈 Performance Optimization

### Frontend ✅ **Enhanced**

- **Code Splitting** - Lazy loading of components
- **Image Optimization** - Next.js Image component
- **Caching** - Static generation where possible
- **Chart Optimization** - Efficient Recharts rendering ✅ **NEW**

### Backend ✅ **Enhanced**

- **Database Indexes** - Optimized queries with multi-tenant indexes ✅ **NEW**
- **Connection Pooling** - Efficient database connections
- **Caching** - Redis for frequently accessed data
- **RLS Optimization** - Efficient role and institution checks ✅ **NEW**

## 🔧 Development

### Code Standards

- **TypeScript** - Strict type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

### Development Workflow

1. **Feature Branch** - Create feature branch
2. **Development** - Implement feature
3. **Testing** - Write and run tests
4. **Code Review** - Submit PR
5. **Merge** - Merge to main

## 📚 API Documentation ✅ **Enhanced**

### REST API Endpoints ✅ **Enhanced**

```
# Student Management
GET    /api/students          # List students (institution-scoped)
POST   /api/students          # Create student
GET    /api/students/:id      # Get student
PUT    /api/students/:id      # Update student
DELETE /api/students/:id      # Delete student

# Payment Management
GET    /api/payments          # List payments (institution-scoped)
POST   /api/payments          # Create payment
GET    /api/payments/:id      # Get payment
PUT    /api/payments/:id      # Update payment

# Reports API ✅ **NEW**
GET    /api/fees/reports/summary        # Dashboard summary
GET    /api/fees/reports/collections    # Collection reports
GET    /api/fees/reports/outstanding    # Outstanding dues
GET    /api/fees/reports/payment-modes  # Payment mode analysis
GET    /api/fees/reports/revenue-trends # Revenue trends
GET    /api/fees/reports/collections/export    # Export collections
GET    /api/fees/reports/outstanding/export    # Export outstanding

# Admin API ✅ **NEW**
GET    /api/admin/institutions          # List institutions (super admin only)
POST   /api/admin/institutions          # Create institution
GET    /api/admin/institutions/:id      # Get institution
PUT    /api/admin/institutions/:id      # Update institution
DELETE /api/admin/institutions/:id      # Delete institution

# Reminder System
POST   /api/reminders         # Send reminders
```

### Webhook Endpoints

```
POST   /api/webhooks/payment  # Payment gateway webhooks
POST   /api/webhooks/whatsapp # WhatsApp delivery status
```

### Multi-Tenant API Features ✅ **NEW**

- **Institution Scoping** - All endpoints automatically scope data to user's institution
- **Role-Based Access** - Endpoints enforce role-based permissions
- **Super Admin Access** - Super admins can access all institutions' data
- **Audit Logging** - All API operations logged with institution context

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Documentation** - Check the docs folder
- **Issues** - Create GitHub issues
- **Discussions** - Use GitHub discussions
- **Email** - Contact support team

## 🔮 Roadmap

### Upcoming Features

- **Mobile App** - React Native application
- **Advanced Analytics** - Machine learning insights
- **Multi-language Support** - Internationalization
- **Advanced Reporting** - Custom report builder
- **API Marketplace** - Third-party integrations

### Performance Improvements

- **Real-time Updates** - WebSocket integration
- **Offline Support** - Service worker implementation
- **Progressive Web App** - PWA features

### Multi-Tenant Enhancements ✅ **NEW**

- **Institution Onboarding** - Automated institution setup wizard
- **White-label Solutions** - Custom branding per institution
- **Advanced Permissions** - Granular permission system
- **Billing & Subscription** - Multi-tenant billing management
- **API Rate Limiting** - Per-institution rate limiting

---

**Built with ❤️ for educational institutions worldwide**

## 🆕 Recent Updates (Latest)

### Phase 1.8: Reports & Analytics ✅ **COMPLETED**
- **Reports Dashboard** - Interactive dashboard with KPI cards and charts
- **Collection Reports** - Daily/monthly/yearly collection analysis with export
- **Dues Reports** - Outstanding dues analysis with class-wise breakdown
- **Trend Reports** - Revenue trends with YoY growth analysis
- **Payment Mode Reports** - Payment method distribution analysis
- **Export Functionality** - CSV and PDF export for all report types

### Phase 2.0: Multi-Tenant Architecture ✅ **IN PROGRESS**
- **Database Schema** - Multi-tenant tables and RLS policies implemented
- **Authentication** - Supabase Auth with role and institution claims
- **Super Admin Panel** - Institution management interface
- **API Routes** - CRUD operations for institutions and configurations
- **Frontend Components** - Admin panel components for institution management
- **Security** - Row Level Security with institution isolation

### Next Steps
- Complete remaining admin panel components (PaymentConfigForm, WhatsAppConfigsList, etc.)
- Implement payment gateway and WhatsApp API integration with tenant context
- Add encryption for API keys and secrets at database level
- Create login/signup UI components
- Integrate PDF receipt generation with tenant-specific credentials

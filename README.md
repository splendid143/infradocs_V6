# INFO DOCS

Professional infrastructure documentation and information management system for physical network infrastructure in data centers, server rooms, telecom rooms, and technical facilities.

## Features

- **Sites, Rooms, Racks** - Hierarchical infrastructure management
- **Equipment & Ports** - Track network equipment with port-level detail
- **Patch Panels** - Fiber and copper patch panel management
- **Cable Management** - Full cable lifecycle with endpoints (4 connection types)
- **Photos & Documents** - Attach files to any infrastructure record
- **QR Codes** - Generate and scan QR codes for quick access
- **Global Search** - Search across all infrastructure data
- **Audit Trail** - Immutable history of all changes
- **Reports** - Infrastructure inventory and documentation reports
- **Role-Based Access** - ADMIN, ENGINEER, VIEWER with approval workflow
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **Auth/Database**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (`npm install -g supabase`)

## Quick Start

### 1. Create Supabase Project

```bash
# Option A: Via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard
# 2. Create new project
# 3. Note the Project URL and anon key

# Option B: Via Supabase CLI (local development)
supabase init
supabase start
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Apply Database Migrations

```bash
# If using local Supabase
supabase db push

# If using remote Supabase
supabase db push --project-ref your-project-ref
```

This creates:
- 14 tables with full hierarchy (sites → rooms → racks → equipment/ports)
- Row Level Security policies for all tables
- Storage buckets for photos and documents
- Triggers for status history and user profile creation

### 4. Bootstrap First Admin

```bash
# Set environment variables for bootstrap script
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
export ADMIN_EMAIL=admin@yourcompany.com
export ADMIN_PASSWORD=secure-password-here
export ADMIN_NAME="System Administrator"

# Run bootstrap (creates exactly one ADMIN account)
npx tsx scripts/bootstrap-admin.ts
```

**Important**: The service_role key is used ONLY for this one-time bootstrap. Never commit it, never use in frontend.

### 5. Start Development Server

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/                    # App-level components
├── components/
│   ├── auth/              # Route guards
│   └── ui/                # Reusable UI components
├── features/              # Feature modules
│   ├── auth/             # Authentication
│   ├── users/            # User management (admin)
│   ├── dashboard/        # Dashboard
│   ├── sites/            # Sites management
│   ├── rooms/            # Rooms management
│   ├── racks/            # Racks management
│   ├── equipment/        # Equipment management
│   ├── patch-panels/     # Patch panels
│   ├── cables/           # Cable management
│   ├── attachments/      # File uploads
│   ├── search/           # Global search
│   ├── qr/               # QR codes
│   ├── reports/          # Reports
│   └── audit/            # Audit log
├── hooks/                 # Custom React hooks
├── layouts/               # Page layouts
├── lib/                   # Library clients (Supabase)
├── pages/                 # Page components
├── services/              # Data access layer
├── types/                 # TypeScript types
└── utils/                 # Utilities

supabase/
├── config.toml           # Supabase local config
├── migrations/           # SQL migrations (version controlled)
└── seed.sql             # Reference data only

scripts/
└── bootstrap-admin.ts   # One-time admin creation
```

## Database Schema

Key entities (14 tables):
- `users` - Extended Supabase Auth profiles
- `sites` - Data center sites
- `rooms` - Rooms within sites
- `racks` - Racks within rooms
- `equipment` - Network equipment in racks
- `equipment_ports` - Ports on equipment
- `patch_panels` - Patch panels in racks
- `patch_ports` - Ports on patch panels
- `cables` - Physical cables
- `cable_endpoints` - Cable connections (A/B ends)
- `attachments` - File metadata
- `notes` - Free-form notes
- `status_history` - Immutable status changes
- `qr_codes` - QR code tokens

## Security Model

- **Authentication**: Supabase Auth (email/password)
- **Authorization**: PostgreSQL Row Level Security (RLS)
- **Roles**: ADMIN, ENGINEER, VIEWER
- **Approval Workflow**: SIGNUP → PENDING → ADMIN REVIEW → APPROVED → ROLE ASSIGNED
- **Storage**: Private buckets with signed URLs

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Environment Variables for Production

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Acceptance Tests

The application is complete when these scenarios work:

1. **Setup**: Supabase project exists, migrations apply cleanly, bootstrap creates exactly one ADMIN
2. **Authentication**: New user signs up → PENDING → cannot access infrastructure → ADMIN approves → ENGINEER → can access
3. **Viewer**: Can search/view, cannot create/edit/upload, cannot access Admin
4. **Engineer**: Can create cables, upload photos, change status, status history created
5. **Admin**: Can approve/reject/disable/reactivate users, change roles, view audit, authorized deletion
6. **Data Integrity**: Invalid endpoints rejected, duplicate cable IDs rejected, RLS enforced
7. **Files**: Authorized upload/view, unauthorized rejected, Admin can delete
8. **Infrastructure**: Full hierarchy navigation works, all 4 cable endpoint combos work, QR opens live record, global search works

## License

Proprietary - Internal Use Only
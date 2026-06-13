# The Treasure School — Management System

A full-stack school management web application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**.

---

## Features

| Module | Description |
|---|---|
| Authentication | JWT-based login/signup with role-based access control |
| Student Management | Add, edit, delete, search and paginate student profiles |
| Teacher Management | Staff profiles with subject assignments |
| Classes & Subjects | Create classes, assign teachers, enroll students |
| Attendance | Mark daily attendance per class; view records |
| Grades & Exams | Record scores, auto-calculate letter grades, view report |
| Timetable | Build and view weekly class schedules |
| Fee Management | Fee structures, payment tracking, receipts |
| Announcements | Role-targeted school-wide notices |
| Dashboards | Role-specific summary with stats and quick actions |

## Roles

- **Admin** — full control
- **Teacher** — attendance, grades, timetable
- **Student** — view own grades, attendance, fees, timetable
- **Parent** — view children's summary

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (JWT, Credentials provider)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

---

## Local Setup

### 1. Prerequisites

- Node.js 18+
- A PostgreSQL database (local, [Neon](https://neon.tech), or [Supabase](https://supabase.com))

### 2. Clone & Install

```bash
# From the project root
npm install
```

### 3. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/treasure_school"

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (dev)
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

After seeding (`npm run db:seed`), use these to log in:

| Role | Email | Password |
|---|---|---|
| Admin | admin@treasureschool.edu | Password@123 |
| Teacher | teacher1@treasureschool.edu | Password@123 |
| Parent | parent1@treasureschool.edu | Password@123 |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & signup pages
│   ├── (dashboard)/     # Role-based dashboard pages
│   │   ├── admin/
│   │   ├── teacher/
│   │   ├── student/
│   │   └── parent/
│   └── api/             # REST API routes
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Sidebar, Header
│   ├── forms/           # Form components per module
│   └── dashboard/       # Dashboard widgets
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Prisma client singleton
│   ├── utils.ts         # Helpers (cn, formatDate, etc.)
│   └── validations.ts   # Zod schemas
└── types/               # TypeScript type definitions
prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Sample data
```

---

## Deployment (Vercel + Neon/Supabase)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` — your Neon/Supabase connection string (add `?sslmode=require`)
   - `NEXTAUTH_SECRET` — a random 32-byte hex string
   - `NEXTAUTH_URL` — your Vercel deployment URL
4. Set build command: `prisma generate && next build`
5. Deploy — Vercel handles the rest

After first deploy, run the seed via a one-off command or Vercel function if needed.

---

## Customising the Brand

| Setting | File |
|---|---|
| School name | `src/app/layout.tsx` (metadata) and login page |
| Primary color | `tailwind.config.ts` → `colors.primary` |
| Gold accent | `tailwind.config.ts` → `colors.gold` |
| Logo | Replace the `GraduationCap` icon in `Sidebar.tsx` with an `<Image>` |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Re-generate Prisma client |
| `npm run db:push` | Push schema changes (dev) |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset and re-migrate database |

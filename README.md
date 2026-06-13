# The Treasure School — Management System

A full-stack school management web application built for Kenyan CBC schools, featuring **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**.

---

## Features

### Core Modules

| Module | Description |
|---|---|
| Authentication | JWT-based login with role-based access control (Admin, Teacher, Student, Parent) |
| Student Management | Full CRUD, photo, NEMIS number, medical info, bulk CSV import |
| Teacher Management | Staff profiles, subject assignments, payroll |
| Classes & Subjects | Create CBC classes (Pre-Primary → Junior Secondary), assign teachers, enroll students |
| Attendance | Mark daily attendance per class; view records per student |
| Grades & Exams | Record scores, auto-calculate CBC levels (EE/ME/AE/BE), view reports |
| Timetable | Build and view weekly class schedules |
| Fee Management | Fee structures, payment tracking with M-Pesa code capture |
| Announcements | Role-targeted school-wide notices |
| Dashboards | Role-specific summary with stats, charts, and quick actions |

### Academic & Administration

| Module | Description |
|---|---|
| Analytics | Charts for enrolment trends, fee collection, attendance rates, grade distributions |
| School Calendar | Create and view school events, holidays, term dates |
| Homework / Assignments | Teachers post assignments; parents and students view them |
| Library Management | Book catalogue, borrow/return tracking |
| Payroll | Record and manage teacher/staff salaries |
| CBC Progress Cards | Per-student printable CBC report cards per term |
| Student Promotions | Bulk-move students between classes at end of term |
| Notifications | Send targeted push-style notifications; bell icon with unread count in header |
| Visitor Log | Track school gate visitors with sign-in/out times |
| Audit Log | Immutable record of key system actions for accountability |
| Reports | Attendance, performance, and financial overview reports |
| Student Applications | Online admission applications with status tracking |

### New Features (Session 3)

| Module | Route | Description |
|---|---|---|
| SMS Alerts | `/admin/sms` | Send SMS to parents/teachers via Africa's Talking; pre-built templates; delivery reports |
| Internal Messaging | `/admin/messages` | Staff-to-staff inbox/sent system with unread count and compose modal |
| Parent-Teacher Meetings | `/admin/meetings` | Schedule, confirm, and track PT meeting sessions |
| Disciplinary Records | `/admin/discipline` | Log warnings, suspensions, and expulsions; mark as resolved |
| Student ID Cards | `/admin/students/id-card` | Generate print-ready ID cards with barcode placeholder |
| Certificate Generator | `/admin/students/certificate` | Print A4-landscape achievement certificates (6 types + custom) |
| Alumni Tracker | `/admin/alumni` | Mark students as graduates; record graduation year and notes |
| Exam Scheduler | `/admin/exam-schedule` | Schedule exams by class/subject/term with venue; printable timetable |
| Expense Tracker | `/admin/expenses` | Record and categorise school expenditures with totals |
| Printable Fee Receipts | `/admin/fees/receipts` | Multi-select payment records and print official receipts |
| Transport Management | `/admin/transport` | Manage buses, routes, drivers, and assign students to stops |
| Health Clinic Log | `/admin/health` | Record student clinic visits, diagnosis, treatment, and referrals |
| Dark Mode | Header toggle | System-aware dark mode; persisted in localStorage (`ts-theme`) |

---

## Roles

| Role | Access |
|---|---|
| **Admin** | Full system access — all modules and settings |
| **Teacher** | Attendance, grades, homework, timetable |
| **Student** | Own grades, attendance, fees, timetable |
| **Parent** | Children's summary, calendar, homework, notifications |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL 18 + Prisma ORM 5 |
| Auth | NextAuth.js v4 (JWT, Credentials provider) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| SMS | Africa's Talking API |

---

## Local Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL (local or cloud — [Neon](https://neon.tech) / [Supabase](https://supabase.com))

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/treasure_school"

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Africa's Talking (required for SMS alerts)
AT_API_KEY="your_africastalking_api_key"
AT_USERNAME="sandbox"   # use "sandbox" for testing, your username in production
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npm run db:migrate

# Seed with sample data (15 teachers, 110 students, 22 CBC classes)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

After seeding (`npm run db:seed`):

| Role | Email | Password |
|---|---|---|
| Admin | admin@treasureschool.edu | Password@123 |
| Teacher | teacher1@treasureschool.edu | Password@123 |
| Student | student1@treasureschool.edu | Password@123 |
| Parent | parent1@treasureschool.edu | Password@123 |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx             # Public landing page
│   ├── (auth)/              # Login page
│   ├── (dashboard)/         # Role-based dashboard pages
│   │   ├── admin/           # All admin modules
│   │   ├── teacher/
│   │   ├── student/
│   │   └── parent/
│   └── api/                 # REST API routes
│       ├── students/
│       ├── teachers/
│       ├── fees/
│       ├── disciplinary/
│       ├── messages/
│       ├── ptmeetings/
│       ├── exam-schedule/
│       ├── expenses/
│       ├── transport/
│       ├── health-visits/
│       └── sms/
├── components/
│   ├── ui/                  # Button, Input, Modal, ConfirmDialog, ThemeToggle, etc.
│   ├── layout/              # Sidebar, Header, SessionProvider
│   ├── forms/               # Form components per module
│   └── dashboard/           # StatsCard, RecentAnnouncements
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client singleton
│   ├── utils.ts             # Helpers (cn, formatDate, etc.)
│   └── validations.ts       # Zod schemas
└── middleware.ts             # Route protection + role redirects
prisma/
├── schema.prisma            # Full database schema
└── seed.ts                  # Sample data
```

---

## Database Schema (Key Models)

| Model | Purpose |
|---|---|
| User | Auth accounts (Admin, Teacher, Student, Parent) |
| Student | Student profiles with CBC class, NEMIS, medical info, alumni fields |
| Teacher | Teacher profiles linked to subjects and classes |
| Parent | Parent profiles linked to multiple students |
| Class | CBC classes with level (PRE_PRIMARY → JUNIOR_SECONDARY) |
| Subject | Subjects assigned to classes and teachers |
| Attendance | Daily attendance records per student per class |
| Grade | Exam scores with CBC level auto-calculation |
| FeeStructure / FeePayment | Fee definitions and M-Pesa-tracked payments |
| DisciplinaryRecord | Student disciplinary history |
| Message | Internal staff messaging (inbox/sent) |
| PTMeeting | Parent-teacher meeting scheduling |
| ExamSchedule | Exam timetable entries |
| Expense | School expenditure records |
| Bus / StudentBus | Transport management and student-bus assignments |
| HealthVisit | Student clinic visit logs |

---

## SMS Setup (Africa's Talking)

1. Create an account at [africastalking.com](https://africastalking.com)
2. Get your **API Key** and **Username** from the dashboard
3. Add to `.env`:
   ```env
   AT_API_KEY=your_api_key
   AT_USERNAME=sandbox   # "sandbox" for testing
   ```
4. Use the **SMS Alerts** page at `/admin/sms` to send messages to parents, teachers, or custom numbers

---

## Deployment (Vercel + Neon/Supabase)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` — Neon/Supabase connection string (append `?sslmode=require`)
   - `NEXTAUTH_SECRET` — random 32-byte hex string
   - `NEXTAUTH_URL` — your Vercel deployment URL
   - `AT_API_KEY` — Africa's Talking API key
   - `AT_USERNAME` — Africa's Talking username
4. Set build command: `prisma generate && next build`
5. Deploy

---

## Customising the Brand

| Setting | File |
|---|---|
| School name | `src/app/layout.tsx` (metadata) and `src/components/layout/Sidebar.tsx` |
| Primary color | `tailwind.config.ts` → `colors.primary` |
| Logo | Replace `GraduationCap` icon in `Sidebar.tsx` with an `<Image>` |
| Landing page | `src/app/page.tsx` |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Re-generate Prisma client |
| `npm run db:push` | Push schema changes without migrations (dev only) |
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:seed` | Seed sample data (15 teachers, 110 students, 22 classes) |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:reset` | Reset database and re-run all migrations |

---

## Acknowledgements

This project was designed and built by **Edel Kiprop** ([@chepkemboiedel](https://github.com/chepkemboiedel)) with AI-assisted development powered by **[Claude](https://claude.ai)** by [Anthropic](https://anthropic.com).


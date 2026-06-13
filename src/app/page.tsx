import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

const features = [
  { icon: '🎓', title: 'CBC Grading', desc: "EE · ME · AE · BE competency levels aligned with Kenya's CBC curriculum", bg: 'bg-gradient-to-br from-violet-600 to-indigo-600', light: 'bg-violet-50 border-violet-200' },
  { icon: '💳', title: 'M-Pesa Payments', desc: 'Record fee payments with M-Pesa codes and generate instant receipts', bg: 'bg-gradient-to-br from-emerald-500 to-green-600', light: 'bg-emerald-50 border-emerald-200' },
  { icon: '👨‍👩‍👧', title: 'Parent Portal', desc: 'Parents track grades, attendance, fees, homework and events in real-time', bg: 'bg-gradient-to-br from-sky-500 to-blue-600', light: 'bg-sky-50 border-sky-200' },
  { icon: '📚', title: 'Library System', desc: 'Book inventory with issue, return and overdue tracking', bg: 'bg-gradient-to-br from-amber-500 to-orange-500', light: 'bg-amber-50 border-amber-200' },
  { icon: '💰', title: 'Payroll', desc: 'Teacher salaries with allowances, deductions and paid/pending status', bg: 'bg-gradient-to-br from-rose-500 to-pink-600', light: 'bg-rose-50 border-rose-200' },
  { icon: '📊', title: 'Analytics', desc: 'Attendance trends, CBC grade distribution and fee collection dashboards', bg: 'bg-gradient-to-br from-purple-600 to-violet-700', light: 'bg-purple-50 border-purple-200' },
  { icon: '📅', title: 'Events Calendar', desc: 'Holidays, exams, sports days and meetings across all portals', bg: 'bg-gradient-to-br from-cyan-500 to-teal-600', light: 'bg-cyan-50 border-cyan-200' },
  { icon: '📋', title: 'Homework Tracker', desc: 'Teachers post assignments; parents see due dates and overdue alerts', bg: 'bg-gradient-to-br from-teal-500 to-emerald-600', light: 'bg-teal-50 border-teal-200' },
  { icon: '🪪', title: 'NEMIS & Medical', desc: 'Store NEMIS numbers, medical conditions and allergies per learner', bg: 'bg-gradient-to-br from-blue-600 to-indigo-600', light: 'bg-blue-50 border-blue-200' },
  { icon: '🚪', title: 'Visitor Log', desc: 'Check-in / check-out with purpose, host name and duration tracking', bg: 'bg-gradient-to-br from-slate-600 to-slate-800', light: 'bg-slate-50 border-slate-200' },
  { icon: '🔍', title: 'Audit Trail', desc: 'Every action is logged with the responsible user and timestamp', bg: 'bg-gradient-to-br from-red-500 to-rose-600', light: 'bg-red-50 border-red-200' },
  { icon: '⬆️', title: 'Bulk CSV Import', desc: 'Import hundreds of students at once with auto parent account creation', bg: 'bg-gradient-to-br from-cyan-600 to-sky-600', light: 'bg-cyan-50 border-cyan-200' },
]

const stats = [
  { label: 'Modules', value: '14+', bg: 'from-violet-600 to-indigo-600', icon: '🧩' },
  { label: 'CBC Aligned', value: '100%', bg: 'from-emerald-500 to-green-600', icon: '✅' },
  { label: 'Role Portals', value: '3', bg: 'from-sky-500 to-blue-600', icon: '🚪' },
  { label: 'Kenya Ready', value: '✓', bg: 'from-red-500 to-rose-600', icon: '🇰🇪' },
]

const roles = [
  {
    role: 'Admin',
    emoji: '🏫',
    bg: 'from-violet-600 via-indigo-600 to-blue-700',
    glow: 'shadow-violet-200',
    check: 'text-violet-500',
    perks: [
      'Full student & teacher management',
      'Fee collection with M-Pesa tracking',
      'CBC printable report card generation',
      'Payroll, library & visitor management',
      'Analytics dashboard, audit log & CSV exports',
    ],
  },
  {
    role: 'Teacher',
    emoji: '👨‍🏫',
    bg: 'from-emerald-500 via-teal-500 to-cyan-600',
    glow: 'shadow-emerald-200',
    check: 'text-emerald-500',
    perks: [
      'Mark daily class attendance',
      'Record CBC competency grades',
      'Post and manage class assignments',
      'View personalised timetable',
    ],
  },
  {
    role: 'Parent',
    emoji: '👨‍👩‍👧',
    bg: 'from-sky-500 via-blue-500 to-indigo-600',
    glow: 'shadow-sky-200',
    check: 'text-sky-500',
    perks: [
      "Track child's attendance and CBC grades",
      'View fee balance and payment history',
      'See upcoming homework due dates',
      'Get school calendar and announcements',
    ],
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect(`/${session.user.role.toLowerCase()}`)

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-violet-300">
              T
            </div>
            <div className="leading-none">
              <p className="text-sm font-extrabold text-slate-900 tracking-tight">The Treasure School</p>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Management System</p>
            </div>
          </div>
          <Link
            href="/login"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-violet-200"
          >
            Login to Portal →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-24" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #1e1b4b 75%, #0f172a 100%)' }}>

        {/* Vivid blobs */}
        <div className="absolute top-10 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)' }} />
        <div className="absolute top-0 right-1/3 w-[300px] h-[300px] rounded-full blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="relative max-w-7xl mx-auto px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border text-sm font-semibold" style={{ background: 'rgba(139,92,246,0.2)', borderColor: 'rgba(139,92,246,0.4)', color: '#c4b5fd' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            🇰🇪 Kenya CBC-Aligned School ERP
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] max-w-4xl tracking-tight">
            The smarter way<br />to run{' '}
            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #f472b6, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              your school
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl max-w-2xl leading-relaxed" style={{ color: '#cbd5e1' }}>
            A complete school management platform built for Kenya's CBC curriculum —
            students, teachers, parents, fees, payroll, library, and more. All in one place.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 font-bold text-base px-8 py-4 rounded-2xl text-white transition shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}
            >
              Login to Your Portal <span>→</span>
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 font-semibold text-base px-8 py-4 rounded-2xl transition"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)' }}
            >
              Explore Features ↓
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`bg-gradient-to-br ${s.bg} rounded-2xl p-5 text-center shadow-xl`}
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-sm text-white/70 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wave ── */}
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none" style={{ marginTop: '-2px', background: '#f8fafc' }}>
        <path d="M0,40 C480,80 960,0 1440,40 L1440,0 L0,0 Z" fill="#0f172a" />
      </svg>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              Everything you need
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">Built for Kenyan schools</h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto text-lg">
              From CBC grading to M-Pesa payments — every feature designed for Kenyan classrooms.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default ${f.light}`}
              >
                <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">{f.title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Color band ── */}
      <div className="h-2" style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb, #0891b2, #059669, #d97706, #dc2626, #7c3aed)' }} />

      {/* ── Roles ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              Designed for everyone
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">One system, three portals</h2>
            <p className="mt-4 text-slate-500 text-lg">Each role gets a tailored dashboard with exactly what they need.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((r) => (
              <div key={r.role} className={`rounded-3xl overflow-hidden shadow-xl ${r.glow} hover:scale-[1.02] transition-transform duration-300`}>
                {/* Header */}
                <div className={`bg-gradient-to-br ${r.bg} px-8 py-10 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                  <div className="text-5xl mb-4 filter drop-shadow-md">{r.emoji}</div>
                  <h3 className="text-2xl font-black">{r.role} Portal</h3>
                  <p className="text-white/60 text-sm mt-1">Tailored for {r.role.toLowerCase()}s</p>
                </div>
                {/* Body */}
                <div className="p-7 bg-white">
                  <ul className="space-y-3">
                    {r.perks.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                        <span className={`mt-0.5 flex-shrink-0 font-black text-base ${r.check}`}>✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`mt-7 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${r.bg} shadow-md hover:opacity-90 transition`}
                  >
                    Login as {r.role} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-28" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 30%, #db2777 60%, #ea580c 100%)' }}>
        {/* Overlay pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: '#a78bfa' }} />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: '#fb923c' }} />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-5 py-2 text-white text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
            Ready to get started?
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
            Manage your school<br className="hidden md:block" /> the modern way
          </h2>
          <p className="mt-6 text-white/80 text-xl max-w-xl mx-auto">
            CBC-aligned, M-Pesa-ready, and built specifically for Kenyan schools.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-flex items-center gap-3 bg-white font-black text-indigo-700 px-10 py-5 rounded-2xl text-lg hover:bg-yellow-50 transition shadow-2xl"
          >
            Login to Portal →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-violet-900">
                T
              </div>
              <div className="leading-none">
                <p className="text-base font-black text-white">The Treasure School</p>
                <p className="text-xs text-slate-500 mt-0.5 tracking-wide">Management System</p>
              </div>
            </div>

            {/* Color bar */}
            <div className="flex items-center gap-2">
              {['bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500'].map((c) => (
                <span key={c} className={`w-2 h-2 rounded-full ${c}`} />
              ))}
              <span className="text-xs text-slate-500 ml-2">CBC-aligned · M-Pesa · Kenya</span>
            </div>

            <Link href="/login" className="text-sm font-bold text-violet-400 hover:text-violet-300 transition">
              Login to Portal →
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} The Treasure School Management System. Built for Kenya.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

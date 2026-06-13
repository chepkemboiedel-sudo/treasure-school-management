'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, GraduationCap, School, ClipboardList,
  BookOpen, DollarSign, Calendar, Bell, LogOut, X, Menu,
  ChevronRight, BarChart2, FileText, Library, Settings,
  Briefcase, Users2, ArrowRightCircle, CreditCard, Megaphone,
  TrendingUp, DoorOpen, ShieldCheck, Banknote, MessageSquare,
  Send, Video, ShieldAlert, Bus, Heart, TrendingDown,
  Award, Receipt, CalendarClock, Contact,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/admin/parents', label: 'Parents', icon: Users2 },
    { href: '/admin/staff', label: 'Staff', icon: Briefcase },
    { href: '/admin/classes', label: 'Classes', icon: School },
    { href: '/admin/classes?tab=subjects', label: 'Subjects', icon: Library },
    { href: '/admin/attendance', label: 'Attendance', icon: ClipboardList },
    { href: '/admin/grades', label: 'Grades', icon: BookOpen },
    { href: '/admin/fees', label: 'Fees', icon: DollarSign },
    { href: '/admin/payroll', label: 'Payroll', icon: Banknote },
    { href: '/admin/timetable', label: 'Timetable', icon: Calendar },
    { href: '/admin/calendar', label: 'School Calendar', icon: Calendar },
    { href: '/admin/homework', label: 'Homework', icon: ClipboardList },
    { href: '/admin/library', label: 'Library', icon: BookOpen },
    { href: '/admin/announcements', label: 'Announcements', icon: Bell },
    { href: '/admin/progress-cards', label: 'Progress Cards', icon: CreditCard },
    { href: '/admin/promotions', label: 'Promotions', icon: ArrowRightCircle },
    { href: '/admin/notifications', label: 'Notifications', icon: Megaphone },
    { href: '/admin/visitors', label: 'Visitors', icon: DoorOpen },
    { href: '/admin/audit', label: 'Audit Log', icon: ShieldCheck },
    { href: '/admin/discipline', label: 'Discipline', icon: ShieldAlert },
    { href: '/admin/meetings', label: 'PT Meetings', icon: Video },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/sms', label: 'SMS Alerts', icon: Send },
    { href: '/admin/exam-schedule', label: 'Exam Schedule', icon: CalendarClock },
    { href: '/admin/expenses', label: 'Expenses', icon: TrendingDown },
    { href: '/admin/transport', label: 'Transport', icon: Bus },
    { href: '/admin/health', label: 'Health Clinic', icon: Heart },
    { href: '/admin/alumni', label: 'Alumni', icon: GraduationCap },
    { href: '/admin/students/id-card', label: 'ID Cards', icon: Contact },
    { href: '/admin/students/certificate', label: 'Certificates', icon: Award },
    { href: '/admin/fees/receipts', label: 'Fee Receipts', icon: Receipt },
    { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
    { href: '/admin/applications', label: 'Applications', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  TEACHER: [
    { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/attendance', label: 'Attendance', icon: ClipboardList },
    { href: '/teacher/grades', label: 'Grades', icon: BookOpen },
    { href: '/teacher/homework', label: 'Homework', icon: FileText },
    { href: '/teacher/timetable', label: 'Timetable', icon: Calendar },
  ],
  STUDENT: [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/grades', label: 'My Grades', icon: BookOpen },
    { href: '/student/attendance', label: 'Attendance', icon: ClipboardList },
    { href: '/student/fees', label: 'Fees', icon: DollarSign },
    { href: '/student/timetable', label: 'Timetable', icon: Calendar },
  ],
  PARENT: [
    { href: '/parent', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/parent/calendar', label: 'School Calendar', icon: Calendar },
    { href: '/parent/homework', label: 'Homework', icon: FileText },
    { href: '/parent/notifications', label: 'Notifications', icon: Bell },
  ],
}

const roleStyle: Record<string, { badge: string; glow: string; active: string }> = {
  ADMIN:   { badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30', glow: 'shadow-violet-900/50', active: 'from-violet-600 to-indigo-600' },
  TEACHER: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', glow: 'shadow-emerald-900/50', active: 'from-emerald-600 to-teal-600' },
  STUDENT: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', glow: 'shadow-amber-900/50', active: 'from-amber-500 to-orange-500' },
  PARENT:  { badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30', glow: 'shadow-sky-900/50', active: 'from-sky-500 to-blue-600' },
}

function NavLink({ item, active: activeGrad, onClick }: { item: NavItem; active: string; onClick?: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const itemUrl = new URL(item.href, 'http://x')
  const itemTab = itemUrl.searchParams.get('tab')
  const currentTab = searchParams.get('tab')
  const pathMatch = pathname === itemUrl.pathname
  const isActive = itemTab
    ? pathMatch && currentTab === itemTab
    : pathMatch
      ? !currentTab
      : !itemTab && item.href !== '/admin' && item.href !== '/teacher' && item.href !== '/student' && item.href !== '/parent' && pathname.startsWith(item.href) && !currentTab
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
        isActive
          ? `bg-gradient-to-r ${activeGrad} text-white shadow-lg`
          : 'text-slate-400 hover:text-white hover:bg-white/8'
      )}
      style={isActive ? { boxShadow: '0 4px 12px rgba(0,0,0,0.3)' } : {}}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
      <span className="truncate">{item.label}</span>
      {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
    </Link>
  )
}

export default function Sidebar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = session?.user?.role ?? 'STUDENT'
  const navItems = navByRole[role] ?? []
  const name = session?.user?.name ?? 'User'
  const style = roleStyle[role] ?? roleStyle.STUDENT

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 14px rgba(124,58,237,0.5)' }}
          >
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-extrabold text-sm leading-tight tracking-tight">The Treasure</p>
            <p className="text-slate-400 text-xs tracking-wide">School System</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border', style.badge)}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
          {role.charAt(0) + role.slice(1).toLowerCase()} Portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={style.active} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-white/5 mb-2">
          <Avatar name={name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">{name}</p>
            <p className="text-slate-500 text-xs truncate mt-0.5">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-64 flex-col fixed left-0 top-0 h-screen z-30 border-r border-white/5"
        style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #1a1a2e 100%)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl shadow-lg text-white"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 h-full w-64 shadow-2xl border-r border-white/5"
            style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #1a1a2e 100%)' }}
          >
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}

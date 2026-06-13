'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import Avatar from '@/components/ui/Avatar'

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/students': 'Student Management',
  '/admin/teachers': 'Teacher Management',
  '/admin/parents': 'Parents Management',
  '/admin/staff': 'Staff Management',
  '/admin/classes': 'Class Management',
  '/admin/attendance': 'Attendance',
  '/admin/grades': 'Grades & Exams',
  '/admin/fees': 'Fee Management',
  '/admin/timetable': 'Timetable',
  '/admin/announcements': 'Announcements',
  '/admin/reports': 'Reports',
  '/admin/applications': 'Applications',
  '/admin/progress-cards': 'Progress Cards',
  '/admin/promotions': 'Promotion Management',
  '/admin/analytics': 'Analytics & Insights',
  '/admin/calendar': 'School Calendar',
  '/admin/homework': 'Homework & Assignments',
  '/admin/library': 'Library Management',
  '/admin/payroll': 'Payroll',
  '/admin/audit': 'Audit Log',
  '/admin/visitors': 'Visitor Log',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
  '/teacher': 'Dashboard',
  '/teacher/attendance': 'Mark Attendance',
  '/teacher/grades': 'Record Grades',
  '/teacher/timetable': 'My Timetable',
  '/student': 'Dashboard',
  '/student/grades': 'My Grades',
  '/student/attendance': 'My Attendance',
  '/student/fees': 'Fee Status',
  '/student/timetable': 'Timetable',
  '/parent': 'Dashboard',
  '/parent/calendar': 'School Calendar',
  '/parent/homework': 'Homework & Assignments',
  '/parent/notifications': 'Notifications',
  '/teacher/homework': 'Homework & Assignments',
  '/admin/discipline': 'Disciplinary Records',
  '/admin/meetings': 'Parent-Teacher Meetings',
  '/admin/messages': 'Internal Messages',
  '/admin/sms': 'SMS Alerts',
  '/admin/exam-schedule': 'Exam Schedule',
  '/admin/expenses': 'Expense Tracker',
  '/admin/transport': 'Transport Management',
  '/admin/health': 'Health Clinic Log',
  '/admin/alumni': 'Alumni Tracker',
  '/admin/students/id-card': 'Student ID Cards',
  '/admin/students/certificate': 'Certificate Generator',
  '/admin/fees/receipts': 'Fee Receipts',
}

// Notification pages — visiting these clears the badge
const NOTIF_PAGES = ['/admin/notifications', '/parent/notifications']

const SEEN_KEY = 'ts_notif_last_seen'

interface NotificationItem {
  id: string
  title: string
  message: string
  priority: string
  targetRole: string | null
  createdAt: string
}

const PRIORITY_DOT: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-amber-500',
  NORMAL: 'bg-blue-400',
  LOW: 'bg-slate-300',
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const title = pageTitles[pathname] ?? 'Page'
  const name = session?.user?.name ?? 'User'
  const role = session?.user?.role

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [count, setCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Calculate unseen count from a list of notifications + localStorage timestamp
  const calcCount = useCallback((all: NotificationItem[]) => {
    try {
      const lastSeen = localStorage.getItem(SEEN_KEY)
      if (!lastSeen) return all.length
      const since = new Date(lastSeen)
      return all.filter((n) => new Date(n.createdAt) > since).length
    } catch {
      return all.length
    }
  }, [])

  // Fetch notifications and derive count — called on mount and periodically
  const refresh = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const j = await res.json()
      const all: NotificationItem[] = (j.data ?? []).slice(0, 50)
      setNotifications(all.slice(0, 8))
      setCount(calcCount(all))
    } catch { /* network error — ignore */ }
  }, [session, calcCount])

  // Initial load
  useEffect(() => { refresh() }, [refresh])

  // Poll for new notifications every 2 minutes
  useEffect(() => {
    const id = setInterval(refresh, 2 * 60 * 1000)
    return () => clearInterval(id)
  }, [refresh])

  // When user lands on a notifications page, mark all as seen
  useEffect(() => {
    if (NOTIF_PAGES.includes(pathname)) {
      try { localStorage.setItem(SEEN_KEY, new Date().toISOString()) } catch { /* */ }
      setCount(0)
    }
  }, [pathname])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleBellClick = () => {
    setOpen((v) => !v)
    // Refresh list when opening so it's up to date
    if (!open) refresh()
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 60_000) return 'Just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
  }

  const goToNotifications = () => {
    setOpen(false)
    router.push(role === 'ADMIN' ? '/admin/notifications' : '/parent/notifications')
  }

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-white/60 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      <div>
        <h1
          className="text-lg font-extrabold"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        >
          {title}
        </h1>
        <p className="text-xs text-slate-400 hidden sm:block">The Treasure School Management System</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {/* Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <Bell className={`w-5 h-5 ${count > 0 ? 'text-slate-700' : 'text-slate-500'}`} />
            {count > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none pointer-events-none">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                  {count > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                      {count} new
                    </span>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">No notifications</div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map((n) => {
                    const isNew = (() => {
                      try {
                        const lastSeen = localStorage.getItem(SEEN_KEY)
                        return !lastSeen || new Date(n.createdAt) > new Date(lastSeen)
                      } catch { return false }
                    })()
                    return (
                      <div key={n.id} className={`px-4 py-3 transition ${isNew ? 'bg-blue-50 hover:bg-blue-50/80' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[n.priority] ?? 'bg-slate-300'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{formatTime(n.createdAt)}</p>
                          </div>
                          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="px-4 py-2.5 border-t border-slate-100">
                <button
                  onClick={goToNotifications}
                  className="w-full text-center text-xs text-primary-600 hover:underline font-medium"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Avatar name={name} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-tight">{name}</p>
            <p className="text-xs text-slate-400">{role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

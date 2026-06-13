'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Users, ClipboardList, BookOpen, Calendar, FileText } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentAnnouncements from '@/components/dashboard/RecentAnnouncements'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { AnnouncementRecord } from '@/types'

interface TeacherStats { classCount: number; studentCount: number; subjectCount: number; todaySlots: number }

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats?role=teacher').then((r) => r.json()),
      fetch('/api/announcements?limit=5').then((r) => r.json()),
    ]).then(([s, a]) => {
      setStats(s.data)
      setAnnouncements(a.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <PageLoader />

  const name = session?.user?.name?.split(' ')[0] ?? 'Teacher'

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #0891b2 60%, #4f46e5 100%)', boxShadow: '0 8px 32px rgba(5,150,105,0.35)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium">Good day,</p>
          <h2 className="text-3xl font-black mt-0.5">{name} 📚</h2>
          <p className="text-white/60 text-sm mt-2">Ready to inspire? Here&apos;s your day at a glance.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="My Classes" value={stats?.classCount ?? 0} icon={Users} color="indigo" />
        <StatsCard title="My Students" value={stats?.studentCount ?? 0} icon={Users} color="green" />
        <StatsCard title="Subjects" value={stats?.subjectCount ?? 0} icon={BookOpen} color="purple" />
        <StatsCard title="Periods Today" value={stats?.todaySlots ?? 0} icon={Calendar} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAnnouncements announcements={announcements} />

        {/* Quick actions */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-900 mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { href: '/teacher/attendance', label: 'Mark Attendance', icon: ClipboardList, gradient: 'from-blue-500 to-cyan-600', glow: 'rgba(59,130,246,0.3)' },
              { href: '/teacher/grades', label: 'Record Grades', icon: BookOpen, gradient: 'from-emerald-500 to-green-600', glow: 'rgba(16,185,129,0.3)' },
              { href: '/teacher/homework', label: 'Post Homework', icon: FileText, gradient: 'from-violet-600 to-indigo-600', glow: 'rgba(124,58,237,0.3)' },
              { href: '/teacher/timetable', label: 'My Timetable', icon: Calendar, gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.3)' },
            ].map(({ href, label, icon: Icon, gradient, glow }) => (
              <a
                key={href}
                href={href}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl text-white bg-gradient-to-br ${gradient} hover:scale-105 transition-transform shadow-lg`}
                style={{ boxShadow: `0 6px 20px ${glow}` }}
              >
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-center leading-tight">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

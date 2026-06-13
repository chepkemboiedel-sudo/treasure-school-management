'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ClipboardList, DollarSign, Calendar } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentAnnouncements from '@/components/dashboard/RecentAnnouncements'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { AnnouncementRecord } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface StudentStats { attendanceRate: number; avgGrade: string; pendingFees: number; subjectCount: number }

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats?role=student').then((r) => r.json()),
      fetch('/api/announcements?limit=5').then((r) => r.json()),
    ]).then(([s, a]) => {
      setStats(s.data)
      setAnnouncements(a.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Attendance Rate" value={`${stats?.attendanceRate ?? 0}%`} icon={ClipboardList} color="green" />
        <StatsCard title="Average Grade" value={stats?.avgGrade ?? '—'} icon={BookOpen} color="blue" />
        <StatsCard title="Pending Fees" value={formatCurrency(stats?.pendingFees ?? 0)} icon={DollarSign} color="amber" />
        <StatsCard title="Subjects" value={stats?.subjectCount ?? 0} icon={Calendar} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAnnouncements announcements={announcements} />
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/student/grades', label: 'My Grades', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
              { href: '/student/attendance', label: 'Attendance', icon: ClipboardList, color: 'bg-green-50 text-green-600' },
              { href: '/student/fees', label: 'Fee Status', icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
              { href: '/student/timetable', label: 'Timetable', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
            ].map(({ href, label, icon: Icon, color }) => (
              <a key={href} href={href} className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
                <span className="text-xs font-medium text-slate-700">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

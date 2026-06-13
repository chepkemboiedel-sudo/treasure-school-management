'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Users, GraduationCap, School, DollarSign, ClipboardList, TrendingUp } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentAnnouncements from '@/components/dashboard/RecentAnnouncements'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { DashboardStats, AnnouncementRecord } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const attendanceData = [
  { day: 'Mon', rate: 92 }, { day: 'Tue', rate: 88 },
  { day: 'Wed', rate: 95 }, { day: 'Thu', rate: 90 },
  { day: 'Fri', rate: 85 },
]

const barColors = ['#7c3aed', '#4f46e5', '#2563eb', '#0891b2', '#059669']

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.json()),
      fetch('/api/announcements?limit=5').then((r) => r.json()),
    ]).then(([s, a]) => {
      setStats(s.data)
      setAnnouncements(a.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <PageLoader />

  const name = session?.user?.name?.split(' ')[0] ?? 'Admin'

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #db2777 100%)', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)', transform: 'translateY(50%)' }} />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium">Welcome back,</p>
          <h2 className="text-3xl font-black mt-0.5">{name} 👋</h2>
          <p className="text-white/60 text-sm mt-2">Here&apos;s what&apos;s happening at The Treasure School today.</p>
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{stats?.totalStudents ?? 0}</p>
              <p className="text-xs text-white/70">Students</p>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{stats?.totalTeachers ?? 0}</p>
              <p className="text-xs text-white/70">Teachers</p>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black">{stats?.todayAttendanceRate ?? 0}%</p>
              <p className="text-xs text-white/70">Attendance Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="xl:col-span-1">
          <StatsCard title="Students" value={stats?.totalStudents ?? 0} icon={Users} color="indigo" />
        </div>
        <div className="xl:col-span-1">
          <StatsCard title="Teachers" value={stats?.totalTeachers ?? 0} icon={GraduationCap} color="green" />
        </div>
        <div className="xl:col-span-1">
          <StatsCard title="Classes" value={stats?.totalClasses ?? 0} icon={School} color="purple" />
        </div>
        <div className="xl:col-span-1">
          <StatsCard title="Fees Collected" value={formatCurrency(stats?.totalFeesCollected ?? 0)} subtitle="Current term" icon={DollarSign} color="blue" />
        </div>
        <div className="xl:col-span-1">
          <StatsCard title="Pending Fees" value={formatCurrency(stats?.pendingFees ?? 0)} icon={TrendingUp} color="amber" />
        </div>
        <div className="xl:col-span-1">
          <StatsCard title="Attendance" value={`${stats?.todayAttendanceRate ?? 0}%`} icon={ClipboardList} color="red" />
        </div>
      </div>

      {/* Chart + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-extrabold text-slate-900">Attendance This Week</h3>
              <p className="text-sm text-slate-400 mt-0.5">Daily attendance rate</p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}
            >
              This Week
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" width={36} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12, fontWeight: 600 }}
                formatter={(v) => [`${v}%`, 'Attendance']}
                cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 8 }}
              />
              <Bar
                dataKey="rate"
                radius={[8, 8, 0, 0]}
                fill="url(#barGrad)"
              />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Announcements */}
        <div className="lg:col-span-2">
          <RecentAnnouncements announcements={announcements} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-6 shadow-sm">
        <h3 className="font-extrabold text-slate-900 mb-5">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/admin/students', label: 'Add Student', icon: Users, gradient: 'from-violet-600 to-indigo-600', glow: 'rgba(124,58,237,0.3)' },
            { href: '/admin/fees', label: 'Record Payment', icon: DollarSign, gradient: 'from-emerald-500 to-green-600', glow: 'rgba(16,185,129,0.3)' },
            { href: '/admin/attendance', label: 'Attendance', icon: ClipboardList, gradient: 'from-sky-500 to-blue-600', glow: 'rgba(14,165,233,0.3)' },
            { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp, gradient: 'from-rose-500 to-pink-600', glow: 'rgba(239,68,68,0.3)' },
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
  )
}

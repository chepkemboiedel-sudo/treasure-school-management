'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Users, BookOpen, DollarSign, ClipboardList, ChevronRight, Calendar, FileText } from 'lucide-react'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import Avatar from '@/components/ui/Avatar'
import RecentAnnouncements from '@/components/dashboard/RecentAnnouncements'
import { AnnouncementRecord } from '@/types'
import { formatCurrency } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'

interface ChildSummary {
  id: string; name: string; studentId: string; className: string | null
  attendanceRate: number; lastGrade: string | null; pendingFees: number
}

const GRADE_GRADIENT: Record<string, string> = {
  EE: 'from-emerald-500 to-green-600',
  ME: 'from-blue-500 to-cyan-600',
  AE: 'from-amber-500 to-orange-500',
  BE: 'from-red-500 to-rose-600',
}

const childGradients = [
  'from-violet-600 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-rose-500 to-pink-600',
]

export default function ParentDashboard() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats?role=parent').then((r) => r.json()),
      fetch('/api/announcements?limit=5').then((r) => r.json()),
    ]).then(([s, a]) => {
      setChildren(s.data?.children ?? [])
      setAnnouncements(a.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <PageLoader />

  const name = session?.user?.name?.split(' ')[0] ?? 'Parent'

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 50%, #7c3aed 100%)', boxShadow: '0 8px 32px rgba(37,99,235,0.35)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium">Welcome back,</p>
          <h2 className="text-3xl font-black mt-0.5">{name} 👨‍👩‍👧</h2>
          <p className="text-white/60 text-sm mt-2">
            {children.length > 0
              ? `Tracking ${children.length} child${children.length > 1 ? 'ren' : ''} at The Treasure School.`
              : 'Contact the school to link your children to your account.'}
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No children linked to your account"
          description="Contact the school administrator to link your child(ren) to your parent account."
        />
      ) : (
        <>
          {/* Children cards */}
          <div>
            <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full inline-block" style={{ background: 'linear-gradient(to bottom, #7c3aed, #4f46e5)' }} />
              My Children
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {children.map((child, i) => {
                const grad = childGradients[i % childGradients.length]
                return (
                  <Link
                    key={child.id}
                    href={`/parent/children/${child.id}`}
                    className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
                  >
                    {/* Card header */}
                    <div className={`bg-gradient-to-r ${grad} px-5 py-4 flex items-center gap-3 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(20%,-20%)' }} />
                      <Avatar name={child.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-white text-base leading-tight">{child.name}</p>
                        <p className="text-white/70 text-xs mt-0.5">
                          {child.studentId}{child.className ? ` · ${child.className}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition" />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 p-4">
                      <div className="text-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <ClipboardList className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-lg font-black text-emerald-700">{child.attendanceRate}%</p>
                        <p className="text-[11px] text-emerald-600 font-medium">Attendance</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <BookOpen className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        {child.lastGrade ? (
                          <p className={`text-lg font-black bg-gradient-to-r ${GRADE_GRADIENT[child.lastGrade] ?? 'from-slate-500 to-slate-600'} bg-clip-text text-transparent`}>
                            {child.lastGrade}
                          </p>
                        ) : (
                          <p className="text-lg font-black text-slate-300">—</p>
                        )}
                        <p className="text-[11px] text-blue-600 font-medium">CBC Grade</p>
                      </div>
                      <div className={`text-center p-3 rounded-xl border ${child.pendingFees > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <DollarSign className={`w-4 h-4 mx-auto mb-1 ${child.pendingFees > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                        <p className={`text-sm font-black leading-tight ${child.pendingFees > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                          {child.pendingFees > 0 ? formatCurrency(child.pendingFees) : 'Clear'}
                        </p>
                        <p className={`text-[11px] font-medium ${child.pendingFees > 0 ? 'text-red-600' : 'text-slate-400'}`}>Fees</p>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <span className="text-xs font-bold text-indigo-600 group-hover:underline">View full progress →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { href: '/parent/calendar', label: 'School Calendar', icon: Calendar, gradient: 'from-sky-500 to-blue-600', glow: 'rgba(14,165,233,0.3)' },
              { href: '/parent/homework', label: 'Homework', icon: FileText, gradient: 'from-violet-600 to-indigo-600', glow: 'rgba(124,58,237,0.3)' },
              { href: '/parent/notifications', label: 'Notifications', icon: ClipboardList, gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.3)' },
              { href: children[0] ? `/parent/children/${children[0].id}?tab=fees` : '#', label: 'Fee Status', icon: DollarSign, gradient: 'from-emerald-500 to-green-600', glow: 'rgba(16,185,129,0.3)' },
            ].map(({ href, label, icon: Icon, gradient, glow }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl text-white bg-gradient-to-br ${gradient} hover:scale-105 transition-transform shadow-lg`}
                style={{ boxShadow: `0 6px 20px ${glow}` }}
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <RecentAnnouncements announcements={announcements} />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Users, GraduationCap, UserCheck, Briefcase, TrendingUp, DollarSign } from 'lucide-react'

interface AnalyticsData {
  summary: { totalStudents: number; totalTeachers: number; totalParents: number; totalStaff: number }
  attendanceTrend: { date: string; rate: number }[]
  gradeDistribution: { EE: number; ME: number; AE: number; BE: number }
  feeCollection: { collected: number; outstanding: number }
  studentsByLevel: { PRE_PRIMARY: number; LOWER_PRIMARY: number; UPPER_PRIMARY: number; JUNIOR_SECONDARY: number }
}

const LEVEL_LABEL: Record<string, string> = {
  PRE_PRIMARY: 'Pre-Primary', LOWER_PRIMARY: 'Lower Primary',
  UPPER_PRIMARY: 'Upper Primary', JUNIOR_SECONDARY: 'Junior Secondary',
}
const LEVEL_COLOR: Record<string, string> = {
  PRE_PRIMARY: 'bg-purple-500', LOWER_PRIMARY: 'bg-blue-500',
  UPPER_PRIMARY: 'bg-teal-500', JUNIOR_SECONDARY: 'bg-amber-500',
}
const GRADE_COLOR: Record<string, string> = { EE: 'bg-green-500', ME: 'bg-blue-500', AE: 'bg-amber-500', BE: 'bg-red-500' }
const GRADE_LABEL: Record<string, string> = { EE: 'Exceeding Expectation', ME: 'Meeting Expectation', AE: 'Approaching Expectation', BE: 'Below Expectation' }

function formatKES(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then((r) => r.json()).then((j) => { setData(j); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading analytics…</div>
  if (!data) return <div className="text-red-500">Failed to load analytics.</div>

  const { summary, attendanceTrend, gradeDistribution, feeCollection, studentsByLevel } = data
  const totalGrades = Object.values(gradeDistribution).reduce((a, b) => a + b, 0)
  const totalStudentsByLevel = Object.values(studentsByLevel).reduce((a, b) => a + b, 0)
  const totalFees = feeCollection.collected + feeCollection.outstanding
  const collectionRate = totalFees > 0 ? Math.round((feeCollection.collected / totalFees) * 100) : 0
  const maxAttendanceRate = Math.max(...attendanceTrend.map((t) => t.rate), 1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-600" /> Analytics &amp; Insights
        </h1>
        <p className="text-slate-500 text-sm mt-1">School-wide statistics and performance overview</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: summary.totalStudents, icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
          { label: 'Teachers', value: summary.totalTeachers, icon: UserCheck, color: 'text-green-600 bg-green-50' },
          { label: 'Parents', value: summary.totalParents, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Staff', value: summary.totalStaff, icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
            <p className="text-sm text-slate-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Attendance Rate — Last 14 Days</h2>
          {attendanceTrend.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No attendance data yet</p>
          ) : (
            <div className="space-y-2">
              {attendanceTrend.map((t) => (
                <div key={t.date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20 flex-shrink-0">
                    {new Date(t.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(t.rate / maxAttendanceRate) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700 w-10 text-right">{t.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CBC Grade Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">CBC Grade Distribution</h2>
          {totalGrades === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No grades recorded yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(gradeDistribution).map(([grade, count]) => (
                <div key={grade}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{grade} — <span className="text-slate-500 font-normal">{GRADE_LABEL[grade]}</span></span>
                    <span className="text-slate-600">{count} ({totalGrades > 0 ? Math.round((count / totalGrades) * 100) : 0}%)</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${GRADE_COLOR[grade]} transition-all`}
                      style={{ width: `${totalGrades > 0 ? (count / totalGrades) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fee Collection */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" /> Fee Collection
          </h2>
          <p className="text-xs text-slate-400 mb-5">All-time totals from recorded payments</p>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="text-xs text-green-700 mb-1">Collected</p>
              <p className="text-xl font-bold text-green-800">{formatKES(feeCollection.collected)}</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-xs text-red-700 mb-1">Outstanding</p>
              <p className="text-xl font-bold text-red-800">{formatKES(feeCollection.outstanding)}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Collection rate</span>
              <span>{collectionRate}%</span>
            </div>
            <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </div>

        {/* Students by CBC Level */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Enrolment by CBC Level</h2>
          {totalStudentsByLevel === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No students assigned to classes yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(studentsByLevel).map(([level, count]) => (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{LEVEL_LABEL[level]}</span>
                    <span className="font-medium text-slate-800">{count} students</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${LEVEL_COLOR[level]} transition-all`}
                      style={{ width: `${totalStudentsByLevel > 0 ? (count / totalStudentsByLevel) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

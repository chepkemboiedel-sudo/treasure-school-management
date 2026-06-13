'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, BarChart2, BookOpen, ClipboardList, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { CLASS_LEVEL_LABEL } from '@/lib/cbc'
import type { ClassLevel } from '@/lib/cbc'

type Tab = 'attendance' | 'performance' | 'classes' | 'alerts'

interface ClassOption { id: string; name: string }
interface ExamOption { id: string; name: string; class: { name: string } }
interface AttendanceRow { studentId: string; name: string; present: number; absent: number; late: number; excused: number; total: number; rate: number; absentRate: number; alert: boolean }
interface PerformanceRow { name: string; code: string; EE: number; ME: number; AE: number; BE: number; count: number; avgMarks: number }
interface ClassRow { id: string; name: string; section: string | null; level: ClassLevel; studentCount: number; subjectCount: number; classTeacher: string | null; attendanceRate: number | null }
interface AlertRow { studentId: string; name: string; className: string; absentRate: number; daysAbsent: number; totalDays: number; parentContacts: { name: string; email: string }[]; classTeacher: { name: string; email: string } | null }

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('alerts')
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [exams, setExams] = useState<ExamOption[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceRow[]>([])
  const [classData, setClassData] = useState<ClassRow[]>([])
  const [alertData, setAlertData] = useState<AlertRow[]>([])
  const [alertsLoaded, setAlertsLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/classes?simple=true').then((r) => r.json()),
      fetch('/api/grades?type=exams').then((r) => r.json()),
    ]).then(([cd, ed]) => {
      setClasses(cd.data ?? [])
      setExams(ed.data ?? [])
    })
  }, [])

  // Auto-load alerts and class overview on mount
  useEffect(() => {
    fetch('/api/reports?type=alerts').then((r) => r.json()).then((d) => {
      setAlertData(d.data ?? [])
      setAlertsLoaded(true)
    })
    fetch('/api/reports?type=classes').then((r) => r.json()).then((d) => setClassData(d.data ?? []))
  }, [])

  const runAttendance = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ type: 'attendance' })
    if (selectedClass) params.set('classId', selectedClass)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    const r = await fetch(`/api/reports?${params}`)
    const d = await r.json()
    setAttendanceData(d.data ?? [])
    setLoading(false)
  }, [selectedClass, dateFrom, dateTo])

  const runPerformance = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ type: 'performance' })
    if (selectedClass) params.set('classId', selectedClass)
    if (selectedExam) params.set('examId', selectedExam)
    const r = await fetch(`/api/reports?${params}`)
    const d = await r.json()
    setPerformanceData(d.data ?? [])
    setLoading(false)
  }, [selectedClass, selectedExam])

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'alerts', label: 'Attendance Alerts', icon: <AlertTriangle className="w-4 h-4" />, badge: alertsLoaded ? alertData.length : undefined },
    { key: 'attendance', label: 'Attendance Report', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'performance', label: 'Performance Report', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'classes', label: 'Class Overview', icon: <Users className="w-4 h-4" /> },
  ]

  const gradeColor = (g: string) => g === 'EE' ? 'bg-green-100 text-green-800' : g === 'ME' ? 'bg-blue-100 text-blue-800' : g === 'AE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary-600" /> Reports & Analytics
        </h1>
        <p className="text-slate-500 text-sm mt-1">School-wide performance, attendance, and alerts</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.icon}{t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{t.badge}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Alerts Tab ── */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Learners Missing ≥ 80% of Sessions</p>
              <p className="text-sm text-red-600 mt-0.5">Contact the parent and class teacher immediately. These learners are at risk of being deregistered per CBC attendance policy.</p>
            </div>
          </div>

          {!alertsLoaded ? <PageLoader /> : alertData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No learners currently below the 80% attendance threshold.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertData.map((a) => (
                <div key={a.studentId} className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{a.name} <span className="text-slate-400 text-sm font-normal">({a.studentId})</span></p>
                      <p className="text-sm text-slate-500">Class: {a.className}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{a.absentRate}%</p>
                      <p className="text-xs text-slate-500">absent rate</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">Absent {a.daysAbsent} out of {a.totalDays} recorded days</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {a.parentContacts.length > 0 && (
                      <div className="bg-amber-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Parent / Guardian</p>
                        {a.parentContacts.map((p, i) => (
                          <p key={i} className="text-sm text-amber-900">{p.name} — <a href={`mailto:${p.email}`} className="underline">{p.email}</a></p>
                        ))}
                      </div>
                    )}
                    {a.classTeacher && (
                      <div className="bg-blue-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Class Teacher</p>
                        <p className="text-sm text-blue-900">{a.classTeacher.name} — <a href={`mailto:${a.classTeacher.email}`} className="underline">{a.classTeacher.email}</a></p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Attendance Report Tab ── */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <Button onClick={runAttendance} loading={loading} size="sm">Generate</Button>
          </div>

          {attendanceData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Learner', 'ID', 'Present', 'Absent', 'Late', 'Excused', 'Attendance Rate', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData.map((r) => (
                    <tr key={r.studentId} className={r.alert ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                      <td className="px-4 py-3 text-slate-500">{r.studentId}</td>
                      <td className="px-4 py-3 text-green-700">{r.present}</td>
                      <td className="px-4 py-3 text-red-600">{r.absent}</td>
                      <td className="px-4 py-3 text-yellow-600">{r.late}</td>
                      <td className="px-4 py-3 text-slate-500">{r.excused}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${r.rate >= 80 ? 'text-green-700' : r.rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{r.rate}%</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.alert ? <Badge variant="red">⚠ Alert</Badge> : <Badge variant="green">OK</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Performance Report Tab ── */}
      {tab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">Assessment</label>
              <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All assessments</option>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.class.name})</option>)}
              </select>
            </div>
            <Button onClick={runPerformance} loading={loading} size="sm">Generate</Button>
          </div>

          {performanceData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Learning Area', 'Code', 'EE', 'ME', 'AE', 'BE', 'Learners', 'Avg Marks'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {performanceData.map((r) => (
                    <tr key={r.code}>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.code}</td>
                      {(['EE', 'ME', 'AE', 'BE'] as const).map((g) => (
                        <td key={g} className="px-4 py-3">
                          {r[g] > 0 ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${gradeColor(g)}`}>{r[g]}</span> : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-slate-600">{r.count}</td>
                      <td className="px-4 py-3 font-medium">{r.avgMarks}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Class Overview Tab ── */}
      {tab === 'classes' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Class', 'Level', 'Class Teacher', 'Learners', 'Subjects', 'Attendance Rate'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classData.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}{c.section ? ` ${c.section}` : ''}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{CLASS_LEVEL_LABEL[c.level]}</td>
                  <td className="px-4 py-3 text-slate-600">{c.classTeacher ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-900">{c.studentCount}</td>
                  <td className="px-4 py-3 text-slate-900">{c.subjectCount}</td>
                  <td className="px-4 py-3">
                    {c.attendanceRate === null ? <span className="text-slate-400">No data</span> : (
                      <span className={`font-medium ${c.attendanceRate >= 80 ? 'text-green-700' : c.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{c.attendanceRate}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

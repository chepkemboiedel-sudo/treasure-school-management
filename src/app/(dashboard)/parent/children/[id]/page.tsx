'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, BookOpen, ClipboardList, DollarSign,
  CheckCircle2, XCircle, Clock, AlertCircle, Printer,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'

interface GradeRow {
  id: string
  marks: number
  grade: string | null
  remarks: string | null
  subject: { name: string; code: string }
  exam: {
    id: string; name: string; examType: string; totalMarks: number
    term: { name: string; academicYear: { name: string } }
  }
}

interface AttendanceRow {
  id: string; status: string; date: string; note: string | null
  class: { name: string; section: string | null }
}

interface FeeRow {
  id: string; amount: string; paymentDate: string; receiptNumber: string
  paymentMethod: string; status: string; notes: string | null
  feeStructure: { name: string; feeType: string; amount: string }
}

interface ChildData {
  student: {
    id: string; name: string; studentId: string; dob: string | null
    photo: string | null; bloodGroup: string | null; address: string | null
    guardianName: string; guardianPhone: string
    class: { id: string; name: string; section: string | null; level: string; classTeacher: { name: string; phone: string | null } | null } | null
  }
  gradesByExam: Record<string, { exam: GradeRow['exam']; grades: GradeRow[] }>
  attendance: AttendanceRow[]
  attendanceSummary: { total: number; present: number; absent: number; late: number; attendanceRate: number }
  feePayments: FeeRow[]
}

const CBC_GRADE = (marks: number, total: number) => {
  const pct = (marks / total) * 100
  if (pct >= 80) return { label: 'EE', color: 'text-emerald-700 bg-emerald-50' }
  if (pct >= 60) return { label: 'ME', color: 'text-blue-700 bg-blue-50' }
  if (pct >= 40) return { label: 'AE', color: 'text-amber-700 bg-amber-50' }
  return { label: 'BE', color: 'text-red-700 bg-red-50' }
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PRESENT: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  ABSENT: <XCircle className="w-4 h-4 text-red-500" />,
  LATE: <Clock className="w-4 h-4 text-amber-500" />,
  EXCUSED: <AlertCircle className="w-4 h-4 text-blue-500" />,
}

const STATUS_BADGE: Record<string, 'green' | 'red' | 'yellow' | 'blue'> = {
  PRESENT: 'green', ABSENT: 'red', LATE: 'yellow', EXCUSED: 'blue',
}

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as 'progress' | 'attendance' | 'fees') ?? 'progress'
  const [data, setData] = useState<ChildData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'progress' | 'attendance' | 'fees'>(initialTab)

  useEffect(() => {
    fetch(`/api/parent/children/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j.data ?? null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Child not found or you do not have access.</p>
      <button onClick={() => router.back()} className="mt-4 text-primary-600 hover:underline text-sm">← Go back</button>
    </div>
  )

  const { student, gradesByExam, attendance, attendanceSummary, feePayments } = data
  const examGroups = Object.values(gradesByExam)

  const overallAvg = examGroups.length > 0
    ? examGroups.flatMap((g) => g.grades).reduce((s, g) => s + (g.marks / g.exam.totalMarks) * 100, 0) /
      examGroups.flatMap((g) => g.grades).length
    : null

  const totalFeesPaid = feePayments.filter((f) => f.status === 'PAID').reduce((s, f) => s + Number(f.amount), 0)
  const totalFeesPending = feePayments.filter((f) => f.status !== 'PAID').reduce((s, f) => s + Number(f.amount), 0)

  return (
    <div className="space-y-6">
      {/* Back + student header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <Avatar name={student.name} photo={student.photo ?? undefined} size="lg" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
              <p className="text-slate-500 text-sm mt-0.5">
                ID: <span className="font-mono">{student.studentId}</span>
                {student.class && (
                  <> · Class: <strong>{student.class.name}{student.class.section ? ` ${student.class.section}` : ''}</strong></>
                )}
              </p>
              {student.class?.classTeacher && (
                <p className="text-xs text-slate-400 mt-1">
                  Class Teacher: {student.class.classTeacher.name}
                  {student.class.classTeacher.phone && ` · ${student.class.classTeacher.phone}`}
                </p>
              )}
            </div>
            {/* Quick stats */}
            <div className="hidden sm:flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{attendanceSummary.attendanceRate}%</p>
                <p className="text-xs text-slate-500">Attendance</p>
              </div>
              {overallAvg !== null && (
                <div className="text-center">
                  <p className={`text-2xl font-bold ${CBC_GRADE(overallAvg, 100).color.split(' ')[0]}`}>
                    {CBC_GRADE(overallAvg, 100).label}
                  </p>
                  <p className="text-xs text-slate-500">Overall Grade</p>
                </div>
              )}
              {totalFeesPending > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalFeesPending)}</p>
                  <p className="text-xs text-slate-500">Pending Fees</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          ['progress', 'Progress Card', BookOpen],
          ['attendance', 'Attendance', ClipboardList],
          ['fees', 'Fees', DollarSign],
        ] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Progress Card Tab */}
      {tab === 'progress' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Academic Progress — CBC Report Card</h3>
            <button onClick={() => window.print()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>

          {/* CBC key */}
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-xs">
            <span className="text-slate-500 font-medium">Grades:</span>
            {[['EE', 'text-emerald-700 bg-emerald-50', '≥80%'], ['ME', 'text-blue-700 bg-blue-50', '60–79%'], ['AE', 'text-amber-700 bg-amber-50', '40–59%'], ['BE', 'text-red-700 bg-red-50', '<40%']].map(([g, c, r]) => (
              <span key={g} className={`px-2 py-0.5 rounded-full font-semibold ${c}`}>{g} <span className="font-normal opacity-70">({r})</span></span>
            ))}
          </div>

          {examGroups.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">No grades recorded yet for this student.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {examGroups.map((group) => {
                const avg = group.grades.length > 0
                  ? group.grades.reduce((s, g) => s + (g.marks / g.exam.totalMarks) * 100, 0) / group.grades.length
                  : null
                return (
                  <div key={group.exam.id} className="px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{group.exam.name}</h4>
                        <p className="text-xs text-slate-400">{group.exam.term.name} · {group.exam.term.academicYear.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={group.exam.examType === 'SUMMATIVE' ? 'blue' : 'green'}>{group.exam.examType}</Badge>
                        {avg !== null && (
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${CBC_GRADE(avg, 100).color}`}>
                            {avg.toFixed(1)}% · {CBC_GRADE(avg, 100).label}
                          </span>
                        )}
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          <th className="text-left pb-2 font-medium">Subject</th>
                          <th className="text-center pb-2 font-medium">Marks</th>
                          <th className="text-center pb-2 font-medium">Total</th>
                          <th className="text-center pb-2 font-medium">%</th>
                          <th className="text-center pb-2 font-medium">Grade</th>
                          <th className="text-left pb-2 font-medium">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {group.grades.map((g) => {
                          const pct = (g.marks / g.exam.totalMarks) * 100
                          const { label, color } = CBC_GRADE(g.marks, g.exam.totalMarks)
                          return (
                            <tr key={g.id} className="hover:bg-slate-50">
                              <td className="py-2 text-slate-700 font-medium">{g.subject.name}</td>
                              <td className="py-2 text-center font-bold text-slate-800">{g.marks}</td>
                              <td className="py-2 text-center text-slate-400">{g.exam.totalMarks}</td>
                              <td className="py-2 text-center text-slate-600">{pct.toFixed(1)}%</td>
                              <td className="py-2 text-center">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                              </td>
                              <td className="py-2 text-slate-400 text-xs">{g.remarks ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present', count: attendanceSummary.present, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Absent', count: attendanceSummary.absent, color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Late', count: attendanceSummary.late, color: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Rate', count: `${attendanceSummary.attendanceRate}%`, color: 'text-blue-700', bg: 'bg-blue-50' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className={`text-xs font-medium ${s.color} opacity-75 mt-0.5`}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Attendance Record <span className="text-slate-400 font-normal text-sm">(last 90 days)</span></h3>
            </div>
            {attendance.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400 text-sm">No attendance records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3 text-left font-medium">Date</th>
                      <th className="px-5 py-3 text-left font-medium">Class</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3 text-left font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-700">{formatDate(a.date)}</td>
                        <td className="px-5 py-3 text-slate-500">{a.class.name}{a.class.section ? ` ${a.class.section}` : ''}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {STATUS_ICON[a.status]}
                            <Badge variant={STATUS_BADGE[a.status] ?? 'blue'}>
                              {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-400 text-xs">{a.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {tab === 'fees' && (
        <div className="space-y-4">
          {/* Fee summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalFeesPaid)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Pending / Unpaid</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(totalFeesPending)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Fee Payment History</h3>
            </div>
            {feePayments.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-400 text-sm">No fee records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3 text-left font-medium">Fee Type</th>
                      <th className="px-5 py-3 text-left font-medium">Amount Paid</th>
                      <th className="px-5 py-3 text-left font-medium">Date</th>
                      <th className="px-5 py-3 text-left font-medium">Receipt</th>
                      <th className="px-5 py-3 text-left font-medium">Method</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {feePayments.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800">{f.feeStructure.name}</p>
                          <p className="text-xs text-slate-400">{f.feeStructure.feeType}</p>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">{formatCurrency(Number(f.amount))}</td>
                        <td className="px-5 py-3 text-slate-500">{formatDate(f.paymentDate)}</td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{f.receiptNumber}</td>
                        <td className="px-5 py-3 text-slate-500 capitalize">{f.paymentMethod.toLowerCase()}</td>
                        <td className="px-5 py-3">
                          <Badge variant={f.status === 'PAID' ? 'green' : f.status === 'PARTIAL' ? 'yellow' : 'red'}>
                            {f.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

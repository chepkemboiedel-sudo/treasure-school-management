'use client'

import { useEffect, useState } from 'react'
import { Printer, Search, FileText, TrendingUp, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'

interface StudentOption {
  id: string
  name: string
  studentId: string
  class: { name: string; section: string | null } | null
}

interface GradeRow {
  id: string
  marks: number
  grade: string | null
  remarks: string | null
  subject: { name: string; code: string }
  exam: {
    name: string
    examType: string
    totalMarks: number
    term: { name: string; academicYear: { name: string } }
  }
}

interface ExamGroup {
  exam: GradeRow['exam']
  grades: GradeRow[]
}

interface ProgressData {
  student: {
    id: string
    name: string
    studentId: string
    dob: string | null
    photo: string | null
    guardianName: string
    class: { name: string; section: string | null; level: string } | null
  }
  gradesByExam: Record<string, ExamGroup>
  exams: { id: string; name: string; examType: string; term: { name: string } }[]
}

const CBC_GRADE = (marks: number, total: number): { label: string; color: string } => {
  const pct = (marks / total) * 100
  if (pct >= 80) return { label: 'EE', color: 'text-emerald-700 bg-emerald-50' }
  if (pct >= 60) return { label: 'ME', color: 'text-blue-700 bg-blue-50' }
  if (pct >= 40) return { label: 'AE', color: 'text-amber-700 bg-amber-50' }
  return { label: 'BE', color: 'text-red-700 bg-red-50' }
}

export default function ProgressCardsPage() {
  const [students, setStudents] = useState<StudentOption[]>([])
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/students?all=true')
      .then((r) => r.json())
      .then((j) => setStudents(j.data ?? []))
      .finally(() => setStudentsLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedStudent) { setData(null); return }
    setLoading(true)
    const url = `/api/progress-cards?studentId=${selectedStudent}${selectedExam ? `&examId=${selectedExam}` : ''}`
    fetch(url)
      .then((r) => r.json())
      .then((j) => setData(j.data ?? null))
      .finally(() => setLoading(false))
  }, [selectedStudent, selectedExam])

  const filtered = search
    ? students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase()))
    : students

  const handlePrint = () => window.print()

  const exportCSV = () => {
    if (!data) return
    const rows: string[][] = [['Student', 'ID', 'Class', 'Guardian', 'Exam', 'Term', 'Subject', 'Marks', 'Out Of', 'Percentage', 'CBC Grade', 'Remarks']]
    for (const group of examGroups) {
      for (const g of group.grades) {
        const pct = ((g.marks / g.exam.totalMarks) * 100).toFixed(1)
        rows.push([data.student.name, data.student.studentId, data.student.class ? `${data.student.class.name}${data.student.class.section ? ` ${data.student.class.section}` : ''}` : '', data.student.guardianName, group.exam.name, group.exam.term.name, g.subject.name, String(g.marks), String(g.exam.totalMarks), pct, CBC_GRADE(g.marks, g.exam.totalMarks).label, g.remarks ?? ''])
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${data.student.name}_report_card.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const examGroups = data ? Object.values(data.gradesByExam) : []
  const overallAvg = examGroups.length > 0
    ? examGroups.flatMap((g) => g.grades).reduce((sum, g) => sum + (g.marks / g.exam.totalMarks) * 100, 0) / examGroups.flatMap((g) => g.grades).length
    : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student picker */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 lg:col-span-1">
          <h3 className="font-semibold text-slate-800">Select Student</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student…" className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {studentsLoading ? <PageLoader /> : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStudent(s.id); setSelectedExam('') }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition rounded-lg ${selectedStudent === s.id ? 'bg-primary-50 text-primary-700' : ''}`}
                >
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.studentId} · {s.class ? `${s.class.name}${s.class.section ? ` ${s.class.section}` : ''}` : 'Unassigned'}</p>
                </button>
              ))}
            </div>
          )}

          {data && data.exams.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All exams</option>
                {data.exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.term.name})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Progress card */}
        <div className="lg:col-span-2">
          {!selectedStudent && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">Select a student to view their progress card</p>
            </div>
          )}

          {selectedStudent && loading && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <PageLoader />
            </div>
          )}

          {selectedStudent && !loading && data && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              {/* School header — visible only in print */}
              <div className="hidden print:block px-6 pt-6 pb-4 border-b border-slate-200 text-center">
                <h1 className="text-2xl font-bold text-slate-900">The Treasure School</h1>
                <p className="text-sm text-slate-500 mt-1">CBC Competency Report Card</p>
                <p className="text-xs text-slate-400">Academic Year {data.gradesByExam && Object.values(data.gradesByExam)[0]?.exam.term.academicYear.name}</p>
              </div>

              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{data.student.name}</h2>
                  <p className="text-sm text-slate-500">
                    {data.student.studentId} ·{' '}
                    {data.student.class
                      ? `${data.student.class.name}${data.student.class.section ? ` ${data.student.class.section}` : ''}`
                      : 'Unassigned'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Guardian: {data.student.guardianName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {overallAvg !== null && (
                    <div className="text-right mr-2">
                      <p className="text-xs text-slate-500">Overall Average</p>
                      <p className="text-2xl font-bold text-slate-900">{overallAvg.toFixed(1)}%</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CBC_GRADE(overallAvg, 100).color}`}>
                        {CBC_GRADE(overallAvg, 100).label}
                      </span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={exportCSV} className="print:hidden">
                    <Download className="w-4 h-4" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
                    <Printer className="w-4 h-4" /> Print
                  </Button>
                </div>
              </div>

              {/* CBC grade key */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-xs">
                <span className="text-slate-500 font-medium">CBC Grades:</span>
                {[['EE', 'text-emerald-700 bg-emerald-50', '≥80%'], ['ME', 'text-blue-700 bg-blue-50', '60–79%'], ['AE', 'text-amber-700 bg-amber-50', '40–59%'], ['BE', 'text-red-700 bg-red-50', '<40%']].map(([g, c, r]) => (
                  <span key={g} className={`px-2 py-0.5 rounded-full font-semibold ${c}`}>{g} <span className="font-normal opacity-70">({r})</span></span>
                ))}
              </div>

              {/* Grades by exam */}
              {examGroups.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No grades recorded yet for this student</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {examGroups.map((group) => {
                    const avg = group.grades.length > 0
                      ? group.grades.reduce((s, g) => s + (g.marks / g.exam.totalMarks) * 100, 0) / group.grades.length
                      : null
                    return (
                      <div key={group.exam.name} className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-slate-800">{group.exam.name}</h3>
                            <p className="text-xs text-slate-400">{group.exam.term.name} · {group.exam.term.academicYear.name} · <Badge variant={group.exam.examType === 'SUMMATIVE' ? 'blue' : 'green'}>{group.exam.examType}</Badge></p>
                          </div>
                          {avg !== null && (
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${CBC_GRADE(avg, 100).color}`}>
                              Avg: {avg.toFixed(1)}% ({CBC_GRADE(avg, 100).label})
                            </span>
                          )}
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-500 uppercase tracking-wider">
                              <th className="text-left py-1.5 font-medium">Subject</th>
                              <th className="text-center py-1.5 font-medium">Marks</th>
                              <th className="text-center py-1.5 font-medium">Out of</th>
                              <th className="text-center py-1.5 font-medium">%</th>
                              <th className="text-center py-1.5 font-medium">Grade</th>
                              <th className="text-left py-1.5 font-medium">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {group.grades.map((g) => {
                              const pct = (g.marks / g.exam.totalMarks) * 100
                              const { label, color } = CBC_GRADE(g.marks, g.exam.totalMarks)
                              return (
                                <tr key={g.id} className="hover:bg-slate-50">
                                  <td className="py-2 text-slate-700">{g.subject.name}</td>
                                  <td className="py-2 text-center font-medium text-slate-800">{g.marks}</td>
                                  <td className="py-2 text-center text-slate-400">{g.exam.totalMarks}</td>
                                  <td className="py-2 text-center text-slate-600">{pct.toFixed(1)}%</td>
                                  <td className="py-2 text-center">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                                  </td>
                                  <td className="py-2 text-slate-500 text-xs">{g.remarks ?? '—'}</td>
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
            {/* Teacher remarks — print only */}
            {data && !loading && examGroups.length > 0 && (
              <div className="hidden print:block px-6 py-5 border-t border-slate-200 mt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Class Teacher&apos;s Remarks</p>
                <div className="border border-slate-300 rounded-lg p-3 min-h-[60px]"></div>
                <div className="mt-4 flex gap-16">
                  <div><p className="text-xs text-slate-500">Class Teacher</p><div className="mt-6 border-b border-slate-400 w-40"></div></div>
                  <div><p className="text-xs text-slate-500">Head Teacher</p><div className="mt-6 border-b border-slate-400 w-40"></div></div>
                  <div><p className="text-xs text-slate-500">Date</p><div className="mt-6 border-b border-slate-400 w-32"></div></div>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

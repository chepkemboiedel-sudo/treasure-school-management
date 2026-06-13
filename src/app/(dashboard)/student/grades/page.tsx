'use client'

import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { GradeRecord } from '@/types'

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/grades?type=grades&mine=true').then((r) => r.json()).then((d) => {
      setGrades(d.data ?? [])
      setLoading(false)
    })
  }, [])

  const gradeColor = (g: string | null) => {
    if (!g) return 'gray' as const
    if (g === 'EE') return 'green' as const
    if (g === 'ME') return 'blue' as const
    if (g === 'AE') return 'yellow' as const
    return 'red' as const // BE
  }

  // Group by exam
  const byExam = grades.reduce<Record<string, { exam: GradeRecord['exam']; records: GradeRecord[] }>>((acc, g) => {
    if (!acc[g.exam.id]) acc[g.exam.id] = { exam: g.exam, records: [] }
    acc[g.exam.id].records.push(g)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {loading ? <PageLoader /> : Object.keys(byExam).length === 0 ? (
        <EmptyState icon={BookOpen} title="No grades available" description="Your grades will appear here once your teacher records them." />
      ) : (
        Object.values(byExam).map(({ exam, records }) => {
          const total = records.reduce((s, g) => s + g.marks, 0)
          const maxTotal = records.reduce((s, g) => s + g.exam.totalMarks, 0)
          const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0
          return (
            <div key={exam.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800">{exam.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Total: {total}/{maxTotal} ({pct}%)</p>
                </div>
                <Badge variant={pct >= 70 ? 'green' : pct >= 50 ? 'yellow' : 'red'}>{pct}%</Badge>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium">Marks</th><th className="px-5 py-3 font-medium">Out of</th><th className="px-5 py-3 font-medium">%</th><th className="px-5 py-3 font-medium">Grade</th><th className="px-5 py-3 font-medium">Remarks</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((g) => {
                    const p = Math.round((g.marks / g.exam.totalMarks) * 100)
                    return (
                      <tr key={g.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3 font-medium text-slate-800">{g.subject.name}</td>
                        <td className="px-5 py-3 text-slate-700">{g.marks}</td>
                        <td className="px-5 py-3 text-slate-500">{g.exam.totalMarks}</td>
                        <td className="px-5 py-3 text-slate-700">{p}%</td>
                        <td className="px-5 py-3"><Badge variant={gradeColor(g.grade)}>{g.grade ?? '—'}</Badge></td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{g.remarks ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })
      )}
    </div>
  )
}

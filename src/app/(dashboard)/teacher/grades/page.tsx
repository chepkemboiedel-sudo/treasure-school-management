'use client'

import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import GradeForm from '@/components/forms/GradeForm'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { GradeRecord } from '@/types'
import { Plus } from 'lucide-react'

export default function TeacherGradesPage() {
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchGrades = async () => {
    setLoading(true)
    const res = await fetch('/api/grades?type=grades&mine=true')
    const json = await res.json()
    setGrades(json.data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchGrades() }, [])

  const gradeColor = (g: string | null) => {
    if (!g) return 'gray' as const
    if (g === 'EE') return 'green' as const
    if (g === 'ME') return 'blue' as const
    if (g === 'AE') return 'yellow' as const
    return 'red' as const // BE
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Record Grade</Button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Grade Records</h2></div>
        {loading ? <PageLoader /> : grades.length === 0 ? (
          <EmptyState icon={BookOpen} title="No grades recorded yet" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Record Grade</Button>} />
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Student</th><th className="px-5 py-3 font-medium">Exam</th><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium">Marks</th><th className="px-5 py-3 font-medium">Grade</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {grades.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3 font-medium text-slate-800">{g.student.name}</td>
                  <td className="px-5 py-3 text-slate-600">{g.exam.name}</td>
                  <td className="px-5 py-3 text-slate-600">{g.subject.name}</td>
                  <td className="px-5 py-3 text-slate-600">{g.marks}/{g.exam.totalMarks}</td>
                  <td className="px-5 py-3"><Badge variant={gradeColor(g.grade)}>{g.grade ?? '—'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Grade">
        <GradeForm onSuccess={() => { setModalOpen(false); fetchGrades() }} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}

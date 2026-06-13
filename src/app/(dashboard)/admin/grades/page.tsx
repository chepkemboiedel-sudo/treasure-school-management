'use client'

import { useEffect, useState, useCallback } from 'react'
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import ExamForm from '@/components/forms/ExamForm'
import GradeForm from '@/components/forms/GradeForm'
import { GradeRecord } from '@/types'
import toast from 'react-hot-toast'

interface Exam { id: string; name: string; class: { id: string; name: string }; term: { id: string; name: string }; totalMarks: number; passingMarks: number; date: string | null }

export default function GradesPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'exams' | 'grades'>('exams')
  const [examModal, setExamModal] = useState(false)
  const [gradeModal, setGradeModal] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null)
  const [deleteGrade, setDeleteGrade] = useState<GradeRecord | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const perPage = 15

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [er, gr] = await Promise.all([fetch('/api/grades?type=exams'), fetch(`/api/grades?type=grades&page=${page}&perPage=${perPage}`)])
    const [ed, gd] = await Promise.all([er.json(), gr.json()])
    setExams(ed.data ?? [])
    setGrades(gd.data ?? [])
    setTotal(gd.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const doDeleteExam = async () => {
    if (!deleteExam) return
    setDeleteLoading(true)
    const res = await fetch(`/api/grades?type=exam&id=${deleteExam.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Exam deleted'); setDeleteExam(null); fetchData() }
    else toast.error('Failed to delete exam')
    setDeleteLoading(false)
  }

  const doDeleteGrade = async () => {
    if (!deleteGrade) return
    setDeleteLoading(true)
    const res = await fetch(`/api/grades?type=grade&id=${deleteGrade.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Grade deleted'); setDeleteGrade(null); fetchData() }
    else toast.error('Failed to delete grade')
    setDeleteLoading(false)
  }

  const totalPages = Math.ceil(total / perPage)

  const gradeColor = (g: string | null) => {
    if (!g) return 'gray'
    if (g === 'EE') return 'green'
    if (g === 'ME') return 'blue'
    if (g === 'AE') return 'yellow'
    return 'red' // BE
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['exams', 'grades'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'exams' && (
        <>
          <div className="flex justify-end"><Button onClick={() => { setEditingExam(null); setExamModal(true) }}><Plus className="w-4 h-4" />Add Exam</Button></div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Exams</h2></div>
            {loading ? <PageLoader /> : exams.length === 0 ? <EmptyState icon={BookOpen} title="No exams created" action={<Button onClick={() => setExamModal(true)}><Plus className="w-4 h-4" />Add Exam</Button>} /> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Exam</th><th className="px-5 py-3 font-medium">Class</th><th className="px-5 py-3 font-medium">Term</th><th className="px-5 py-3 font-medium">Total Marks</th><th className="px-5 py-3 font-medium text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {exams.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-medium text-slate-800">{e.name}</td>
                      <td className="px-5 py-3 text-slate-600">{e.class.name}</td>
                      <td className="px-5 py-3 text-slate-600">{e.term.name}</td>
                      <td className="px-5 py-3 text-slate-600">{e.totalMarks} (Pass: {e.passingMarks})</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingExam(e); setExamModal(true) }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteExam(e)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'grades' && (
        <>
          <div className="flex justify-end"><Button onClick={() => setGradeModal(true)}><Plus className="w-4 h-4" />Record Grade</Button></div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Grade Records</h2></div>
            {loading ? <PageLoader /> : grades.length === 0 ? <EmptyState icon={BookOpen} title="No grades recorded" action={<Button onClick={() => setGradeModal(true)}><Plus className="w-4 h-4" />Record Grade</Button>} /> : (
              <>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Student</th><th className="px-5 py-3 font-medium">Exam</th><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium">Marks</th><th className="px-5 py-3 font-medium">Grade</th><th className="px-5 py-3 font-medium text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {grades.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3"><p className="font-medium text-slate-800">{g.student.name}</p><p className="text-xs text-slate-400">{g.student.studentId}</p></td>
                        <td className="px-5 py-3 text-slate-600">{g.exam.name}</td>
                        <td className="px-5 py-3 text-slate-600">{g.subject.name}</td>
                        <td className="px-5 py-3 text-slate-600">{g.marks}/{g.exam.totalMarks}</td>
                        <td className="px-5 py-3"><Badge variant={gradeColor(g.grade) as 'green' | 'blue' | 'yellow' | 'red' | 'gray'}>{g.grade ?? '—'}</Badge></td>
                        <td className="px-5 py-3"><div className="flex items-center justify-end gap-1"><button onClick={() => setDeleteGrade(g)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onPageChange={setPage} />
              </>
            )}
          </div>
        </>
      )}

      <Modal isOpen={examModal} onClose={() => setExamModal(false)} title={editingExam ? 'Edit Exam' : 'Add Exam'}>
        <ExamForm
          defaultValues={editingExam ? {
            name: editingExam.name,
            classId: editingExam.class.id,
            termId: editingExam.term.id,
            totalMarks: editingExam.totalMarks,
            passingMarks: editingExam.passingMarks,
            date: editingExam.date ?? undefined,
          } : undefined}
          onSuccess={() => { setExamModal(false); fetchData() }}
          onCancel={() => setExamModal(false)}
          isEdit={!!editingExam}
          examId={editingExam?.id}
        />
      </Modal>
      <Modal isOpen={gradeModal} onClose={() => setGradeModal(false)} title="Record Grade">
        <GradeForm onSuccess={() => { setGradeModal(false); fetchData() }} onCancel={() => setGradeModal(false)} />
      </Modal>
      <ConfirmDialog isOpen={!!deleteExam} onClose={() => setDeleteExam(null)} onConfirm={doDeleteExam} message={`Delete exam "${deleteExam?.name}" and all its grade records?`} loading={deleteLoading} />
      <ConfirmDialog isOpen={!!deleteGrade} onClose={() => setDeleteGrade(null)} onConfirm={doDeleteGrade} message="Delete this grade record?" loading={deleteLoading} />
    </div>
  )
}

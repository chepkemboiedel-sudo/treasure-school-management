'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Printer, Trash2, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'

interface ClassOption { id: string; name: string }
interface Subject { id: string; name: string; classId: string }
interface Term { id: string; name: string }
interface ExamSchedule {
  id: string
  title: string
  class: { id: string; name: string }
  subject: { name: string }
  term: { name: string }
  date: string
  startTime: string
  endTime: string
  venue: string
}

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  termId: z.string().min(1, 'Term is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(1, 'Venue is required'),
})
type FormData = z.infer<typeof schema>

export default function ExamSchedulePage() {
  const [exams, setExams] = useState<ExamSchedule[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [deleting, setDeleting] = useState<ExamSchedule | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [classFilter, setClassFilter] = useState<string>('ALL')
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedClassId = watch('classId')
  const filteredSubjects = allSubjects.filter(s => !watchedClassId || s.classId === watchedClassId)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [er, cr, sr, tr] = await Promise.all([
        fetch('/api/exam-schedule'),
        fetch('/api/classes?simple=true'),
        fetch('/api/subjects?all=true'),
        fetch('/api/terms'),
      ])
      const [ed, cd, sd, td] = await Promise.all([er.json(), cr.json(), sr.json(), tr.json()])
      setExams(ed.data ?? [])
      setClasses(cd.data ?? [])
      setAllSubjects(sd.data ?? [])
      setTerms(td.data ?? [])
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const onSubmit = async (values: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/exam-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      toast.success('Exam added to schedule')
      reset()
      setModal(false)
      fetchData()
    } catch { toast.error('Failed to add exam') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/exam-schedule/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Exam removed')
      setDeleting(null)
      fetchData()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteLoading(false) }
  }

  const displayedExams = classFilter === 'ALL'
    ? exams
    : exams.filter(e => e.class.id === classFilter)

  // Group by class for display
  const grouped = displayedExams.reduce((acc, e) => {
    const key = e.class.name
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {} as Record<string, ExamSchedule[]>)

  return (
    <div className="space-y-6">
      {/* Print header — only visible when printing */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">The Treasure School — Exam Timetable</h1>
        <p className="text-sm text-slate-600 mt-1">Generated on {new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exam Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage exam timetables by class</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button onClick={() => { reset(); setSelectedClassId(''); setModal(true) }}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
            <Plus className="w-4 h-4" /> Add Exam
          </Button>
        </div>
      </div>

      {/* Class filter */}
      <div className="flex items-center gap-2 flex-wrap print:hidden">
        <button
          onClick={() => setClassFilter('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${classFilter === 'ALL' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          All Classes
        </button>
        {classes.map(c => (
          <button key={c.id}
            onClick={() => setClassFilter(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${classFilter === c.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Exam tables grouped by class */}
      {loading ? (
        <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-10 text-center text-slate-400 text-sm">
          No exams scheduled
        </div>
      ) : (
        Object.entries(grouped).map(([className, items]) => (
          <div key={className} className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-600" />
              <h3 className="font-semibold text-slate-800">{className}</h3>
              <span className="text-xs text-slate-400 ml-1">({items.length} exam{items.length !== 1 ? 's' : ''})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-5 py-3 font-medium">Subject</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Venue</th>
                    <th className="px-5 py-3 font-medium">Term</th>
                    <th className="px-5 py-3 font-medium text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3 font-medium text-slate-800">{e.title}</td>
                      <td className="px-5 py-3 text-slate-600">{e.subject.name}</td>
                      <td className="px-5 py-3 text-slate-600">{new Date(e.date).toLocaleDateString('en-KE')}</td>
                      <td className="px-5 py-3 text-slate-600">{e.startTime} – {e.endTime}</td>
                      <td className="px-5 py-3 text-slate-600">{e.venue}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{e.term.name}</td>
                      <td className="px-5 py-3 text-right print:hidden">
                        <button onClick={() => setDeleting(e)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Add Exam Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Exam to Schedule" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Exam Title" {...register('title')} error={errors.title?.message} placeholder="e.g. End of Term Mathematics" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Class"
              {...register('classId')}
              error={errors.classId?.message}
              options={classes.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select class"
            />
            <Select
              label="Subject"
              {...register('subjectId')}
              error={errors.subjectId?.message}
              options={filteredSubjects.map(s => ({ value: s.id, label: s.name }))}
              placeholder={watchedClassId ? 'Select subject' : 'Select class first'}
            />
          </div>
          <Select
            label="Term"
            {...register('termId')}
            error={errors.termId?.message}
            options={terms.map(t => ({ value: t.id, label: t.name }))}
            placeholder="Select term"
          />
          <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="time" {...register('startTime')} error={errors.startTime?.message} />
            <Input label="End Time" type="time" {...register('endTime')} error={errors.endTime?.message} />
          </div>
          <Input label="Venue" {...register('venue')} error={errors.venue?.message} placeholder="e.g. Hall A, Classroom 5" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              Add Exam
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Remove Exam"
        message={`Remove "${deleting?.title}" from the schedule?`}
        confirmLabel="Remove"
        loading={deleteLoading}
      />
    </div>
  )
}

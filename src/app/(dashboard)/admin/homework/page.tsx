'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Trash2, Pencil, CalendarDays } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

interface Assignment {
  id: string; title: string; description: string | null; dueDate: string
  class: { id: string; name: string; section: string | null }
  subject: { id: string; name: string } | null
  teacher: { id: string; name: string }
}
interface ClassOption { id: string; name: string; section: string | null }
interface SubjectOption { id: string; name: string; classId: string }
interface TeacherOption { id: string; name: string }

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date required'),
  classId: z.string().min(1, 'Class required'),
  subjectId: z.string().optional(),
  teacherId: z.string().min(1, 'Teacher required'),
})
type FormData = z.infer<typeof schema>

export default function AdminHomeworkPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const selectedClassId = watch('classId')

  const load = () => {
    setLoading(true)
    fetch('/api/assignments').then((r) => r.json()).then((j) => { setAssignments(j.data ?? []); setLoading(false) })
  }

  useEffect(() => {
    load()
    Promise.all([
      fetch('/api/classes?simple=true').then((r) => r.json()),
      fetch('/api/subjects?all=true').then((r) => r.json()),
      fetch('/api/teachers?all=true').then((r) => r.json()),
    ]).then(([cl, su, te]) => {
      setClasses(cl.data ?? [])
      setSubjects(su.data ?? [])
      setTeachers(te.data ?? [])
    })
  }, [])

  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` ${c.section}` : ''}` }))
  const subjectOptions = subjects
    .filter((s) => !selectedClassId || s.classId === selectedClassId)
    .map((s) => ({ value: s.id, label: s.name }))
  const teacherOptions = teachers.map((t) => ({ value: t.id, label: t.name }))

  const openAdd = () => { reset({}); setEditing(null); setShowModal(true) }
  const openEdit = (a: Assignment) => {
    setEditing(a)
    reset({ title: a.title, description: a.description ?? '', dueDate: a.dueDate.split('T')[0], classId: a.class.id, subjectId: a.subject?.id ?? '', teacherId: a.teacher.id })
    setShowModal(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const url = editing ? `/api/assignments/${editing.id}` : '/api/assignments'
    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed to save'); return }
    toast.success(editing ? 'Assignment updated' : 'Assignment created')
    setShowModal(false); load()
  }

  const deleteAssignment = async (id: string) => {
    await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
    toast.success('Assignment deleted'); setDeletingId(null); load()
  }

  const isOverdue = (d: string) => new Date(d) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary-600" /> Homework & Assignments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage assignments for all classes</p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2"><Plus className="w-4 h-4" /> New Assignment</Button>
      </div>

      {loading ? <div className="text-center py-16 text-slate-400">Loading…</div> : assignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No assignments yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Title', 'Class', 'Subject', 'Teacher', 'Due Date', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{a.title}</td>
                  <td className="px-4 py-3 text-slate-600">{a.class.name}{a.class.section ? ` ${a.class.section}` : ''}</td>
                  <td className="px-4 py-3 text-slate-600">{a.subject?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.teacher.name}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-sm ${isOverdue(a.dueDate) ? 'text-red-600' : 'text-slate-700'}`}>
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(a.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {isOverdue(a.dueDate) && <span className="text-xs text-red-500">(overdue)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingId(a.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Assignment' : 'New Assignment'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title *" {...register('title')} error={errors.title?.message} placeholder="Mathematics Exercise 3" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Class *" {...register('classId')} error={errors.classId?.message} options={classOptions} placeholder="Select class…" />
            <Select label="Subject" {...register('subjectId')} error={errors.subjectId?.message} options={subjectOptions} placeholder="Any subject…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Teacher *" {...register('teacherId')} error={errors.teacherId?.message} options={teacherOptions} placeholder="Select teacher…" />
            <Input label="Due Date *" type="date" {...register('dueDate')} error={errors.dueDate?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Assignment instructions…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteAssignment(deletingId)} title="Delete Assignment" message="Remove this assignment?" confirmLabel="Delete" />
    </div>
  )
}

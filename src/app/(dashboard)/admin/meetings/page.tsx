'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Calendar, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface Teacher { id: string; name: string }
interface Parent { id: string; name: string }
interface Student { id: string; name: string; studentId: string }
interface Meeting {
  id: string
  teacher: { name: string }
  parent: { name: string }
  student?: { name: string } | null
  dateTime: string
  duration: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  notes?: string | null
}

const schema = z.object({
  teacherId: z.string().min(1, 'Teacher is required'),
  parentId: z.string().min(1, 'Parent is required'),
  studentId: z.string().optional(),
  dateTime: z.string().min(1, 'Date & time is required'),
  duration: z.coerce.number().min(5, 'Min 5 minutes').max(480),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const statusBadge = (s: string) => {
  const map: Record<string, 'yellow' | 'green' | 'red' | 'blue'> = {
    PENDING: 'yellow', CONFIRMED: 'green', CANCELLED: 'red', COMPLETED: 'blue',
  }
  return map[s] ?? 'gray'
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [deleting, setDeleting] = useState<Meeting | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 30 },
  })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [mr, tr, pr, sr] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/teachers?all=true'),
        fetch('/api/parents?all=true'),
        fetch('/api/students?all=true'),
      ])
      const [md, td, pd, sd] = await Promise.all([mr.json(), tr.json(), pr.json(), sr.json()])
      setMeetings(md.data ?? [])
      setTeachers(td.data ?? [])
      setParents(pd.data ?? [])
      setStudents(sd.data ?? [])
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const onSubmit = async (values: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      toast.success('Meeting scheduled')
      reset({ duration: 30 })
      setModal(false)
      fetchAll()
    } catch { toast.error('Failed to schedule meeting') }
    finally { setSubmitting(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id + status)
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Meeting ${status.toLowerCase()}`)
      fetchAll()
    } catch { toast.error('Failed to update status') }
    finally { setUpdating(null) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/meetings/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Meeting deleted')
      setDeleting(null)
      fetchAll()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteLoading(false) }
  }

  const stats = [
    { label: 'Total', value: meetings.length, color: 'from-violet-500 to-indigo-500' },
    { label: 'Pending', value: meetings.filter(m => m.status === 'PENDING').length, color: 'from-amber-500 to-orange-500' },
    { label: 'Confirmed', value: meetings.filter(m => m.status === 'CONFIRMED').length, color: 'from-emerald-500 to-teal-500' },
    { label: 'Completed', value: meetings.filter(m => m.status === 'COMPLETED').length, color: 'from-blue-500 to-cyan-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parent-Teacher Meetings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule and manage parent-teacher conferences</p>
        </div>
        <Button onClick={() => { reset({ duration: 30 }); setModal(true) }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
          <Plus className="w-4 h-4" /> Schedule Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Meetings ({meetings.length})</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No meetings scheduled</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-medium">Teacher</th>
                  <th className="px-5 py-3 font-medium">Parent</th>
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {meetings.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-medium text-slate-800">{m.teacher.name}</td>
                    <td className="px-5 py-3 text-slate-600">{m.parent.name}</td>
                    <td className="px-5 py-3 text-slate-500">{m.student?.name ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <p>{new Date(m.dateTime).toLocaleDateString('en-KE')}</p>
                      <p className="text-xs text-slate-400">{new Date(m.dateTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5" /> {m.duration} min
                      </span>
                    </td>
                    <td className="px-5 py-3"><Badge variant={statusBadge(m.status)}>{m.status}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {m.status === 'PENDING' && (
                          <Button size="sm" variant="secondary" loading={updating === m.id + 'CONFIRMED'}
                            onClick={() => updateStatus(m.id, 'CONFIRMED')}>
                            <CheckCircle className="w-3.5 h-3.5" /> Confirm
                          </Button>
                        )}
                        {(m.status === 'PENDING' || m.status === 'CONFIRMED') && (
                          <Button size="sm" variant="secondary" loading={updating === m.id + 'CANCELLED'}
                            onClick={() => updateStatus(m.id, 'CANCELLED')}>
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </Button>
                        )}
                        {m.status === 'CONFIRMED' && (
                          <Button size="sm" variant="secondary" loading={updating === m.id + 'COMPLETED'}
                            onClick={() => updateStatus(m.id, 'COMPLETED')}>
                            Complete
                          </Button>
                        )}
                        <button onClick={() => setDeleting(m)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Schedule Meeting" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Teacher"
            {...register('teacherId')}
            error={errors.teacherId?.message}
            options={teachers.map(t => ({ value: t.id, label: t.name }))}
            placeholder="Select teacher"
          />
          <Select
            label="Parent"
            {...register('parentId')}
            error={errors.parentId?.message}
            options={parents.map(p => ({ value: p.id, label: p.name }))}
            placeholder="Select parent"
          />
          <Select
            label="Student (optional)"
            {...register('studentId')}
            options={students.map(s => ({ value: s.id, label: `${s.name} (${s.studentId})` }))}
            placeholder="Select student (optional)"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date &amp; Time" type="datetime-local" {...register('dateTime')} error={errors.dateTime?.message} />
            <Input label="Duration (minutes)" type="number" {...register('duration')} error={errors.duration?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea {...register('notes')} rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Any notes or agenda..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              Schedule
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Meeting"
        message={`Delete this meeting between ${deleting?.teacher.name} and ${deleting?.parent.name}?`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

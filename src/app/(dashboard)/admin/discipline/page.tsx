'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, AlertTriangle, CheckCircle, XCircle, Trash2, ShieldAlert } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface Student { id: string; name: string; studentId: string }
interface DisciplinaryRecord {
  id: string
  student: { id: string; name: string; studentId: string }
  type: 'WARNING' | 'SUSPENSION' | 'EXPULSION' | 'NOTE'
  description: string
  actionTaken: string | null
  reportedBy: string
  date: string
  resolved: boolean
}

const schema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  type: z.enum(['WARNING', 'SUSPENSION', 'EXPULSION', 'NOTE']),
  description: z.string().min(3, 'Description is required'),
  actionTaken: z.string().optional(),
  reportedBy: z.string().min(1, 'Reporter is required'),
  date: z.string().min(1, 'Date is required'),
})
type FormData = z.infer<typeof schema>

const typeBadge = (type: string) => {
  const map: Record<string, 'yellow' | 'red' | 'blue'> = {
    WARNING: 'yellow', SUSPENSION: 'red', EXPULSION: 'red', NOTE: 'blue',
  }
  return map[type] ?? 'gray'
}

export default function DisciplinePage() {
  const [records, setRecords] = useState<DisciplinaryRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [deleting, setDeleting] = useState<DisciplinaryRecord | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'WARNING', date: new Date().toISOString().slice(0, 10) },
  })

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/disciplinary')
      const data = await res.json()
      setRecords(data.data ?? [])
    } catch { toast.error('Failed to load records') }
    finally { setLoading(false) }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students?all=true')
      const data = await res.json()
      setStudents(data.data ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchRecords(); fetchStudents() }, [fetchRecords, fetchStudents])

  const onSubmit = async (values: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/disciplinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      toast.success('Record added')
      reset()
      setModal(false)
      fetchRecords()
    } catch { toast.error('Failed to add record') }
    finally { setSubmitting(false) }
  }

  const markResolved = async (id: string) => {
    setResolving(id)
    try {
      const res = await fetch(`/api/disciplinary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      })
      if (!res.ok) throw new Error()
      toast.success('Marked as resolved')
      fetchRecords()
    } catch { toast.error('Failed to update') }
    finally { setResolving(null) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/disciplinary/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Record deleted')
      setDeleting(null)
      fetchRecords()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteLoading(false) }
  }

  const total = records.length
  const warnings = records.filter(r => r.type === 'WARNING').length
  const suspensions = records.filter(r => r.type === 'SUSPENSION' || r.type === 'EXPULSION').length
  const resolved = records.filter(r => r.resolved).length

  const stats = [
    { label: 'Total Records', value: total, color: 'from-violet-500 to-indigo-500', icon: ShieldAlert },
    { label: 'Warnings', value: warnings, color: 'from-amber-500 to-orange-500', icon: AlertTriangle },
    { label: 'Suspensions/Expulsions', value: suspensions, color: 'from-red-500 to-pink-500', icon: XCircle },
    { label: 'Resolved', value: resolved, color: 'from-emerald-500 to-teal-500', icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disciplinary Records</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage student disciplinary incidents</p>
        </div>
        <Button onClick={() => { reset({ type: 'WARNING', date: new Date().toISOString().slice(0, 10) }); setModal(true) }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">All Records</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No disciplinary records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Reported By</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{r.student.name}</p>
                      <p className="text-xs text-slate-400">{r.student.studentId}</p>
                    </td>
                    <td className="px-5 py-3"><Badge variant={typeBadge(r.type)}>{r.type}</Badge></td>
                    <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{r.description}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(r.date).toLocaleDateString('en-KE')}</td>
                    <td className="px-5 py-3 text-slate-600">{r.reportedBy}</td>
                    <td className="px-5 py-3">
                      {r.resolved
                        ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle className="w-4 h-4" /> Resolved</span>
                        : <span className="inline-flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> Open</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {!r.resolved && (
                          <Button size="sm" variant="secondary" loading={resolving === r.id}
                            onClick={() => markResolved(r.id)}>
                            Mark Resolved
                          </Button>
                        )}
                        <button onClick={() => setDeleting(r)}
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

      {/* Add Record Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Disciplinary Record" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Student"
            {...register('studentId')}
            error={errors.studentId?.message}
            options={students.map(s => ({ value: s.id, label: `${s.name} (${s.studentId})` }))}
            placeholder="Select student"
          />
          <Select
            label="Type"
            {...register('type')}
            error={errors.type?.message}
            options={[
              { value: 'WARNING', label: 'Warning' },
              { value: 'SUSPENSION', label: 'Suspension' },
              { value: 'EXPULSION', label: 'Expulsion' },
              { value: 'NOTE', label: 'Note' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Describe the incident..." />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Action Taken</label>
            <textarea {...register('actionTaken')}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="What action was taken?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Reported By" {...register('reportedBy')} error={errors.reportedBy?.message} placeholder="Teacher / staff name" />
            <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              Add Record
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        message={`Delete this disciplinary record for "${deleting?.student.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

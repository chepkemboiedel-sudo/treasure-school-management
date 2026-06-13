'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Activity, AlertCircle, Trash2, HeartPulse } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface Student { id: string; name: string; studentId: string }
interface HealthVisit {
  id: string
  student: { id: string; name: string; studentId: string }
  visitDate: string
  complaint: string
  diagnosis: string
  treatment: string
  attendedBy: string
  referral: boolean
}

const schema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  visitDate: z.string().min(1, 'Date is required'),
  complaint: z.string().min(3, 'Complaint is required'),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  treatment: z.string().min(2, 'Treatment is required'),
  attendedBy: z.string().min(2, 'Attended by is required'),
  referral: z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

export default function HealthPage() {
  const [visits, setVisits] = useState<HealthVisit[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [deleting, setDeleting] = useState<HealthVisit | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10))

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      visitDate: new Date().toISOString().slice(0, 16),
      referral: false,
    },
  })

  const fetchVisits = useCallback(async () => {
    setLoading(true)
    try {
      const params = dateFilter ? `?date=${dateFilter}` : ''
      const res = await fetch(`/api/health-visits${params}`)
      const data = await res.json()
      setVisits(data.data ?? [])
    } catch { toast.error('Failed to load visits') }
    finally { setLoading(false) }
  }, [dateFilter])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students?all=true')
      const data = await res.json()
      setStudents(data.data ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchVisits() }, [fetchVisits])
  useEffect(() => { fetchStudents() }, [fetchStudents])

  const onSubmit = async (values: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/health-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      toast.success('Visit logged')
      reset({ visitDate: new Date().toISOString().slice(0, 16), referral: false })
      setModal(false)
      fetchVisits()
    } catch { toast.error('Failed to log visit') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/health-visits/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Visit deleted')
      setDeleting(null)
      fetchVisits()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteLoading(false) }
  }

  const todayVisits = visits.length
  const referralsToday = visits.filter(v => v.referral).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Clinic Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">Log and track student clinic visits</p>
        </div>
        <Button onClick={() => {
          reset({ visitDate: new Date().toISOString().slice(0, 16), referral: false })
          setModal(true)
        }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
          <Plus className="w-4 h-4" /> Log Visit
        </Button>
      </div>

      {/* Date filter + stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4 flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{todayVisits}</p>
            <p className="text-xs text-slate-500">Total Visits</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4 flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{referralsToday}</p>
            <p className="text-xs text-slate-500">Referrals</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4 flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Filter by Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Clinic Visits</h2>
          <span className="text-xs text-slate-400">
            {dateFilter ? `Showing: ${new Date(dateFilter + 'T00:00:00').toLocaleDateString('en-KE')}` : 'All dates'}
          </span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : visits.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No visits recorded for this date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                  <th className="px-5 py-3 font-medium">Complaint</th>
                  <th className="px-5 py-3 font-medium">Diagnosis</th>
                  <th className="px-5 py-3 font-medium">Treatment</th>
                  <th className="px-5 py-3 font-medium">Attended By</th>
                  <th className="px-5 py-3 font-medium">Referral</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visits.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{v.student.name}</p>
                      <p className="text-xs text-slate-400">{v.student.studentId}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(v.visitDate).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-[150px] truncate">{v.complaint}</td>
                    <td className="px-5 py-3 text-slate-600 max-w-[150px] truncate">{v.diagnosis}</td>
                    <td className="px-5 py-3 text-slate-600 max-w-[150px] truncate">{v.treatment}</td>
                    <td className="px-5 py-3 text-slate-600">{v.attendedBy}</td>
                    <td className="px-5 py-3">
                      <Badge variant={v.referral ? 'red' : 'green'}>{v.referral ? 'YES' : 'NO'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setDeleting(v)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Visit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Log Clinic Visit" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Student"
            {...register('studentId')}
            error={errors.studentId?.message}
            options={students.map(s => ({ value: s.id, label: `${s.name} (${s.studentId})` }))}
            placeholder="Select student"
          />
          <Input label="Visit Date &amp; Time" type="datetime-local" {...register('visitDate')} error={errors.visitDate?.message} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Complaint</label>
            <textarea {...register('complaint')} rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Patient's complaint..." />
            {errors.complaint && <p className="text-red-500 text-xs mt-1">{errors.complaint.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Diagnosis</label>
            <textarea {...register('diagnosis')} rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Clinical diagnosis..." />
            {errors.diagnosis && <p className="text-red-500 text-xs mt-1">{errors.diagnosis.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Treatment</label>
            <textarea {...register('treatment')} rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Treatment administered..." />
            {errors.treatment && <p className="text-red-500 text-xs mt-1">{errors.treatment.message}</p>}
          </div>
          <Input label="Attended By" {...register('attendedBy')} error={errors.attendedBy?.message} placeholder="Nurse / Doctor name" />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('referral')}
              className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
            <span className="text-sm font-medium text-slate-700">Referred to hospital / specialist</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              Log Visit
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Visit Record"
        message={`Delete health visit for "${deleting?.student.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

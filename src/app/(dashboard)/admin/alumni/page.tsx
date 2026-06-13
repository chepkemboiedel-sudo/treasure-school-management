'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, GraduationCap, Search, RotateCcw, Users, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  studentId: string
  isAlumni: boolean
  graduatedAt?: string | null
  alumniNotes?: string | null
  class?: { name: string } | null
}

const markSchema = z.object({
  graduatedAt: z.string().min(1, 'Graduation date is required'),
  alumniNotes: z.string().optional(),
})
type MarkFormData = z.infer<typeof markSchema>

export default function AlumniPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [viewAlumni, setViewAlumni] = useState(true)
  const [search, setSearch] = useState('')
  const [markModal, setMarkModal] = useState<Student | null>(null)
  const [markSubmitting, setMarkSubmitting] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MarkFormData>({
    resolver: zodResolver(markSchema),
    defaultValues: { graduatedAt: new Date().toISOString().slice(0, 10) },
  })

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/students?all=true&alumni=${viewAlumni}`)
      const data = await res.json()
      setStudents(data.data ?? [])
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }, [viewAlumni])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const onMarkSubmit = async (values: MarkFormData) => {
    if (!markModal) return
    setMarkSubmitting(true)
    try {
      const res = await fetch(`/api/students/${markModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAlumni: true, ...values }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${markModal.name} marked as alumni`)
      setMarkModal(null)
      reset({ graduatedAt: new Date().toISOString().slice(0, 10) })
      fetchStudents()
    } catch { toast.error('Failed to update student') }
    finally { setMarkSubmitting(false) }
  }

  const restoreStudent = async (student: Student) => {
    setRestoring(student.id)
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAlumni: false }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${student.name} restored to current students`)
      fetchStudents()
    } catch { toast.error('Failed to restore student') }
    finally { setRestoring(null) }
  }

  const currentYear = new Date().getFullYear()
  const graduatedThisYear = students.filter(s =>
    s.graduatedAt && new Date(s.graduatedAt).getFullYear() === currentYear
  ).length

  const filtered = students.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alumni Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage school alumni and graduates</p>
        </div>
        {!viewAlumni && (
          <Button
            onClick={() => { reset({ graduatedAt: new Date().toISOString().slice(0, 10) }); setMarkModal({ id: '', name: '', studentId: '', isAlumni: false } as Student) }}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
            <Plus className="w-4 h-4" /> Mark as Alumni
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{students.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total {viewAlumni ? 'Alumni' : 'Current Students'}</p>
        </div>
        {viewAlumni && (
          <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{graduatedThisYear}</p>
            <p className="text-xs text-slate-500 mt-0.5">Graduated {currentYear}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* View toggle */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewAlumni(true)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewAlumni ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            Alumni
          </button>
          <button
            onClick={() => setViewAlumni(false)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${!viewAlumni ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            Current Students
          </button>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or ID..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            {viewAlumni ? 'Alumni List' : 'Current Students'}
          </h2>
          <span className="text-xs text-slate-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            {search ? 'No results match your search' : `No ${viewAlumni ? 'alumni' : 'students'} found`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Student ID</th>
                  <th className="px-5 py-3 font-medium">Last Class</th>
                  {viewAlumni && <th className="px-5 py-3 font-medium">Graduated</th>}
                  {viewAlumni && <th className="px-5 py-3 font-medium">Notes</th>}
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{s.studentId}</td>
                    <td className="px-5 py-3">
                      {s.class ? <Badge variant="blue">{s.class.name}</Badge> : <span className="text-slate-300">—</span>}
                    </td>
                    {viewAlumni && (
                      <td className="px-5 py-3 text-slate-600">
                        {s.graduatedAt
                          ? new Date(s.graduatedAt).toLocaleDateString('en-KE')
                          : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    {viewAlumni && (
                      <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                        {s.alumniNotes ?? <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {!viewAlumni ? (
                          <Button size="sm" variant="secondary"
                            onClick={() => {
                              reset({ graduatedAt: new Date().toISOString().slice(0, 10) })
                              setMarkModal(s)
                            }}>
                            <GraduationCap className="w-3.5 h-3.5" /> Mark Alumni
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary"
                            loading={restoring === s.id}
                            onClick={() => restoreStudent(s)}>
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark as Alumni Modal */}
      <Modal
        isOpen={!!markModal && markModal.id !== ''}
        onClose={() => setMarkModal(null)}
        title={`Mark as Alumni — ${markModal?.name}`}
        size="sm">
        <form onSubmit={handleSubmit(onMarkSubmit)} className="space-y-4">
          <Input
            label="Graduation Date"
            type="date"
            {...register('graduatedAt')}
            error={errors.graduatedAt?.message}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alumni Notes (optional)</label>
            <textarea {...register('alumniNotes')} rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="e.g. Won scholarship to XYZ University..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setMarkModal(null)}>Cancel</Button>
            <Button type="submit" loading={markSubmitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              <GraduationCap className="w-4 h-4" /> Mark Alumni
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Calendar, Plus, Trash2, Pencil } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

interface SchoolEvent {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  type: string
}

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().optional(),
  type: z.enum(['HOLIDAY', 'EXAM', 'SPORTS', 'MEETING', 'OTHER']),
})
type FormData = z.infer<typeof schema>

const TYPE_COLORS: Record<string, string> = {
  HOLIDAY: 'bg-green-100 text-green-800 border-green-200',
  EXAM: 'bg-red-100 text-red-800 border-red-200',
  SPORTS: 'bg-blue-100 text-blue-800 border-blue-200',
  MEETING: 'bg-purple-100 text-purple-800 border-purple-200',
  OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
}
const TYPE_OPTIONS = [
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'EXAM', label: 'Exam Period' },
  { value: 'SPORTS', label: 'Sports Day' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'OTHER', label: 'Other' },
]

function groupByMonth(events: SchoolEvent[]) {
  const groups: Record<string, SchoolEvent[]> = {}
  for (const e of events) {
    const key = new Date(e.startDate).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

export default function CalendarPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<SchoolEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'OTHER' },
  })

  const load = () => {
    setLoading(true)
    fetch('/api/events').then((r) => r.json()).then((j) => { setEvents(j.data ?? []); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { reset({ type: 'OTHER' }); setEditing(null); setShowModal(true) }
  const openEdit = (e: SchoolEvent) => {
    setEditing(e)
    reset({
      title: e.title, description: e.description ?? '', type: e.type as FormData['type'],
      startDate: e.startDate.split('T')[0], endDate: e.endDate?.split('T')[0] ?? '',
    })
    setShowModal(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const url = editing ? `/api/events/${editing.id}` : '/api/events'
    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed to save'); return }
    toast.success(editing ? 'Event updated' : 'Event created')
    setShowModal(false); load()
  }

  const deleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    toast.success('Event deleted'); setDeletingId(null); load()
  }

  const grouped = groupByMonth(events)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" /> School Calendar
          </h1>
          <p className="text-slate-500 text-sm mt-1">Term dates, exams, holidays and school events</p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Event</Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No events yet. Add your first school event.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, evts]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{month}</h2>
              <div className="space-y-2">
                {evts.map((e) => (
                  <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition">
                    <div className="text-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[52px]">
                      <p className="text-xs text-slate-500">{new Date(e.startDate).toLocaleDateString('en-KE', { month: 'short' })}</p>
                      <p className="text-xl font-bold text-slate-800 leading-tight">{new Date(e.startDate).getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800">{e.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[e.type]}`}>{e.type}</span>
                      </div>
                      {e.description && <p className="text-sm text-slate-500 mt-0.5">{e.description}</p>}
                      {e.endDate && e.endDate !== e.startDate && (
                        <p className="text-xs text-slate-400 mt-1">
                          Until {new Date(e.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingId(e.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Event' : 'Add Event'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Event Title *" {...register('title')} error={errors.title?.message} placeholder="End of Term Exam" />
          <Select label="Type" {...register('type')} error={errors.type?.message} options={TYPE_OPTIONS} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date *" type="date" {...register('startDate')} error={errors.startDate?.message} />
            <Input label="End Date" type="date" {...register('endDate')} error={errors.endDate?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Optional details…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update' : 'Create Event'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteEvent(deletingId)}
        title="Delete Event"
        message="Remove this event from the calendar?"
        confirmLabel="Delete"
      />
    </div>
  )
}

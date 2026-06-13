'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Calendar, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import TimetableForm from '@/components/forms/TimetableForm'
import { TimetableSlot, Day } from '@/types'
import toast from 'react-hot-toast'

const DAYS: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<TimetableSlot | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [tr, cr] = await Promise.all([
      fetch(`/api/timetable${selectedClass !== 'all' ? `?classId=${selectedClass}` : ''}`),
      fetch('/api/classes?simple=true'),
    ])
    const [td, cd] = await Promise.all([tr.json(), cr.json()])
    setSlots(td.data ?? [])
    setClasses(cd.data ?? [])
    setLoading(false)
  }, [selectedClass])

  useEffect(() => { fetchData() }, [fetchData])

  const doDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    const res = await fetch(`/api/timetable?id=${deleting.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Slot deleted'); setDeleting(null); fetchData() }
    else toast.error('Failed to delete slot')
    setDeleteLoading(false)
  }

  const slotsByDay = DAYS.reduce<Record<Day, TimetableSlot[]>>(
    (acc, d) => ({ ...acc, [d]: slots.filter((s) => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)) }),
    {} as Record<Day, TimetableSlot[]>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="all">All Classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add Slot</Button>
      </div>

      {loading ? <PageLoader /> : slots.length === 0 ? (
        <EmptyState icon={Calendar} title="No timetable slots" description="Start building the school timetable" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add Slot</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {DAYS.map((day) => (
            <div key={day} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-primary-600 text-white">
                <p className="font-semibold text-sm">{day.charAt(0) + day.slice(1).toLowerCase()}</p>
              </div>
              <div className="p-3 space-y-2">
                {slotsByDay[day].length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No classes</p>
                ) : (
                  slotsByDay[day].map((slot) => (
                    <div key={slot.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 group relative">
                      <p className="text-xs font-semibold text-slate-700">{slot.subject.name}</p>
                      <p className="text-xs text-slate-500">{slot.class.name}</p>
                      <p className="text-xs text-slate-400">{slot.startTime} – {slot.endTime}</p>
                      {slot.room && <p className="text-xs text-slate-400">Room {slot.room}</p>}
                      <p className="text-xs text-slate-500 truncate">{slot.teacher.name}</p>
                      <button onClick={() => setDeleting(slot)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400 transition"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Timetable Slot">
        <TimetableForm onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} message="Delete this timetable slot?" loading={deleteLoading} />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { TimetableSlot, Day } from '@/types'

const DAYS: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

export default function StudentTimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/timetable?mine=true').then((r) => r.json()).then((d) => {
      setSlots(d.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <PageLoader />
  if (slots.length === 0) return <EmptyState icon={Calendar} title="No timetable available" description="Your class timetable will appear here once it is set up." />

  const slotsByDay = DAYS.reduce<Record<Day, TimetableSlot[]>>(
    (acc, d) => ({ ...acc, [d]: slots.filter((s) => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)) }),
    {} as Record<Day, TimetableSlot[]>
  )

  return (
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
                <div key={slot.id} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-sm font-semibold text-emerald-900">{slot.subject.name}</p>
                  <p className="text-xs text-emerald-700">{slot.teacher.name}</p>
                  <p className="text-xs text-emerald-600 mt-1">{slot.startTime} – {slot.endTime}</p>
                  {slot.room && <p className="text-xs text-emerald-500">Room {slot.room}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

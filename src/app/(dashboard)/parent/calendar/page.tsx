'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'

interface SchoolEvent {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  type: string
}

const TYPE_COLORS: Record<string, string> = {
  HOLIDAY: 'bg-green-100 text-green-800 border-green-200',
  EXAM: 'bg-red-100 text-red-800 border-red-200',
  SPORTS: 'bg-blue-100 text-blue-800 border-blue-200',
  MEETING: 'bg-purple-100 text-purple-800 border-purple-200',
  OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function ParentCalendarPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events').then((r) => r.json()).then((j) => { setEvents(j.data ?? []); setLoading(false) })
  }, [])

  if (loading) return <div className="text-center py-16 text-slate-400">Loading…</div>

  const upcoming = events.filter((e) => new Date(e.startDate) >= new Date(new Date().setHours(0,0,0,0)))
  const past = events.filter((e) => new Date(e.startDate) < new Date(new Date().setHours(0,0,0,0)))

  const renderList = (list: SchoolEvent[], label: string) => (
    list.length === 0 ? null : (
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</h2>
        <div className="space-y-2">
          {list.map((e) => (
            <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
              <div className="text-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[52px]">
                <p className="text-xs text-slate-500">{new Date(e.startDate).toLocaleDateString('en-KE', { month: 'short' })}</p>
                <p className="text-xl font-bold text-slate-800 leading-tight">{new Date(e.startDate).getDate()}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800">{e.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[e.type]}`}>{e.type}</span>
                </div>
                {e.description && <p className="text-sm text-slate-500 mt-0.5">{e.description}</p>}
                {e.endDate && e.endDate !== e.startDate && (
                  <p className="text-xs text-slate-400 mt-1">Until {new Date(e.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long' })}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Calendar className="w-6 h-6 text-primary-600" /> School Calendar</h1>
        <p className="text-slate-500 text-sm mt-1">Upcoming term dates, exams and school events</p>
      </div>
      {events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No events scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {renderList(upcoming, 'Upcoming')}
          {renderList(past, 'Past Events')}
        </div>
      )}
    </div>
  )
}

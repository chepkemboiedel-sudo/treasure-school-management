'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, CalendarDays } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Assignment {
  id: string; title: string; description: string | null; dueDate: string
  class: { id: string; name: string; section: string | null }
  subject: { id: string; name: string } | null
  teacher: { id: string; name: string }
}
interface Child { id: string; name: string; studentId: string }

export default function ParentHomeworkPage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/parent/children').then((r) => r.json()).then((j) => {
      const kids: Child[] = j.data ?? []
      setChildren(kids)
      if (kids.length > 0) setSelectedChild(kids[0].id)
    })
  }, [session])

  useEffect(() => {
    if (!selectedChild) return
    setLoading(true)
    fetch(`/api/assignments?studentId=${selectedChild}`).then((r) => r.json()).then((j) => {
      setAssignments(j.data ?? []); setLoading(false)
    })
  }, [selectedChild])

  const isOverdue = (d: string) => new Date(d) < new Date()
  const upcoming = assignments.filter((a) => !isOverdue(a.dueDate))
  const overdue = assignments.filter((a) => isOverdue(a.dueDate))

  const renderGroup = (list: Assignment[], label: string, color: string) =>
    list.length === 0 ? null : (
      <div>
        <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${color}`}>{label}</h2>
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-medium text-slate-800">{a.title}</p>
                {a.subject && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">{a.subject.name}</span>}
              </div>
              {a.description && <p className="text-sm text-slate-500 mb-2">{a.description}</p>}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Due: {new Date(a.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span>Posted by {a.teacher.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary-600" /> Homework & Assignments</h1>
        <p className="text-slate-500 text-sm mt-1">Assignments posted by teachers for your child</p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChild(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${selectedChild === c.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'}`}
            >{c.name}</button>
          ))}
        </div>
      )}

      {loading ? <div className="text-center py-16 text-slate-400">Loading…</div> : assignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {renderGroup(overdue, 'Overdue', 'text-red-600')}
          {renderGroup(upcoming, 'Upcoming', 'text-slate-500')}
        </div>
      )}
    </div>
  )
}

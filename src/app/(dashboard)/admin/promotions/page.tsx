'use client'

import { useEffect, useState } from 'react'
import { ArrowRightCircle, Users, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface ClassOption {
  id: string
  name: string
  section: string | null
  level: string
  _count?: { students: number }
}

interface StudentRow {
  id: string
  name: string
  studentId: string
  photo: string | null
  class: { name: string; section: string | null } | null
}

const LEVEL_LABELS: Record<string, string> = {
  PRE_PRIMARY: 'Pre-Primary',
  LOWER_PRIMARY: 'Lower Primary',
  UPPER_PRIMARY: 'Upper Primary',
  JUNIOR_SECONDARY: 'Junior Secondary',
}

export default function PromotionsPage() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [fromClass, setFromClass] = useState('')
  const [toClass, setToClass] = useState('')
  const [students, setStudents] = useState<StudentRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/classes?all=true').then((r) => r.json()).then((j) => setClasses(j.data ?? []))
  }, [])

  useEffect(() => {
    if (!fromClass) { setStudents([]); setSelected(new Set()); return }
    setStudentsLoading(true)
    fetch(`/api/students?all=true&classId=${fromClass}`)
      .then((r) => r.json())
      .then((j) => {
        setStudents(j.data ?? [])
        setSelected(new Set((j.data ?? []).map((s: StudentRow) => s.id)))
      })
      .finally(() => setStudentsLoading(false))
  }, [fromClass])

  const toggleStudent = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected(selected.size === students.length ? new Set() : new Set(students.map((s) => s.id)))

  const handlePromote = async () => {
    if (!toClass || selected.size === 0) return
    if (!confirm(`Promote ${selected.size} student(s) to ${classes.find((c) => c.id === toClass)?.name} ${classes.find((c) => c.id === toClass)?.section ?? ''}? This cannot be undone.`)) return
    setLoading(true)
    const res = await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds: Array.from(selected), toClassId: toClass }),
    })
    const json = await res.json()
    setLoading(false)
    if (res.ok) {
      toast.success(`${json.data.promoted} student(s) promoted successfully`)
      setDone(true)
      setStudents([])
      setSelected(new Set())
      setFromClass('')
      setToClass('')
      setTimeout(() => setDone(false), 5000)
    } else {
      toast.error(json.error ?? 'Promotion failed')
    }
  }

  const groupedClasses = classes.reduce((acc, c) => {
    const key = c.level
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, ClassOption[]>)

  const toClassOptions = classes.filter((c) => c.id !== fromClass)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <p className="text-sm text-amber-800 font-medium">Promotion moves selected students from one class to another. Use this at the end of an academic year.</p>
      </div>

      {done && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-800 font-medium">Students promoted successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">1. Current Class (From)</h3>
          <select
            value={fromClass}
            onChange={(e) => { setFromClass(e.target.value); setToClass('') }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select class…</option>
            {Object.entries(groupedClasses).map(([level, cls]) => (
              <optgroup key={level} label={LEVEL_LABELS[level] ?? level}>
                {cls.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ''}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {fromClass && (
            <p className="text-xs text-slate-500">{students.length} student(s) in this class</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">2. Target Class (To)</h3>
          <select
            value={toClass}
            onChange={(e) => setToClass(e.target.value)}
            disabled={!fromClass}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <option value="">Select target class…</option>
            {Object.entries(groupedClasses).map(([level, cls]) => (
              <optgroup key={level} label={LEVEL_LABELS[level] ?? level}>
                {cls.filter((c) => c.id !== fromClass).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ''}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {fromClass && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-800">3. Select Students to Promote</h3>
              <Badge variant="blue">{selected.size} selected</Badge>
            </div>
            <button onClick={toggleAll} className="text-sm text-primary-600 hover:underline">
              {selected.size === students.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          {studentsLoading ? <PageLoader /> : students.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">No students in this class</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded border-slate-300"
                  />
                  <Avatar name={s.name} photo={s.photo ?? undefined} size="sm" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.studentId}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {fromClass && toClass && selected.size > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Users className="w-4 h-4 text-slate-400" />
            Promoting <strong>{selected.size}</strong> student(s) →{' '}
            <strong>{classes.find((c) => c.id === toClass)?.name} {classes.find((c) => c.id === toClass)?.section ?? ''}</strong>
          </div>
          <Button loading={loading} onClick={handlePromote}>
            <ArrowRightCircle className="w-4 h-4" /> Promote Students
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { ClipboardList, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Badge, { attendanceBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { AttendanceStatus } from '@/types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface ClassOption { id: string; name: string }
interface StudentRow { id: string; name: string; studentId: string; status: AttendanceStatus; note: string }

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(true)

  useEffect(() => {
    fetch('/api/classes?simple=true&mine=true').then((r) => r.json()).then((d) => {
      setClasses(d.data ?? [])
      setLoadingClasses(false)
    })
  }, [])

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return
    setLoading(true)
    const res = await fetch(`/api/students?classId=${selectedClass}&all=true`)
    const json = await res.json()
    setStudents((json.data ?? []).map((s: { id: string; name: string; studentId: string }) => ({
      id: s.id, name: s.name, studentId: s.studentId, status: 'PRESENT' as AttendanceStatus, note: '',
    })))
    setLoading(false)
  }, [selectedClass])

  useEffect(() => { loadStudents() }, [loadStudents])

  const updateRow = (id: string, field: 'status' | 'note', value: string) => {
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s))
  }

  const markAll = (status: AttendanceStatus) => setStudents((prev) => prev.map((s) => ({ ...s, status })))

  const save = async () => {
    if (!selectedClass || students.length === 0) return
    setSaving(true)
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: selectedClass, date, records: students.map((s) => ({ studentId: s.id, status: s.status, note: s.note })) }),
    })
    if (res.ok) toast.success('Attendance saved successfully')
    else { const j = await res.json(); toast.error(j.error ?? 'Failed to save') }
    setSaving(false)
  }

  if (loadingClasses) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select class…"
          />
          <Input
            label="Date"
            type="date"
            value={date}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={() => markAll('PRESENT')}>All Present</Button>
            <Button variant="outline" size="sm" onClick={() => markAll('ABSENT')}>All Absent</Button>
          </div>
        </div>
      </div>

      {!selectedClass ? (
        <EmptyState icon={ClipboardList} title="Select a class to mark attendance" />
      ) : loading ? (
        <PageLoader />
      ) : students.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No students in this class" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Mark Attendance</h2>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(date)} · {students.length} students</p>
            </div>
            <Button onClick={save} loading={saving}>
              <Check className="w-4 h-4" /> Save Attendance
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Student</th><th className="px-5 py-3 font-medium">ID</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Note</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{s.studentId}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((st) => (
                          <button key={st} onClick={() => updateRow(s.id, 'status', st)} className={`px-2 py-1 rounded text-xs font-medium transition ${s.status === st ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}>
                            <Badge variant={attendanceBadge(st)}>{st.charAt(0)}</Badge>
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input value={s.note} onChange={(e) => updateRow(s.id, 'note', e.target.value)} placeholder="Optional note" className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

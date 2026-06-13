'use client'

import { useEffect, useState, useCallback } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import Badge, { attendanceBadge } from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { AttendanceRecord } from '@/types'
import { formatDate } from '@/lib/utils'

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const perPage = 15

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/attendance?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}`)
    const json = await res.json()
    setRecords(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by student name…" className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Attendance Records</h2>
          <span className="text-sm text-slate-500">{total} records</span>
        </div>
        {loading ? <PageLoader /> : records.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No attendance records" description="Attendance records will appear here once teachers mark them." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Student</th><th className="px-5 py-3 font-medium">Class</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Note</th><th className="px-5 py-3 font-medium">Marked By</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3"><p className="font-medium text-slate-800">{r.student.name}</p><p className="text-xs text-slate-400">{r.student.studentId}</p></td>
                      <td className="px-5 py-3 text-slate-600">{r.class.name}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(r.date)}</td>
                      <td className="px-5 py-3"><Badge variant={attendanceBadge(r.status)}>{r.status}</Badge></td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{r.note ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{r.markedBy.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

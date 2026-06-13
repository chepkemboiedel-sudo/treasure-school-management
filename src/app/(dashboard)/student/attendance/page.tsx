'use client'

import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import Badge, { attendanceBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { AttendanceRecord } from '@/types'
import { formatDate } from '@/lib/utils'

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const perPage = 15

  useEffect(() => {
    setLoading(true)
    fetch(`/api/attendance?mine=true&page=${page}&perPage=${perPage}`).then((r) => r.json()).then((d) => {
      setRecords(d.data ?? [])
      setTotal(d.total ?? 0)
      setLoading(false)
    })
  }, [page])

  const presentCount = records.filter((r) => r.status === 'PRESENT').length
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Days', value: total, color: 'bg-blue-50 text-blue-700' },
          { label: 'Present', value: records.filter(r => r.status === 'PRESENT').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Attendance Rate', value: `${attendanceRate}%`, color: 'bg-amber-50 text-amber-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Attendance Records</h2></div>
        {loading ? <PageLoader /> : records.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No attendance records" />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Class</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Note</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-slate-700">{formatDate(r.date)}</td>
                    <td className="px-5 py-3 text-slate-600">{r.class.name}</td>
                    <td className="px-5 py-3"><Badge variant={attendanceBadge(r.status)}>{r.status}</Badge></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{r.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={Math.ceil(total / perPage)} total={total} perPage={perPage} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

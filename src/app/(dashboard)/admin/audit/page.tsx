'use client'

import { useEffect, useState, useCallback } from 'react'
import { ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react'

interface AuditLog {
  id: string; action: string; entity: string; entityId: string | null; details: string | null; createdAt: string
  user: { email: string; role: string; admin?: { name: string } | null; teacher?: { name: string } | null }
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  RESET_PASSWORD: 'bg-amber-100 text-amber-800',
  LOGIN: 'bg-slate-100 text-slate-700',
}

const ENTITIES = ['All', 'Student', 'Teacher', 'Fee', 'Grade', 'Attendance', 'User']

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [entityFilter, setEntityFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const perPage = 25

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), perPage: String(perPage) })
    if (entityFilter) params.set('entity', entityFilter)
    fetch(`/api/audit?${params}`).then((r) => r.json()).then((j) => {
      setLogs(j.data ?? []); setTotal(j.total ?? 0); setLoading(false)
    })
  }, [page, entityFilter])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / perPage)
  const userName = (log: AuditLog) => log.user.admin?.name ?? log.user.teacher?.name ?? log.user.email

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-primary-600" /> Audit Log</h1>
        <p className="text-slate-500 text-sm mt-1">Track all important changes in the system</p>
      </div>

      {/* Filter by entity */}
      <div className="flex gap-2 flex-wrap">
        {ENTITIES.map((e) => (
          <button
            key={e}
            onClick={() => { setEntityFilter(e === 'All' ? '' : e); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${(e === 'All' && !entityFilter) || e === entityFilter ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300'}`}
          >{e}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No audit logs yet. Changes will be recorded here as you use the system.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Time', 'User', 'Action', 'Entity', 'Details'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <br />{new Date(log.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{userName(log)}</p>
                      <p className="text-xs text-slate-400">{log.user.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLOR[log.action] ?? 'bg-slate-100 text-slate-700'}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.entity}
                      {log.entityId && <span className="text-slate-400 text-xs ml-1 font-mono">#{log.entityId.slice(-6)}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm max-w-xs truncate">{log.details ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{total} total entries</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-4 py-2 text-sm text-slate-600">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

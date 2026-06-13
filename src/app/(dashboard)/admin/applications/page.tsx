'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Trash2, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface Application {
  id: string
  studentName: string
  dob: string | null
  gender: string | null
  classApplying: string
  previousSchool: string | null
  parentName: string
  parentEmail: string
  parentPhone: string
  relationship: string | null
  message: string | null
  status: ApplicationStatus
  adminNotes: string | null
  createdAt: string
}

const statusVariant: Record<ApplicationStatus, 'yellow' | 'green' | 'red'> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
}

const statusLabel: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'ALL'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [noteValues, setNoteValues] = useState<Record<string, string>>({})

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const params = filterStatus !== 'ALL' ? `?status=${filterStatus}` : ''
    const res = await fetch(`/api/applications${params}`)
    const d = await res.json()
    const apps: Application[] = d.data ?? []
    setApplications(apps)
    const notes: Record<string, string> = {}
    apps.forEach((a) => { notes[a.id] = a.adminNotes ?? '' })
    setNoteValues(notes)
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    setActionLoading(id + status)
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes: noteValues[id] || undefined }),
    })
    if (res.ok) {
      toast.success(`Application ${statusLabel[status].toLowerCase()}`)
      fetchApplications()
    } else {
      toast.error('Failed to update application')
    }
    setActionLoading(null)
  }

  const deleteApplication = async () => {
    if (!deletingId) return
    setDeleteLoading(true)
    const res = await fetch(`/api/applications/${deletingId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Application deleted'); setDeletingId(null); fetchApplications() }
    else toast.error('Failed to delete application')
    setDeleteLoading(false)
  }

  const counts = {
    ALL: applications.length,
    PENDING: applications.filter((a) => a.status === 'PENDING').length,
    APPROVED: applications.filter((a) => a.status === 'APPROVED').length,
    REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
  }

  const displayed = filterStatus === 'ALL' ? applications : applications.filter((a) => a.status === filterStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary-600" /> Admissions Applications
        </h1>
        <p className="text-slate-500 text-sm mt-1">Review and process online applications from prospective learners</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([['ALL', 'Total', 'bg-slate-100 text-slate-700'], ['PENDING', 'Pending', 'bg-yellow-100 text-yellow-700'], ['APPROVED', 'Approved', 'bg-green-100 text-green-700'], ['REJECTED', 'Rejected', 'bg-red-100 text-red-700']] as const).map(([s, label, cls]) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-xl p-4 text-left transition border-2 ${filterStatus === s ? 'border-primary-500 shadow-sm' : 'border-transparent'} ${cls}`}
          >
            <p className="text-2xl font-bold">{counts[s]}</p>
            <p className="text-sm font-medium">{label}</p>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <PageLoader /> : displayed.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No {filterStatus !== 'ALL' ? statusLabel[filterStatus].toLowerCase() : ''} applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((app) => {
            const expanded = expandedId === app.id
            return (
              <div key={app.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Row header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setExpandedId(expanded ? null : app.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{app.studentName}</p>
                      <Badge variant={statusVariant[app.status]}>{statusLabel[app.status]}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">Applying for {app.classApplying} · Parent: {app.parentName} · {new Date(app.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {app.status === 'PENDING' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'APPROVED') }}
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {actionLoading === app.id + 'APPROVED' ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'REJECTED') }}
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {actionLoading === app.id + 'REJECTED' ? '…' : 'Reject'}
                        </button>
                      </>
                    )}
                    {app.status !== 'PENDING' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'PENDING') }}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 transition disabled:opacity-60"
                      >
                        <Clock className="w-3.5 h-3.5" /> Reset
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(app.id) }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Date of Birth</p><p className="text-slate-800">{app.dob ? new Date(app.dob).toLocaleDateString('en-KE') : '—'}</p></div>
                      <div><p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Gender</p><p className="text-slate-800">{app.gender ?? '—'}</p></div>
                      <div><p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Class Applying</p><p className="text-slate-800">{app.classApplying}</p></div>
                      <div><p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Previous School</p><p className="text-slate-800">{app.previousSchool || '—'}</p></div>
                      <div><p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Parent / Guardian</p><p className="text-slate-800">{app.parentName} ({app.relationship ?? 'Guardian'})</p></div>
                      <div><p className="text-slate-500 text-xs uppercase tracking-wide font-medium">Contact</p><p className="text-slate-800">{app.parentPhone}</p><a href={`mailto:${app.parentEmail}`} className="text-primary-600 text-xs underline">{app.parentEmail}</a></div>
                    </div>

                    {app.message && (
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-1">Message from Applicant</p>
                        <p className="text-slate-700 text-sm bg-white border border-slate-200 rounded-lg px-4 py-3">{app.message}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs uppercase tracking-wide font-medium text-slate-500 mb-1">Admin Notes</label>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={noteValues[app.id] ?? ''}
                          onChange={(e) => setNoteValues((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          placeholder="Add internal notes (visible only to admins)…"
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(app.id, app.status)}
                          loading={actionLoading === app.id + app.status}
                        >
                          Save notes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={deleteApplication}
        message="Permanently delete this application? This cannot be undone."
        loading={deleteLoading}
      />
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Bell, Trash2, Megaphone } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge, { roleBadge } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import AnnouncementForm from '@/components/forms/AnnouncementForm'
import { AnnouncementRecord } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<AnnouncementRecord | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const perPage = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/announcements?page=${page}&perPage=${perPage}`)
    const json = await res.json()
    setAnnouncements(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const doDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    const res = await fetch(`/api/announcements/${deleting.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Announcement deleted'); setDeleting(null); fetchData() }
    else toast.error('Failed to delete announcement')
    setDeleteLoading(false)
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />New Announcement</Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">All Announcements</h2>
          <span className="text-sm text-slate-500">{total} total</span>
        </div>
        {loading ? <PageLoader /> : announcements.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements yet" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Create Announcement</Button>} />
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {announcements.map((a) => {
                const authorName = a.author.admin?.name ?? a.author.teacher?.name ?? a.author.email
                return (
                  <div key={a.id} className="px-5 py-4 flex gap-4 hover:bg-slate-50 transition">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-slate-800">{a.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {a.targetRole && <Badge variant={roleBadge(a.targetRole)}>{a.targetRole}</Badge>}
                          <button onClick={() => setDeleting(a)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{a.content}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        By {authorName} · {formatDate(a.createdAt, 'MMM d, yyyy HH:mm')}
                        {a.class && ` · ${a.class.name}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Announcement">
        <AnnouncementForm onSuccess={() => { setModalOpen(false); fetchData() }} onCancel={() => setModalOpen(false)} />
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} message={`Delete announcement "${deleting?.title}"?`} loading={deleteLoading} />
    </div>
  )
}

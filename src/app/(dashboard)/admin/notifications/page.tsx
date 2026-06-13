'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Plus, Trash2, Megaphone } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  title: string
  message: string
  targetRole: string | null
  priority: string
  createdAt: string
  author: { admin: { name: string } | null }
}

const PRIORITY_COLORS: Record<string, 'green' | 'blue' | 'yellow' | 'red'> = {
  LOW: 'green',
  NORMAL: 'blue',
  HIGH: 'yellow',
  URGENT: 'red',
}

function NotificationForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', targetRole: '', priority: 'NORMAL' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        message: form.message,
        targetRole: form.targetRole || null,
        priority: form.priority,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (res.ok) { toast.success('Notification sent'); onSuccess() }
    else toast.error(json.error ?? 'Failed to send')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={4}
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder="Write your notification message…"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
          <select value={form.targetRole} onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Everyone</option>
            <option value="TEACHER">Teachers only</option>
            <option value="STUDENT">Students only</option>
            <option value="PARENT">Parents only</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}><Megaphone className="w-4 h-4" /> Send Notification</Button>
      </div>
    </form>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState<Notification | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filter, setFilter] = useState('')

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/notifications')
    const json = await res.json()
    setNotifications(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    const res = await fetch(`/api/notifications/${deleting.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Notification deleted'); setDeleting(null); fetchNotifications() }
    else toast.error('Failed to delete')
    setDeleteLoading(false)
  }

  const filtered = filter ? notifications.filter((n) => n.targetRole === filter || (!n.targetRole && filter === 'ALL')) : notifications

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          {['', 'TEACHER', 'STUDENT', 'PARENT'].map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === r ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {r === '' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}s
            </button>
          ))}
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Send Notification
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">All Notifications</h2>
          <span className="text-sm text-slate-500">{filtered.length} total</span>
        </div>
        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="Send a notification to get started" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Send Notification</Button>} />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((n) => (
              <div key={n.id} className="px-5 py-4 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.priority === 'URGENT' ? 'bg-red-500' : n.priority === 'HIGH' ? 'bg-amber-500' : n.priority === 'LOW' ? 'bg-slate-300' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-slate-800">{n.title}</h3>
                        <Badge variant={PRIORITY_COLORS[n.priority] ?? 'blue'}>{n.priority}</Badge>
                        {n.targetRole ? (
                          <Badge variant="yellow">{n.targetRole.charAt(0) + n.targetRole.slice(1).toLowerCase()}s</Badge>
                        ) : (
                          <Badge variant="green">Everyone</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {n.author?.admin?.name ?? 'Admin'} · {formatTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setDeleting(n)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Send Notification" size="md">
        <NotificationForm onSuccess={() => { setModalOpen(false); fetchNotifications() }} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} message={`Delete notification "${deleting?.title}"?`} loading={deleteLoading} />
    </div>
  )
}

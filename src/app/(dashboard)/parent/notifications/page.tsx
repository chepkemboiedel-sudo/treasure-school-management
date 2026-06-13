'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'

interface NotificationItem {
  id: string
  title: string
  message: string
  priority: string
  targetRole: string | null
  createdAt: string
}

const PRIORITY_DOT: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-amber-500',
  NORMAL: 'bg-blue-400',
  LOW: 'bg-slate-300',
}

const PRIORITY_BADGE: Record<string, 'red' | 'yellow' | 'blue' | 'green'> = {
  URGENT: 'red', HIGH: 'yellow', NORMAL: 'blue', LOW: 'green',
}

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((j) => setNotifications(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 60_000) return 'Just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours ago`
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {loading ? <PageLoader /> : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You have no notifications at this time." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">School Notifications</h2>
            <p className="text-xs text-slate-400 mt-0.5">{notifications.length} notification(s) from the school</p>
          </div>
          <div className="divide-y divide-slate-50">
            {notifications.map((n) => (
              <div key={n.id} className="px-5 py-4 hover:bg-slate-50 transition">
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[n.priority] ?? 'bg-slate-300'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-800">{n.title}</h3>
                      <Badge variant={PRIORITY_BADGE[n.priority] ?? 'blue'}>{n.priority}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatTime(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

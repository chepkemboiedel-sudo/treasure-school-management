'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Mail,
  Send,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Inbox,
  MessageSquare,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

interface Message {
  id: string
  subject: string
  body: string
  createdAt: string
  isRead: boolean
  sender: { id: string; name: string; role: string }
  recipient: { id: string; name: string; role: string }
}

interface TeacherOption {
  value: string
  label: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    TEACHER: 'bg-blue-100 text-blue-700',
    PARENT: 'bg-green-100 text-green-700',
    STUDENT: 'bg-amber-100 text-amber-700',
  }
  return map[role] ?? 'bg-slate-100 text-slate-600'
}

export default function MessagesPage() {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [deleting, setDeleting] = useState<Message | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Compose form state
  const [recipientOptions, setRecipientOptions] = useState<TeacherOption[]>([])
  const [composeForm, setComposeForm] = useState({ toUserId: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)

  const unreadCount = messages.filter((m) => !m.isRead && tab === 'inbox').length

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?box=${tab}`)
      const json = await res.json()
      setMessages(json.data ?? json ?? [])
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch('/api/teachers?all=true')
      const json = await res.json()
      const teachers: { userId?: string; name: string }[] = json.data ?? json ?? []
      setRecipientOptions(
        teachers
          .filter((t) => t.userId)
          .map((t) => ({ value: t.userId as string, label: t.name }))
      )
    } catch {
      setRecipientOptions([])
    }
  }, [])

  const openCompose = () => {
    setComposeForm({ toUserId: '', subject: '', body: '' })
    fetchRecipients()
    setComposeOpen(true)
  }

  const handleExpand = async (msg: Message) => {
    if (expanded === msg.id) {
      setExpanded(null)
      return
    }
    setExpanded(msg.id)
    // Mark as read if inbox message and unread
    if (tab === 'inbox' && !msg.isRead) {
      try {
        await fetch(`/api/messages/${msg.id}`, { method: 'PATCH' })
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        )
      } catch {
        // silently fail
      }
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeForm.toUserId) { toast.error('Please select a recipient'); return }
    if (!composeForm.subject.trim()) { toast.error('Subject is required'); return }
    if (!composeForm.body.trim()) { toast.error('Message body is required'); return }
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Message sent!')
        setComposeOpen(false)
        if (tab === 'sent') fetchMessages()
      } else {
        toast.error(json.error ?? 'Failed to send message')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/messages/${deleting.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Message deleted')
        setDeleting(null)
        setExpanded(null)
        fetchMessages()
      } else {
        toast.error('Failed to delete message')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const currentUnread = messages.filter((m) => !m.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => { setTab('inbox'); setExpanded(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'inbox'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Inbox
            {currentUnread > 0 && tab !== 'inbox' && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {currentUnread}
              </span>
            )}
            {tab === 'inbox' && currentUnread > 0 && (
              <span className="bg-white/25 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                {currentUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => { setTab('sent'); setExpanded(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'sent'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            Sent
          </button>
        </div>
        <Button onClick={openCompose}>
          <Plus className="w-4 h-4" /> Compose
        </Button>
      </div>

      {/* Message List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            {tab === 'inbox' ? (
              <>
                <Inbox className="w-4 h-4 text-slate-500" /> Inbox
                {currentUnread > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full px-2 py-0.5">
                    {currentUnread} unread
                  </span>
                )}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-slate-500" /> Sent Messages
              </>
            )}
          </h2>
          <span className="text-sm text-slate-500">{messages.length} total</span>
        </div>

        {loading ? (
          <PageLoader />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={tab === 'inbox' ? 'No messages received' : 'No messages sent'}
            description={tab === 'inbox' ? 'When someone sends you a message, it will appear here' : 'Messages you send will appear here'}
            action={<Button onClick={openCompose}><Plus className="w-4 h-4" /> Compose Message</Button>}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {messages.map((msg) => {
              const other = tab === 'inbox' ? msg.sender : msg.recipient
              const isExpanded = expanded === msg.id
              return (
                <div
                  key={msg.id}
                  className={`transition ${!msg.isRead && tab === 'inbox' ? 'bg-blue-50/40' : 'bg-white'} hover:bg-slate-50`}
                >
                  {/* Row */}
                  <button
                    className="w-full text-left px-5 py-4 flex items-start gap-3"
                    onClick={() => handleExpand(msg)}
                  >
                    {/* Unread dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!msg.isRead && tab === 'inbox' ? (
                        <span className="w-2 h-2 bg-blue-500 rounded-full block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full block" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-sm ${!msg.isRead && tab === 'inbox' ? 'text-slate-900' : 'text-slate-700'}`}>
                          {other?.name ?? 'Unknown'}
                        </span>
                        {other?.role && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleBadge(other.role)}`}>
                            {other.role.charAt(0) + other.role.slice(1).toLowerCase()}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className={`text-sm mt-0.5 ${!msg.isRead && tab === 'inbox' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {msg.subject}
                      </p>
                      {!isExpanded && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{msg.body}</p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-slate-400 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div className="px-5 pb-4 ml-5">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(msg)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="New Message" size="md">
        <form onSubmit={handleSend} className="space-y-4">
          <Select
            label="Recipient *"
            options={recipientOptions}
            placeholder="Select recipient..."
            value={composeForm.toUserId}
            onChange={(e) => setComposeForm((f) => ({ ...f, toUserId: e.target.value }))}
          />
          <Input
            label="Subject *"
            value={composeForm.subject}
            onChange={(e) => setComposeForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Message subject"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
            <textarea
              value={composeForm.body}
              onChange={(e) => setComposeForm((f) => ({ ...f, body: e.target.value }))}
              rows={6}
              required
              placeholder="Write your message here..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button type="submit" loading={sending}>
              <Send className="w-4 h-4" /> Send Message
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message={`Delete the message "${deleting?.subject}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  MessageSquare,
  Send,
  Users,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  ChevronDown,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

type RecipientType = 'all-parents' | 'all-teachers' | 'student-parent' | 'custom'

interface SendResult {
  number: string
  status: 'success' | 'error'
  message?: string
}

interface Teacher {
  name: string
  phone?: string
}

interface Parent {
  name: string
  phone?: string
  guardianPhone?: string
}

interface Student {
  id: string
  name: string
  studentId: string
  guardianPhone?: string
  guardianName?: string
}

const TEMPLATES = [
  {
    name: 'Fee Reminder',
    icon: '💰',
    body: `Dear {parent_name},\n\nThis is a reminder that the school fees for {student_name} are due by {due_date}. Outstanding amount: KES {amount}.\n\nPlease settle promptly to avoid inconvenience.\n\nThe Treasure School`,
  },
  {
    name: 'Attendance Alert',
    icon: '📋',
    body: `Dear {parent_name},\n\nThis is to inform you that {student_name} was absent from school today, {date}.\n\nPlease contact the school if this absence was unplanned.\n\nThe Treasure School`,
  },
  {
    name: 'Event Notice',
    icon: '📅',
    body: `Dear Parent/Guardian,\n\nWe wish to inform you of an upcoming school event: {event_name} on {event_date} at {event_time}.\n\nYour presence and support are warmly welcome.\n\nThe Treasure School`,
  },
  {
    name: 'General Notice',
    icon: '📢',
    body: `Dear Parent/Guardian,\n\nThis is an important notice from The Treasure School:\n\n{message}\n\nThank you for your continued support.\n\nThe Treasure School Administration`,
  },
]

const MAX_SMS_CHARS = 160

export default function SmsPage() {
  const [tab, setTab] = useState<'send' | 'templates'>('send')

  // Recipients
  const [recipientType, setRecipientType] = useState<RecipientType>('all-parents')
  const [studentSearch, setStudentSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const [customNumbers, setCustomNumbers] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SendResult[] | null>(null)

  const [parents, setParents] = useState<Parent[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const charCount = message.length
  const smsCount = Math.ceil(charCount / MAX_SMS_CHARS) || 1

  // Fetch parents + teachers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch('/api/parents?all=true'),
          fetch('/api/teachers?all=true'),
        ])
        const pJson = await pRes.json()
        const tJson = await tRes.json()
        setParents(pJson.data ?? pJson ?? [])
        setTeachers(tJson.data ?? tJson ?? [])
      } catch {
        // ignore
      }
    }
    fetchData()
  }, [])

  const searchStudents = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&perPage=8`)
      const json = await res.json()
      setSearchResults(json.data ?? [])
      setShowDropdown(true)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchStudents(studentSearch), 300)
    return () => clearTimeout(timer)
  }, [studentSearch, searchStudents])

  const getPhoneNumbers = (): string[] => {
    if (recipientType === 'all-parents') {
      return parents
        .map((p) => p.phone ?? p.guardianPhone ?? '')
        .filter(Boolean)
    }
    if (recipientType === 'all-teachers') {
      return teachers.map((t) => t.phone ?? '').filter(Boolean)
    }
    if (recipientType === 'student-parent' && selectedStudent?.guardianPhone) {
      return [selectedStudent.guardianPhone]
    }
    if (recipientType === 'custom') {
      return customNumbers
        .split(/[\n,]+/)
        .map((n) => n.trim())
        .filter(Boolean)
    }
    return []
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const phones = getPhoneNumbers()
    if (phones.length === 0) {
      toast.error('No phone numbers to send to')
      return
    }
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    setSending(true)
    setResults(null)
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phones, message }),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(`SMS sent to ${phones.length} recipient${phones.length !== 1 ? 's' : ''}`)
        setResults(json.results ?? phones.map((n) => ({ number: n, status: 'success' as const })))
        setMessage('')
      } else {
        toast.error(json.error ?? 'Failed to send SMS')
        if (json.results) setResults(json.results)
      }
    } catch {
      toast.error('Network error sending SMS')
    } finally {
      setSending(false)
    }
  }

  const copyTemplate = (body: string) => {
    setMessage(body)
    setTab('send')
    toast.success('Template copied to message box')
  }

  const recipientLabel: Record<RecipientType, string> = {
    'all-parents': 'All Parents',
    'all-teachers': 'All Teachers',
    'student-parent': "Specific Student's Parent",
    'custom': 'Custom Numbers',
  }

  const phoneCount = getPhoneNumbers().length

  return (
    <div className="space-y-6">
      {/* Warning banner if needed - shown always as advisory */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <span>
          SMS requires <span className="font-mono font-semibold">AT_API_KEY</span> and{' '}
          <span className="font-mono font-semibold">AT_USERNAME</span> in your{' '}
          <span className="font-mono">.env</span> file. Get your keys at{' '}
          <a
            href="https://africastalking.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-amber-900"
          >
            africastalking.com
          </a>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setTab('send')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'send' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" /> Send SMS
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'templates' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Templates
        </button>
      </div>

      {tab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <Send className="w-4 h-4 text-slate-500" /> Compose SMS
            </h2>
            <form onSubmit={handleSend} className="space-y-5">
              {/* Recipient Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(recipientLabel) as RecipientType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setRecipientType(type); setSelectedStudent(null); setStudentSearch('') }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition text-left ${
                        recipientType === type
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'all-parents' && <Users className="w-3.5 h-3.5" />}
                      {type === 'all-teachers' && <Users className="w-3.5 h-3.5" />}
                      {type === 'student-parent' && <User className="w-3.5 h-3.5" />}
                      {type === 'custom' && <Phone className="w-3.5 h-3.5" />}
                      {recipientLabel[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student search */}
              {recipientType === 'student-parent' && (
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Search Student</label>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null) }}
                    placeholder="Type student name or ID..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  />
                  {searching && (
                    <p className="text-xs text-slate-400 mt-1">Searching...</p>
                  )}
                  {showDropdown && searchResults.length > 0 && !selectedStudent && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                      {searchResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s)
                            setStudentSearch(s.name)
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                        >
                          <p className="font-medium text-sm text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.studentId} · Parent: {s.guardianName} · {s.guardianPhone ?? 'No phone'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedStudent && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                      <p className="font-medium text-green-800">{selectedStudent.guardianName}</p>
                      <p className="text-green-600 text-xs">{selectedStudent.guardianPhone ?? 'No phone on record'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Custom numbers */}
              {recipientType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Numbers</label>
                  <textarea
                    value={customNumbers}
                    onChange={(e) => setCustomNumbers(e.target.value)}
                    rows={3}
                    placeholder="+254700000001, +254700000002&#10;One per line or comma-separated"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {getPhoneNumbers().length} number{getPhoneNumbers().length !== 1 ? 's' : ''} entered
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Message *</label>
                  <span className={`text-xs ${charCount > MAX_SMS_CHARS ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                    {charCount}/{MAX_SMS_CHARS} chars · {smsCount} SMS
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                  placeholder="Type your SMS message here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition"
                />
                {charCount > MAX_SMS_CHARS && (
                  <p className="text-xs text-amber-600 mt-1">
                    Message exceeds 160 characters — will be sent as {smsCount} SMS segments.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-slate-500">
                  {phoneCount > 0 ? (
                    <span className="text-slate-700 font-medium">{phoneCount} recipient{phoneCount !== 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-amber-600">No recipients selected</span>
                  )}
                </p>
                <Button type="submit" loading={sending} disabled={phoneCount === 0}>
                  <Send className="w-4 h-4" /> Send SMS
                </Button>
              </div>
            </form>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" /> Delivery Report
            </h3>
            {results === null ? (
              <div className="text-center py-10 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Send an SMS to see the delivery report here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      r.status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}
                  >
                    {r.status === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs">{r.number}</span>
                    {r.message && <span className="text-xs opacity-75 ml-auto">{r.message}</span>}
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  {results.filter((r) => r.status === 'success').length} sent ·{' '}
                  {results.filter((r) => r.status === 'error').length} failed
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Message Templates</h2>
            <p className="text-sm text-slate-500 mt-0.5">Click a template to copy it to the message composer.</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.name}
                className="border border-slate-200 rounded-xl p-4 hover:border-primary-300 hover:bg-primary-50/30 transition group cursor-pointer"
                onClick={() => copyTemplate(tpl.body)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tpl.icon}</span>
                    <h3 className="font-semibold text-slate-800">{tpl.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyTemplate(tpl.body) }}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 transition font-medium"
                  >
                    <Copy className="w-3.5 h-3.5" /> Use Template
                  </button>
                </div>
                <pre className="text-xs text-slate-500 mt-3 whitespace-pre-wrap font-sans leading-relaxed line-clamp-5 border-t border-slate-100 pt-3">
                  {tpl.body}
                </pre>
                <p className="text-xs text-slate-400 mt-2 italic">
                  Placeholders like {'{student_name}'} should be replaced before sending.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

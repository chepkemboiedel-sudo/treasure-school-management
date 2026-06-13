'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, DollarSign, Trash2, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge, { paymentBadge } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import FeeStructureForm from '@/components/forms/FeeStructureForm'
import FeePaymentForm from '@/components/forms/FeePaymentForm'
import { FeePaymentRecord } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface FeeStructure {
  id: string
  name: string
  amount: string
  feeType: string
  level: string | null
  class?: { name: string } | null
  term: { name: string }
  isActive: boolean
}

const LEVEL_LABEL: Record<string, string> = {
  PRE_PRIMARY: 'Pre-Primary',
  LOWER_PRIMARY: 'Lower Primary',
  UPPER_PRIMARY: 'Upper Primary',
  JUNIOR_SECONDARY: 'Junior Secondary',
}

const LEVEL_BADGE_COLOR: Record<string, 'blue' | 'green' | 'yellow' | 'red'> = {
  PRE_PRIMARY: 'green',
  LOWER_PRIMARY: 'blue',
  UPPER_PRIMARY: 'yellow',
  JUNIOR_SECONDARY: 'red',
}

// Order for grouping display
const LEVEL_ORDER = ['PRE_PRIMARY', 'LOWER_PRIMARY', 'UPPER_PRIMARY', 'JUNIOR_SECONDARY', '__CLASS__', '__ALL__']

function scopeLabel(s: FeeStructure) {
  if (s.level) return LEVEL_LABEL[s.level] ?? s.level
  if (s.class?.name) return s.class.name
  return 'All Students'
}

function scopeBadge(s: FeeStructure): 'blue' | 'green' | 'yellow' | 'red' | 'gray' {
  if (s.level) return LEVEL_BADGE_COLOR[s.level] ?? 'blue'
  if (s.class?.name) return 'blue'
  return 'gray'
}

function groupKey(s: FeeStructure) {
  if (s.level) return s.level
  if (s.class?.name) return '__CLASS__'
  return '__ALL__'
}

function groupLabel(key: string) {
  if (LEVEL_LABEL[key]) return LEVEL_LABEL[key]
  if (key === '__CLASS__') return 'Specific Classes'
  return 'All Students'
}

export default function FeesPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [payments, setPayments] = useState<FeePaymentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'structures' | 'payments'>('structures')
  const [structureModal, setStructureModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [deleting, setDeleting] = useState<FeeStructure | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [levelFilter, setLevelFilter] = useState<string>('ALL')
  const perPage = 15

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [sr, pr] = await Promise.all([
      fetch('/api/fees/structures'),
      fetch(`/api/fees/payments?page=${page}&perPage=${perPage}`),
    ])
    const [sd, pd] = await Promise.all([sr.json(), pr.json()])
    setStructures(sd.data ?? [])
    setPayments(pd.data ?? [])
    setTotal(pd.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDeleteStructure = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    const res = await fetch(`/api/fees/structures/${deleting.id}`, { method: 'DELETE' })
    setDeleteLoading(false)
    if (res.ok) { toast.success('Fee structure deleted'); setDeleting(null); fetchData() }
    else toast.error('Failed to delete — it may have existing payments')
  }

  const totalPages = Math.ceil(total / perPage)

  const exportPaymentsCSV = () => {
    const rows = [['Receipt', 'Student', 'Fee Structure', 'Amount (KES)', 'Date', 'Method', 'M-Pesa Code', 'Status']]
    for (const p of payments) {
      rows.push([p.receiptNumber, p.student?.name ?? '', p.feeStructure?.name ?? '', p.amount, p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-KE') : '', p.paymentMethod, (p as { mpesaCode?: string }).mpesaCode ?? '', p.status])
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'fee_payments.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Group structures for display
  const filteredStructures = levelFilter === 'ALL'
    ? structures
    : levelFilter === '__ALL__'
      ? structures.filter((s) => !s.level && !s.class)
      : levelFilter === '__CLASS__'
        ? structures.filter((s) => !!s.class)
        : structures.filter((s) => s.level === levelFilter)

  const grouped = LEVEL_ORDER.reduce((acc, key) => {
    const items = filteredStructures.filter((s) => groupKey(s) === key)
    if (items.length > 0) acc[key] = items
    return acc
  }, {} as Record<string, FeeStructure[]>)

  // Summary totals per bracket
  const bracketTotals = Object.entries(LEVEL_LABEL).map(([key, label]) => ({
    key, label,
    count: structures.filter((s) => s.level === key).length,
    total: structures
      .filter((s) => s.level === key && s.feeType === 'TUITION')
      .reduce((sum, s) => sum + Number(s.amount), 0),
  }))

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['structures', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'structures' ? 'Fee Structure' : 'Payments'}
          </button>
        ))}
      </div>

      {activeTab === 'structures' && (
        <>
          {/* Bracket summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bracketTotals.map((b) => (
              <div
                key={b.key}
                onClick={() => setLevelFilter(levelFilter === b.key ? 'ALL' : b.key)}
                className={`cursor-pointer rounded-xl border p-4 transition ${levelFilter === b.key ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300'} shadow-sm`}
              >
                <Badge variant={LEVEL_BADGE_COLOR[b.key]}>{b.label}</Badge>
                <p className="text-2xl font-bold text-slate-800 mt-2">{b.count}</p>
                <p className="text-xs text-slate-500">fee structure{b.count !== 1 ? 's' : ''}</p>
                {b.total > 0 && (
                  <p className="text-xs text-slate-600 font-medium mt-1">Tuition: {formatCurrency(b.total)}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {['ALL', 'PRE_PRIMARY', 'LOWER_PRIMARY', 'UPPER_PRIMARY', 'JUNIOR_SECONDARY', '__CLASS__', '__ALL__'].map((key) => (
                <button
                  key={key}
                  onClick={() => setLevelFilter(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${levelFilter === key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {key === 'ALL' ? 'All' : groupLabel(key)}
                </button>
              ))}
            </div>
            <Button onClick={() => setStructureModal(true)}>
              <Plus className="w-4 h-4" /> Add Fee Structure
            </Button>
          </div>

          <div className="space-y-4">
            {loading ? <PageLoader /> : filteredStructures.length === 0 ? (
              <EmptyState icon={DollarSign} title="No fee structures" description="Add a fee structure to get started" action={<Button onClick={() => setStructureModal(true)}><Plus className="w-4 h-4" />Add</Button>} />
            ) : (
              Object.entries(grouped).map(([key, items]) => (
                <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                    <Badge variant={LEVEL_BADGE_COLOR[key] ?? 'gray'}>{groupLabel(key)}</Badge>
                    <span className="text-sm text-slate-400">{items.length} structure{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-5 py-3 font-medium">Fee Name</th>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Applies To</th>
                        <th className="px-5 py-3 font-medium">Term</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                          <td className="px-5 py-3"><Badge variant="blue">{s.feeType}</Badge></td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{formatCurrency(s.amount)}</td>
                          <td className="px-5 py-3">
                            <Badge variant={scopeBadge(s)}>{scopeLabel(s)}</Badge>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{s.term.name}</td>
                          <td className="px-5 py-3">
                            <Badge variant={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => setDeleting(s)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'payments' && (
        <>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={exportPaymentsCSV} className="flex items-center gap-2"><Download className="w-4 h-4" />Export CSV</Button>
            <Button onClick={() => setPaymentModal(true)}><Plus className="w-4 h-4" />Record Payment</Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Payment Records</h2>
              <span className="text-sm text-slate-500">{total} records</span>
            </div>
            {loading ? <PageLoader /> : payments.length === 0 ? (
              <EmptyState icon={DollarSign} title="No payments recorded" action={<Button onClick={() => setPaymentModal(true)}><Plus className="w-4 h-4" />Record Payment</Button>} />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-5 py-3 font-medium">Student</th>
                        <th className="px-5 py-3 font-medium">Fee</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Method</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium">Receipt</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-800">{p.student.name}</p>
                            <p className="text-xs text-slate-400">{p.student.studentId}</p>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{p.feeStructure.name}</td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{formatCurrency(p.amount)}</td>
                          <td className="px-5 py-3 text-slate-600">{p.paymentMethod}</td>
                          <td className="px-5 py-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.receiptNumber}</td>
                          <td className="px-5 py-3"><Badge variant={paymentBadge(p.status)}>{p.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onPageChange={setPage} />
              </>
            )}
          </div>
        </>
      )}

      <Modal isOpen={structureModal} onClose={() => setStructureModal(false)} title="Add Fee Structure" size="md">
        <FeeStructureForm onSuccess={() => { setStructureModal(false); fetchData() }} onCancel={() => setStructureModal(false)} />
      </Modal>
      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment">
        <FeePaymentForm onSuccess={() => { setPaymentModal(false); fetchData() }} onCancel={() => setPaymentModal(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDeleteStructure}
        message={`Delete fee structure "${deleting?.name}"? This cannot be undone if payments exist against it.`}
        loading={deleteLoading}
      />
    </div>
  )
}

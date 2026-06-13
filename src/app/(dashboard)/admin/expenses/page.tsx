'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Download, Wallet, TrendingDown, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

type Category = 'SALARIES' | 'UTILITIES' | 'SUPPLIES' | 'MAINTENANCE' | 'TRANSPORT' | 'OTHER'

interface Expense {
  id: string
  title: string
  category: Category
  amount: string | number
  date: string
  payee: string
  receiptNo?: string | null
  description?: string | null
}

const CATEGORIES: Category[] = ['SALARIES', 'UTILITIES', 'SUPPLIES', 'MAINTENANCE', 'TRANSPORT', 'OTHER']

const categoryBadge = (cat: Category) => {
  const map: Record<Category, 'purple' | 'blue' | 'green' | 'orange' | 'yellow' | 'gray'> = {
    SALARIES: 'purple', UTILITIES: 'blue', SUPPLIES: 'green',
    MAINTENANCE: 'orange', TRANSPORT: 'yellow', OTHER: 'gray',
  }
  return map[cat] ?? 'gray'
}

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: z.enum(['SALARIES', 'UTILITIES', 'SUPPLIES', 'MAINTENANCE', 'TRANSPORT', 'OTHER']),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  payee: z.string().min(1, 'Payee is required'),
  receiptNo: z.string().optional(),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(n)

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [catFilter, setCatFilter] = useState<string>('ALL')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'OTHER', date: new Date().toISOString().slice(0, 10) },
  })

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/expenses')
      const data = await res.json()
      setExpenses(data.data ?? [])
    } catch { toast.error('Failed to load expenses') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const onSubmit = async (values: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      toast.success('Expense recorded')
      reset({ category: 'OTHER', date: new Date().toISOString().slice(0, 10) })
      setModal(false)
      fetchExpenses()
    } catch { toast.error('Failed to add expense') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/expenses/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Expense deleted')
      setDeleting(null)
      fetchExpenses()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteLoading(false) }
  }

  const exportCSV = () => {
    const rows = [['Date', 'Title', 'Category', 'Payee', 'Receipt No', 'Amount (KES)', 'Description']]
    for (const e of expenses) {
      rows.push([
        new Date(e.date).toLocaleDateString('en-KE'),
        e.title, e.category, e.payee,
        e.receiptNo ?? '', String(Number(e.amount)),
        e.description ?? '',
      ])
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const now = new Date()
  const thisMonth = expenses
    .filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, e) => s + Number(e.amount), 0)

  const catTotals = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(c => c.total > 0)

  const filtered = catFilter === 'ALL' ? expenses : expenses.filter(e => e.category === catFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and manage school expenditures</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => { reset({ category: 'OTHER', date: new Date().toISOString().slice(0, 10) }); setModal(true) }}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-500">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmt(total)}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-500">This Month</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmt(thisMonth)}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-5">
          <p className="text-sm font-medium text-slate-600 mb-3">By Category</p>
          <div className="space-y-1.5">
            {catTotals.slice(0, 4).map(c => (
              <div key={c.cat} className="flex items-center justify-between">
                <Badge variant={categoryBadge(c.cat)}>{c.cat}</Badge>
                <span className="text-xs font-medium text-slate-600">{fmt(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['ALL', ...CATEGORIES].map(c => (
          <button key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${catFilter === c ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Expenses</h2>
          <span className="text-sm text-slate-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No expenses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Payee</th>
                  <th className="px-5 py-3 font-medium">Receipt No</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 text-slate-500">{new Date(e.date).toLocaleDateString('en-KE')}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{e.title}</p>
                      {e.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{e.description}</p>}
                    </td>
                    <td className="px-5 py-3"><Badge variant={categoryBadge(e.category)}>{e.category}</Badge></td>
                    <td className="px-5 py-3 text-slate-600">{e.payee}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{e.receiptNo ?? '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(Number(e.amount))}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setDeleting(e)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50/50">
                <tr>
                  <td colSpan={5} className="px-5 py-3 text-sm font-medium text-slate-600">
                    {catFilter !== 'ALL' ? `${catFilter} Total` : 'Grand Total'}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">
                    {fmt(filtered.reduce((s, e) => s + Number(e.amount), 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Expense" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" {...register('title')} error={errors.title?.message} placeholder="e.g. Staff salaries — June" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              {...register('category')}
              error={errors.category?.message}
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
            />
            <Input label="Amount (KES)" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
            <Input label="Payee" {...register('payee')} error={errors.payee?.message} placeholder="Person / company paid" />
          </div>
          <Input label="Receipt No (optional)" {...register('receiptNo')} placeholder="Receipt or invoice number" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Additional details..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Delete expense "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

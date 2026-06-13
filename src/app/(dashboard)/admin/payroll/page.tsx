'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Plus, Trash2, CheckCircle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

interface SalaryRecord {
  id: string; month: number; year: number; basicSalary: string; allowances: string; deductions: string; netSalary: string; status: string; paidDate: string | null; notes: string | null
  teacher: { id: string; name: string; employeeId: string }
}
interface TeacherOption { id: string; name: string; employeeId: string }

const schema = z.object({
  teacherId: z.string().min(1, 'Teacher required'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
  basicSalary: z.coerce.number().min(0, 'Required'),
  allowances: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const now = new Date()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => ({ value: String(y), label: String(y) }))
const MONTH_OPTIONS = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))

function formatKES(n: string | number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(Number(n))
}

export default function PayrollPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()))
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { month: now.getMonth() + 1, year: now.getFullYear(), allowances: 0, deductions: 0 },
  })
  const basic = watch('basicSalary') || 0
  const allowances = watch('allowances') || 0
  const deductions = watch('deductions') || 0
  const net = Number(basic) + Number(allowances) - Number(deductions)

  const load = () => {
    setLoading(true)
    fetch(`/api/payroll?month=${filterMonth}&year=${filterYear}`).then((r) => r.json()).then((j) => { setRecords(j.data ?? []); setLoading(false) })
  }

  useEffect(() => { load() }, [filterMonth, filterYear])
  useEffect(() => { fetch('/api/teachers?all=true').then((r) => r.json()).then((j) => setTeachers(j.data ?? [])) }, [])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const res = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed to create record'); return }
    toast.success('Salary record created'); setShowModal(false); load()
  }

  const markPaid = async (id: string) => {
    const res = await fetch(`/api/payroll/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAID' }) })
    if (res.ok) { toast.success('Marked as paid'); load() }
  }

  const deleteRecord = async (id: string) => {
    await fetch(`/api/payroll/${id}`, { method: 'DELETE' })
    toast.success('Record deleted'); setDeletingId(null); load()
  }

  const totalNet = records.reduce((a, r) => a + Number(r.netSalary), 0)
  const paidCount = records.filter((r) => r.status === 'PAID').length
  const teacherOptions = teachers.map((t) => ({ value: t.id, label: `${t.name} (${t.employeeId})` }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary-600" /> Payroll</h1>
          <p className="text-slate-500 text-sm mt-1">Teacher salary records and payment tracking</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Salary Record</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          {YEAR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="text-sm text-slate-500">{MONTHS[parseInt(filterMonth) - 1]} {filterYear}</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Payroll', value: formatKES(totalNet) },
          { label: 'Paid', value: `${paidCount} / ${records.length}` },
          { label: 'Pending', value: formatKES(records.filter((r) => r.status === 'PENDING').reduce((a, r) => a + Number(r.netSalary), 0)) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <div className="text-center py-16 text-slate-400">Loading…</div> : records.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No salary records for this period.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Teacher', 'Basic', 'Allowances', 'Deductions', 'Net', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{r.teacher.name}</p>
                    <p className="text-xs text-slate-400">{r.teacher.employeeId}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatKES(r.basicSalary)}</td>
                  <td className="px-4 py-3 text-green-700">+{formatKES(r.allowances)}</td>
                  <td className="px-4 py-3 text-red-700">-{formatKES(r.deductions)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatKES(r.netSalary)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === 'PAID' ? 'green' : 'yellow'}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {r.status === 'PENDING' && (
                        <button onClick={() => markPaid(r.id)} className="flex items-center gap-1 text-xs px-2 py-1 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition">
                          <CheckCircle className="w-3 h-3" /> Mark Paid
                        </button>
                      )}
                      {r.status === 'PAID' && r.paidDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(r.paidDate).toLocaleDateString('en-KE')}</span>
                      )}
                      <button onClick={() => setDeletingId(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Salary Record" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Teacher *" {...register('teacherId')} error={errors.teacherId?.message} options={teacherOptions} placeholder="Select teacher…" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Month *" {...register('month')} error={errors.month?.message} options={MONTH_OPTIONS} />
            <Select label="Year *" {...register('year')} error={errors.year?.message} options={YEAR_OPTIONS} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Basic Salary (KES) *" type="number" {...register('basicSalary')} error={errors.basicSalary?.message} />
            <Input label="Allowances" type="number" {...register('allowances')} />
            <Input label="Deductions" type="number" {...register('deductions')} />
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            Net Salary: <span className="font-bold text-slate-900">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(net)}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Optional…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Record</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteRecord(deletingId)} title="Delete Record" message="Remove this salary record?" confirmLabel="Delete" />
    </div>
  )
}

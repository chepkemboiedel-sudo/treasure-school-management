'use client'

import { useEffect, useState, useCallback } from 'react'
import { DoorOpen, Plus, LogOut, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'

interface Visitor {
  id: string; name: string; phone: string | null; purpose: string; hostName: string | null; timeIn: string; timeOut: string | null
}

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().optional(),
  purpose: z.string().min(1, 'Purpose required'),
  hostName: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [total, setTotal] = useState(0)
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/visitors?date=${dateFilter}`).then((r) => r.json()).then((j) => {
      setVisitors(j.data ?? []); setTotal(j.total ?? 0); setLoading(false)
    })
  }, [dateFilter])

  useEffect(() => { load() }, [load])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const res = await fetch('/api/visitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed'); return }
    toast.success('Visitor checked in'); setShowModal(false); reset(); load()
  }

  const checkOut = async (id: string) => {
    const res = await fetch(`/api/visitors/${id}`, { method: 'PATCH' })
    if (res.ok) { toast.success('Visitor checked out'); load() }
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
  const duration = (timeIn: string, timeOut: string | null) => {
    const end = timeOut ? new Date(timeOut) : new Date()
    const mins = Math.floor((end.getTime() - new Date(timeIn).getTime()) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const inCount = visitors.filter((v) => !v.timeOut).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><DoorOpen className="w-6 h-6 text-primary-600" /> Visitor Log</h1>
          <p className="text-slate-500 text-sm mt-1">Record and track school visitors</p>
        </div>
        <Button onClick={() => { reset(); setShowModal(true) }} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Check In Visitor</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Today', value: total },
          { label: 'Currently Inside', value: inCount },
          { label: 'Checked Out', value: total - inCount },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Date:</label>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      {loading ? <div className="text-center py-16 text-slate-400">Loading…</div> : visitors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No visitors recorded for this date.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Visitor', 'Phone', 'Purpose', 'Visiting', 'Time In', 'Time Out', 'Duration', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visitors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{v.name}</td>
                  <td className="px-4 py-3 text-slate-600">{v.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{v.purpose}</td>
                  <td className="px-4 py-3 text-slate-600">{v.hostName ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{formatTime(v.timeIn)}</td>
                  <td className="px-4 py-3 text-slate-600">{v.timeOut ? formatTime(v.timeOut) : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{duration(v.timeIn, v.timeOut)}</td>
                  <td className="px-4 py-3"><Badge variant={v.timeOut ? 'green' : 'blue'}>{v.timeOut ? 'Checked Out' : 'Inside'}</Badge></td>
                  <td className="px-4 py-3">
                    {!v.timeOut && (
                      <button onClick={() => checkOut(v.id)} className="flex items-center gap-1 text-xs px-2 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                        <LogOut className="w-3 h-3" /> Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Check In Visitor" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Visitor Name *" {...register('name')} error={errors.name?.message} placeholder="John Kamau" />
            <Input label="Phone Number" {...register('phone')} placeholder="+254 700 000 000" />
          </div>
          <Input label="Purpose of Visit *" {...register('purpose')} error={errors.purpose?.message} placeholder="Parent meeting, delivery, official…" />
          <Input label="Who Are They Visiting?" {...register('hostName')} placeholder="Mr. Omondi, Admin Office…" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Check In</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

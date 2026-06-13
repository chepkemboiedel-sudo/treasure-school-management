'use client'

import { useEffect, useState } from 'react'
import { DollarSign } from 'lucide-react'
import Badge, { paymentBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { FeePaymentRecord } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function StudentFeesPage() {
  const [payments, setPayments] = useState<FeePaymentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fees/payments?mine=true').then((r) => r.json()).then((d) => {
      setPayments(d.data ?? [])
      setLoading(false)
    })
  }, [])

  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0)
  const totalDue = payments.filter((p) => p.status !== 'PAID').reduce((s, p) => s + Number(p.feeStructure.amount), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          <p className="text-sm text-emerald-600 mt-1">Total Paid</p>
        </div>
        <div className="bg-red-50 rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDue)}</p>
          <p className="text-sm text-red-600 mt-1">Outstanding</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Payment History</h2></div>
        {loading ? <PageLoader /> : payments.length === 0 ? (
          <EmptyState icon={DollarSign} title="No fee records" description="Your fee payment records will appear here." />
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Fee</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Method</th><th className="px-5 py-3 font-medium">Receipt</th><th className="px-5 py-3 font-medium">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3 font-medium text-slate-800">{p.feeStructure.name}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                  <td className="px-5 py-3 text-slate-600">{p.paymentMethod}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.receiptNumber}</td>
                  <td className="px-5 py-3"><Badge variant={paymentBadge(p.status)}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, Printer, Receipt, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

interface Payment {
  id: string
  amount: string
  paymentDate: string
  method: string
  reference?: string
  mpesaCode?: string
  term?: { name: string; year: number }
  feeStructure?: { name: string; amount: string }
  student: { name: string; studentId: string; class?: { name: string } }
}

function FeeReceipt({ payment, receiptNo }: { payment: Payment; receiptNo: number }) {
  const schoolName = 'The Treasure School'
  const ref = payment.mpesaCode ?? payment.reference ?? `RCP-${String(receiptNo).padStart(5, '0')}`

  return (
    <div className="receipt-item" style={{
      width: '380px', minHeight: '480px',
      border: '1px solid #e5e7eb', borderRadius: '12px',
      fontFamily: 'system-ui, sans-serif', padding: '0',
      background: 'white', overflow: 'hidden', pageBreakAfter: 'always',
    }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '20px 24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>{schoolName}</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Official Fee Receipt</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Receipt No.</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{ref}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        {/* Paid stamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#ecfdf5', borderRadius: 8, marginBottom: 16, border: '1px solid #d1fae5' }}>
          <CheckCircle style={{ width: 18, height: 18, color: '#059669', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>Payment Received</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(payment.paymentDate).toLocaleString('en-KE', { dateStyle: 'long', timeStyle: 'short' })}</div>
          </div>
        </div>

        {/* Student details */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Student Details</div>
          <Row label="Name" value={payment.student.name} />
          <Row label="Student ID" value={payment.student.studentId} mono />
          {payment.student.class && <Row label="Class" value={payment.student.class.name} />}
        </div>

        {/* Payment details */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Payment Details</div>
          {payment.feeStructure && <Row label="Fee Type" value={payment.feeStructure.name} />}
          {payment.term && <Row label="Term" value={`${payment.term.name} ${payment.term.year}`} />}
          <Row label="Method" value={payment.method} />
          {payment.mpesaCode && <Row label="M-Pesa Code" value={payment.mpesaCode} mono />}
          {payment.reference && <Row label="Reference" value={payment.reference} mono />}
        </div>

        {/* Amount */}
        <div style={{ background: 'linear-gradient(135deg,#f3f4f6,#faf5ff)', borderRadius: 10, padding: '14px 16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Amount Paid</div>
          <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KES {parseFloat(payment.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 24px', borderTop: '1px dashed #e5e7eb', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
          This is a computer-generated receipt and is valid without a signature.<br />
          {schoolName} — Generated {new Date().toLocaleDateString('en-KE')}
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

export default function FeeReceiptsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true)
      const res = await fetch('/api/fees/payments?all=true&include=student,term,feeStructure')
      const json = await res.json()
      setPayments(json.data ?? [])
      setLoading(false)
    }
    fetchPayments()
  }, [])

  const filtered = payments.filter(p =>
    !search ||
    p.student.name.toLowerCase().includes(search.toLowerCase()) ||
    p.student.studentId.includes(search) ||
    (p.mpesaCode ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.reference ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }

  const selectedPayments = payments.filter(p => selected.has(p.id))

  const handlePrint = () => window.print()

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-area { display: flex !important; flex-wrap: wrap; gap: 16px; padding: 16px; }
          .receipt-item { page-break-inside: avoid; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <div className="space-y-6 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fee Receipts</h1>
            <p className="text-sm text-gray-500">Print official payment receipts for students</p>
          </div>
          {selected.size > 0 && (
            <Button onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print {selected.size} Receipt{selected.size > 1 ? 's' : ''}</Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name, ID or M-Pesa code..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent" />
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading payments...</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No payments found" description="Fee payments will appear here once recorded" icon={Receipt} />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-violet-50 to-indigo-50 text-left">
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-4 h-4 rounded text-violet-600" />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fee Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`transition-colors ${selected.has(p.id) ? 'bg-violet-50' : 'hover:bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 rounded text-violet-600" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.student.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.student.studentId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.feeStructure?.name ?? '-'}</td>
                    <td className="px-4 py-3 font-bold text-violet-700">KES {parseFloat(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{p.method}</span></td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.mpesaCode ?? p.reference ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.paymentDate).toLocaleDateString('en-KE')}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setSelected(new Set([p.id])); setTimeout(handlePrint, 50) }} className="text-violet-500 hover:text-violet-700 transition-colors"><Printer className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Print zone */}
      <div className="print-area hidden" ref={printRef}>
        {selectedPayments.map((p, i) => (
          <FeeReceipt key={p.id} payment={p} receiptNo={i + 1} />
        ))}
      </div>
    </>
  )
}

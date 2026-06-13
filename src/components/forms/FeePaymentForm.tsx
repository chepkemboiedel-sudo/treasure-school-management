'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { feePaymentSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

type FeePaymentFormData = z.infer<typeof feePaymentSchema>

interface StudentOption {
  id: string
  name: string
  studentId: string
  class: { id: string; name: string; section: string | null; level: string } | null
}

interface FeeStructureOption {
  id: string
  name: string
  amount: string
  feeType: string
  level: string | null
  classId: string | null
}

const LEVEL_LABEL: Record<string, string> = {
  PRE_PRIMARY: 'Pre-Primary',
  LOWER_PRIMARY: 'Lower Primary',
  UPPER_PRIMARY: 'Upper Primary',
  JUNIOR_SECONDARY: 'Junior Secondary',
}

interface Props { onSuccess: () => void; onCancel: () => void }

export default function FeePaymentForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [allStructures, setAllStructures] = useState<FeeStructureOption[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/students?all=true').then((r) => r.json()),
      fetch('/api/fees/structures').then((r) => r.json()),
    ]).then(([sd, fd]) => {
      setStudents(sd.data ?? [])
      setAllStructures(fd.data ?? [])
    })
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FeePaymentFormData>({
    resolver: zodResolver(feePaymentSchema),
    defaultValues: { paymentDate: format(new Date(), 'yyyy-MM-dd'), status: 'PAID', paymentMethod: 'Cash' },
  })

  const studentId = watch('studentId')
  const feeStructureId = watch('feeStructureId')

  // When student changes, update selected student and clear fee selection
  useEffect(() => {
    const s = students.find((s) => s.id === studentId) ?? null
    setSelectedStudent(s)
    setValue('feeStructureId', '')
    setValue('amount', 0)
  }, [studentId, students, setValue])

  // When fee structure changes, auto-fill amount
  useEffect(() => {
    const fs = allStructures.find((f) => f.id === feeStructureId)
    if (fs) setValue('amount', Number(fs.amount))
  }, [feeStructureId, allStructures, setValue])

  // Filter fee structures applicable to the selected student
  const applicableStructures = selectedStudent
    ? allStructures.filter((s) => {
        if (!s.level && !s.classId) return true // applies to all
        if (s.level && selectedStudent.class?.level === s.level) return true // matches level bracket
        if (s.classId && selectedStudent.class?.id === s.classId) return true // matches specific class
        return false
      })
    : allStructures

  const feeOptions = applicableStructures.map((f) => ({
    value: f.id,
    label: `${f.name} — ${formatCurrency(Number(f.amount))}`,
  }))

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.studentId})${s.class ? ` · ${s.class.name}${s.class.section ? ` ${s.class.section}` : ''}` : ''}`,
  }))

  const onSubmit = async (data: FeePaymentFormData) => {
    setLoading(true)
    const res = await fetch('/api/fees/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to record payment')
    else { toast.success('Payment recorded'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Select
            label="Student *"
            {...register('studentId')}
            error={errors.studentId?.message}
            options={studentOptions}
            placeholder="Select student…"
          />
          {selectedStudent?.class && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              Level bracket:
              <Badge variant="blue">{LEVEL_LABEL[selectedStudent.class.level] ?? selectedStudent.class.level}</Badge>
              — showing {applicableStructures.length} applicable fee structure{applicableStructures.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Select
            label="Fee Structure *"
            {...register('feeStructureId')}
            error={errors.feeStructureId?.message}
            options={feeOptions}
            placeholder={selectedStudent ? 'Select applicable fee…' : 'Select student first…'}
          />
        </div>

        <Input label="Amount (KES) *" type="number" {...register('amount')} error={errors.amount?.message} />
        <Input label="Payment Date *" type="date" {...register('paymentDate')} error={errors.paymentDate?.message} />
        <Select
          label="Payment Method *"
          {...register('paymentMethod')}
          error={errors.paymentMethod?.message}
          options={[
            { value: 'Cash', label: 'Cash' },
            { value: 'M-Pesa', label: 'M-Pesa' },
            { value: 'Bank Transfer', label: 'Bank Transfer' },
            { value: 'Cheque', label: 'Cheque' },
          ]}
        />
        {watch('paymentMethod') === 'M-Pesa' && (
          <Input
            label="M-Pesa Code"
            {...register('mpesaCode')}
            placeholder="e.g. QHB3K9AX1L"
            error={errors.mpesaCode?.message}
          />
        )}
        <Select
          label="Status *"
          {...register('status')}
          error={errors.status?.message}
          options={[
            { value: 'PAID', label: 'Paid (Full)' },
            { value: 'PARTIAL', label: 'Partial' },
            { value: 'UNPAID', label: 'Unpaid' },
          ]}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          placeholder="Optional note…"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Record Payment</Button>
      </div>
    </form>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount)
}

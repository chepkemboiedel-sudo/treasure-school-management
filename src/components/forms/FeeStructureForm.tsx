'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { feeStructureSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

type FeeStructureFormData = z.infer<typeof feeStructureSchema>

// Who this fee applies to
type ApplyTo = 'ALL' | 'PRE_PRIMARY' | 'LOWER_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_SECONDARY' | 'SPECIFIC_CLASS'

const APPLY_OPTIONS: { value: ApplyTo; label: string; description: string }[] = [
  { value: 'ALL', label: 'All Students', description: 'Applies to every student in the school' },
  { value: 'PRE_PRIMARY', label: 'Pre-Primary', description: 'PP1 and PP2' },
  { value: 'LOWER_PRIMARY', label: 'Lower Primary', description: 'Grade 1, 2 and 3' },
  { value: 'UPPER_PRIMARY', label: 'Upper Primary', description: 'Grade 4, 5 and 6' },
  { value: 'JUNIOR_SECONDARY', label: 'Junior Secondary', description: 'Grade 7, 8 and 9' },
  { value: 'SPECIFIC_CLASS', label: 'Specific Class', description: 'One particular class only' },
]

const FEE_TYPES = [
  { value: 'TUITION', label: 'Tuition' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'UNIFORM', label: 'Uniform' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'OTHER', label: 'Other' },
]

interface Props { onSuccess: () => void; onCancel: () => void }

export default function FeeStructureForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [applyTo, setApplyTo] = useState<ApplyTo>('ALL')
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([])
  const [terms, setTerms] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/classes?simple=true').then((r) => r.json()),
      fetch('/api/terms').then((r) => r.json()),
    ]).then(([cd, td]) => {
      setClasses((cd.data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      setTerms((td.data ?? []).map((t: { id: string; name: string }) => ({ value: t.id, label: t.name })))
    })
  }, [])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
  })

  const onSubmit = async (data: FeeStructureFormData) => {
    // Map applyTo → level + classId
    const level = ['PRE_PRIMARY', 'LOWER_PRIMARY', 'UPPER_PRIMARY', 'JUNIOR_SECONDARY'].includes(applyTo)
      ? (applyTo as FeeStructureFormData['level'])
      : undefined
    const classId = applyTo === 'SPECIFIC_CLASS' ? data.classId : undefined

    setLoading(true)
    const res = await fetch('/api/fees/structures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, level, classId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to create fee structure')
    else { toast.success('Fee structure created'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Fee Name *" {...register('name')} error={errors.name?.message} placeholder="e.g. Tuition Fee" />
        <Input label="Amount (KES) *" type="number" {...register('amount')} error={errors.amount?.message} placeholder="15000" />
        <Select
          label="Fee Type *"
          {...register('feeType')}
          error={errors.feeType?.message}
          options={FEE_TYPES}
          placeholder="Select type…"
        />
        <Select
          label="Term *"
          {...register('termId')}
          error={errors.termId?.message}
          options={terms}
          placeholder="Select term…"
        />
      </div>

      {/* Fee bracket */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Applies To *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {APPLY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setApplyTo(opt.value)
                if (opt.value !== 'SPECIFIC_CLASS') setValue('classId', undefined)
              }}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition ${
                applyTo === opt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <p className="font-medium leading-tight">{opt.label}</p>
              <p className="text-xs opacity-60 mt-0.5 leading-tight">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Show class picker only when SPECIFIC_CLASS selected */}
      {applyTo === 'SPECIFIC_CLASS' && (
        <Select
          label="Class *"
          {...register('classId')}
          error={errors.classId?.message}
          options={classes}
          placeholder="Select class…"
        />
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Create Fee Structure</Button>
      </div>
    </form>
  )
}

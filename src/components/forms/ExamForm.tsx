'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { examSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

type ExamFormData = z.infer<typeof examSchema>
interface Props {
  defaultValues?: Partial<ExamFormData>
  onSuccess: () => void
  onCancel: () => void
  isEdit?: boolean
  examId?: string
}

export default function ExamForm({ defaultValues, onSuccess, onCancel, isEdit, examId }: Props) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([])
  const [terms, setTerms] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    Promise.all([fetch('/api/classes?simple=true').then(r => r.json()), fetch('/api/terms').then(r => r.json())]).then(([cd, td]) => {
      setClasses((cd.data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      setTerms((td.data ?? []).map((t: { id: string; name: string }) => ({ value: t.id, label: t.name })))
    })
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: defaultValues ?? { totalMarks: 100, passingMarks: 40 },
  })

  const onSubmit = async (data: ExamFormData) => {
    setLoading(true)
    const url = isEdit ? `/api/grades?type=exam&id=${examId}` : '/api/grades?type=exam'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to save exam')
    else { toast.success(isEdit ? 'Exam updated' : 'Exam created'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Assessment Name *" {...register('name')} error={errors.name?.message} placeholder="Summative Assessment 1" />
        <Select label="Assessment Type *" {...register('examType')} error={errors.examType?.message} options={[
          { value: 'SUMMATIVE', label: 'Summative Assessment' },
          { value: 'FORMATIVE', label: 'Formative Assessment' },
        ]} placeholder="Select type…" />
        <Select label="Class *" {...register('classId')} error={errors.classId?.message} options={classes} placeholder="Select class…" />
        <Select label="Term *" {...register('termId')} error={errors.termId?.message} options={terms} placeholder="Select term…" />
        <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
        <Input label="Total Marks *" type="number" {...register('totalMarks')} error={errors.totalMarks?.message} />
        <Input label="Passing Marks *" type="number" {...register('passingMarks')} error={errors.passingMarks?.message} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update Exam' : 'Create Exam'}</Button>
      </div>
    </form>
  )
}

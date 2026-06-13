'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { classSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { CLASS_LEVELS, CLASS_LEVEL_GRADES, type ClassLevel } from '@/lib/cbc'

type ClassFormData = z.infer<typeof classSchema>

interface Props {
  defaultValues?: Partial<ClassFormData>
  onSuccess: () => void
  onCancel: () => void
  isEdit?: boolean
  classId?: string
}

export default function ClassForm({ defaultValues, onSuccess, onCancel, isEdit, classId }: Props) {
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([])
  const [academicYears, setAcademicYears] = useState<{ value: string; label: string }[]>([])
  const [selectedLevel, setSelectedLevel] = useState<ClassLevel | ''>(defaultValues?.level ?? '')

  useEffect(() => {
    Promise.all([
      fetch('/api/teachers?simple=true').then((r) => r.json()),
      fetch('/api/academic-years').then((r) => r.json()),
    ]).then(([td, yd]) => {
      setTeachers((td.data ?? []).map((t: { id: string; name: string }) => ({ value: t.id, label: t.name })))
      setAcademicYears((yd.data ?? []).map((y: { id: string; name: string }) => ({ value: y.id, label: y.name })))
    })
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: defaultValues ?? { capacity: 35 },
  })

  const watchedLevel = watch('level') as ClassLevel | undefined
  useEffect(() => {
    if (watchedLevel) {
      setSelectedLevel(watchedLevel)
      if (!isEdit) setValue('name', '')
    }
  }, [watchedLevel, isEdit, setValue])

  const gradeOptions = selectedLevel
    ? CLASS_LEVEL_GRADES[selectedLevel].map((g) => ({ value: g, label: g }))
    : []

  const onSubmit = async (data: ClassFormData) => {
    setLoading(true)
    const url = isEdit ? `/api/classes/${classId}` : '/api/classes'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to save class')
    else { toast.success(isEdit ? 'Class updated' : 'Class created'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Education Level *"
          {...register('level')}
          error={errors.level?.message}
          options={CLASS_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
          placeholder="Select level…"
        />
        {selectedLevel ? (
          <Select
            label="Grade / Class Name *"
            {...register('name')}
            error={errors.name?.message}
            options={gradeOptions}
            placeholder="Select grade…"
          />
        ) : (
          <Input label="Grade / Class Name *" {...register('name')} error={errors.name?.message} placeholder="Select a level first" disabled />
        )}
        <Input label="Stream / Section" {...register('section')} error={errors.section?.message} placeholder="A, B, or C" />
        <Input label="Capacity" type="number" {...register('capacity')} error={errors.capacity?.message} />
        <Select label="Academic Year *" {...register('academicYearId')} error={errors.academicYearId?.message} options={academicYears} placeholder="Select year…" />
        <Select label="Class Teacher" {...register('classTeacherId')} error={errors.classTeacherId?.message} options={teachers} placeholder="Select teacher…" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update Class' : 'Create Class'}</Button>
      </div>
    </form>
  )
}

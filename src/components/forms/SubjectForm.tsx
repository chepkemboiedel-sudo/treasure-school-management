'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { subjectSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { CBC_SUBJECTS, subjectCode, type ClassLevel } from '@/lib/cbc'

type SubjectFormData = z.infer<typeof subjectSchema>

interface Props {
  defaultValues?: Partial<SubjectFormData>
  onSuccess: () => void
  onCancel: () => void
  isEdit?: boolean
  subjectId?: string
}

interface ClassOption { id: string; name: string; level: string }

export default function SubjectForm({ defaultValues, onSuccess, onCancel, isEdit, subjectId }: Props) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([])
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/classes?simple=true').then((r) => r.json()),
      fetch('/api/teachers?simple=true').then((r) => r.json()),
    ]).then(([cd, td]) => {
      setClasses(cd.data ?? [])
      setTeachers((td.data ?? []).map((t: { id: string; name: string }) => ({ value: t.id, label: t.name })))
    })
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: defaultValues ?? {},
  })

  const watchedClassId = watch('classId')
  useEffect(() => {
    if (watchedClassId) {
      const cls = classes.find((c) => c.id === watchedClassId)
      if (cls?.level) {
        const subjects = CBC_SUBJECTS[cls.level as ClassLevel] ?? []
        setSubjectOptions(subjects.map((s) => ({ value: s, label: s })))
      }
    } else {
      setSubjectOptions([])
    }
  }, [watchedClassId, classes])

  const watchedName = watch('name')
  useEffect(() => {
    if (watchedName && !isEdit) {
      setValue('code', subjectCode(watchedName))
    }
  }, [watchedName, isEdit, setValue])

  const onSubmit = async (data: SubjectFormData) => {
    setLoading(true)
    const url = isEdit ? `/api/subjects?id=${subjectId}` : '/api/subjects'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to save subject')
    else { toast.success(isEdit ? 'Subject updated' : 'Subject created'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Class *" {...register('classId')} error={errors.classId?.message}
          options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class first…" />

        {subjectOptions.length > 0 ? (
          <Select label="Learning Area *" {...register('name')} error={errors.name?.message}
            options={subjectOptions} placeholder="Select learning area…" />
        ) : (
          <Input label="Learning Area *" {...register('name')} error={errors.name?.message} placeholder="Select a class first" />
        )}

        <Input label="Subject Code *" {...register('code')} error={errors.code?.message} placeholder="Auto-generated" />
        <Select label="Teacher" {...register('teacherId')} error={errors.teacherId?.message}
          options={teachers} placeholder="Select teacher…" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update Subject' : 'Create Subject'}</Button>
      </div>
    </form>
  )
}

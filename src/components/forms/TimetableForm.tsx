'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { timetableSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

type TimetableFormData = z.infer<typeof timetableSchema>
interface Props { onSuccess: () => void; onCancel: () => void }

export default function TimetableForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([])
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([])
  const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    Promise.all([fetch('/api/classes?simple=true').then(r => r.json()), fetch('/api/teachers?simple=true').then(r => r.json())]).then(([cd, td]) => {
      setClasses((cd.data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      setTeachers((td.data ?? []).map((t: { id: string; name: string }) => ({ value: t.id, label: t.name })))
    })
  }, [])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TimetableFormData>({
    resolver: zodResolver(timetableSchema),
  })

  const classId = watch('classId')
  useEffect(() => {
    if (classId) {
      fetch(`/api/subjects?classId=${classId}`).then(r => r.json()).then(d => {
        setSubjects((d.data ?? []).map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })))
      })
    }
  }, [classId])

  const onSubmit = async (data: TimetableFormData) => {
    setLoading(true)
    const res = await fetch('/api/timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to create slot')
    else { toast.success('Timetable slot created'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Class *" {...register('classId')} error={errors.classId?.message} options={classes} placeholder="Select class…" />
        <Select label="Subject *" {...register('subjectId')} error={errors.subjectId?.message} options={subjects} placeholder="Select subject…" />
        <Select label="Teacher *" {...register('teacherId')} error={errors.teacherId?.message} options={teachers} placeholder="Select teacher…" />
        <Select label="Day *" {...register('dayOfWeek')} error={errors.dayOfWeek?.message} options={[
          { value: 'MONDAY', label: 'Monday' }, { value: 'TUESDAY', label: 'Tuesday' },
          { value: 'WEDNESDAY', label: 'Wednesday' }, { value: 'THURSDAY', label: 'Thursday' }, { value: 'FRIDAY', label: 'Friday' },
        ]} placeholder="Select day…" />
        <Input label="Start Time *" type="time" {...register('startTime')} error={errors.startTime?.message} />
        <Input label="End Time *" type="time" {...register('endTime')} error={errors.endTime?.message} />
        <Input label="Room" {...register('room')} error={errors.room?.message} placeholder="A-101" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Add Slot</Button>
      </div>
    </form>
  )
}

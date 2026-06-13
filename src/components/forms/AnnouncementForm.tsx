'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { announcementSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

type AnnouncementFormData = z.infer<typeof announcementSchema>
interface Props { onSuccess: () => void; onCancel: () => void }

export default function AnnouncementForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetch('/api/classes?simple=true').then(r => r.json()).then(d => {
      setClasses((d.data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
    })
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
  })

  const onSubmit = async (data: AnnouncementFormData) => {
    setLoading(true)
    const res = await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to post announcement')
    else { toast.success('Announcement posted'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title *" {...register('title')} error={errors.title?.message} placeholder="School Closing Day Notice" />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Content *</label>
        <textarea {...register('content')} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" placeholder="Write your announcement here…" />
        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Target Audience" {...register('targetRole')} options={[
          { value: 'ADMIN', label: 'Admins' }, { value: 'TEACHER', label: 'Teachers' },
          { value: 'STUDENT', label: 'Students' }, { value: 'PARENT', label: 'Parents' },
        ]} placeholder="All roles" />
        <Select label="Class (optional)" {...register('classId')} options={classes} placeholder="All classes" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Post Announcement</Button>
      </div>
    </form>
  )
}

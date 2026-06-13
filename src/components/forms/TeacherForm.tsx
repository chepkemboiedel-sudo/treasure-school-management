'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { teacherSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Camera, X } from 'lucide-react'
import { ALL_CBC_SUBJECTS } from '@/lib/cbc'

type TeacherFormData = z.infer<typeof teacherSchema>

interface Props {
  defaultValues?: Partial<TeacherFormData>
  onSuccess: () => void
  onCancel: () => void
  isEdit?: boolean
  teacherId?: string
}

const specializationOptions = ALL_CBC_SUBJECTS.map((s) => ({ value: s, label: s }))

export default function TeacherForm({ defaultValues, onSuccess, onCancel, isEdit, teacherId }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string>(defaultValues?.photo ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: defaultValues ?? {},
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const json = await res.json()
    setUploading(false)
    if (res.ok) {
      setPhotoUrl(json.url)
      setValue('photo', json.url)
    } else {
      toast.error(json.error ?? 'Failed to upload photo')
    }
  }

  const clearPhoto = () => {
    setPhotoUrl('')
    setValue('photo', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: TeacherFormData) => {
    setLoading(true)
    const url = isEdit ? `/api/teachers/${teacherId}` : '/api/teachers'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, photo: photoUrl || undefined }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to save teacher')
    else { toast.success(isEdit ? 'Teacher updated' : 'Teacher added'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Photo upload */}
      <div className="flex items-center gap-4 pb-2">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
          {photoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Teacher photo" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <Camera className="w-8 h-8 text-slate-400" />
          )}
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <input type="hidden" {...register('photo')} value={photoUrl} />
          <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? 'Uploading…' : photoUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF · max 2 MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name *" {...register('name')} error={errors.name?.message} placeholder="Mary Johnson" />
        <Input label="Email Address *" type="email" {...register('email')} error={errors.email?.message} placeholder="mary@school.edu" />
        <Input label="Employee ID *" {...register('employeeId')} error={errors.employeeId?.message} placeholder="EMP-001" />
        <Input label="Phone Number" {...register('phone')} error={errors.phone?.message} placeholder="+254 700 000 000" />
        <Select
          label="Specialization (Learning Area)"
          {...register('specialization')}
          error={errors.specialization?.message}
          options={specializationOptions}
          placeholder="Select learning area…"
        />
      </div>
      {!isEdit && (
        <Input label="Password *" type="password" {...register('password')} error={errors.password?.message} placeholder="Min 6 characters" />
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update Teacher' : 'Add Teacher'}</Button>
      </div>
    </form>
  )
}

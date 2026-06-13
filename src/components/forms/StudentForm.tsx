'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { studentSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Camera, X, Info } from 'lucide-react'

type StudentFormData = z.infer<typeof studentSchema>

interface Props {
  defaultValues?: Partial<StudentFormData> & { id?: string }
  onSuccess: () => void
  onCancel: () => void
  isEdit?: boolean
  studentId?: string
}

export default function StudentForm({ defaultValues, onSuccess, onCancel, isEdit, studentId }: Props) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string>(defaultValues?.photo ?? '')
  const [classes, setClasses] = useState<{ value: string; label: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/classes?simple=true').then((r) => r.json()).then((d) => {
      setClasses((d.data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
    })
  }, [])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
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

  const onSubmit = async (data: StudentFormData) => {
    setLoading(true)
    const url = isEdit ? `/api/students/${studentId}` : '/api/students'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, photo: photoUrl || undefined }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to save student')
    else { toast.success(isEdit ? 'Student updated' : 'Student enrolled'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Photo upload */}
      <div className="flex items-center gap-4 pb-2">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
          {photoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Student photo" className="w-full h-full object-cover" />
              <button type="button" onClick={clearPhoto} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow">
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

      {/* Learner details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name *" {...register('name')} error={errors.name?.message} placeholder="Alice Wanjiku" />
        <Input label="Learner ID *" {...register('studentId')} error={errors.studentId?.message} placeholder="STU-001" disabled={isEdit} />
        <Input label="Date of Birth" type="date" {...register('dob')} error={errors.dob?.message} />
        <Input label="Blood Group" {...register('bloodGroup')} error={errors.bloodGroup?.message} placeholder="A+" />
        <Input label="NEMIS Number" {...register('nemisNumber')} error={errors.nemisNumber?.message} placeholder="National Education ID" />
        <Select label="Class" {...register('classId')} error={errors.classId?.message} options={classes} placeholder="Select class…" />
      </div>
      <Input label="Address" {...register('address')} error={errors.address?.message} placeholder="123 Kenyatta Avenue, Nairobi" />

      {/* Medical info */}
      <div className="border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Medical Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Medical Conditions</label>
            <textarea
              {...register('medicalConditions')}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              placeholder="Asthma, diabetes, epilepsy…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Allergies</label>
            <textarea
              {...register('allergies')}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              placeholder="Nuts, penicillin, bee stings…"
            />
          </div>
        </div>
      </div>

      {/* Parent / Guardian */}
      <div className="border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-slate-700 mb-1">Parent / Guardian</p>
        <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          The parent logs in using the email below to view this student's progress, attendance, and fees.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Guardian Name *" {...register('guardianName')} error={errors.guardianName?.message} placeholder="Jane Wanjiku" />
          <Input label="Guardian Phone *" {...register('guardianPhone')} error={errors.guardianPhone?.message} placeholder="+254 700 000 000" />
          <div className="sm:col-span-2">
            <Input
              label="Parent Login Email *"
              type="email"
              {...register('guardianEmail')}
              error={errors.guardianEmail?.message}
              placeholder="parent@example.com"
            />
            <p className="text-xs text-slate-400 mt-1">
              If this parent already has an account (another child enrolled), their existing account is reused automatically.
            </p>
          </div>
        </div>
      </div>

      {!isEdit && (
        <div>
          <Input
            label="Parent Account Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            placeholder="Leave blank to use default: Password@123"
          />
          <p className="text-xs text-slate-400 mt-1">Only applies when creating a new parent account. Ignored if the parent already has an account.</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update Learner' : 'Enrol Learner'}</Button>
      </div>
    </form>
  )
}

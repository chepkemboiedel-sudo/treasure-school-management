'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { gradeSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { calculatePerformanceLevel, performanceLevelLabel } from '@/lib/utils'

type GradeFormData = z.infer<typeof gradeSchema>

interface Props { onSuccess: () => void; onCancel: () => void }

export default function GradeForm({ onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false)
  const [exams, setExams] = useState<{ value: string; label: string; totalMarks: number }[]>([])
  const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([])
  const [students, setStudents] = useState<{ value: string; label: string }[]>([])
  const [selectedExam, setSelectedExam] = useState<{ totalMarks: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/grades?type=exams').then((r) => r.json()),
      fetch('/api/students?all=true').then((r) => r.json()),
    ]).then(([ed, sd]) => {
      setExams((ed.data ?? []).map((e: { id: string; name: string; totalMarks: number; class: { name: string } }) => ({
        value: e.id, label: `${e.name} (${e.class.name})`, totalMarks: e.totalMarks,
      })))
      setStudents((sd.data ?? []).map((s: { id: string; name: string; studentId: string }) => ({
        value: s.id, label: `${s.name} (${s.studentId})`,
      })))
    })
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
  })

  const examId = watch('examId')
  useEffect(() => {
    if (examId) {
      const exam = exams.find((e) => e.value === examId)
      setSelectedExam(exam ? { totalMarks: exam.totalMarks } : null)
      fetch(`/api/subjects?examId=${examId}`).then((r) => r.json()).then((d) => {
        setSubjects((d.data ?? []).map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })))
      })
    }
  }, [examId, exams])

  const marks = watch('marks')
  useEffect(() => {
    if (marks && selectedExam) {
      const level = calculatePerformanceLevel(Number(marks), selectedExam.totalMarks)
      setValue('remarks', `${level} — ${performanceLevelLabel[level]}`)
    }
  }, [marks, selectedExam, setValue])

  const onSubmit = async (data: GradeFormData) => {
    if (selectedExam && Number(data.marks) > selectedExam.totalMarks) {
      toast.error(`Marks cannot exceed ${selectedExam.totalMarks}`)
      return
    }
    setLoading(true)
    const grade = selectedExam ? calculatePerformanceLevel(Number(data.marks), selectedExam.totalMarks) : undefined
    const res = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, grade }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) toast.error(json.error ?? 'Failed to save grade')
    else { toast.success('Grade recorded'); onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Exam *" {...register('examId')} error={errors.examId?.message} options={exams} placeholder="Select exam…" />
      <Select label="Subject *" {...register('subjectId')} error={errors.subjectId?.message} options={subjects} placeholder="Select subject…" />
      <Select label="Student *" {...register('studentId')} error={errors.studentId?.message} options={students} placeholder="Select student…" />
      <Input label={`Marks *${selectedExam ? ` (out of ${selectedExam.totalMarks})` : ''}`} type="number" {...register('marks')} error={errors.marks?.message} placeholder="0" />
      <Input label="Remarks" {...register('remarks')} error={errors.remarks?.message} placeholder="Optional" />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>Record Grade</Button>
      </div>
    </form>
  )
}

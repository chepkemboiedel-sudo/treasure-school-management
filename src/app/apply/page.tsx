'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { GraduationCap, CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  studentName: z.string().min(2, 'Full name required'),
  dob: z.string().optional(),
  gender: z.string().optional(),
  classApplying: z.string().min(1, 'Please select a class'),
  previousSchool: z.string().optional(),
  parentName: z.string().min(2, 'Parent/guardian name required'),
  parentEmail: z.string().email('Valid email required'),
  parentPhone: z.string().min(6, 'Phone number required'),
  relationship: z.string().optional(),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const CLASS_OPTIONS = [
  { group: 'Pre-Primary', options: ['PP1', 'PP2'] },
  { group: 'Lower Primary', options: ['Grade 1', 'Grade 2', 'Grade 3'] },
  { group: 'Upper Primary', options: ['Grade 4', 'Grade 5', 'Grade 6'] },
  { group: 'Junior Secondary', options: ['Grade 7', 'Grade 8', 'Grade 9'] },
]

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setServerError('')
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setServerError(json.error ?? 'Something went wrong. Please try again.')
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-500 mb-6">
            Thank you for applying to The Treasure School. Our admissions team will review your application and contact you at the email address provided within 5–7 business days.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline"
          >
            Return to login <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const field = (label: string, name: keyof FormData, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-400 rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white">The Treasure School</h1>
          <p className="text-slate-400 mt-1">Online Admissions Application</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Learner Information */}
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Learner Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Full Name *', 'studentName', 'text', 'e.g. Alice Wanjiku Kamau')}
              {field('Date of Birth', 'dob', 'date')}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select {...register('gender')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select…</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Applying For *</label>
                <select {...register('classApplying')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select class…</option>
                  {CLASS_OPTIONS.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </optgroup>
                  ))}
                </select>
                {errors.classApplying && <p className="text-xs text-red-500 mt-1">{errors.classApplying.message}</p>}
              </div>
              <div className="sm:col-span-2">
                {field('Previous School (if any)', 'previousSchool', 'text', 'Name of previous school')}
              </div>
            </div>
          </div>

          {/* Parent / Guardian */}
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Parent / Guardian Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Full Name *', 'parentName', 'text', 'e.g. Jane Wanjiku')}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                <select {...register('relationship')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select…</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {field('Email Address *', 'parentEmail', 'email', 'jane@example.com')}
              {field('Phone Number *', 'parentPhone', 'tel', '+254 700 000 000')}
            </div>
          </div>

          {/* Additional Message */}
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message to Admissions (optional)</label>
              <textarea
                rows={4}
                placeholder="Any special needs, questions, or information you'd like to share with our admissions team…"
                {...register('message')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="px-8 py-6 bg-slate-50">
            {serverError && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{serverError}</p>
            )}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                By submitting, you confirm all information provided is accurate. The school will contact you to confirm receipt.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="flex-shrink-0 inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-60"
              >
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-400 hover:underline font-medium">Sign in here</Link>
        </p>
      </div>
    </div>
  )
}

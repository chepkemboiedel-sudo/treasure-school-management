'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const signupSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
})
type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'STUDENT' },
  })

  const onSubmit = async (data: SignupForm) => {
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Registration failed')
    } else {
      toast.success('Account created! Please sign in.')
      router.push('/login')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-3">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
        <p className="text-sm text-slate-500 mt-1">The Treasure School</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[
          { label: 'Full Name', name: 'name' as const, type: 'text', placeholder: 'John Doe' },
          { label: 'Email address', name: 'email' as const, type: 'email', placeholder: 'you@example.com' },
          { label: 'Password', name: 'password' as const, type: 'password', placeholder: '••••••••' },
        ].map(({ label, name, type, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            <input
              {...register(name)}
              type={type}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
            {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
          <select
            {...register('role')}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
          >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="PARENT">Parent</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  )
}

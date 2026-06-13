'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap } from 'lucide-react'
import { loginSchema } from '@/lib/validations'
import toast from 'react-hot-toast'
import Link from 'next/link'

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setLoading(false)

    if (result?.error) {
      toast.error('Invalid email or password')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-3">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">The Treasure School</h1>
        <p className="text-sm text-slate-500 mt-1">School Management System</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@treasureschool.edu"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-sm text-slate-500 mb-2">New to The Treasure School?</p>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm transition"
          >
            <GraduationCap className="w-4 h-4" />
            Apply for Admission
          </Link>
        </div>
      </div>

      {/* Login hints */}
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
        <p className="text-xs text-slate-600 font-medium">Who logs in with what:</p>
        <p className="text-xs text-slate-500">👤 <strong>Admin / Teachers</strong> — school-issued email</p>
        <p className="text-xs text-slate-500">👨‍👩‍👧 <strong>Parents</strong> — guardian email used at enrolment</p>
        <p className="text-xs text-slate-500">🔑 Default password: <span className="font-mono">Password@123</span></p>
      </div>
    </div>
  )
}

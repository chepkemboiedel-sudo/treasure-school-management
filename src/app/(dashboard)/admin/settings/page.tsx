'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, KeyRound, User, Eye, EyeOff, Copy, Check } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter current password'),
  newPassword: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string().min(6),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// All teacher accounts from seed
const TEACHER_ACCOUNTS = [
  { name: 'Mary Wanjiku Johnson',  email: 'teacher1@treasureschool.edu',  id: 'EMP-001' },
  { name: 'James Omondi Wilson',   email: 'teacher2@treasureschool.edu',  id: 'EMP-002' },
  { name: 'Sarah Achieng Davis',   email: 'teacher3@treasureschool.edu',  id: 'EMP-003' },
  { name: 'Robert Kamau Brown',    email: 'teacher4@treasureschool.edu',  id: 'EMP-004' },
  { name: 'Grace Chebet Rono',     email: 'teacher5@treasureschool.edu',  id: 'EMP-005' },
  { name: 'David Mwangi Njoroge', email: 'teacher6@treasureschool.edu',  id: 'EMP-006' },
  { name: 'Faith Atieno Ouma',    email: 'teacher7@treasureschool.edu',  id: 'EMP-007' },
  { name: 'Peter Kipchoge Mutai', email: 'teacher8@treasureschool.edu',  id: 'EMP-008' },
  { name: 'Anne Wambui Karanja',  email: 'teacher9@treasureschool.edu',  id: 'EMP-009' },
  { name: 'John Otieno Okello',   email: 'teacher10@treasureschool.edu', id: 'EMP-010' },
  { name: 'Lucy Njeri Githuku',   email: 'teacher11@treasureschool.edu', id: 'EMP-011' },
  { name: 'Moses Kiptoo Bett',    email: 'teacher12@treasureschool.edu', id: 'EMP-012' },
  { name: 'Esther Mumbi Ndungu', email: 'teacher13@treasureschool.edu', id: 'EMP-013' },
  { name: 'Samuel Maina Gichuki', email: 'teacher14@treasureschool.edu', id: 'EMP-014' },
  { name: 'Priscilla Auma Otieno',email: 'teacher15@treasureschool.edu', id: 'EMP-015' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="ml-1 text-slate-400 hover:text-primary-600 transition">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register: rp, handleSubmit: hsp, formState: { errors: ep } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: session?.user?.name ?? '', email: session?.user?.email ?? '' },
  })

  const { register: rpw, handleSubmit: hspw, reset: resetPw, formState: { errors: epw } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const saveProfile = async (data: ProfileForm) => {
    setProfileLoading(true)
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, email: data.email }),
    })
    const json = await res.json()
    setProfileLoading(false)
    if (res.ok) toast.success('Profile updated — sign out and back in for changes to take effect')
    else toast.error(json.error ?? 'Failed to update profile')
  }

  const changePassword = async (data: PasswordForm) => {
    setPasswordLoading(true)
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    })
    const json = await res.json()
    setPasswordLoading(false)
    if (res.ok) { toast.success('Password changed successfully'); resetPw() }
    else toast.error(json.error ?? 'Failed to change password')
  }

  const passwordInput = (label: string, name: keyof PasswordForm, show: boolean, toggle: () => void) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          {...rpw(name)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {epw[name] && <p className="text-xs text-red-500 mt-1">{epw[name]?.message}</p>}
    </div>
  )

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" /> Admin Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and view system credentials</p>
      </div>

      {/* ── Profile ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-600" />
          <h2 className="font-semibold text-slate-800">My Profile</h2>
        </div>
        <form onSubmit={hsp(saveProfile)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Display Name" {...rp('name')} error={ep.name?.message} placeholder="System Admin" />
            <Input label="Email / Username" type="email" {...rp('email')} error={ep.email?.message} placeholder="admin@treasureschool.edu" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading} size="sm">Save Profile</Button>
          </div>
        </form>
      </div>

      {/* ── Change Password ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary-600" />
          <h2 className="font-semibold text-slate-800">Change Password</h2>
        </div>
        <form onSubmit={hspw(changePassword)} className="px-6 py-5 space-y-4">
          {passwordInput('Current Password', 'currentPassword', showCurrent, () => setShowCurrent(!showCurrent))}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {passwordInput('New Password', 'newPassword', showNew, () => setShowNew(!showNew))}
            {passwordInput('Confirm New Password', 'confirmPassword', showConfirm, () => setShowConfirm(!showConfirm))}
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={passwordLoading} size="sm">Update Password</Button>
          </div>
        </form>
      </div>

      {/* ── Teacher Credentials Reference ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-800">Teacher Login Credentials</h2>
          </div>
          <span className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">Default password: <strong>Password@123</strong></span>
        </div>
        <div className="divide-y divide-slate-50">
          {TEACHER_ACCOUNTS.map((t) => (
            <div key={t.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <p className="text-sm font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400">{t.id}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-600 font-mono">{t.email}</span>
                <CopyButton text={t.email} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

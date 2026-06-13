'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Users2, KeyRound, UserCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface LinkedStudent {
  id: string
  name: string
  studentId: string
  class: { name: string; section: string | null } | null
}

interface ParentRecord {
  id: string
  name: string
  phone: string | null
  photo: string | null
  email: string
  userId: string
  createdAt: string
  students: LinkedStudent[]
}

interface AllStudent {
  id: string
  name: string
  studentId: string
  class: { name: string; section: string | null } | null
}

function ParentForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEdit,
  parentId,
  allStudents,
}: {
  defaultValues?: Partial<ParentRecord>
  onSuccess: () => void
  onCancel: () => void
  isEdit?: boolean
  parentId?: string
  allStudents: AllStudent[]
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: defaultValues?.name ?? '',
    email: defaultValues?.email ?? '',
    phone: defaultValues?.phone ?? '',
    password: '',
    studentIds: (defaultValues?.students ?? []).map((s) => s.id),
  })

  const toggleStudent = (id: string) =>
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id) ? f.studentIds.filter((s) => s !== id) : [...f.studentIds, id],
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = isEdit
      ? { name: form.name, phone: form.phone, studentIds: form.studentIds }
      : { name: form.name, email: form.email, phone: form.phone, password: form.password || undefined, studentIds: form.studentIds }

    const res = await fetch(isEdit ? `/api/parents/${parentId}` : '/api/parents', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setLoading(false)
    if (res.ok) { toast.success(isEdit ? 'Parent updated' : 'Parent added'); onSuccess() }
    else toast.error(json.error ?? 'Failed to save')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Full Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      {!isEdit && (
        <>
          <Input label="Email (Login) *" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input label="Password (default: Password@123)" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Leave blank for default" />
        </>
      )}
      <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Link Students</label>
        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
          {allStudents.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No students found</p>
          ) : allStudents.map((s) => (
            <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.studentIds.includes(s.id)}
                onChange={() => toggleStudent(s.id)}
                className="rounded border-slate-300"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-400">{s.studentId} {s.class ? `· ${s.class.name}${s.class.section ? ` ${s.class.section}` : ''}` : ''}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Add Parent'}</Button>
      </div>
    </form>
  )
}

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentRecord[]>([])
  const [allStudents, setAllStudents] = useState<AllStudent[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ParentRecord | null>(null)
  const [deleting, setDeleting] = useState<ParentRecord | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [resetTarget, setResetTarget] = useState<ParentRecord | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const fetchParents = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/parents?search=${encodeURIComponent(search)}`)
    const json = await res.json()
    setParents(json.data ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { fetchParents() }, [fetchParents])

  useEffect(() => {
    fetch('/api/students?all=true').then((r) => r.json()).then((j) => setAllStudents(j.data ?? []))
  }, [])

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    const res = await fetch(`/api/parents/${deleting.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Parent deleted'); setDeleting(null); fetchParents() }
    else toast.error('Failed to delete')
    setDeleteLoading(false)
  }

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword) return
    setResetLoading(true)
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetTarget.userId, newPassword }),
    })
    const json = await res.json()
    setResetLoading(false)
    if (res.ok) { toast.success(`Password reset for ${resetTarget.name}`); setResetTarget(null); setNewPassword('') }
    else toast.error(json.error ?? 'Failed to reset password')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Parent
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Parents / Guardians</h2>
          <span className="text-sm text-slate-500">{parents.length} total</span>
        </div>
        {loading ? <PageLoader /> : parents.length === 0 ? (
          <EmptyState icon={Users2} title="No parents found" description={search ? 'Try a different search term' : 'Add a parent/guardian to get started'} action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add Parent</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Parent</th>
                  <th className="px-5 py-3 font-medium">Login Email</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Linked Children</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {parents.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} photo={p.photo ?? undefined} size="sm" />
                        <p className="font-medium text-slate-800">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{p.email}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.phone ?? '—'}</td>
                    <td className="px-5 py-3">
                      {p.students.length === 0 ? (
                        <span className="text-slate-400 text-xs">None linked</span>
                      ) : (
                        <div className="space-y-1">
                          {p.students.map((s) => (
                            <div key={s.id} className="flex items-center gap-1.5">
                              <UserCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                              <span className="text-xs text-slate-700">{s.name}</span>
                              {s.class && <span className="text-xs text-slate-400">({s.class.name}{s.class.section ? ` ${s.class.section}` : ''})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Reset password" onClick={() => { setResetTarget(p); setNewPassword('') }} className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition"><KeyRound className="w-4 h-4" /></button>
                        <button onClick={() => { setEditing(p); setModalOpen(true) }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleting(p)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Parent' : 'Add Parent/Guardian'} size="md">
        <ParentForm
          defaultValues={editing ?? undefined}
          allStudents={allStudents}
          onSuccess={() => { setModalOpen(false); fetchParents() }}
          onCancel={() => setModalOpen(false)}
          isEdit={!!editing}
          parentId={editing?.id}
        />
      </Modal>

      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password" size="sm">
        {resetTarget && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm">
              <p className="font-medium text-slate-800">{resetTarget.name}</p>
              <p className="text-slate-500">{resetTarget.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button size="sm" loading={resetLoading} onClick={handleResetPassword} disabled={newPassword.length < 6}>
                <KeyRound className="w-3.5 h-3.5" /> Reset Password
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} message={`Delete ${deleting?.name}? This will remove their account and all data.`} loading={deleteLoading} />
    </div>
  )
}

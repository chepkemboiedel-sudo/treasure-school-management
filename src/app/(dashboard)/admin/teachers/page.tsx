'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, GraduationCap, KeyRound } from 'lucide-react'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import TeacherForm from '@/components/forms/TeacherForm'
import { TeacherWithUser } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface TeacherWithUserId extends TeacherWithUser { userId: string }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherWithUserId[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherWithUserId | null>(null)
  const [deleting, setDeleting] = useState<TeacherWithUserId | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [resetTarget, setResetTarget] = useState<TeacherWithUserId | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const perPage = 10

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/teachers?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}`)
    const json = await res.json()
    setTeachers(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    const res = await fetch(`/api/teachers/${deleting.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Teacher deleted'); setDeleting(null); fetchTeachers() }
    else toast.error('Failed to delete teacher')
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

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, ID…" className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Teacher
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">All Teachers</h2>
          <span className="text-sm text-slate-500">{total} total</span>
        </div>
        {loading ? <PageLoader /> : teachers.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No teachers found" action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add Teacher</Button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Teacher</th>
                    <th className="px-5 py-3 font-medium">Login Email</th>
                    <th className="px-5 py-3 font-medium">Employee ID</th>
                    <th className="px-5 py-3 font-medium">Specialization</th>
                    <th className="px-5 py-3 font-medium">Subjects</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={t.name} photo={t.photo} size="sm" />
                          <p className="font-medium text-slate-800">{t.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{t.email}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{t.employeeId}</td>
                      <td className="px-5 py-3 text-slate-600">{t.specialization ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{t.subjects.length} subject(s)</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDate(t.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button title="Reset password" onClick={() => { setResetTarget(t); setNewPassword('') }} className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition"><KeyRound className="w-4 h-4" /></button>
                          <button onClick={() => { setEditing(t); setModalOpen(true) }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleting(t)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} perPage={perPage} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add New Teacher'} size="md">
        <TeacherForm
          defaultValues={editing ? {
            name: editing.name,
            email: editing.email,
            employeeId: editing.employeeId,
            phone: editing.phone ?? undefined,
            photo: editing.photo ?? undefined,
            specialization: editing.specialization ?? undefined,
          } : undefined}
          onSuccess={() => { setModalOpen(false); fetchTeachers() }}
          onCancel={() => setModalOpen(false)}
          isEdit={!!editing}
          teacherId={editing?.id}
        />
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password" size="sm">
        {resetTarget && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm">
              <p className="font-medium text-slate-800">{resetTarget.name}</p>
              <p className="text-slate-500">{resetTarget.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
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

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} message={`Delete ${deleting?.name}? All associated records will be removed.`} loading={deleteLoading} />
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Briefcase, CheckCircle, XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import Input from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface StaffMember {
  id: string
  name: string
  staffId: string
  position: string
  department: string | null
  phone: string | null
  email: string | null
  photo: string | null
  isActive: boolean
  joinDate: string
  createdAt: string
}

function StaffForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEdit,
  staffId: editId,
}: {
  defaultValues?: Partial<StaffMember>
  onSuccess: () => void
  onCancel: () => void
  isEdit?: boolean
  staffId?: string
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: defaultValues?.name ?? '',
    staffId: defaultValues?.staffId ?? '',
    position: defaultValues?.position ?? '',
    department: defaultValues?.department ?? '',
    phone: defaultValues?.phone ?? '',
    email: defaultValues?.email ?? '',
    isActive: defaultValues?.isActive ?? true,
    joinDate: defaultValues?.joinDate ? defaultValues.joinDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(isEdit ? `/api/staff/${editId}` : '/api/staff', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setLoading(false)
    if (res.ok) { toast.success(isEdit ? 'Staff updated' : 'Staff added'); onSuccess() }
    else toast.error(json.error ?? 'Failed to save')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name *" value={form.name} onChange={set('name')} required />
        <Input label="Staff ID *" value={form.staffId} onChange={set('staffId')} required disabled={isEdit} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Position *" value={form.position} onChange={set('position')} required />
        <Input label="Department" value={form.department} onChange={set('department')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone" value={form.phone} onChange={set('phone')} />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} />
      </div>
      <Input label="Join Date" type="date" value={form.joinDate} onChange={set('joinDate')} />
      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="rounded border-slate-300"
        />
        Active Staff Member
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Add Staff'}</Button>
      </div>
    </form>
  )
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [deleting, setDeleting] = useState<StaffMember | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/staff?search=${encodeURIComponent(search)}`)
    const json = await res.json()
    setStaff(json.data ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    const res = await fetch(`/api/staff/${deleting.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Staff member deleted'); setDeleting(null); fetchStaff() }
    else toast.error('Failed to delete')
    setDeleteLoading(false)
  }

  const departments = Array.from(new Set(staff.map((s) => s.department).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, position…" className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Staff</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{staff.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{staff.filter((s) => s.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Inactive</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{staff.filter((s) => !s.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Departments</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{departments.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">All Staff Members</h2>
          <span className="text-sm text-slate-500">{staff.length} total</span>
        </div>
        {loading ? <PageLoader /> : staff.length === 0 ? (
          <EmptyState icon={Briefcase} title="No staff members found" description={search ? 'Try a different search term' : 'Add your first staff member to get started'} action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add Staff</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Staff ID</th>
                  <th className="px-5 py-3 font-medium">Position</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} photo={s.photo ?? undefined} size="sm" />
                        <p className="font-medium text-slate-800">{s.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.staffId}</td>
                    <td className="px-5 py-3 text-slate-700">{s.position}</td>
                    <td className="px-5 py-3 text-slate-500">{s.department ?? '—'}</td>
                    <td className="px-5 py-3">
                      {s.phone && <p className="text-slate-700 text-xs">{s.phone}</p>}
                      {s.email && <p className="text-slate-400 text-xs">{s.email}</p>}
                    </td>
                    <td className="px-5 py-3">
                      {s.isActive
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Inactive</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{formatDate(s.joinDate)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(s); setModalOpen(true) }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleting(s)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff Member' : 'Add Staff Member'} size="md">
        <StaffForm
          defaultValues={editing ?? undefined}
          onSuccess={() => { setModalOpen(false); fetchStaff() }}
          onCancel={() => setModalOpen(false)}
          isEdit={!!editing}
          staffId={editing?.id}
        />
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} message={`Delete ${deleting?.name}? This action cannot be undone.`} loading={deleteLoading} />
    </div>
  )
}

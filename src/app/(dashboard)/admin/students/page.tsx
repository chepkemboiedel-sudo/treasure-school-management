'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Users, KeyRound, Upload, Download, CheckCircle, XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import StudentForm from '@/components/forms/StudentForm'
import { StudentWithClass } from '@/types'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface StudentRow extends StudentWithClass {
  email: string | null
  userId: string | null
  parentId: string | null
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StudentRow | null>(null)
  const [deleting, setDeleting] = useState<StudentRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [resetTarget, setResetTarget] = useState<StudentRow | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ successCount: number; total: number; results: { row: number; name: string; status: string; message?: string }[] } | null>(null)
  const perPage = 10

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/students?page=${page}&perPage=${perPage}&search=${encodeURIComponent(search)}`)
    const json = await res.json()
    setStudents(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const openAdd = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (s: StudentRow) => { setEditing(s); setModalOpen(true) }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    const res = await fetch(`/api/students/${deleting.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Student deleted'); setDeleting(null); fetchStudents() }
    else toast.error('Failed to delete student')
    setDeleteLoading(false)
  }

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword) return
    if (!resetTarget.userId) {
      toast.error('No parent account linked to reset password for')
      return
    }
    setResetLoading(true)
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetTarget.userId, newPassword }),
    })
    const json = await res.json()
    setResetLoading(false)
    if (res.ok) {
      toast.success(`Parent password reset for ${resetTarget.guardianName}`)
      setResetTarget(null)
      setNewPassword('')
    } else toast.error(json.error ?? 'Failed to reset password')
  }

  const totalPages = Math.ceil(total / perPage)

  const downloadTemplate = () => {
    const csv = 'name,studentId,classId,dob,bloodGroup,nemisNumber,address,guardianName,guardianPhone,guardianEmail,password\nAlice Wanjiku,STU-001,,2015-03-12,A+,,123 Kenyatta Ave,Jane Wanjiku,+254700000001,jane@example.com,Password@123'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'student_import_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!importFile) return
    setImporting(true)
    const fd = new FormData(); fd.append('file', importFile)
    const res = await fetch('/api/students/import', { method: 'POST', body: fd })
    const json = await res.json()
    setImporting(false)
    if (!res.ok) { toast.error(json.error ?? 'Import failed'); return }
    setImportResults(json)
    if (json.successCount > 0) fetchStudents()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, ID, guardian email…" className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setImportResults(null); setImportFile(null); setShowImport(true) }} className="flex items-center gap-2"><Upload className="w-4 h-4" /> Import CSV</Button>
          <Button onClick={openAdd}><Plus className="w-4 h-4" /> Enrol Student</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">All Students</h2>
          <span className="text-sm text-slate-500">{total} total</span>
        </div>

        {loading ? <PageLoader /> : students.length === 0 ? (
          <EmptyState icon={Users} title="No students found" description={search ? 'Try a different search term' : 'Enrol your first student to get started'} action={<Button onClick={openAdd}><Plus className="w-4 h-4" />Enrol Student</Button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Class</th>
                    <th className="px-5 py-3 font-medium">Guardian</th>
                    <th className="px-5 py-3 font-medium">Parent Login Email</th>
                    <th className="px-5 py-3 font-medium">Enrolled</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} photo={s.photo} size="sm" />
                          <p className="font-medium text-slate-800">{s.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{s.studentId}</td>
                      <td className="px-5 py-3">
                        {s.class ? (
                          <Badge variant="blue">{s.class.name}{s.class.section ? ` ${s.class.section}` : ''}</Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-slate-700">{s.guardianName}</p>
                        <p className="text-xs text-slate-400">{s.guardianPhone}</p>
                      </td>
                      <td className="px-5 py-3">
                        {s.email ? (
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{s.email}</span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No parent account</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(s.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {s.userId && (
                            <button title="Reset parent password" onClick={() => { setResetTarget(s); setNewPassword('') }} className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition">
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleting(s)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Enrol New Student'} size="lg">
        <StudentForm
          defaultValues={editing ? {
            name: editing.name,
            studentId: editing.studentId,
            guardianName: editing.guardianName,
            guardianPhone: editing.guardianPhone,
            guardianEmail: editing.guardianEmail ?? editing.email ?? '',
            photo: editing.photo ?? undefined,
            classId: editing.classId ?? undefined,
            dob: editing.dob ?? undefined,
            address: editing.address ?? undefined,
            bloodGroup: editing.bloodGroup ?? undefined,
          } : undefined}
          onSuccess={() => { setModalOpen(false); fetchStudents() }}
          onCancel={() => setModalOpen(false)}
          isEdit={!!editing}
          studentId={editing?.id}
        />
      </Modal>

      {/* Reset Parent Password Modal */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Parent Login Password" size="sm">
        {resetTarget && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm">
              <p className="font-medium text-slate-800">{resetTarget.guardianName}</p>
              <p className="text-slate-500">{resetTarget.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">Parent of {resetTarget.name}</p>
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

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} message={`Delete ${deleting?.name}? This will remove all their grades, attendance and fee records.`} loading={deleteLoading} />

      {/* CSV Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Import Students from CSV" size="md">
        {!importResults ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              CSV columns: <span className="font-mono text-xs">name, studentId, classId, dob, bloodGroup, nemisNumber, address, guardianName, guardianPhone, guardianEmail, password</span>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
              <Download className="w-4 h-4" /> Download template CSV
            </button>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload CSV File</label>
              <input type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-slate-300 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowImport(false)}>Cancel</Button>
              <Button onClick={handleImport} loading={importing} disabled={!importFile}>Import Students</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-lg p-4 ${importResults.successCount === importResults.total ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className="font-semibold text-slate-800">{importResults.successCount} of {importResults.total} students imported successfully</p>
            </div>
            {importResults.results.filter((r) => r.status === 'error').length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {importResults.results.filter((r) => r.status === 'error').map((r) => (
                  <div key={r.row} className="flex items-start gap-2 text-sm text-red-700">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Row {r.row}: {r.name} — {r.message}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setShowImport(false)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

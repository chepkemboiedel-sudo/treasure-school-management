'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, School, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import ClassForm from '@/components/forms/ClassForm'
import SubjectForm from '@/components/forms/SubjectForm'
import { ClassWithDetails, SubjectWithDetails } from '@/types'
import toast from 'react-hot-toast'
import { CLASS_LEVEL_LABEL, CLASS_LEVELS, type ClassLevel } from '@/lib/cbc'

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [classModal, setClassModal] = useState(false)
  const [subjectModal, setSubjectModal] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithDetails | null>(null)
  const [editingSubject, setEditingSubject] = useState<SubjectWithDetails | null>(null)
  const [deletingClass, setDeletingClass] = useState<ClassWithDetails | null>(null)
  const [deletingSubject, setDeletingSubject] = useState<SubjectWithDetails | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>(
    searchParams.get('tab') === 'subjects' ? 'subjects' : 'classes'
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [cr, sr] = await Promise.all([fetch('/api/classes'), fetch('/api/subjects')])
    const [cd, sd] = await Promise.all([cr.json(), sr.json()])
    setClasses(cd.data ?? [])
    setSubjects(sd.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const deleteClass = async () => {
    if (!deletingClass) return
    setDeleteLoading(true)
    const res = await fetch(`/api/classes/${deletingClass.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Class deleted'); setDeletingClass(null); fetchData() }
    else toast.error('Failed to delete class')
    setDeleteLoading(false)
  }

  const deleteSubject = async () => {
    if (!deletingSubject) return
    setDeleteLoading(true)
    const res = await fetch(`/api/subjects?id=${deletingSubject.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Subject deleted'); setDeletingSubject(null); fetchData() }
    else toast.error('Failed to delete subject')
    setDeleteLoading(false)
  }

  // Group classes by CBC level in a defined order
  const classesByLevel = CLASS_LEVELS.map(({ value }) => ({
    level: value as ClassLevel,
    label: CLASS_LEVEL_LABEL[value as ClassLevel],
    items: classes.filter((c) => (c as ClassWithDetails & { level?: ClassLevel }).level === value),
  })).filter((g) => g.items.length > 0)

  const ungrouped = classes.filter((c) => !(c as ClassWithDetails & { level?: ClassLevel }).level)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['classes', 'subjects'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'classes' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => { setEditingClass(null); setClassModal(true) }}><Plus className="w-4 h-4" />Add Class</Button>
          </div>

          {loading ? <PageLoader /> : classes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <EmptyState icon={School} title="No classes yet" action={<Button onClick={() => setClassModal(true)}><Plus className="w-4 h-4" />Add Class</Button>} />
            </div>
          ) : (
            <div className="space-y-6">
              {classesByLevel.map(({ level, label, items }) => (
                <div key={level} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <School className="w-4 h-4 text-primary-600" />
                    <h2 className="font-semibold text-slate-800">{label}</h2>
                    <Badge variant="blue">{items.length}</Badge>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-5 py-3 font-medium">Class</th>
                        <th className="px-5 py-3 font-medium">Academic Year</th>
                        <th className="px-5 py-3 font-medium">Class Teacher</th>
                        <th className="px-5 py-3 font-medium">Students</th>
                        <th className="px-5 py-3 font-medium">Capacity</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3"><p className="font-medium text-slate-800">{c.name}{c.section ? ` — ${c.section}` : ''}</p></td>
                          <td className="px-5 py-3 text-slate-600">{c.academicYear.name}</td>
                          <td className="px-5 py-3 text-slate-600">{c.classTeacher?.name ?? <span className="text-slate-400">Unassigned</span>}</td>
                          <td className="px-5 py-3"><Badge variant="blue">{c._count.students}</Badge></td>
                          <td className="px-5 py-3 text-slate-600">{c.capacity}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setEditingClass(c); setClassModal(true) }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => setDeletingClass(c)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Fallback for classes without a level set */}
              {ungrouped.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-500">Uncategorised</h2>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-5 py-3 font-medium">Class</th>
                        <th className="px-5 py-3 font-medium">Academic Year</th>
                        <th className="px-5 py-3 font-medium">Class Teacher</th>
                        <th className="px-5 py-3 font-medium">Students</th>
                        <th className="px-5 py-3 font-medium">Capacity</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ungrouped.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3"><p className="font-medium text-slate-800">{c.name}{c.section ? ` — ${c.section}` : ''}</p></td>
                          <td className="px-5 py-3 text-slate-600">{c.academicYear.name}</td>
                          <td className="px-5 py-3 text-slate-600">{c.classTeacher?.name ?? <span className="text-slate-400">Unassigned</span>}</td>
                          <td className="px-5 py-3"><Badge variant="blue">{c._count.students}</Badge></td>
                          <td className="px-5 py-3 text-slate-600">{c.capacity}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => { setEditingClass(c); setClassModal(true) }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => setDeletingClass(c)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'subjects' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => { setEditingSubject(null); setSubjectModal(true) }}><Plus className="w-4 h-4" />Add Subject</Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Subjects</h2></div>
            {loading ? <PageLoader /> : subjects.length === 0 ? (
              <EmptyState icon={BookOpen} title="No subjects yet" action={<Button onClick={() => setSubjectModal(true)}><Plus className="w-4 h-4" />Add Subject</Button>} />
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium">Code</th><th className="px-5 py-3 font-medium">Class</th><th className="px-5 py-3 font-medium">Teacher</th><th className="px-5 py-3 font-medium text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {subjects.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.code}</td>
                      <td className="px-5 py-3 text-slate-600">{s.class.name}</td>
                      <td className="px-5 py-3 text-slate-600">{s.teacher?.name ?? <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingSubject(s); setSubjectModal(true) }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeletingSubject(s)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <Modal isOpen={classModal} onClose={() => setClassModal(false)} title={editingClass ? 'Edit Class' : 'Add Class'} size="md">
        <ClassForm
          defaultValues={editingClass ? {
            name: editingClass.name,
            level: (editingClass as ClassWithDetails & { level?: ClassLevel }).level,
            capacity: editingClass.capacity,
            academicYearId: editingClass.academicYearId,
            section: editingClass.section ?? undefined,
            classTeacherId: editingClass.classTeacherId ?? undefined,
          } : undefined}
          onSuccess={() => { setClassModal(false); fetchData() }}
          onCancel={() => setClassModal(false)}
          isEdit={!!editingClass}
          classId={editingClass?.id}
        />
      </Modal>
      <Modal isOpen={subjectModal} onClose={() => setSubjectModal(false)} title={editingSubject ? 'Edit Subject' : 'Add Subject'} size="md">
        <SubjectForm
          defaultValues={editingSubject ? {
            name: editingSubject.name,
            code: editingSubject.code,
            classId: editingSubject.classId,
            teacherId: editingSubject.teacherId ?? undefined,
          } : undefined}
          onSuccess={() => { setSubjectModal(false); fetchData() }}
          onCancel={() => setSubjectModal(false)}
          isEdit={!!editingSubject}
          subjectId={editingSubject?.id}
        />
      </Modal>
      <ConfirmDialog isOpen={!!deletingClass} onClose={() => setDeletingClass(null)} onConfirm={deleteClass} message={`Delete class "${deletingClass?.name}"? All students and subjects in this class will be affected.`} loading={deleteLoading} />
      <ConfirmDialog isOpen={!!deletingSubject} onClose={() => setDeletingSubject(null)} onConfirm={deleteSubject} message={`Delete subject "${deletingSubject?.name}"?`} loading={deleteLoading} />
    </div>
  )
}

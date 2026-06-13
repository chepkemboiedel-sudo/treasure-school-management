'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Plus, Trash2, Pencil, ArrowLeftRight, RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

interface Book { id: string; title: string; author: string | null; isbn: string | null; category: string | null; quantity: number; available: number; _count: { issues: number } }
interface BookIssue { id: string; issueDate: string; dueDate: string; returnDate: string | null; status: string; book: { id: string; title: string }; student: { id: string; name: string; studentId: string } }
interface StudentOption { id: string; name: string; studentId: string }

const bookSchema = z.object({ title: z.string().min(1, 'Title required'), author: z.string().optional(), isbn: z.string().optional(), category: z.string().optional(), quantity: z.coerce.number().min(1).default(1) })
const issueSchema = z.object({ bookId: z.string().min(1), studentId: z.string().min(1), dueDate: z.string().min(1) })
type BookForm = z.infer<typeof bookSchema>
type IssueForm = z.infer<typeof issueSchema>

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Geography', 'Language', 'Reference', 'Other']

export default function LibraryPage() {
  const [tab, setTab] = useState<'books' | 'issues'>('books')
  const [books, setBooks] = useState<Book[]>([])
  const [issues, setIssues] = useState<BookIssue[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [search, setSearch] = useState('')
  const [showBookModal, setShowBookModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const bookForm = useForm<BookForm>({ resolver: zodResolver(bookSchema), defaultValues: { quantity: 1 } })
  const issueForm = useForm<IssueForm>({ resolver: zodResolver(issueSchema) })

  const loadBooks = () => fetch(`/api/library/books?search=${search}`).then((r) => r.json()).then((j) => setBooks(j.data ?? []))
  const loadIssues = () => fetch('/api/library/issues').then((r) => r.json()).then((j) => setIssues(j.data ?? []))

  useEffect(() => { loadBooks(); loadIssues() }, [])
  useEffect(() => { const t = setTimeout(loadBooks, 300); return () => clearTimeout(t) }, [search])
  useEffect(() => { fetch('/api/students?all=true').then((r) => r.json()).then((j) => setStudents(j.data ?? [])) }, [])

  const openAddBook = () => { bookForm.reset({ quantity: 1 }); setEditingBook(null); setShowBookModal(true) }
  const openEditBook = (b: Book) => { setEditingBook(b); bookForm.reset({ title: b.title, author: b.author ?? '', isbn: b.isbn ?? '', category: b.category ?? '', quantity: b.quantity }); setShowBookModal(true) }

  const saveBook = async (data: BookForm) => {
    setSaving(true)
    const url = editingBook ? `/api/library/books/${editingBook.id}` : '/api/library/books'
    const method = editingBook ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed'); return }
    toast.success(editingBook ? 'Book updated' : 'Book added')
    setShowBookModal(false); loadBooks()
  }

  const deleteBook = async (id: string) => {
    const res = await fetch(`/api/library/books/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Cannot delete'); setDeletingId(null); return }
    toast.success('Book deleted'); setDeletingId(null); loadBooks()
  }

  const issueBook = async (data: IssueForm) => {
    setSaving(true)
    const res = await fetch('/api/library/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed to issue'); return }
    toast.success('Book issued'); setShowIssueModal(false); loadBooks(); loadIssues()
  }

  const returnBook = async (id: string) => {
    const res = await fetch(`/api/library/issues/${id}`, { method: 'PATCH' })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed'); return }
    toast.success('Book returned'); loadBooks(); loadIssues()
  }

  const studentOptions = students.map((s) => ({ value: s.id, label: `${s.name} (${s.studentId})` }))
  const bookOptions = books.map((b) => ({ value: b.id, label: `${b.title}${b.author ? ` — ${b.author}` : ''} (${b.available} avail.)` }))
  const isOverdue = (d: string) => new Date(d) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary-600" /> Library Management</h1>
          <p className="text-slate-500 text-sm mt-1">Book inventory, issue and return tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowIssueModal(true)} className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Issue Book</Button>
          <Button onClick={openAddBook} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Book</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Books', value: books.reduce((a, b) => a + b.quantity, 0) },
          { label: 'Available', value: books.reduce((a, b) => a + b.available, 0) },
          { label: 'Currently Issued', value: issues.filter((i) => i.status === 'ISSUED').length },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['books', 'issues'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'books' && (
        <>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search books…" className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Title', 'Author', 'ISBN', 'Category', 'Qty', 'Available', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No books in library</td></tr>
                ) : books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">{b.title}</td>
                    <td className="px-4 py-3 text-slate-600">{b.author ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{b.isbn ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{b.category ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{b.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.available > 0 ? 'green' : 'red'}>{b.available}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditBook(b)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingId(b.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'issues' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Book', 'Student', 'Issued', 'Due', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No issues recorded</td></tr>
              ) : issues.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{i.book.title}</td>
                  <td className="px-4 py-3 text-slate-600">{i.student.name} <span className="text-slate-400 text-xs">({i.student.studentId})</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(i.issueDate).toLocaleDateString('en-KE')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${i.status === 'ISSUED' && isOverdue(i.dueDate) ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                      {new Date(i.dueDate).toLocaleDateString('en-KE')}
                      {i.status === 'ISSUED' && isOverdue(i.dueDate) && ' ⚠'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={i.status === 'RETURNED' ? 'green' : isOverdue(i.dueDate) ? 'red' : 'blue'}>{i.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {i.status === 'ISSUED' && (
                      <button onClick={() => returnBook(i.id)} className="flex items-center gap-1 text-xs px-2 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                        <RotateCcw className="w-3 h-3" /> Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Book Modal */}
      <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title={editingBook ? 'Edit Book' : 'Add Book'} size="md">
        <form onSubmit={bookForm.handleSubmit(saveBook)} className="space-y-4">
          <Input label="Title *" {...bookForm.register('title')} error={bookForm.formState.errors.title?.message} placeholder="The Treasure Island" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Author" {...bookForm.register('author')} placeholder="Robert Louis Stevenson" />
            <Input label="ISBN" {...bookForm.register('isbn')} placeholder="978-0-00-000000-0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" {...bookForm.register('category')} options={CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Select category…" />
            <Input label="Quantity *" type="number" {...bookForm.register('quantity')} error={bookForm.formState.errors.quantity?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowBookModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingBook ? 'Update' : 'Add Book'}</Button>
          </div>
        </form>
      </Modal>

      {/* Issue Modal */}
      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue Book to Student" size="md">
        <form onSubmit={issueForm.handleSubmit(issueBook)} className="space-y-4">
          <Select label="Book *" {...issueForm.register('bookId')} error={issueForm.formState.errors.bookId?.message} options={bookOptions} placeholder="Select book…" />
          <Select label="Student *" {...issueForm.register('studentId')} error={issueForm.formState.errors.studentId?.message} options={studentOptions} placeholder="Select student…" />
          <Input label="Due Date *" type="date" {...issueForm.register('dueDate')} error={issueForm.formState.errors.dueDate?.message} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowIssueModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Issue Book</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deletingId && deleteBook(deletingId)} title="Delete Book" message="Remove this book from the library?" confirmLabel="Delete" />
    </div>
  )
}

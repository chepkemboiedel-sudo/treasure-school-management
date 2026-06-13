'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Printer, CreditCard, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  studentId: string
  photo?: string | null
  nemisNumber?: string | null
  classId?: string | null
  class?: { name: string; section?: string | null } | null
  dob?: string | null
  bloodGroup?: string | null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function IDCard({ student }: { student: Student }) {
  const currentYear = new Date().getFullYear()
  const className = student.class
    ? `${student.class.name}${student.class.section ? ` ${student.class.section}` : ''}`
    : 'Unassigned'

  return (
    <div
      className="id-card relative w-[340px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
      style={{ aspectRatio: '1.586/1', minHeight: 214 }}
    >
      {/* Gradient header */}
      <div className="absolute inset-x-0 top-0 h-[80px] bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center px-4 gap-3">
        {/* Logo */}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 border-2 border-white/40">
          T
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">The Treasure School</p>
          <p className="text-indigo-200 text-[10px] leading-tight">Student Identification Card</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white/70 text-[9px] uppercase tracking-wider">Valid</p>
          <p className="text-white font-semibold text-xs">{currentYear}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="absolute inset-x-0 top-[80px] bottom-0 bg-white flex px-4 py-3 gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-[68px] h-[68px] rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-200 flex items-center justify-center overflow-hidden">
            {student.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-600 font-bold text-lg">{getInitials(student.name)}</span>
            )}
          </div>
          {student.bloodGroup && (
            <span className="bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200">
              {student.bloodGroup}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <p className="font-bold text-slate-900 text-sm leading-tight truncate">{student.name}</p>

          <div className="mt-1.5 space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider w-10 flex-shrink-0">ID</span>
              <span className="text-xs font-mono text-slate-700 font-semibold">{student.studentId}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider w-10 flex-shrink-0">Class</span>
              <span className="text-xs text-slate-700 truncate">{className}</span>
            </div>
            {student.nemisNumber && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider w-10 flex-shrink-0">NEMIS</span>
                <span className="text-xs font-mono text-slate-600 truncate">{student.nemisNumber}</span>
              </div>
            )}
          </div>

          {/* Barcode placeholder */}
          <div className="mt-2 flex items-end gap-px">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-800 flex-shrink-0"
                style={{
                  width: i % 3 === 0 ? '2px' : '1px',
                  height: i % 5 === 0 ? '18px' : i % 3 === 0 ? '14px' : '10px',
                }}
              />
            ))}
          </div>
          <p className="text-[8px] font-mono text-slate-400 mt-0.5 tracking-widest">
            {student.studentId.replace(/\D/g, '').padEnd(12, '0').slice(0, 12)}
          </p>
        </div>
      </div>

      {/* Bottom stripe */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600" />
    </div>
  )
}

export default function IDCardPage() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Student[]>([])
  const [selected, setSelected] = useState<Student[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowDropdown(false); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&perPage=10`)
      const json = await res.json()
      setResults(json.data ?? [])
      setShowDropdown(true)
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300)
    return () => clearTimeout(t)
  }, [search, doSearch])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addStudent = (s: Student) => {
    if (selected.find((x) => x.id === s.id)) {
      toast('Student already added')
      return
    }
    setSelected((prev) => [...prev, s])
    setSearch('')
    setShowDropdown(false)
  }

  const removeStudent = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id))
  }

  const handlePrint = () => {
    if (selected.length === 0) {
      toast.error('Add at least one student to print')
      return
    }
    window.print()
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: fixed; inset: 0; display: flex; flex-wrap: wrap; gap: 16px; padding: 16px; align-content: flex-start; }
          .no-print { display: none !important; }
          .id-card { box-shadow: none !important; break-inside: avoid; }
        }
      `}</style>

      <div className="space-y-6 no-print">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" /> Student ID Card Generator
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Search and select students to preview and print their ID cards.</p>
          </div>
          <Button onClick={handlePrint} disabled={selected.length === 0}>
            <Printer className="w-4 h-4" /> Print ID Card{selected.length > 1 ? 's' : ''}
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div ref={searchRef} className="relative max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type name or student ID..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {showDropdown && results.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                {results.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addStudent(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition border-b border-slate-50 last:border-0 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-bold text-xs">{getInitials(s.name)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">
                        {s.studentId}
                        {s.class ? ` · ${s.class.name}${s.class.section ? ` ${s.class.section}` : ''}` : ''}
                      </p>
                    </div>
                    <span className="ml-auto text-xs text-indigo-600 font-medium">Add</span>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && results.length === 0 && !searching && search.length >= 2 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-500">
                No students found for &quot;{search}&quot;
              </div>
            )}
          </div>

          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selected.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-200"
                >
                  {s.name}
                  <button
                    onClick={() => removeStudent(s.id)}
                    className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Grid - visible normally and during print */}
      {selected.length > 0 ? (
        <div className="print-area">
          <div className="no-print flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">
              {selected.length} card{selected.length !== 1 ? 's' : ''} ready to print
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            {selected.map((s) => (
              <div key={s.id} className="relative group">
                <IDCard student={s} />
                <button
                  onClick={() => removeStudent(s.id)}
                  className="no-print absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-print bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CreditCard className="w-14 h-14 text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No Students Selected</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Search for a student above and click their name to add their ID card to the preview.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

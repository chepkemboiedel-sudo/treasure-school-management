'use client'
import { useState, useRef } from 'react'
import { Award, Search, Printer, X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Student {
  id: string
  name: string
  studentId: string
  class?: { name: string; level: string }
}

interface CertData {
  student: Student
  type: string
  description: string
  date: string
  signatory: string
  title: string
}

const CERT_TYPES = [
  { value: 'excellence', label: 'Academic Excellence', description: 'This is to certify that {name} has demonstrated exceptional academic performance and commitment to excellence.' },
  { value: 'participation', label: 'Participation', description: 'This is to certify that {name} has actively participated in school activities and demonstrated commitment to learning.' },
  { value: 'completion', label: 'Course Completion', description: 'This is to certify that {name} has successfully completed the academic programme and fulfilled all requirements.' },
  { value: 'sports', label: 'Sports Achievement', description: 'This is to certify that {name} has demonstrated outstanding sportsmanship and athletic excellence.' },
  { value: 'leadership', label: 'Leadership Award', description: 'This is to certify that {name} has shown exemplary leadership qualities and has been an inspiration to fellow students.' },
  { value: 'custom', label: 'Custom', description: '' },
]

function Certificate({ data }: { data: CertData }) {
  const desc = data.description.replace(/{name}/g, data.student.name)

  return (
    <div className="cert-card" style={{
      width: '842px', minHeight: '595px',
      background: 'linear-gradient(135deg, #fefefe 0%, #f8f0ff 50%, #fefefe 100%)',
      border: '12px solid transparent',
      backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #7c3aed, #4f46e5, #db2777)',
      backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box',
      borderRadius: '12px', position: 'relative', overflow: 'hidden',
      padding: '48px 64px', boxSizing: 'border-box',
      fontFamily: 'Georgia, serif', pageBreakAfter: 'always',
    }}>
      {/* Corner ornaments */}
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: i < 2 ? 16 : 'auto', bottom: i >= 2 ? 16 : 'auto',
          left: i % 2 === 0 ? 16 : 'auto', right: i % 2 === 1 ? 16 : 'auto',
          width: 48, height: 48,
          background: 'linear-gradient(135deg, #7c3aed, #db2777)',
          borderRadius: i === 0 ? '0 0 100% 0' : i === 1 ? '0 0 0 100%' : i === 2 ? '0 100% 0 0' : '100% 0 0 0',
          opacity: 0.25,
        }} />
      ))}

      {/* School crest area */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 8px',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
        }}>
          <Award style={{ width: 36, height: 36, color: 'white' }} />
        </div>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#7c3aed', fontWeight: 700, fontFamily: 'sans-serif' }}>The Treasure School</p>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', color: '#9333ea', fontFamily: 'sans-serif', fontWeight: 600 }}>Certificate of</h2>
        <h1 style={{ margin: '4px 0 0', fontSize: 38, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700, letterSpacing: 1 }}>
          {data.type}
        </h1>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto 20px', maxWidth: 400 }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#7c3aed)' }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#7c3aed,transparent)' }} />
      </div>

      {/* Presented to */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', fontFamily: 'sans-serif', margin: '0 0 8px', letterSpacing: 2, textTransform: 'uppercase' }}>This is proudly presented to</p>
      <h2 style={{ textAlign: 'center', fontSize: 36, margin: '0 0 4px', color: '#1e1b4b', fontWeight: 700, letterSpacing: 1 }}>{data.student.name}</h2>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', margin: '0 0 20px', fontFamily: 'sans-serif' }}>
        {data.student.studentId} {data.student.class ? `· ${data.student.class.name}` : ''}
      </p>

      {/* Description */}
      <p style={{ textAlign: 'center', fontSize: 15, color: '#374151', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px', fontStyle: 'italic' }}>{desc}</p>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 12 }}>
        <div style={{ textAlign: 'center', minWidth: 180 }}>
          <div style={{ borderTop: '1.5px solid #9333ea', paddingTop: 8 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e1b4b', fontFamily: 'sans-serif' }}>{data.signatory}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280', fontFamily: 'sans-serif' }}>{data.title}</p>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontFamily: 'sans-serif' }}>{new Date(data.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ textAlign: 'center', minWidth: 180 }}>
          <div style={{ borderTop: '1.5px solid #9333ea', paddingTop: 8 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e1b4b', fontFamily: 'sans-serif' }}>The Treasurer</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280', fontFamily: 'sans-serif' }}>Principal</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CertificatePage() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Student[]>([])
  const [selected, setSelected] = useState<Student[]>([])
  const [certType, setCertType] = useState(CERT_TYPES[0])
  const [customDesc, setCustomDesc] = useState('')
  const [signatory, setSignatory] = useState('The Head Teacher')
  const [signatoryTitle, setSignatoryTitle] = useState('Head of School')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [searching, setSearching] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const doSearch = async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&perPage=6`)
    const json = await res.json()
    setResults((json.data ?? []).filter((s: Student) => !selected.find(x => x.id === s.id)))
    setSearching(false)
  }

  const addStudent = (s: Student) => {
    setSelected(prev => [...prev, s])
    setResults([])
    setSearch('')
  }

  const removeStudent = (id: string) => setSelected(prev => prev.filter(s => s.id !== id))

  const handlePrint = () => window.print()

  const getDescription = (s: Student) => {
    const base = certType.value === 'custom' ? customDesc : certType.description
    return base.replace(/{name}/g, s.name)
  }

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-area { display: block !important; position: static !important; }
          .cert-card { page-break-after: always; margin: 0; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>

      <div className="space-y-6 no-print">
        <div>
          <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Certificate Generator</h1>
          <p className="text-sm text-gray-500">Generate printable achievement certificates for students</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Config panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Certificate Settings</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
                  <select value={certType.value} onChange={e => setCertType(CERT_TYPES.find(c => c.value === e.target.value) ?? CERT_TYPES[0])} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                    {CERT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                {certType.value === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Description</label>
                    <textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500" rows={3} placeholder="Use {name} as placeholder for student name..." />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signatory Name</label>
                  <input value={signatory} onChange={e => setSignatory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signatory Title</label>
                  <input value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
            </div>

            {/* Student search */}
            <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Add Students</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); doSearch(e.target.value) }} placeholder="Search student name..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent" />
              </div>
              {results.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  {results.map(s => (
                    <button key={s.id} onClick={() => addStudent(s)} className="w-full text-left px-3 py-2 hover:bg-violet-50 transition-colors text-sm border-b border-gray-100 last:border-0">
                      <div className="font-medium text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.studentId} {s.class ? `· ${s.class.name}` : ''}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected */}
              {selected.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {selected.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-violet-50 rounded-lg px-3 py-1.5">
                      <span className="text-sm font-medium text-gray-800">{s.name}</span>
                      <button onClick={() => removeStudent(s.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handlePrint} disabled={selected.length === 0} className="w-full"><Printer className="w-4 h-4 mr-2" />Print {selected.length > 0 ? `${selected.length} Certificate${selected.length > 1 ? 's' : ''}` : 'Certificates'}</Button>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            {selected.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-12 shadow-sm text-center text-gray-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Add students to preview certificates</p>
                <p className="text-sm mt-1">Search for students and configure the certificate above</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-x-auto">
                {selected.map(s => (
                  <div key={s.id} className="rounded-2xl overflow-hidden shadow-md" style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142%' }}>
                    <Certificate data={{ student: s, type: certType.label, description: getDescription(s), date, signatory, title: signatoryTitle }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print area — hidden from screen, shown when printing */}
      <div className="print-area hidden" ref={printRef}>
        {selected.map(s => (
          <Certificate key={s.id} data={{ student: s, type: certType.label, description: getDescription(s), date, signatory, title: signatoryTitle }} />
        ))}
      </div>
    </>
  )
}

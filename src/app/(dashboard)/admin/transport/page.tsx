'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Bus, Users, Trash2, Pencil, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface SchoolBus {
  id: string
  plateNumber: string
  route: string
  driverName: string
  driverPhone: string
  capacity: number
  studentBuses?: { id: string; student: { id: string; name: string; studentId: string }; stopName: string }[]
}

interface Student {
  id: string
  name: string
  studentId: string
  studentBus?: { bus: { id: string; plateNumber: string; route: string }; stopName: string } | null
}

const busSchema = z.object({
  plateNumber: z.string().min(2, 'Plate number is required'),
  route: z.string().min(2, 'Route is required'),
  driverName: z.string().min(2, 'Driver name is required'),
  driverPhone: z.string().min(7, 'Phone is required'),
  capacity: z.coerce.number().int().positive('Capacity must be positive'),
})
type BusFormData = z.infer<typeof busSchema>

const assignSchema = z.object({
  busId: z.string().min(1, 'Bus is required'),
  stopName: z.string().min(1, 'Stop name is required'),
})
type AssignFormData = z.infer<typeof assignSchema>

export default function TransportPage() {
  const [tab, setTab] = useState<'buses' | 'students'>('buses')
  const [buses, setBuses] = useState<SchoolBus[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [busModal, setBusModal] = useState(false)
  const [editingBus, setEditingBus] = useState<SchoolBus | null>(null)
  const [deletingBus, setDeletingBus] = useState<SchoolBus | null>(null)
  const [busDeleteLoading, setBusDeleteLoading] = useState(false)
  const [busSubmitting, setBusSubmitting] = useState(false)
  const [assignModal, setAssignModal] = useState<Student | null>(null)
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [removingAssign, setRemovingAssign] = useState<string | null>(null)

  const { register: regBus, handleSubmit: handleBus, reset: resetBus, formState: { errors: busErrors } } = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
  })

  const { register: regAssign, handleSubmit: handleAssign, reset: resetAssign, formState: { errors: assignErrors } } = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema),
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [br, sr] = await Promise.all([
        fetch('/api/transport/buses'),
        fetch('/api/students?all=true'),
      ])
      const [bd, sd] = await Promise.all([br.json(), sr.json()])
      setBuses(bd.data ?? [])
      setStudents(sd.data ?? [])
    } catch { toast.error('Failed to load transport data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const onBusSubmit = async (values: BusFormData) => {
    setBusSubmitting(true)
    try {
      const url = editingBus ? `/api/transport/buses/${editingBus.id}` : '/api/transport/buses'
      const method = editingBus ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      toast.success(editingBus ? 'Bus updated' : 'Bus added')
      resetBus()
      setBusModal(false)
      setEditingBus(null)
      fetchData()
    } catch { toast.error('Failed to save bus') }
    finally { setBusSubmitting(false) }
  }

  const openEdit = (bus: SchoolBus) => {
    setEditingBus(bus)
    resetBus({ plateNumber: bus.plateNumber, route: bus.route, driverName: bus.driverName, driverPhone: bus.driverPhone, capacity: bus.capacity })
    setBusModal(true)
  }

  const handleDeleteBus = async () => {
    if (!deletingBus) return
    setBusDeleteLoading(true)
    try {
      const res = await fetch(`/api/transport/buses/${deletingBus.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Bus removed')
      setDeletingBus(null)
      fetchData()
    } catch { toast.error('Failed to delete bus') }
    finally { setBusDeleteLoading(false) }
  }

  const onAssignSubmit = async (values: AssignFormData) => {
    if (!assignModal) return
    setAssignSubmitting(true)
    try {
      const res = await fetch('/api/transport/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: assignModal.id, ...values }),
      })
      if (!res.ok) throw new Error()
      toast.success('Bus assigned')
      resetAssign()
      setAssignModal(null)
      fetchData()
    } catch { toast.error('Failed to assign bus') }
    finally { setAssignSubmitting(false) }
  }

  const removeAssignment = async (studentId: string) => {
    setRemovingAssign(studentId)
    try {
      const res = await fetch(`/api/transport/assign/${studentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Assignment removed')
      fetchData()
    } catch { toast.error('Failed to remove assignment') }
    finally { setRemovingAssign(null) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transport Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage school buses and student assignments</p>
        </div>
        {tab === 'buses' && (
          <Button onClick={() => { setEditingBus(null); resetBus(); setBusModal(true) }}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
            <Plus className="w-4 h-4" /> Add Bus
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mb-3">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{buses.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Buses</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {students.filter(s => s.studentBus).length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Assigned Students</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {students.filter(s => !s.studentBus).length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Unassigned</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['buses', 'students'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'buses' ? 'Buses' : 'Students'}
          </button>
        ))}
      </div>

      {/* Buses Tab */}
      {tab === 'buses' && (
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">School Buses ({buses.length})</h2>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
          ) : buses.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No buses added yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium">Plate</th>
                    <th className="px-5 py-3 font-medium">Route</th>
                    <th className="px-5 py-3 font-medium">Driver</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Capacity</th>
                    <th className="px-5 py-3 font-medium">Students</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {buses.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3 font-mono font-medium text-slate-800">{b.plateNumber}</td>
                      <td className="px-5 py-3 text-slate-600">{b.route}</td>
                      <td className="px-5 py-3 text-slate-600">{b.driverName}</td>
                      <td className="px-5 py-3 text-slate-500">{b.driverPhone}</td>
                      <td className="px-5 py-3 text-slate-600">{b.capacity}</td>
                      <td className="px-5 py-3">
                        <Badge variant={(b.studentBuses?.length ?? 0) >= b.capacity ? 'red' : 'green'}>
                          {b.studentBuses?.length ?? 0} / {b.capacity}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(b)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingBus(b)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Student Bus Assignments</h2>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Assigned Bus</th>
                    <th className="px-5 py-3 font-medium">Route</th>
                    <th className="px-5 py-3 font-medium">Stop</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">{s.studentId}</td>
                      <td className="px-5 py-3">
                        {s.studentBus
                          ? <Badge variant="green">{s.studentBus.bus.plateNumber}</Badge>
                          : <Badge variant="gray">Unassigned</Badge>}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{s.studentBus?.bus.route ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{s.studentBus?.stopName ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="secondary"
                            onClick={() => { resetAssign(); setAssignModal(s) }}>
                            {s.studentBus ? 'Reassign' : 'Assign Bus'}
                          </Button>
                          {s.studentBus && (
                            <button
                              onClick={() => removeAssignment(s.id)}
                              disabled={removingAssign === s.id}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition disabled:opacity-50">
                              <X className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Bus Add/Edit Modal */}
      <Modal isOpen={busModal} onClose={() => { setBusModal(false); setEditingBus(null) }}
        title={editingBus ? 'Edit Bus' : 'Add Bus'} size="md">
        <form onSubmit={handleBus(onBusSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Plate Number" {...regBus('plateNumber')} error={busErrors.plateNumber?.message} placeholder="KBZ 123A" />
            <Input label="Capacity" type="number" {...regBus('capacity')} error={busErrors.capacity?.message} placeholder="50" />
          </div>
          <Input label="Route" {...regBus('route')} error={busErrors.route?.message} placeholder="e.g. Westlands – School" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Driver Name" {...regBus('driverName')} error={busErrors.driverName?.message} />
            <Input label="Driver Phone" {...regBus('driverPhone')} error={busErrors.driverPhone?.message} placeholder="07XXXXXXXX" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setBusModal(false); setEditingBus(null) }}>Cancel</Button>
            <Button type="submit" loading={busSubmitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              {editingBus ? 'Update Bus' : 'Add Bus'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Bus Modal */}
      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Bus — ${assignModal?.name}`} size="sm">
        <form onSubmit={handleAssign(onAssignSubmit)} className="space-y-4">
          <Select
            label="Bus"
            {...regAssign('busId')}
            error={assignErrors.busId?.message}
            options={buses.map(b => ({ value: b.id, label: `${b.plateNumber} — ${b.route} (${b.studentBuses?.length ?? 0}/${b.capacity})` }))}
            placeholder="Select bus"
          />
          <Input label="Stop Name" {...regAssign('stopName')} error={assignErrors.stopName?.message} placeholder="e.g. Westlands Bus Stop" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setAssignModal(null)}>Cancel</Button>
            <Button type="submit" loading={assignSubmitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
              Assign
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingBus}
        onClose={() => setDeletingBus(null)}
        onConfirm={handleDeleteBus}
        title="Remove Bus"
        message={`Remove bus "${deletingBus?.plateNumber}" from the fleet? Student assignments will be cleared.`}
        confirmLabel="Remove"
        loading={busDeleteLoading}
      />
    </div>
  )
}

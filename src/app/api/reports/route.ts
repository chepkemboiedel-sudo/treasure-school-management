import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const classId = searchParams.get('classId')
  const examId = searchParams.get('examId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // ── Attendance report ──────────────────────────────────────────────────────
  if (type === 'attendance') {
    const where: Record<string, unknown> = {}
    if (classId) where.classId = classId
    if (from || to) {
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { student: { select: { id: true, name: true, studentId: true } } },
    })

    const byStudent = new Map<string, { name: string; studentId: string; present: number; absent: number; late: number; excused: number }>()
    for (const r of records) {
      if (!byStudent.has(r.studentId)) {
        byStudent.set(r.studentId, { name: r.student.name, studentId: r.student.studentId, present: 0, absent: 0, late: 0, excused: 0 })
      }
      const s = byStudent.get(r.studentId)!
      if (r.status === 'PRESENT') s.present++
      else if (r.status === 'ABSENT') s.absent++
      else if (r.status === 'LATE') s.late++
      else if (r.status === 'EXCUSED') s.excused++
    }

    const data = Array.from(byStudent.values()).map((s) => {
      const total = s.present + s.absent + s.late + s.excused
      const rate = total > 0 ? Math.round((s.present / total) * 100) : 0
      const absentRate = total > 0 ? Math.round(((s.absent + s.late) / total) * 100) : 0
      return { ...s, total, rate, absentRate, alert: absentRate >= 80 }
    })

    return NextResponse.json({ data })
  }

  // ── Performance report ─────────────────────────────────────────────────────
  if (type === 'performance') {
    const gradeWhere: Record<string, unknown> = {}
    if (examId) gradeWhere.examId = examId
    if (classId) {
      const students = await prisma.student.findMany({ where: { classId }, select: { id: true } })
      gradeWhere.studentId = { in: students.map((s) => s.id) }
    }

    const grades = await prisma.grade.findMany({
      where: gradeWhere,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        student: { select: { name: true, studentId: true } },
      },
    })

    // Group by subject
    const bySubject = new Map<string, { name: string; code: string; EE: number; ME: number; AE: number; BE: number; totalMarks: number; count: number }>()
    for (const g of grades) {
      const key = g.subjectId
      if (!bySubject.has(key)) bySubject.set(key, { name: g.subject.name, code: g.subject.code, EE: 0, ME: 0, AE: 0, BE: 0, totalMarks: 0, count: 0 })
      const s = bySubject.get(key)!
      const level = g.grade ?? 'BE'
      if (level === 'EE') s.EE++
      else if (level === 'ME') s.ME++
      else if (level === 'AE') s.AE++
      else s.BE++
      s.totalMarks += g.marks
      s.count++
    }

    const data = Array.from(bySubject.values()).map((s) => ({
      ...s,
      avgMarks: s.count > 0 ? Math.round(s.totalMarks / s.count) : 0,
    }))

    return NextResponse.json({ data })
  }

  // ── Class overview report ──────────────────────────────────────────────────
  if (type === 'classes') {
    const classes = await prisma.class.findMany({
      include: {
        _count: { select: { students: true, subjects: true } },
        classTeacher: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })

    const data = await Promise.all(classes.map(async (cls) => {
      const attendance = await prisma.attendance.findMany({
        where: { classId: cls.id },
        select: { status: true },
      })
      const total = attendance.length
      const present = attendance.filter((a) => a.status === 'PRESENT').length
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : null

      return {
        id: cls.id,
        name: cls.name,
        section: cls.section,
        level: cls.level,
        studentCount: cls._count.students,
        subjectCount: cls._count.subjects,
        classTeacher: cls.classTeacher?.name ?? null,
        attendanceRate,
      }
    }))

    return NextResponse.json({ data })
  }

  // ── Attendance alerts (students missing ≥80% of sessions) ─────────────────
  if (type === 'alerts') {
    const students = await prisma.student.findMany({
      include: {
        attendance: { select: { status: true } },
        class: { select: { id: true, name: true, section: true, classTeacher: { select: { name: true, user: { select: { email: true } } } } } },
        parents: { select: { name: true, user: { select: { email: true } } } },
        user: { select: { email: true } },
      },
    })

    const alerts = students
      .map((s) => {
        const total = s.attendance.length
        if (total === 0) return null
        const absent = s.attendance.filter((a) => a.status === 'ABSENT' || a.status === 'LATE').length
        const absentRate = Math.round((absent / total) * 100)
        if (absentRate < 80) return null
        const className = s.class ? (s.class.section ? `${s.class.name} ${s.class.section}` : s.class.name) : '—'
        return {
          studentId: s.studentId,
          name: s.name,
          className,
          absentRate,
          daysAbsent: absent,
          totalDays: total,
          parentContacts: s.parents.map((p) => ({ name: p.name, email: p.user.email })),
          classTeacher: s.class?.classTeacher ? { name: s.class.classTeacher.name, email: s.class.classTeacher.user.email } : null,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ data: alerts })
  }

  return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
}

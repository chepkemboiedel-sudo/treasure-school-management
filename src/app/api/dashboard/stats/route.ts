import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') ?? session.user.role.toLowerCase()

  // Admin stats
  if (role === 'admin') {
    const [totalStudents, totalTeachers, totalClasses, feeAgg, pendingAgg, todayAttendance, totalToday] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.feePayment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      prisma.feePayment.aggregate({ _sum: { amount: true }, where: { status: { in: ['UNPAID', 'PARTIAL'] } } }),
      prisma.attendance.count({ where: { date: startOfDay(new Date()), status: 'PRESENT' } }),
      prisma.attendance.count({ where: { date: startOfDay(new Date()) } }),
    ])

    return NextResponse.json({
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalFeesCollected: Number(feeAgg._sum.amount ?? 0),
        pendingFees: Number(pendingAgg._sum.amount ?? 0),
        todayAttendanceRate: totalToday > 0 ? Math.round((todayAttendance / totalToday) * 100) : 0,
        recentAnnouncements: await prisma.announcement.count(),
      },
    })
  }

  // Teacher stats
  if (role === 'teacher') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ data: { classCount: 0, studentCount: 0, subjectCount: 0, todaySlots: 0 } })

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const [subjects, classes, todaySlots] = await Promise.all([
      prisma.subject.count({ where: { teacherId: teacher.id } }),
      prisma.class.findMany({ where: { OR: [{ classTeacherId: teacher.id }, { subjects: { some: { teacherId: teacher.id } } }] }, select: { id: true } }),
      prisma.timetable.count({ where: { teacherId: teacher.id, dayOfWeek: today as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' } }),
    ])

    const classIds = classes.map((c) => c.id)
    const studentCount = await prisma.student.count({ where: { classId: { in: classIds } } })

    return NextResponse.json({ data: { classCount: classes.length, studentCount, subjectCount: subjects, todaySlots } })
  }

  // Student stats
  if (role === 'student') {
    const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
    if (!student) return NextResponse.json({ data: { attendanceRate: 0, avgGrade: '—', pendingFees: 0, subjectCount: 0 } })

    const [attendance, grades, pendingFees, subjectCount] = await Promise.all([
      prisma.attendance.findMany({ where: { studentId: student.id }, select: { status: true } }),
      prisma.grade.findMany({ where: { studentId: student.id }, select: { marks: true, exam: { select: { totalMarks: true } } } }),
      prisma.feePayment.aggregate({ _sum: { amount: true }, where: { studentId: student.id, status: { not: 'PAID' } } }),
      student.classId ? prisma.subject.count({ where: { classId: student.classId } }) : Promise.resolve(0),
    ])

    const presentCount = attendance.filter((a) => a.status === 'PRESENT').length
    const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0

    const avgPct = grades.length > 0
      ? grades.reduce((s, g) => s + (g.marks / g.exam.totalMarks) * 100, 0) / grades.length
      : 0
    const avgGrade = grades.length === 0 ? '—' : avgPct >= 80 ? 'EE' : avgPct >= 60 ? 'ME' : avgPct >= 40 ? 'AE' : 'BE'

    return NextResponse.json({
      data: {
        attendanceRate,
        avgGrade,
        pendingFees: Number(pendingFees._sum.amount ?? 0),
        subjectCount,
      },
    })
  }

  // Parent stats
  if (role === 'parent') {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            class: { select: { name: true } },
            attendance: { select: { status: true } },
            grades: { include: { exam: { select: { totalMarks: true } } }, orderBy: { createdAt: 'desc' }, take: 1 },
            feePayments: { where: { status: { not: 'PAID' } }, select: { amount: true } },
          },
        },
      },
    })

    if (!parent) return NextResponse.json({ data: { children: [] } })

    const children = parent.students.map((s) => {
      const presentCount = s.attendance.filter((a) => a.status === 'PRESENT').length
      const attendanceRate = s.attendance.length > 0 ? Math.round((presentCount / s.attendance.length) * 100) : 0
      const lastGradeRecord = s.grades[0]
      const lastGrade = lastGradeRecord
        ? (() => {
            const pct = (lastGradeRecord.marks / lastGradeRecord.exam.totalMarks) * 100
            return pct >= 80 ? 'EE' : pct >= 60 ? 'ME' : pct >= 40 ? 'AE' : 'BE'
          })()
        : null
      const pendingFees = s.feePayments.reduce((sum, p) => sum + Number(p.amount), 0)
      return {
        id: s.id, name: s.name, studentId: s.studentId,
        className: s.class?.name ?? null, attendanceRate, lastGrade, pendingFees,
      }
    })

    return NextResponse.json({ data: { children } })
  }

  return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
}

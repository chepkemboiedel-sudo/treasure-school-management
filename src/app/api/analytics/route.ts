import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalStudents, totalTeachers, totalParents, totalStaff,
    attendanceLast30, grades, feePayments, feeStructures,
    studentsByLevel,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.parent.count(),
    prisma.staff.count(),
    prisma.attendance.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      select: { date: true, status: true },
    }),
    prisma.grade.findMany({ select: { marks: true } }),
    prisma.feePayment.findMany({ select: { amount: true, status: true } }),
    prisma.feeStructure.findMany({ select: { amount: true, level: true, classId: true } }),
    prisma.student.groupBy({ by: ['classId'], _count: { id: true } }),
  ])

  // Attendance trend: last 30 days grouped by date
  const attendanceByDate: Record<string, { present: number; absent: number; total: number }> = {}
  for (const a of attendanceLast30) {
    const key = a.date.toISOString().split('T')[0]
    if (!attendanceByDate[key]) attendanceByDate[key] = { present: 0, absent: 0, total: 0 }
    attendanceByDate[key].total++
    if (a.status === 'PRESENT' || a.status === 'LATE') attendanceByDate[key].present++
    else attendanceByDate[key].absent++
  }
  const attendanceTrend = Object.entries(attendanceByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, v]) => ({ date, rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0 }))

  // CBC grade distribution
  let ee = 0, me = 0, ae = 0, be = 0
  for (const g of grades) {
    if (g.marks >= 80) ee++
    else if (g.marks >= 60) me++
    else if (g.marks >= 40) ae++
    else be++
  }

  // Fee collection stats
  let collected = 0, outstanding = 0
  for (const p of feePayments) {
    const amt = Number(p.amount)
    if (p.status === 'PAID') collected += amt
    else outstanding += amt
  }

  // Students by CBC level (need class data)
  const classes = await prisma.class.findMany({ select: { id: true, level: true } })
  const classLevelMap = Object.fromEntries(classes.map((c) => [c.id, c.level]))
  const byLevel: Record<string, number> = { PRE_PRIMARY: 0, LOWER_PRIMARY: 0, UPPER_PRIMARY: 0, JUNIOR_SECONDARY: 0 }
  for (const row of studentsByLevel) {
    if (row.classId) {
      const level = classLevelMap[row.classId]
      if (level && byLevel[level] !== undefined) byLevel[level] += row._count.id
    }
  }

  return NextResponse.json({
    summary: { totalStudents, totalTeachers, totalParents, totalStaff },
    attendanceTrend,
    gradeDistribution: { EE: ee, ME: me, AE: ae, BE: be },
    feeCollection: { collected: Math.round(collected), outstanding: Math.round(outstanding) },
    studentsByLevel: byLevel,
  })
}
